'use strict';

const fs = require('fs');
const path = require('path');

const root = __dirname;
const auditRoot = path.join(root, 'migration-audit');
const prefix = 'before-cart-page-v23-';

function fail(message) {
  console.error(message);
  process.exit(1);
}

function copyRequired(source, target) {
  if (!fs.existsSync(source)) fail(`Required backup file was not found: ${source}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

if (!fs.existsSync(auditRoot)) {
  fail('migration-audit directory was not found. No rollback was performed.');
}

const backups = fs.readdirSync(auditRoot, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && entry.name.startsWith(prefix))
  .map(entry => entry.name)
  .sort()
  .reverse();

if (!backups.length) {
  fail('No before-cart-page-v23 backup was found. No rollback was performed.');
}

const backup = path.join(auditRoot, backups[0]);
const mappings = [
  ['twilight.json', 'twilight.json'],
  ['src/views/pages/cart.twig', 'src/views/pages/cart.twig'],
  ['src/assets/styles/app.scss', 'src/assets/styles/app.scss']
];

for (const [backupRelative, targetRelative] of mappings) {
  copyRequired(path.join(backup, backupRelative), path.join(root, targetRelative));
}

const optionalTargets = [
  'src/views/components/cart/veloura-cart-banners.twig',
  'src/assets/styles/05-utilities/veloura-cart-surfaces-v23.scss'
];

for (const relative of optionalTargets) {
  const backupFile = path.join(backup, relative);
  const targetFile = path.join(root, relative);
  if (fs.existsSync(backupFile)) {
    fs.mkdirSync(path.dirname(targetFile), { recursive: true });
    fs.copyFileSync(backupFile, targetFile);
  } else if (fs.existsSync(targetFile)) {
    fs.unlinkSync(targetFile);
  }
}

try {
  JSON.parse(fs.readFileSync(path.join(root, 'twilight.json'), 'utf8').replace(/^\uFEFF/, ''));
} catch (error) {
  fail(`Rollback restored an invalid twilight.json: ${error.message}`);
}

console.log('Cart Page V2.3 was rolled back successfully.');
console.log(`Restored backup: ${backup}`);
