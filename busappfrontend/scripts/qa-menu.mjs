// Menu + stats button navigation check.
import { chromium } from 'playwright';
const base = process.env.QA_BASE ?? 'http://localhost:3100';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
try {
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.screenshot({ path: '../qa/phone-menu.png' });
  await page.getByRole('menuitem', { name: 'Scenarios' }).click();
  await page.waitForURL('**/demo');
  console.log('menu → /demo ok');
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Pressure timeline' }).click();
  await page.waitForURL('**/plan');
  console.log('stats → /plan ok');
} finally { await browser.close(); }
