import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { DatabaseSync } from 'node:sqlite';
import { config } from '../config.js';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Détection de PostgreSQL via DATABASE_URL (Railway, Neon, Supabase, etc.)
const isPostgres = Boolean(process.env.DATABASE_URL);

let pgPool = null;
let sqliteDb = null;

if (isPostgres) {
  const isLocalDb = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');
  const sslConfig = isLocalDb 
    ? false 
    : (process.env.DB_SSL_STRICT === 'true' ? { rejectUnauthorized: true } : { rejectUnauthorized: false });

  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });

  pgPool.on('error', (err) => {
    console.error('Erreur inattendue sur le pool PostgreSQL:', err);
  });
} else {
  console.log('📦 Connexion à la base SQLite locale (mode développement)...');
  sqliteDb = new DatabaseSync(config.dbFilePath);
  sqliteDb.exec('PRAGMA foreign_keys = ON;');
}

let sqliteTxLock = Promise.resolve();

/**
 * Convertit une requête SQLite avec des placeholders '?' en syntaxe PostgreSQL ($1, $2, ...)
 * et ajoute RETURNING id si c'est un INSERT sans RETURNING explicite.
 */
/**
 * Remplace toute valeur `undefined` par `null` avant liaison SQL.
 *
 * node:sqlite (contrairement à `pg`) refuse de lier `undefined` et lève
 * "Provided value cannot be bound to SQLite parameter N" — ce qui plantait
 * en HTTP 500 chaque fois qu'un champ optionnel était omis d'une requête
 * (ex. modification d'une catégorie sans renvoyer `is_active`). Comme la
 * plupart des UPDATE utilisent `COALESCE(?, colonne)`, remplacer par `null`
 * a en plus l'effet voulu : le champ omis conserve sa valeur existante.
 */
function normalizeParams(params) {
  return params.map(p => (p === undefined ? null : p));
}

function convertSqlForPg(sql) {
  let paramIndex = 1;
  let inString = false;
  let stringChar = '';
  let converted = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    if (!inString && (char === "'" || char === '"')) {
      inString = true;
      stringChar = char;
      converted += char;
    } else if (inString && char === stringChar) {
      if (sql[i + 1] === stringChar) {
        converted += char + sql[i + 1];
        i++;
      } else {
        inString = false;
        converted += char;
      }
    } else if (!inString && char === '?') {
      converted += `$${paramIndex++}`;
    } else {
      converted += char;
    }
  }

  let trimmed = converted.trim().replace(/;$/, '');

  // Traduction des fonctions de dates SQLite vers PostgreSQL
  trimmed = trimmed
    .replace(/DATE\(\s*'now'\s*,\s*'-7 days'\s*\)/gi, "(CURRENT_DATE - INTERVAL '7 days')")
    .replace(/DATE\(\s*'now'\s*,\s*'start of month'\s*\)/gi, "date_trunc('month', CURRENT_DATE)")
    .replace(/DATE\(\s*'now'\s*\)/gi, "CURRENT_DATE");

  if (/^INSERT\s+INTO\s+/i.test(trimmed) && !/\bRETURNING\b/i.test(trimmed)) {
    if (/^INSERT\s+INTO\s+settings\b/i.test(trimmed)) {
      return `${trimmed};`;
    }
    return `${trimmed} RETURNING id;`;
  }

  return trimmed;
}

/**
 * Initialisation automatique du schéma (PostgreSQL ou SQLite)
 */
export async function initSchema() {
  try {
    if (isPostgres) {
      const schemaPath = path.join(__dirname, 'schema.postgres.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await pgPool.query(schemaSql);
        console.log('✅ Schéma PostgreSQL initialisé avec succès !');
      }
    } else {
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      sqliteDb.exec(schemaSql);

      // Migration non-destructive : vérifier si la table payments supporte le statut 'paid'
      try {
        const stmt = sqliteDb.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='payments'");
        const tableRow = stmt.get();
        if (tableRow && tableRow.sql && !tableRow.sql.includes("'paid'")) {
          sqliteDb.exec(`
            CREATE TABLE IF NOT EXISTS payments_new (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
              provider TEXT NOT NULL CHECK(provider IN ('wave', 'orange_money', 'card', 'paytech', 'cash')),
              transaction_id TEXT UNIQUE,
              amount INTEGER NOT NULL,
              currency TEXT NOT NULL DEFAULT 'XOF',
              status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'successful', 'paid', 'failed', 'cancelled', 'refunded')),
              raw_response TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            INSERT INTO payments_new (id, order_id, provider, transaction_id, amount, currency, status, raw_response, created_at)
            SELECT id, order_id, provider, transaction_id, amount, currency, status, raw_response, created_at FROM payments;
            DROP TABLE payments;
            ALTER TABLE payments_new RENAME TO payments;
            CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
            CREATE INDEX IF NOT EXISTS idx_payments_transaction ON payments(transaction_id);
          `);
        }
      } catch (migErr) {
        console.warn('Note migration SQLite payments:', migErr.message);
      }
    }
  } catch (err) {
    console.error('Erreur lors de l\'initialisation du schéma DB:', err);
  }
}

