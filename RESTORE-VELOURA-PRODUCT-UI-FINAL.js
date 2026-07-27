#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BACKUP_DIR = path.join(ROOT, '.veloura-product-ui-final-backup');
const REQUIRED = [
  path.join('src', 'views', 'layouts', 'master.twig'),
  path.join('src', 'views', 'pages', 'product', 'single.twig'),
  'twilight.json'
];
const OPTIONAL = [
  path.join('src', 'views', 'partials', 'veloura-product-ui-contract.twig')
];

function fail(message) {
  throw new Error(message);
}

try {
  if (!fs.existsSync(BACKUP_DIR)) {
    fail('Backup folder was not found: .veloura-product-ui-final-backup');
  }

  REQUIRED.forEach((relative) => {
    const source = path.join(BACKUP_DIR, relative);
    const target = path.join(ROOT, relative);
    if (!fs.existsSync(source)) fail(`Backup file is missing: ${relative}`);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  });

  OPTIONAL.forEach((relative) => {
    const source = path.join(BACKUP_DIR, relative);
    const target = path.join(ROOT, relative);
    if (fs.existsSync(source)) {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(source, target);
    }
  });

  console.log('');
  console.log('Veloura Product UI files were restored from the pre-install backup.');
  console.log('Run: git restore -- public');
  console.log('Then: pnpm production');
  console.log('');
} catch (error) {
  console.error('');
  console.error('RESTORE ERROR: ' + error.message);
  console.error('');
  process.exit(1);
}
