// Primary journey: home → plan → pick a bar → use time → home shows pressure at that time.
// Also: demo stage stepping reacts, and the Tomorrow/8-hour live plan loads.
import { chromium } from 'playwright';
const base = process.env.QA_BASE ?? 'http://localhost:3100';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, geolocation: { latitude: 40.4443, longitude: -79.9428 }, permissions: ['geolocation'] });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
const text = async () => page.locator('body').innerText();
try {
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await page.getByText(/^Transit pressure$/).waitFor();
  await page.getByText(/\d+ \/ 100/).first().waitFor({ timeout: 20000 });
  console.log('home: pressure rendered');
  // The time row now opens a direct time picker (qa-time.mjs); reach the
  // pressure-timeline windows via its own nav entry, same as a real rider would.
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('menuitem', { name: 'Pressure timeline' }).click();
  await page.waitForURL('**/plan');
  const bars = page.getByRole('radio', { name: /pressure \d+ of 100/ });
  await bars.first().waitFor({ timeout: 20000 });
  const count = await bars.count();
  await bars.nth(6).click();
  const label = await bars.nth(6).getAttribute('aria-label');
  console.log(`plan: ${count} bars, picked "${label}"`);
  await page.getByRole('button', { name: 'Use selected time' }).click();
  await page.waitForURL(base + '/');
  await page.getByText(/^Leave at$/).waitFor();
  const home = await text();
  const at = home.match(/at (\d{1,2}:\d{2} [AP]M)/)?.[1];
  console.log(`home: departure applied, module shows "at ${at}"`);
  if (!at) throw new Error('module did not show the applied time');
  // Demo stepping
  await page.goto(base + '/?demo=pirates&stage=0', { waitUntil: 'domcontentloaded' });
  const score = async () => { await page.waitForTimeout(1200); return (await text()).match(/(\d+)\s*\/ 100/)?.[1]; };
  const s0 = await score();
  await page.getByRole('radio', { name: '+ Reported service delay' }).click();
  const s3 = await score();
  console.log(`demo: stage0=${s0} stage3=${s3} url=${page.url()}`);
  if (!(Number(s3) > Number(s0))) throw new Error('demo stage did not raise pressure');
  await page.getByRole('button', { name: 'Exit demo scenario' }).click();
  await page.waitForTimeout(800);
  console.log(`demo exit: url=${page.url()} scenarioStrip=${(await text()).includes('Scenario ·')}`);
  // Tomorrow, 8 hours
  await page.goto(base + '/plan', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Day').selectOption('Tomorrow');
  await page.getByLabel('Range').selectOption('8 hours');
  await page.getByRole('radio', { name: /pressure \d+ of 100/ }).first().waitFor({ timeout: 20000 });
  await page.waitForTimeout(1500);
  const tomorrow = await text();
  console.log(`tomorrow: ${await page.getByRole('radio', { name: /pressure \d+ of 100/ }).count()} bars; windows: ${tomorrow.split('Departure windows')[1]?.split('\n').filter(Boolean).slice(0, 6).join(' | ')}`);
  await page.screenshot({ path: '../qa/phone-plan-tomorrow.png', fullPage: true });
} finally { await browser.close(); }
console.log(errors.length ? `PAGE ERRORS: ${errors.join(' | ')}` : 'flow ok, no page errors');
