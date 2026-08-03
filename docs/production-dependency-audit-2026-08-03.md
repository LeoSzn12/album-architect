# Production dependency audit — 2026-08-03

## Scope

This bounded audit covers `package.json`, `package-lock.json`, and the installed Next/vinext dependency tree. No package, lockfile, or source changes were made. The only change in this slice is this report.

## Baseline

Command:

```sh
npm audit --omit=dev
```

Result: exit code `1`; 3 high production vulnerabilities, 0 critical, 0 moderate, and 0 low.

The relevant resolved tree is:

```text
next@16.2.12
└── postcss@8.4.31      vulnerable nested copy
└── sharp@0.34.5        vulnerable optional dependency

postcss@8.5.23          healthy copy used by Vite/Tailwind
```

Findings reported by npm:

- `postcss@8.4.31`: XSS and source-map file disclosure/path traversal advisories. The affected ranges are `<8.5.10`, `<=8.5.11`, and `<=8.5.17` respectively. See [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93), [GHSA-6g55-p6wh-862q](https://github.com/advisories/GHSA-6g55-p6wh-862q), and [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849).
- `sharp@0.34.5`: inherited libvips vulnerabilities affecting versions `<0.35.0`. See [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj).
- npm aggregates both transitive findings under direct `next@16.2.12`. Its suggested automatic fix is `next@9.3.3`, which is an unusable downgrade and must not be applied.

`vinext@0.0.50` does not introduce an independent production audit finding; it peers with the project’s Next version through `@unpic/react`.

## Remediation investigation

Registry checks show:

- Current stable Next is `16.2.12`, whose manifest pins `postcss` to `8.4.31` and permits `sharp` `^0.34.5`.
- `postcss@8.5.25` is available and resolves all reported PostCSS ranges.
- `sharp@0.35.3` is available and is the current compatible security line for the reported sharp advisory. It requires Node `>=20.9.0`; Next `16.2.12` has the same minimum.
- Next `16.3.0-preview.8+` changes its dependency lines to `postcss@8.5.10` and `sharp@^0.35.3`, but it is a prerelease and is not a production-safe upgrade recommendation without a separate framework compatibility review. The current stable channel does not expose a fixed Next release through the registry metadata checked here.

An isolated temporary copy of the checked-in tree was tested with this candidate npm override (the repository was not edited):

```json
{
  "overrides": {
    "postcss": "8.5.25",
    "sharp": "0.35.3"
  }
}
```

The temporary install resolved `postcss@8.5.25` and `sharp@0.35.3` under Next, Vite/Tailwind, and Miniflare. Its `npm audit --omit=dev` returned 0 vulnerabilities. Against the checked-in application source, the same isolated tree also passed:

- `npm run build`
- `npm test` — 32 tests passed
- `npm run lint`

## Decision

The compatible non-force remediation is now applied in `package.json` and `package-lock.json`:

```json
{
  "overrides": {
    "postcss": "8.5.25",
    "sharp": "0.35.3"
  }
}
```

The resolved tree is `postcss@8.5.25` and `sharp@0.35.3` under Next, Vite/Tailwind, and Miniflare. Verification completed with `npm audit --omit=dev` reporting zero vulnerabilities, plus `npm test`, `npm run lint`, and `npm run build` passing. A production deployment smoke test remains appropriate because `sharp` includes native binaries.

Follow-up:

1. Keep the overrides while supported deployment targets are verified on Node `>=20.9.0`.
2. Re-run the production audit in CI and during deployment.
3. Remove the overrides once a stable Next release updates its own PostCSS and sharp dependency lines.

Do not run `npm audit fix --force`; npm’s proposed Next `9.3.3` result is a downgrade that would break the current Next/vinext application.

## Files changed in this slice

- `docs/production-dependency-audit-2026-08-03.md` — this report only.

Pre-existing worktree modifications were left untouched.
