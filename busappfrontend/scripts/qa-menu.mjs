// Menu + stats button navigation check.
import { chromium } from 'playwright';
const base = process.env.QA_BASE ?? 'http://localhost:3100';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
try {
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.screenshot({ path: '../qa/phone-menu.png' });
  const items = await page.getByRole('menuitem').allInnerTexts();
  if (items.some((t) => /scenario/i.test(t))) throw new Error('Scenarios entry still in the menu');
  await page.getByRole('menuitem', { name: 'Pressure timeline' }).click();
  await page.waitForURL('**/plan');
  console.log(`menu → /plan ok (items: ${items.join(', ')})`);
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Pressure timeline' }).click();
  await page.waitForURL('**/plan');
  console.log('stats → /plan ok');
  const demo = await page.goto(base + '/demo', { waitUntil: 'domcontentloaded' });
  console.log(`/demo status ${demo?.status()} (expected 404: public Scenarios page removed)`);
  if (demo?.status() !== 404) throw new Error('/demo still served');
} finally { await browser.close(); }
