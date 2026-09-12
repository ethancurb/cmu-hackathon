// Failure-state QA: the pressure API returning 503, then the request aborting.
// The UI must show an honest unavailable state, never a stale/fabricated score.
import { chromium } from 'playwright';
const base = process.env.QA_BASE ?? 'http://localhost:3100';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const problems = [];
try {
  await page.route('**/api/pressure**', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Pressure model unavailable' }) }));
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const home = await page.locator('body').innerText();
  const section = home.split('Transit pressure')[1]?.split('\n').filter(Boolean).slice(0, 4).join(' | ');
  console.log('503 home →', section);
  if (!/unavailable/i.test(home) || /\d+ \/ 100/.test(home)) problems.push('home did not show an unavailable state on 503');
  await page.screenshot({ path: '../qa/phone-home-fail.png', fullPage: true });

  await page.unroute('**/api/pressure**');
  await page.route('**/api/pressure**', (route) => route.abort());
  await page.goto(base + '/plan', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const plan = await page.locator('body').innerText();
  console.log('abort plan →', plan.split('hours')[1]?.split('\n').filter(Boolean).slice(0, 3).join(' | '));
  if (!/unavailable|failed/i.test(plan)) problems.push('plan did not show an unavailable state on network failure');
  const disabled = await page.getByRole('button', { name: 'Use selected time' }).isDisabled();
  if (!disabled) problems.push('apply button enabled with no timeline');
} finally {
  await browser.close();
}
console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'failure states ok');
