# Pre-migration Baseline

Snapshot of Lighthouse scores and bundle composition before the RSC migration described in `MIGRATION_PLAN.md`. Re-run after each migration commit to quantify deltas.

## Methodology

- **Tool**: `@lhci/cli@0.15.1` (global `lighthouse@13.1.0` also available).
- **Command**: `pnpm lh` (`next build && lhci autorun`).
- **Server**: `pnpm exec next start -p 4999` — port 4999 to avoid collisions with other local dev servers. (An earlier run accidentally audited a dev server running on port 3000 from a different project; invalid results discarded.)
- **Preset**: `desktop`, throttling default, 3 runs, median reported.
- **Categories**: performance, accessibility, best-practices, seo.
- **Skipped audits**: `uses-http2` (localhost is HTTP/1.1; not representative of production).
- **Raw reports**: `lighthouse-baseline/` (JSON + HTML for all 3 runs + manifest). Gitignored — regenerate locally with `pnpm lh` if needed.
- **Commit**: `main @ 653fe30` (no working-tree changes affecting runtime).

## Scores

| Category | Run 1 | Run 2 | Run 3 | Median |
|---|---|---|---|---|
| Performance | 93 | 93 (rep) | 92 | **93** |
| Accessibility | 94 | 94 | 94 | **94** |
| Best Practices | 96 | 96 | 96 | **96** |
| SEO | 100 | 100 | 100 | **100** |

Representative run: `localhost--2026_04_15_13_06_05.report.json`.

## Core Web Vitals (representative run, desktop)

| Metric | Value | Notes |
|---|---|---|
| First Contentful Paint | **0.3 s** | Skeleton shell paints fast — it's client-rendered from an inline HTML body, no data wait. |
| Largest Contentful Paint | **1.8 s** | Time until the first real data-filled element appears. The dominant contributor is the `ssr:false` dynamic import of `providers.tsx` resolving + hydrating + running client-side Morpho GraphQL fetches. This is the single most important number to watch post-migration. |
| Total Blocking Time | 0 ms | No long tasks on the main thread. |
| Cumulative Layout Shift | 0 | Skeleton sizes match final content. |
| Speed Index | 0.7 s | |
| Time to Interactive | 1.8 s | Dominated by LCP, same reason. |

## Resource summary (representative run)

| Type | Count | Transfer |
|---|---|---|
| Script | 33 | 728.4 KiB |
| Font | 2 | 58.9 KiB |
| Other | 17 | 33.4 KiB |
| Stylesheet | 2 | 10.5 KiB |
| Document | 1 | 3.2 KiB |
| Third-party | 16 | 7.7 KiB |
| **Total** | **55** | **834.3 KiB** |

## Top JS chunks (attributed)

Top 10 scripts by compressed transfer size, attributed by scanning each chunk for library identifiers (`head -c 500k | grep`):

| Transfer | Raw | Contents |
|---|---|---|
| 141.5 KiB | 434 KiB | **RainbowKit + wagmi + QueryClient + connectors** (MetaMask, Coinbase, WalletConnect markers) |
| 96.1 KiB | 337 KiB | **Recharts** (already `dynamic(ssr:false)` via `SharePriceChartInner`) |
| 70.6 KiB | 266 KiB | WalletConnect / Coinbase split chunk |
| 68.9 KiB | 219 KiB | Unattributed — likely React framework + viem core |
| 68.7 KiB | 258 KiB | WalletConnect shared runtime |
| 39.8 KiB | 120 KiB | — |
| 39.5 KiB | 154 KiB | — |
| 38.4 KiB | 138 KiB | — |
| 21.3 KiB | 73 KiB | — |
| 18.3 KiB | 64 KiB | — |

