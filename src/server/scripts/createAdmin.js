import readline from 'readline';
import bcrypt from 'bcryptjs';
import { db } from '../db/connection.js';

function ask(question, hidden = false) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function createAdmin() {
  console.log('\n======================================================');
  console.log('👑 TERANGA SHOP DAKAR - CRÉATION DU COMPTE ADMINISTRATEUR');
  console.log('======================================================\n');

  let email = process.env.ADMIN_DEFAULT_EMAIL || '';
  let password = process.env.ADMIN_DEFAULT_PASSWORD || '';
  let firstName = 'Awa';
  let lastName = 'Ndiaye';
  let phone = '+221 77 123 45 67';

  // Si non fourni par l'environnement, demander de manière interactive
  if (!email || !password) {
    firstName = await ask('Prénom de la propriétaire / administratrice (ex: Awa) : ') || firstName;
    lastName = await ask('Nom de famille (ex: Ndiaye) : ') || lastName;
    email = await ask('Email professionnel de connexion : ');
    phone = await ask('Téléphone / WhatsApp (ex: +221 77 123 45 67) : ') || phone;
    password = await ask('Mot de passe sécurisé (min 8 caractères) : ');
  }

  if (!email || !password || password.length < 8) {
    console.error('❌ Erreur : L’email et un mot de passe d’au moins 8 caractères sont requis.');
    process.exit(1);
  }

  const existing = db.queryOne('SELECT id, role FROM users WHERE email = ?', [email.toLowerCase()]);
  const passwordHash = await bcrypt.hash(password, 12);

  if (existing) {
    db.execute(`
      UPDATE users 
      SET first_name = ?, last_name = ?, phone = ?, password_hash = ?, role = 'admin', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [firstName, lastName, phone, passwordHash, existing.id]);
    console.log(`\n✅ Le compte existant "${email}" a été promu en ADMINISTRATEUR avec succès !`);
  } else {
    db.execute(`
      INSERT INTO users (first_name, last_name, email, phone, password_hash, role, city, region)
      VALUES (?, ?, ?, ?, ?, 'admin', 'Dakar', 'Dakar')
    `, [firstName, lastName, email.toLowerCase(), phone, passwordHash]);
    console.log(`\n✅ Nouveau compte ADMINISTRATEUR créé avec succès pour "${email}" !`);
  }

  console.log(`🔑 Vous pouvez maintenant vous connecter sur : http://localhost:5173/admin/login`);
  console.log('======================================================\n');
}

createAdmin()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erreur lors de la création:', err);
    process.exit(1);
  });
