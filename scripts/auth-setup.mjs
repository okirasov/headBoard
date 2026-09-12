#!/usr/bin/env node
/**
 * One-shot sign-in configuration for local development.
 *
 *   npm run auth:setup -- --google-web <id> --google-secret <secret> [--google-ios <id>] [--google-android <id>]
 *                         [--apple-services <id>] [--apple-redirect <https url>] [--api-url http://localhost:5081] [--dry-run]
 *   npm run auth:setup -- --show
 *
 * Client ids go to apps/web/.env and apps/mobile/.env (gitignored); everything the API needs, including the
 * secret, goes to .NET user-secrets of apps/api/Headboard.Api (outside the repo). The secret is never printed.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const API_DIR = resolve(root, 'apps/api/Headboard.Api');
const BUNDLE_ID = 'com.headboard.app';

const args = process.argv.slice(2);
const flag = name => { const i = args.indexOf(name); return i >= 0 ? (args[i + 1] ?? '') : undefined; };
const has = name => args.includes(name);
const dry = has('--dry-run');

if (has('--help') || args.length === 0) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 11).map(l => l.replace(/^ \*\/?\s?/, '')).join('\n'));
  process.exit(0);
}

function upsertEnv(file, values) {
  const lines = existsSync(file) ? readFileSync(file, 'utf8').split('\n') : [];
  for (const [k, v] of Object.entries(values)) {
    if (v === undefined) continue;
    const i = lines.findIndex(l => l.startsWith(k + '='));
    if (i >= 0) lines[i] = `${k}=${v}`; else lines.push(`${k}=${v}`);
  }
  const out = lines.join('\n').replace(/\n*$/, '\n');
  if (dry) console.log(`\n# ${file}\n${out}`); else writeFileSync(file, out);
}

function secret(key, value) {
  if (value === undefined || value === '') return;
  if (dry) { console.log(`dotnet user-secrets set "${key}" ${key.includes('Secret') ? '***' : JSON.stringify(value)}`); return; }
  execFileSync('dotnet', ['user-secrets', 'set', key, value], { cwd: API_DIR, stdio: 'ignore' });
}

if (has('--show')) {
  const list = execFileSync('dotnet', ['user-secrets', 'list'], { cwd: API_DIR, encoding: 'utf8' });
  console.log(list.split('\n').map(l => (l.startsWith('Auth:GoogleClientSecret') ? 'Auth:GoogleClientSecret = ***' : l)).join('\n'));
  for (const f of ['apps/web/.env', 'apps/mobile/.env']) { const p = resolve(root, f); console.log(`\n# ${f}\n${existsSync(p) ? readFileSync(p, 'utf8') : '(missing)'}`); }
  process.exit(0);
}

const googleWeb = flag('--google-web');
const googleSecret = flag('--google-secret');
const googleIos = flag('--google-ios');
const googleAndroid = flag('--google-android');
const appleServices = flag('--apple-services');
const appleRedirect = flag('--apple-redirect');
const apiUrl = flag('--api-url') ?? 'http://localhost:5081';

if (!googleWeb && !googleIos && !googleAndroid && !appleServices) {
  console.error('Nothing to configure: pass at least one of --google-web, --google-ios, --google-android, --apple-services.');
  process.exit(1);
}

// API (user-secrets): audiences accepted for id-tokens, the web client for the code flow and Calendar, Apple audiences.
const audiences = [googleWeb, googleIos, googleAndroid].filter(Boolean);
audiences.forEach((id, i) => secret(`Auth:GoogleClientIds:${i}`, id));
secret('Auth:GoogleWebClientId', googleWeb);
secret('Auth:GoogleClientSecret', googleSecret);
const apple = [appleServices, BUNDLE_ID].filter(Boolean);
if (appleServices) apple.forEach((id, i) => secret(`Auth:AppleClientIds:${i}`, id));
if (googleWeb) secret('Calendar:RedirectUri', apiUrl.replace(/\/$/, '') + '/calendar/oauth/callback');

// Clients (.env, gitignored)
upsertEnv(resolve(root, 'apps/web/.env'), {
  VITE_API_URL: apiUrl,
  VITE_GOOGLE_CLIENT_ID: googleWeb,
  VITE_APPLE_SERVICES_ID: appleServices,
  VITE_APPLE_REDIRECT_URI: appleRedirect,
});
upsertEnv(resolve(root, 'apps/mobile/.env'), {
  EXPO_PUBLIC_API_URL: apiUrl,
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: googleIos,
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: googleAndroid,
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: googleWeb,
});

console.log(`${dry ? '[dry run] ' : ''}Configured: ${[googleWeb && 'Google web', googleIos && 'Google iOS', googleAndroid && 'Google Android', appleServices && 'Apple'].filter(Boolean).join(', ')}.`);
if (googleWeb && !googleSecret) console.log('Note: no --google-secret → browser sign-in (code flow) and Calendar will answer 503 until it is set.');
if (appleServices && !appleRedirect) console.log('Note: Apple web sign-in needs --apple-redirect with the https return URL registered for the Services ID.');
console.log('Restart the API and the dev servers to pick the values up.');
