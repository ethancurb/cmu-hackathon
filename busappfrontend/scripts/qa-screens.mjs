// Responsive runtime QA against a running server (default http://localhost:3100).
// Captures home (live + demo stages) and plan screens at phone/tablet/desktop
// widths, checks for horizontal overflow and console errors. Writes ../qa/*.png.
import { chromium } from 'playwright';
const base = process.env.QA_BASE ?? 'http://localhost:3100';
const viewports = { phone: { width: 390, height: 844 }, small: { width: 320, height: 568 }, tablet: { width: 768, height: 1024 }, desktop: { width: 1280, height: 800 } };
const pages = [
  ['home-live', '/'],
  ['home-demo-0', '/?demo=pirates&stage=0'],
  ['home-demo-3', '/?demo=pirates&stage=3'],
  ['plan', '/plan'],
];
const browser = await chromium.launch({ headless: true });
const problems = [];
try {
  for (const [vpName, viewport] of Object.entries(viewports)) {
    const context = await browser.newContext({ viewport, geolocation: { latitude: 40.4443, longitude: -79.9428 }, permissions: ['geolocation'] });
    const page = await context.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
    for (const [name, path] of pages) {
      if (vpName !== 'phone' && name !== 'home-demo-3' && name !== 'plan') continue;
      await page.goto(base + path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(4500);
      const overflow = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth - document.documentElement.clientWidth, body: document.body.scrollWidth - document.body.clientWidth }));
      if (overflow.doc > 0 || overflow.body > 0) problems.push(`${vpName}/${name}: horizontal overflow ${JSON.stringify(overflow)}`);
      await page.screenshot({ path: `../qa/${vpName}-${name}.png`, fullPage: true });
      const text = await page.locator('body').innerText();
      if (/free|% full|onboard|seats/i.test(text)) problems.push(`${vpName}/${name}: occupancy-like text present`);
      console.log(`${vpName}/${name}: ok, ${text.length} chars, overflow ${overflow.doc}/${overflow.body}`);
    }
    if (errors.length) problems.push(`${vpName}: console errors: ${errors.slice(0, 5).join(' | ')}`);
    await context.close();
  }
} finally { await browser.close(); }
console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'No problems detected');
