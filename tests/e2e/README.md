# Browser checks

The checks use the installed Playwright CLI and Chrome, without a separate test
runner. Start the app with `npm run dev`, or run `npm run build` followed by
`npm run preview -- --port 4173` to test the Cloudflare production bundle.

```sh
BASE_URL=http://localhost:4173 npm run test:e2e
BASE_URL=http://localhost:4173 npm run test:e2e:gaps
```

Both commands create isolated browser sessions and close them on exit. The
wrapper treats Playwright's `### Error` output as failure, even if its process
returns zero. Assertions wait for UI or game-state transitions rather than fixed
sleep intervals.

- Smoke: home, leaderboard focus, setup/library/profile navigation, search,
  modal keyboard focus, mobile overflow, missing share data, and health.
- Gameplay: host challenge start, matching initial pools in a second browser,
  invite refresh/resume, complete Draft/EP/Album/Budget games, saved results, and
  no cloud writes for unsigned-in guests.

These checks do not verify live provider audio, authenticated database writes,
OAuth, or deployed behavior. They do not submit real accounts or payments.
