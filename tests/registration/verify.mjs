// Run against a locally started API using .env.test only.
// PLAYWRIGHT_PACKAGE can point to an existing playwright-core installation.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { validateEnrollment } from "../../server/enrollmentValidation.js";

const env = dotenv.parse(fs.readFileSync(".env.test"));
assert.equal(env.DB_DATABASE, "care4success_test", "Only the dedicated test database is allowed");
const api = `http://127.0.0.1:${env.API_PORT || 4099}/api`;
const db = await mysql.createConnection({ host: env.DB_HOST, port: Number(env.DB_PORT), user: env.DB_USERNAME, password: env.DB_PASSWORD, database: env.DB_DATABASE });
const marker = `signup-${randomUUID()}`;
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || "playwright");
const browser = await chromium.launch({ headless: true });
const password = "Signup-test-2026!";
const childPassword = "Child-test-2026!";
const parentEmail = `${marker}-parent@example.test`;
const childEmail = `${marker}-child@example.test`;
const widths = [320, 375, 390, 768, 1024, 1440];
const output = process.env.TEMP || ".";
async function http(path, body, token) {
  const response = await fetch(`${api}${path}`, { method: body ? "POST" : "GET", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, data: await response.json() };
}
async function checkWidths(page, label) {
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(100);
    const metrics = await page.evaluate(() => ({ viewport: innerWidth, scroll: document.documentElement.scrollWidth, outside: [...document.querySelectorAll('.signup-page input,.signup-page select,.signup-page button')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.left < -1 || r.right > innerWidth + 1); }).length }));
    assert.equal(metrics.scroll, width, `${label} page overflow at ${width}`);
    assert.equal(metrics.outside, 0, `${label} field overflow at ${width}`);
  }
  console.log(`PASS ${label}: responsive at ${widths.join(', ')} px`);
}
try {
  assert.equal((await http('/health')).status, 200);
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  let rejectFirstSubmission = true;
  const routeErrors = [];
  // Forward only actual API requests; never intercept /src/api modules.
  await page.route(/^http:\/\/(localhost|127\.0\.0\.1):4000\/api\//, async route => {
    try {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/parents/enroll') && rejectFirstSubmission) {
      rejectFirstSubmission = false;
      return route.fulfill({ status: 503, json: { message: 'Indisponibilité temporaire de test. Réessayez.' } });
    }
    const response = await route.fetch({ url: `${api}${url.pathname.slice(4)}${url.search}` });
    await route.fulfill({ response });
    } catch (error) {
      // Navigation cancels requests from the previous page; closing a test does the same.
      if (!/already handled|Target.*closed|context disposed|has been closed/i.test(error.message)) routeErrors.push(error.message);
    }
  });
  await page.goto('http://127.0.0.1:8085/inscription', { waitUntil: 'domcontentloaded' });
  await page.locator('#parentName').waitFor();
  await checkWidths(page, 'Parent');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: `${output}/c4s-signup-parent-desktop.png`, fullPage: true });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.locator('.signup-primary').click();
  assert.equal(await page.locator('#parentName').count(), 1, 'Empty form must not advance');
  await page.locator('#parentName').fill('Parent Test Inscription');
  await page.locator('#parentEmail').fill(parentEmail);
  await page.locator('#parentPassword').fill(password);
  await page.locator('#parentPhone').fill('699123456');
  await page.locator('#geo-country option').filter({ hasText: 'Cameroun' }).waitFor({ state: 'attached' });
  await page.locator('#geo-country').selectOption({ label: 'Cameroun' });
  await page.locator('.signup-primary').click();
  await page.locator('input[name="childName"]').waitFor();
  await checkWidths(page, 'Child');
  await page.setViewportSize({ width: 375, height: 900 });
  await page.locator('.signup-primary').click();
  assert.equal(await page.locator('input[name="childName"]').count(), 1, 'Empty child cannot advance');
  await page.locator('input[name="childName"]').fill('Enfant Test Inscription');
  await page.locator('input[name="childEmail"]').fill(parentEmail);
  await page.locator('input[id^="childPassword-"]').fill(childPassword);
  await page.locator('[id^="childLevel-"]').click();
  await page.getByRole('option').filter({ hasText: 'CM2' }).first().click();
  await page.getByRole('button', { name: 'Mathématiques', exact: true }).click();
  await page.locator('.signup-primary').click();
  assert.match(await page.getByRole('alert').innerText(), /email différente/);
  await page.locator('input[name="childEmail"]').fill(childEmail);
  await page.getByRole('button', { name: 'Ajouter un enfant' }).click();
  await page.getByRole('button', { name: 'Supprimer l’enfant 2' }).click();
  assert.equal(await page.locator('input[name="childName"]').count(), 1);
  await page.screenshot({ path: `${output}/c4s-signup-child-mobile.png`, fullPage: true });
  await page.locator('.signup-primary').click();
  await page.getByRole('heading', { name: 'Confirmez votre inscription' }).waitFor();
  await checkWidths(page, 'Confirmation');
  await page.getByRole('button', { name: 'Retour', exact: true }).click();
  assert.equal(await page.locator('input[name="childEmail"]').inputValue(), childEmail, 'Back must retain fields');
  await page.locator('.signup-primary').click();
  await page.getByRole('button', { name: 'Confirmer l’inscription', exact: true }).click();
  await page.getByRole('alert').waitFor();
  assert.match(await page.getByRole('alert').innerText(), /Réessayez/);
  assert.ok((await page.locator('.signup-summary').first().innerText()).includes(parentEmail));
  await page.getByRole('button', { name: 'Confirmer l’inscription', exact: true }).click();
  await page.getByRole('heading', { name: 'Vos comptes ont été créés !' }).waitFor();
  await checkWidths(page, 'Success');
  const parentLogin = await http('/auth/login', { email: parentEmail, password });
  assert.equal(parentLogin.status, 200);
  assert.equal(parentLogin.data.user.role, 'parent');
  const childLogin = await http('/auth/login', { email: childEmail, password: childPassword });
  assert.equal(childLogin.status, 200);
  assert.equal(childLogin.data.user.role, 'student');
  const [links] = await db.query('SELECT child_id FROM parent_child WHERE parent_id = ?', [parentLogin.data.user.id]);
  assert.ok(links.some(row => row.child_id === childLogin.data.user.id));
  const [students] = await db.query('SELECT parent_id, geo_location_id, password FROM users WHERE id = ?', [childLogin.data.user.id]);
  assert.equal(students[0].parent_id, parentLogin.data.user.id);
  assert.ok(students[0].geo_location_id);
  assert.notEqual(students[0].password, childPassword);
  const [requests] = await db.query('SELECT level, subject FROM requests WHERE email = ?', [parentEmail]);
  assert.equal(requests[0].level, 'CM2');
  assert.equal(requests[0].subject, 'Mathématiques');
  assert.equal((await http(`/parents/${parentLogin.data.user.id}/overview`, undefined, parentLogin.data.token)).status, 200);
  assert.equal((await http(`/students/${childLogin.data.user.id}/overview`, undefined, childLogin.data.token)).status, 200);
  await page.getByRole('link', { name: 'Se connecter maintenant' }).click();
  await page.locator('input[type="email"]').fill(parentEmail);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /^Se connecter →$/ }).click();
  await page.waitForURL(/\/parent(?:\/|$)/);
  await page.evaluate(() => localStorage.clear());
  await page.goto('http://127.0.0.1:8085/login', { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="email"]').fill(childEmail);
  await page.locator('input[type="password"]').fill(childPassword);
  await page.getByRole('button', { name: /^Se connecter →$/ }).click();
  await page.waitForURL(/\/student(?:\/|$)/);
  console.log('PASS real UI enrollment + parent login + child login + household linkage + diagnostic request');
  const valid = { parentName: 'Parent Test', parentEmail: `${marker}-api@example.test`, parentPassword: password, parentPhone: '+237 699123456', children: [{ name: 'Test Child', email: `${marker}-api-child@example.test`, password: childPassword, level: 'CM2', subject: 'Mathématiques' }] };
  assert.throws(() => validateEnrollment({ ...valid, children: [{ ...valid.children[0], password: '' }] }));
  assert.throws(() => validateEnrollment({ ...valid, children: [{ ...valid.children[0], email: valid.parentEmail.toUpperCase() }] }));
  assert.equal((await http('/parents/enroll', { ...valid, children: [{ ...valid.children[0], password: '' }] })).status, 400);
  assert.equal((await http('/parents/enroll', { ...valid, googleIdToken: 'invalid-token' })).status, 400);
  assert.equal((await http('/parents/enroll', { ...valid, parentEmail })).status, 400);
  const multi = { ...valid, children: [...valid.children, { ...valid.children[0], name: 'Second Child', email: `${marker}-api-child2@example.test` }] };
  const concurrent = await Promise.all([http('/parents/enroll', multi), http('/parents/enroll', multi)]);
  assert.equal(concurrent.filter(r => r.status === 201).length, 1);
  assert.ok(concurrent.some(r => [400, 409].includes(r.status)));
  const [count] = await db.query('SELECT COUNT(*) AS n FROM users WHERE email IN (?, ?, ?)', [valid.parentEmail, ...multi.children.map(c => c.email)]);
  assert.equal(count[0].n, 3, 'Concurrent enrollment must not leave partial or duplicate accounts');
  console.log('PASS server validation, duplicate emails, concurrent enrollment and multiple children');
  await page.goto('about:blank');
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  assert.deepEqual(routeErrors, []);
} finally {
  for (const context of browser.contexts()) for (const page of context.pages()) await page.unrouteAll({ behavior: 'ignoreErrors' });
  await browser.close();
  const [users] = await db.query('SELECT id FROM users WHERE email LIKE ?', [`${marker}%`]);
  const ids = users.map(u => u.id);
  await db.query('DELETE FROM requests WHERE email LIKE ?', [`${marker}%`]);
  if (ids.length) {
    await db.query('DELETE FROM parent_child WHERE parent_id IN (?) OR child_id IN (?)', [ids, ids]);
    await db.query('DELETE FROM users WHERE id IN (?) AND role = ?', [ids, 'student']);
    await db.query('DELETE FROM users WHERE id IN (?)', [ids]);
  }
  await db.end();
}
