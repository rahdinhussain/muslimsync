#!/usr/bin/env node
// Copy or compare the reviewed shared locale assets with another checkout.
// Platform-specific mobile.json and web.json catalogs are intentionally excluded.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const fromIndex = args.indexOf('--from');
const check = args.includes('--check');
if (fromIndex === -1 || !args[fromIndex + 1]) {
  console.error('Usage: node scripts/sync-shared-locales.mjs --from /path/to/other/repository [--check]');
  process.exit(1);
}
const sourceRoot = resolve(args[fromIndex + 1]);
const registryPath = 'i18n/languages.json';
const registryText = await readFile(resolve(sourceRoot, registryPath), 'utf8');
const registry = JSON.parse(registryText);
const codes = registry.languages.map((language) => language.code);
if (!codes.includes(registry.defaultLocale) || codes.some((code) => !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(code))) {
  throw new Error('Invalid shared language registry');
}
const paths = [registryPath, ...codes.map((code) => `i18n/locales/${code}/common.json`)];
let differences = 0;
for (const path of paths) {
  const source = await readFile(resolve(sourceRoot, path), 'utf8');
  JSON.parse(source);
  let current = '';
  try { current = await readFile(resolve(root, path), 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (source === current) continue;
  differences += 1;
  if (check) console.error(`Shared locale differs: ${path}`);
  else {
    await mkdir(dirname(resolve(root, path)), { recursive: true });
    await writeFile(resolve(root, path), source);
  }
}
if (check && differences) process.exit(1);
console.log(check ? `Verified ${paths.length} shared locale assets.` : `Synchronized ${differences} of ${paths.length} shared locale assets.`);
