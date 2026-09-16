import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';
import { config } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialisation de la base SQLite native Node 22 (sans dépendance C++ externe)
const rawDb = new DatabaseSync(config.dbFilePath);
rawDb.exec('PRAGMA foreign_keys = ON;');

// Initialisation du schéma si les tables n'existent pas
export function initSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  rawDb.exec(schemaSql);
}

// Abstraction pour requêtes préparées 100% sécurisées contre l'injection SQL
export const db = {
  getRawDb() {
    return rawDb;
  },

  queryAll(sql, params = []) {
    const stmt = rawDb.prepare(sql);
    const results = Array.isArray(params) ? stmt.all(...params) : stmt.all(params);
    // Convertir les objets null-prototype en objets JavaScript réguliers
    return results.map(row => ({ ...row }));
  },

  queryOne(sql, params = []) {
    const stmt = rawDb.prepare(sql);
    const row = Array.isArray(params) ? stmt.get(...params) : stmt.get(params);
    return row ? { ...row } : null;
  },

  execute(sql, params = []) {
    const stmt = rawDb.prepare(sql);
    const info = Array.isArray(params) ? stmt.run(...params) : stmt.run(params);
    return {
      lastInsertRowid: info.lastInsertRowid !== undefined ? Number(info.lastInsertRowid) : 0,
      changes: info.changes !== undefined ? Number(info.changes) : 0
    };
  },

  exec(sql) {
    return rawDb.exec(sql);
  },

  transaction(fn) {
    rawDb.exec('BEGIN TRANSACTION;');
    try {
      const result = fn();
      rawDb.exec('COMMIT;');
      return result;
    } catch (e) {
      rawDb.exec('ROLLBACK;');
      throw e;
    }
  }
};

// Initialiser le schéma à l'import
initSchema();
