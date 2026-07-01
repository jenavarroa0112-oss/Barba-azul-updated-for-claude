// Generates the value for ADMIN_PASSWORD_HASH in .env.
//
// Usage:
//   node scripts/hash-password.mjs "tu-contraseña-aquí"
//
// The plaintext password is never written anywhere — only the salted hash
// printed below gets saved (into .env, which is gitignored).

import { randomBytes, scrypt as scryptCallback } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);

const password = process.argv[2];
if (!password) {
  console.error('Uso: node scripts/hash-password.mjs "tu-contraseña"');
  process.exit(1);
}
if (password.length < 12) {
  console.warn('⚠️  Esa contraseña tiene menos de 12 caracteres. Esta es la única puerta del panel de admin — usa algo largo y único (un gestor de contraseñas te puede generar una).');
}

const salt = randomBytes(16);
const derived = await scrypt(password, salt, 64);
const hash = `${salt.toString('hex')}:${derived.toString('hex')}`;

console.log('\nAgrega esto a tu .env:\n');
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log('');
