// Journey + chat + map + evidence runtime QA against a running server (default :3100).
// 1. chat plans "CMU to the North Shore", journey cards appear, selecting one updates the shared trip
// 2. "Leave now" refreshes: the button ETA equals the panel's arrival estimate; the itinerary lists walk/board/alight legs
// 3. pan/zoom on the map, then "Fit route" (no page errors)
// 4. /plan: click a bar → "What's happening" opens with that sample's evidence; ← → moves selection; collapse works
// 5. failure states: routing 503, chat 503, denied geolocation
import { chromium } from 'playwright';
const base = process.env.QA_BASE ?? 'http://localhost:3100';
const browser = await chromium.launch({ headless: true });
const problems = [];
const errors = [];
const at = (page) => page.locator('body').innerText();
// The primary action (not the time row or the collapsed Advice summary, which also read "Leave now").
const primary = (page) => page.getByRole('button', { name: /Leave now/ }).filter({ has: page.locator('.text-button-label') });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, geolocation: { latitude: 40.4443, longitude: -79.9428 }, permissions: ['geolocation'] });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));

  // 1. Chat plans the trip and offers journeys.
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Ask LoadLine/ }).first().click();
  await page.getByRole('dialog', { name: 'Ask LoadLine' }).waitFor();
  const mode = await page.locator('[role=dialog] .text-footnote').first().innerText();
  console.log(`chat mode: ${mode}`);
  await page.getByLabel('Message LoadLine').fill('I need to get from CMU to the North Shore by 7');
  await page.getByRole('button', { name: 'Send' }).click();
  const cards = page.getByRole('radiogroup', { name: 'Journey cards' }).getByRole('radio');
  await cards.first().waitFor({ timeout: 45000 });
  const cardCount = await cards.count();
  const reply = (await page.locator('[role=dialog]').innerText()).split('\n').filter(Boolean);
  console.log(`chat: ${cardCount} journey cards; reply starts "${reply.find((l) => /→/.test(l))}"`);
  if (!/model index/.test(reply.join(' '))) problems.push('chat reply does not label the score as a model index');
  // Ambiguity: "the museum" must ask, not guess.
  await page.getByLabel('Message LoadLine').fill('what about the museum instead');
  await page.getByRole('button', { name: 'Send' }).click();
  await page.getByRole('group', { name: 'Choices' }).waitFor({ timeout: 30000 });
  const choices = await page.getByRole('group', { name: 'Choices' }).getByRole('button').allInnerTexts();
  console.log(`chat clarification options: ${choices.join(' | ')}`);
  if (choices.length < 2) problems.push('ambiguous destination did not offer choices');
  await page.getByRole('group', { name: 'Choices' }).getByRole('button').filter({ hasText: /Warhol/ }).click();
  await page.locator('[role=dialog]').getByText(/→ The Andy Warhol Museum/).waitFor({ timeout: 45000 });
  await page.getByRole('radiogroup', { name: 'Journey cards' }).last().getByRole('radio').first().waitFor({ timeout: 45000 });
  const lastCards = page.getByRole('radiogroup', { name: 'Journey cards' }).last().getByRole('radio');
  const secondCardName = (await lastCards.count()) > 1 ? await lastCards.nth(1).innerText() : null;
  if (secondCardName) await lastCards.nth(1).click();
  await page.getByRole('button', { name: 'Show on map' }).last().click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  const to = await page.getByText('To', { exact: true }).locator('..').innerText();
  console.log(`home destination field: ${to.replace(/\n/g, ' ')}`);
  if (!/Warhol/.test(to)) problems.push('chat destination did not reach the home destination field');

  // 2. Selected trip summary, ETA consistency, itinerary legs.
  const panel = page.getByRole('region', { name: 'Selected trip' });
  await panel.getByText(/arrive ~/).waitFor({ timeout: 45000 });
  const summary = await panel.innerText();
  const arrive = summary.match(/arrive ~(\d{1,2}:\d{2} [AP]M)/)?.[1];
  const buttonEta = (await primary(page).innerText()).match(/~(\d{1,2}:\d{2} [AP]M)/)?.[1];
  console.log(`trip panel arrive ~${arrive}; primary button ETA ~${buttonEta}; timing: ${summary.match(/(realtime PRT|scheduled)/)?.[1]}`);
  if (!arrive || arrive !== buttonEta) problems.push(`ETA mismatch: panel ${arrive} vs button ${buttonEta}`);
  if (secondCardName && !/Arrive by/.test(await at(page))) problems.push('arrive-by deadline from chat not reflected in the time row');
  await page.getByRole('button', { name: 'Itinerary' }).click();
  const legs = await panel.locator('ol li').allInnerTexts();
  console.log(`itinerary legs (${legs.length}): ${legs.map((l) => l.split('\n')[0]).join(' → ')}`);
  if (!legs.some((l) => /^Walk/.test(l)) || !legs.some((l) => /Board .* → alight/.test(l)) || !legs.some((l) => /Arrive \(estimate\)/.test(l))) problems.push('itinerary is missing walking, boarding/alighting or arrival rows');
  const options = page.getByRole('radiogroup', { name: 'Journey options' }).getByRole('radio');
  if ((await options.count()) > 1) {
    const before = arrive;
    await options.nth(1).click();
    await page.waitForTimeout(500);
    const after = (await panel.innerText()).match(/arrive ~(\d{1,2}:\d{2} [AP]M)/)?.[1];
    const afterButton = (await primary(page).innerText()).match(/~(\d{1,2}:\d{2} [AP]M)/)?.[1];
    console.log(`switched journey: arrive ${before} → ${after}; button ${afterButton}`);
    if (after !== afterButton) problems.push('journey switch left the button ETA stale');
  }
  await primary(page).click();
  await page.waitForTimeout(1500);
  const nowText = await at(page);
  if (!/Leave now\s+Now/.test(nowText.replace(/\n/g, ' '))) problems.push('"Leave now" did not reset the time row');
  const arriveNow = (await panel.innerText()).match(/arrive ~(\d{1,2}:\d{2} [AP]M)/)?.[1];
  const buttonNow = (await primary(page).innerText()).match(/~(\d{1,2}:\d{2} [AP]M)/)?.[1];
  console.log(`leave now: panel ~${arriveNow}, button ~${buttonNow}`);
  if (arriveNow !== buttonNow) problems.push('leave-now ETA mismatch between panel and button');
  await page.screenshot({ path: '../qa/phone-home-journey.png', fullPage: true });

  // 3. Map interaction + fit route.
  const canvas = page.locator('.maplibregl-canvas');
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 + 40, { steps: 8 });
  await page.mouse.up();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await page.getByRole('button', { name: 'Zoom out' }).click();
  await page.getByRole('button', { name: 'Fit route' }).click();
  await page.waitForTimeout(900);
  const pageScrollBefore = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(300);
  const pageScrollAfter = await page.evaluate(() => window.scrollY);
  console.log(`map: drag/zoom/fit ok; plain wheel over the map scrolled the page ${pageScrollBefore} → ${pageScrollAfter}`);
  await page.screenshot({ path: '../qa/phone-home-map-fit.png' });

  // 4. Timeline bars + What's happening.
  await page.goto(base + '/plan', { waitUntil: 'domcontentloaded' });
  const bars = page.getByRole('radio', { name: /pressure \d+ of 100/ });
  await bars.first().waitFor({ timeout: 30000 });
  await bars.nth(5).click();
  const section = page.getByRole('button', { name: /What's happening/ });
  const title = await section.innerText();
  if (!/true/.test(String(await section.getAttribute('aria-expanded')))) problems.push('selecting a bar did not open the evidence section');
  const evidence = await page.getByRole('region', { name: 'Evidence for the selected time' }).innerText();
  console.log(`plan: "${title.replace(/\n/g, ' ')}" → ${evidence.split('\n').slice(0, 3).join(' | ')}`);
  if (!/model pattern|verified feed|rider report/.test(evidence)) problems.push('evidence items lack a basis label');
  const selectedBefore = await bars.nth(5).getAttribute('aria-label');
  await bars.nth(5).focus();
  await page.keyboard.press('ArrowRight');
  const focusedLabel = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  const checked = await page.getByRole('radio', { name: /pressure \d+ of 100/, checked: true }).getAttribute('aria-label');
  console.log(`keyboard: ${selectedBefore} → ${checked} (focus on ${focusedLabel})`);
  if (checked === selectedBefore || focusedLabel !== checked) problems.push('ArrowRight did not move the bar selection/focus');
  await section.click();
  if (await page.getByRole('region', { name: 'Evidence for the selected time' }).isVisible()) problems.push('evidence section did not collapse');
  await page.screenshot({ path: '../qa/phone-plan-evidence.png', fullPage: true });
  await context.close();

  // 5. Failure states.
  const failCtx = await browser.newContext({ viewport: { width: 390, height: 844 } }); // no geolocation permission
  const fail = await failCtx.newPage();
  fail.on('pageerror', (e) => errors.push(String(e)));
  await fail.route('**/api/journey**', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ status: 'error', error: 'Routing provider unavailable. Try again shortly.', retryable: true }) }));
  await fail.route('**/api/chat', (route) => (route.request().method() === 'POST' ? route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Planner unavailable.' }) }) : route.continue()));
  await fail.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await fail.waitForTimeout(2500);
  const home = await at(fail);
  if (!/Device location unavailable or denied/.test(home)) problems.push('denied geolocation did not show the manual-origin hint');
  if (/Routing unavailable/.test(home)) problems.push('routing error shown before any destination exists');
  // cached destination from the previous context is not shared; set one through the field is network-bound, so exercise the routing failure via localStorage cache instead.
  await fail.evaluate(() => localStorage.setItem('loadline:destination', JSON.stringify({ label: 'North Shore', lat: 40.4462, lng: -80.0083 })));
  await fail.reload({ waitUntil: 'domcontentloaded' });
  await fail.getByText('Routing unavailable.').waitFor({ timeout: 15000 });
  const routingFail = (await at(fail)).split('Routing unavailable.')[1]?.split('\n').filter(Boolean)[0];
  console.log(`routing 503 → "Routing unavailable." ${routingFail}`);
  if (/arrive ~/.test(await at(fail))) problems.push('a journey was shown despite routing failure');
  await fail.getByRole('button', { name: /Ask LoadLine/ }).first().click();
  await fail.getByLabel('Message LoadLine').fill('to downtown');
  await fail.getByRole('button', { name: 'Send' }).click();
  await fail.getByText(/planner is unavailable \(503\)/).waitFor({ timeout: 10000 });
  console.log('chat 503 → honest unavailable message, nothing changed');
  await fail.screenshot({ path: '../qa/phone-home-routing-fail.png', fullPage: true });
  await failCtx.close();
} finally {
  await browser.close();
}
if (errors.length) problems.push(`page errors: ${errors.slice(0, 3).join(' | ')}`);
console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'journey/chat/map/evidence QA ok');
process.exitCode = problems.length ? 1 : 0;