/**
 * Abstraction unifiée pour requêtes préparées (PostgreSQL & SQLite)
 */
export const db = {
  isPostgres() {
    return isPostgres;
  },

  getRawDb() {
    return isPostgres ? pgPool : sqliteDb;
  },

  async queryAll(sql, params = []) {
    const flatParams = normalizeParams(Array.isArray(params) ? params : [params]);

    if (isPostgres) {
      const pgSql = convertSqlForPg(sql);
      const res = await pgPool.query(pgSql, flatParams);
      return res.rows;
    } else {
      const stmt = sqliteDb.prepare(sql);
      const results = stmt.all(...flatParams);
      return results.map(row => ({ ...row }));
    }
  },

  async queryOne(sql, params = []) {
    const flatParams = normalizeParams(Array.isArray(params) ? params : [params]);

    if (isPostgres) {
      const pgSql = convertSqlForPg(sql);
      const res = await pgPool.query(pgSql, flatParams);
      return res.rows.length > 0 ? res.rows[0] : null;
    } else {
      const stmt = sqliteDb.prepare(sql);
      const row = stmt.get(...flatParams);
      return row ? { ...row } : null;
    }
  },

  async execute(sql, params = []) {
    const flatParams = normalizeParams(Array.isArray(params) ? params : [params]);

    if (isPostgres) {
      const pgSql = convertSqlForPg(sql);
      const res = await pgPool.query(pgSql, flatParams);
      const lastId = res.rows && res.rows.length > 0 && res.rows[0].id !== undefined 
        ? Number(res.rows[0].id) 
        : 0;
      return {
        lastInsertRowid: lastId,
        changes: res.rowCount || 0
      };
    } else {
      const stmt = sqliteDb.prepare(sql);
      const info = stmt.run(...flatParams);
      return {
        lastInsertRowid: info.lastInsertRowid !== undefined ? Number(info.lastInsertRowid) : 0,
        changes: info.changes !== undefined ? Number(info.changes) : 0
      };
    }
  },

  async exec(sql) {
    if (isPostgres) {
      return await pgPool.query(sql);
    } else {
      return sqliteDb.exec(sql);
    }
  },

  async transaction(fn) {
    if (isPostgres) {
      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');

        // Objet transactionnel dédié exécutant TOUTES les requêtes sur CE client unique
        const tx = {
          async queryAll(sql, params = []) {
            const flatParams = normalizeParams(Array.isArray(params) ? params : [params]);
            const pgSql = convertSqlForPg(sql);
            const res = await client.query(pgSql, flatParams);
            return res.rows;
          },
          async queryOne(sql, params = []) {
            const flatParams = normalizeParams(Array.isArray(params) ? params : [params]);
            const pgSql = convertSqlForPg(sql);
            const res = await client.query(pgSql, flatParams);
            return res.rows.length > 0 ? res.rows[0] : null;
          },
          async execute(sql, params = []) {
            const flatParams = normalizeParams(Array.isArray(params) ? params : [params]);
            const pgSql = convertSqlForPg(sql);
            const res = await client.query(pgSql, flatParams);
            const lastId = res.rows && res.rows.length > 0 && res.rows[0].id !== undefined 
              ? Number(res.rows[0].id) 
              : 0;
            return {
              lastInsertRowid: lastId,
              changes: res.rowCount || 0
            };
          }
        };

        const res = await fn(tx);
        await client.query('COMMIT');
        return res;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    } else {
      // Pour SQLite (connexion unique), sérialiser les transactions via une file d'attente async
      // afin de garantir l'atomicité et éviter l'erreur "cannot start a transaction within a transaction"
      const executeTx = async () => {
        sqliteDb.exec('BEGIN TRANSACTION;');
        try {
          const tx = {
            queryAll: db.queryAll.bind(db),
            queryOne: db.queryOne.bind(db),
            execute: db.execute.bind(db)
          };
          const result = await fn(tx);
          sqliteDb.exec('COMMIT;');
          return result;
        } catch (e) {
          try { sqliteDb.exec('ROLLBACK;'); } catch (_) {}
          throw e;
        }
      };

      const currentLock = sqliteTxLock;
      const nextPromise = (async () => {
        try {
          await currentLock;
        } catch (_) {}
        return await executeTx();
      })();

      sqliteTxLock = nextPromise.catch(() => {});
      return await nextPromise;
    }
  }
};
