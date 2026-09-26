module.exports = async (page) => {
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(30000);
  const origin = await page.evaluate(() => window.location.origin);
  const errors = [];
  const forbiddenWrites = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (request.method() === 'POST' && /\/api\/(sessions|scorecards|challenges)(\/|$)/.test(request.url())) forbiddenWrites.push(request.url());
  });
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('album-architect-draft-v1')).state);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => localStorage.clear());
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '1v1 Challenge', exact: true }).click();
  const invite = await page.getByRole('textbox', { name: 'Shareable invite link' }).inputValue();
  await page.getByRole('button', { name: /Start Matched Draft With Seed/ }).click();
  await page.getByRole('button', { name: 'Lock In Pick', exact: true }).first().waitFor();
  const initial = (await state()).candidateHistory[0].pools[0].map((song) => song.id);
  await page.getByRole('button', { name: 'Lock In Pick', exact: true }).first().click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('album-architect-draft-v1')).state.currentRoundIndex === 1);
  // Invites opened in a fresh browser must match, irrespective of host history.
  const friendContext = await page.context().browser().newContext();
  const friend = await friendContext.newPage();
  await friend.goto(invite, { waitUntil: 'domcontentloaded' });
  await friend.getByRole('button', { name: 'Lock In Pick', exact: true }).first().waitFor();
  const friendPool = await friend.evaluate(() => JSON.parse(localStorage.getItem('album-architect-draft-v1')).state.candidateHistory[0].pools[0].map((song) => song.id));
  if (JSON.stringify(initial) !== JSON.stringify(friendPool)) throw new Error('Friend starting pools differ');
  await friendContext.close();
  await page.goto(invite, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('album-architect-draft-v1')).state.currentRoundIndex === 1);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Lock In Pick', exact: true }).first().waitFor();
  if ((await state()).currentRoundIndex !== 1) throw new Error('Invite reload lost progress');
  for (const [mode, count, review] of [['draft', 7, 'Get Your Score'], ['ep', 7, 'Review EP'], ['album', 14, 'Review Album'], ['budget', 5, 'Review $15 Budget']]) {
    await page.goto(`${origin}/?seed=QA-${mode}&mode=${mode}&diff=standard&era=all&theme=standard`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Lock In Pick', exact: true }).first().waitFor();
    for (let round = 1; round <= count; round++) {
      await page.getByRole('button', { name: 'Lock In Pick', exact: true }).and(page.locator(':enabled')).first().click();
      await page.waitForFunction((expected) => JSON.parse(localStorage.getItem('album-architect-draft-v1')).state.currentRoundIndex === expected, round);
      if (round === 1) {
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: 'Lock In Pick', exact: true }).first().waitFor();
        if ((await state()).currentRoundIndex !== 1) throw new Error(`${mode} lost progress on refresh`);
        const expectedPool = (await state()).candidateHistory.find((entry) => entry.roundIndex === 1).pools.at(-1);
        const visibleCandidates = await page.getByRole('article').evaluateAll((elements) => elements.map((el) => el.getAttribute('aria-label')));
        for (const song of expectedPool) {
          if (!visibleCandidates.some((label) => label?.endsWith(`: ${song.title} by ${song.artist}`))) throw new Error(`${mode} changed candidate pool on refresh`);
        }
      }
    }
    await page.getByRole('button', { name: review, exact: true }).click();
    await page.getByRole('heading', { name: 'Transparent A&R Scorecard', exact: true }).waitFor({ timeout: 60000 });
    const completed = await state();
    if (!Number.isFinite(completed.evaluationResult.overallScore)) throw new Error(`${mode} has no score`);
    if (completed.sessionId !== null) throw new Error('Guest received a cloud session');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Transparent A&R Scorecard', exact: true }).waitFor();
  }
  if (forbiddenWrites.length) throw new Error(`Guest attempted cloud writes: ${forbiddenWrites.length}`);
  if (errors.length) throw new Error(errors.join('\n'));
};
