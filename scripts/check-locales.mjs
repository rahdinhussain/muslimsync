#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(await readFile(resolve(root, 'i18n/languages.json'), 'utf8'));
const flatten = (value, prefix = '', result = {}) => {
  for (const [key, item] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof item === 'string') result[path] = item;
    else {
      assert.ok(item && typeof item === 'object' && !Array.isArray(item), `${path}: messages must be strings or objects`);
      flatten(item, path, result);
    }
  }
  return result;
};
const tokens = (message) => [...new Set([...message.matchAll(/\{\{\s*-?\s*([^},\s]+)(?:[^}]*)\}\}/g)].map((match) => match[1]))].sort();
const pluralBase = (key) => key.replace(/_(zero|one|two|few|many|other)$/, '');
const load = async (locale, name) => flatten(JSON.parse(await readFile(resolve(root, 'i18n/locales', locale, name), 'utf8')));
const namespaces = (await readdir(resolve(root, 'i18n/locales', registry.defaultLocale))).filter((name) => name.endsWith('.json'));
let checked = 0;
for (const namespace of namespaces) {
  const source = await load(registry.defaultLocale, namespace);
  for (const language of registry.languages) {
    const translated = await load(language.code, namespace);
    for (const [key, message] of Object.entries(source)) {
      assert.equal(typeof translated[key], 'string', `${language.code}/${namespace}: missing ${key}`);
      assert.ok(translated[key].trim(), `${language.code}/${namespace}: empty ${key}`);
      assert.deepEqual(tokens(translated[key]), tokens(message), `${language.code}/${namespace}: interpolation mismatch for ${key}`);
      checked += 1;
    }
    for (const [key, message] of Object.entries(translated)) {
      if (key in source) continue;
      const base = pluralBase(key);
      const reference = source[`${base}_other`] ?? source[`${base}_one`];
      assert.ok(base !== key && reference, `${language.code}/${namespace}: unexpected ${key}`);
      assert.deepEqual(tokens(message), tokens(reference), `${language.code}/${namespace}: plural interpolation mismatch for ${key}`);
      assert.ok(message.trim(), `${language.code}/${namespace}: empty ${key}`);
    }
  }
}
console.log(`Validated ${checked} translated messages across ${registry.languages.length} languages and ${namespaces.length} namespaces.`);