**Observation.** The wallet stack (RainbowKit + wagmi + WalletConnect + connectors) spans at least three of the top five chunks and accounts for roughly 280–350 KiB gzipped. Post-migration this code stays exactly where it is — still dynamically imported behind `ssr:false` — so its transfer size will not change. What changes is *when* the browser needs it: currently the whole page is gated on its evaluation (hence LCP 1.8s); post-migration the static shell paints first and the wallet chunk loads off the critical path.

Recharts (96 KiB) is already deferred correctly.

## Performance opportunities flagged

| Audit | Value |
|---|---|
| `unused-javascript` | 348 KiB unused (estimated 410 ms savings) |
| `legacy-javascript` | 13 KiB savings |
| `uses-rel-preconnect` | 110 ms savings (no preconnect to `blue-api.morpho.org`) |
| `largest-contentful-paint-element` | 1,790 ms to render the LCP element |

The 348 KiB of unused JS is almost entirely inside the wallet chunks — RainbowKit ships UI for every wallet type but only one is shown per session. This is inherent to the library; not fixable without replacing RainbowKit (explicit non-goal of the migration).

## Accessibility findings

| Audit | Issue |
|---|---|
| `color-contrast` | `text-gray-500`, `text-gray-400` on dark background fail WCAG AA in several places (time-range buttons, stat labels, connect button inner text). |
| `heading-order` | `h3` used under an `h1` with no `h2` in between (stat card titles). |

These are pre-existing and unrelated to the migration. **Not in scope for the migration plan**; flagging here so the post-migration diff isn't misread as a regression if touched in passing.

## Best-practices findings

| Audit | Issue |
|---|---|
| `errors-in-console` | Browser errors logged on page load. |

Likely wagmi/WalletConnect initialization noise. Worth reviewing separately after the migration settles; not a migration task.

## Bundle observations from `next build`

Next 16 with Turbopack does not emit the classic First-Load-JS table. The build output lists routes only:

```
Route (app)
┌ ○ /
└ ○ /_not-found

○  (Static)  prerendered as static content
```

Both routes are prerendered, but the `/` route's static HTML is effectively empty beyond the skeleton markup — all real content renders after hydration via client-side `useQuery`. Post-migration, the static HTML for `/` should contain TVL, APY, liquidity, vault name, curator, and allocation rows (verifiable with `curl -s localhost:4999 | grep TVL`).

Raw chunk sizes live under `.next/static/chunks/` (6.4 MB uncompressed across 189 files). Post-migration file count may increase as the App Router emits separate chunks for each server wrapper, but the critical-path transfer size should drop.

## Expected deltas after migration

Predictions to verify against the post-migration report:

| Metric | Baseline | Expected post-migration | Why |
|---|---|---|---|
| Performance score | 93 | 97–100 | LCP drops sharply; rest of metrics already near ceiling. |
| LCP | 1.8 s | 0.3–0.5 s | Static shell contains real data; LCP is now a text/number paint, not a hydration gate. |
| FCP | 0.3 s | 0.2–0.3 s | Already near floor. Minor improvement possible from fewer blocking scripts. |
| TBT | 0 ms | 0 ms | No change. |
| Script transfer | 728 KiB | 700–730 KiB | Essentially unchanged. Wallet chunks stay the same; a small amount of server-component JS no longer ships. |
| `unused-javascript` | 348 KiB | 300–350 KiB | Mostly RainbowKit; wallet stack untouched. |
| Accessibility | 94 | 94 | Not in scope. |
| Best Practices | 96 | 96 | Not in scope. |

If LCP does not drop below 1 s post-migration, something in the plan is wrong — either Cache Components is not actually prerendering, or the client hydration is still gating first paint on a fetch. Treat that as a gate for commit 5 acceptance.

## Re-running

```sh
pnpm lh                                    # full cycle: build → start → audit → collect
mv .lighthouseci lighthouse-post-migration # preserve under a stable name
```

Compare `lighthouse-baseline/manifest.json` to `lighthouse-post-migration/manifest.json` for headline numbers; diff individual report JSONs for detail.
