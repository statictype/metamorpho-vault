# RSC Migration Plan

Convert the app from an `ssr: false` SPA-in-Next to a Next.js 16 App Router setup where the public vault view is prerendered into a static shell, data sections stream in via Suspense, and the wallet-connector module graph stays isolated behind a client-only island.

Target stack (already pinned in `package.json`):

- `next@16.1.7`
- `react@19.2.3`
- `@tanstack/react-query@5.91.0`
- `wagmi@3.5.0`
- `@rainbow-me/rainbowkit@2.2.10`
- `babel-plugin-react-compiler@1.0.0`

This plan is written to be executed by Claude in a future session. File paths, exact code blocks, and commit boundaries are all spelled out. Execute commits in order; each should leave the app in a shippable state.

---

## Goals

1. **Public market data** (TVL, APY, liquidity, name, curator, allocations, share-price history) is fetched server-side from the Morpho GraphQL API, cached via `'use cache'`, and included in the prerendered static shell (Partial Prerendering).
2. **Streaming**: each data section renders inside its own `<Suspense>` boundary so fast sections paint before slow ones. TTFB is near-zero regardless of Morpho latency.
3. **Wallet-dependent UI** (connect button, balance, allowance, shares, submit) stays client-only, inside a dynamically imported provider subtree that never touches SSR.
4. **TanStack Query stays**. Wagmi v3 is built on it, and client-side polling (10–15s on-chain, 30s–5min API) is unchanged. Server data crosses the boundary via `initialData` + `initialDataUpdatedAt` so the client knows how fresh the server snapshot is.
5. **No regressions** to the current transaction flow (`useSendCalls` → `useCallsStatus` → toast lifecycle) or to cache invalidation after writes.

## Non-goals

- Replacing RainbowKit with a lighter wallet UI.
- Server actions for transactions (transactions must be signed client-side).
- Moving on-chain reads (wagmi) to the server.
- Changing the Morpho GraphQL schema or query shapes.

---

## Baseline and success gates

A pre-migration Lighthouse baseline was captured on `main @ 653fe30` and stored in `lighthouse-baseline/` (raw JSON + HTML for 3 runs, gitignored and regenerable). Methodology and attribution live in [`rsc-migration-baseline.md`](rsc-migration-baseline.md).

### Baseline numbers (desktop preset, 3 runs, median)

| Category | Score |
|---|---|
| Performance | 93 |
| Accessibility | 94 |
| Best Practices | 96 |
| SEO | 100 |

Core Web Vitals (representative run):

| Metric | Value |
|---|---|
| FCP | 0.3 s |
| **LCP** | **1.8 s** |
| TBT | 0 ms |
| CLS | 0 |
| TTI | 1.8 s |

Bundle: 834 KiB total / 728 KiB scripts across 33 JS files. The wallet stack (RainbowKit + wagmi + WalletConnect + connectors) accounts for ~280–350 KiB gzipped across the top three chunks. Recharts (96 KiB gzipped) is already `dynamic(ssr:false)` and will remain so.

### Why this matters for the plan

The entire motivation for the migration is visible in one number: **LCP 1.8s**. The static HTML today is effectively empty — just a skeleton — so first contentful paint comes from the skeleton (0.3s) and largest contentful paint waits for the `ssr:false` provider tree to resolve, hydrate, and run client-side Morpho fetches.

Script transfer size will **not** improve meaningfully post-migration. The wallet stack stays client-only by design, and that's where most of the JS lives. What changes is *when* the browser needs it: after the migration, the static shell contains the real data (TVL, APY, liquidity, curator, allocations, share-price history), so the wallet chunk loads off the critical path.

### Success gates (must hold after commit 5)

| Metric | Gate | Why |
|---|---|---|
| LCP | ≤ 0.5 s | If LCP doesn't drop below 1 s, Cache Components isn't actually prerendering, or client hydration is still gating first paint on a fetch. Block commit 5 until resolved. |
| Performance score | ≥ 97 | TBT and CLS are already at floor; LCP drop is the only realistic lever. |
| Static HTML contains data | `curl -s localhost:4999 \| grep -qE '(TVL\|APY\|Total Supply)'` | Confirms the shell is not an empty skeleton anymore. |
| Script transfer | within ±10% of baseline | Regressions here indicate accidental server-bundle bloat. |
| Accessibility score | ≥ 94 (unchanged) | Pre-existing `color-contrast` and `heading-order` issues are **explicitly out of scope**. Don't fix them in passing — they'd pollute the migration diff. |
| Best Practices score | ≥ 96 (unchanged) | Same reason. `errors-in-console` is a separate follow-up. |

### Predicted deltas (from the baseline writeup)

| Metric | Baseline | Predicted | Notes |
|---|---|---|---|
| Perf score | 93 | 97–100 | |
| LCP | 1.8 s | 0.3–0.5 s | Biggest expected win. |
| FCP | 0.3 s | 0.2–0.3 s | Already near floor. |
| Script transfer | 728 KiB | 700–730 KiB | Essentially unchanged. |
| `unused-javascript` | 348 KiB | 300–350 KiB | Mostly RainbowKit; untouched. |

### Re-running the audit

```sh
pnpm lh                                      # build + start on :4999 + 3 runs
mv .lighthouseci lighthouse-post-migration   # preserve under stable name
diff <(jq '.[] | .summary' lighthouse-baseline/manifest.json) \
     <(jq '.[] | .summary' lighthouse-post-migration/manifest.json)
```

### Port discipline

`lighthouserc.json` pins the audit server to port **4999**. This is deliberate: an early run silently attached to a stale `next dev` on port 3000 owned by an unrelated project and audited the wrong site. Do not change the port back to 3000. If you need to test manually, use `pnpm exec next start -p 4999`.

### Things the baseline found that are NOT migration work

For the post-migration diff to be clean, these known issues must remain unchanged. Do not fix them in the migration commits.

- **Color contrast** on `text-gray-500` / `text-gray-400` over dark backgrounds (time-range buttons, stat labels, connect button inner text).
- **Heading order** — `h3` under `h1` with no intervening `h2` on stat cards.
- **Console errors** on page load (likely wagmi / WalletConnect initialization noise).
- **`uses-rel-preconnect`** — no preconnect to `blue-api.morpho.org` (would shave ~110 ms, but post-migration the initial page no longer fetches from that origin on the critical path, so the audit may auto-resolve or change meaning).

Track these in a separate follow-up after the migration ships.

## Constraint we're designing around

Commit `65673a5` moved `Providers` behind `dynamic(..., { ssr: false })` because WalletConnect's connector reads `indexedDB` at module-evaluation time, which breaks Next's static generation. That fix stays — we just shrink the boundary so it wraps only the interactive subtree instead of the whole page, and let the outer page become a server component.

## Rules Claude must follow when executing this plan

- **Stop after each commit** and wait for review before moving to the next. The user reviews incrementally.
- **Commit messages**: neutral, present tense, no references to the take-home challenge or to "migration". Example: `Enable Cache Components and add server-side Morpho fetch layer`, not `Phase 1: migrate to SSR`.
- **Do not add** `useMemo`, `useCallback`, or `React.memo`. The React Compiler handles memoization.
- **All writes** must go through `useSendCalls` / `sendCallsAsync`. Never `useWriteContract`.
- **Cache invalidation after transactions**: keep the existing targeted approach using wagmi's `readContractQueryKey` / `readContractsQueryKey` from `wagmi/query` and `QUERY_KEYS` from `src/lib/constants.ts`. Do not replace with blanket refetches.
- **Do not restructure** the `src/` layout. Only the files this plan names move, get renamed, or get created.
- **Do not move** on-chain wagmi reads or wallet-scoped queries to the server.

---

## Target architecture

```
app/layout.tsx                              server — unchanged metadata, font setup
  app/loading.tsx                           server — skeleton fallback for navigations
  app/page.tsx                              server — composes sections
    <VaultHeaderServer />                   server — own Suspense, own cached fetch
    <VaultStatsServer />                    server — own Suspense, own cached fetch
    <SharePriceChartServer />               server — own Suspense, own cached fetch
    <VaultAllocationsServer />              server — own Suspense, own cached fetch
      each server wrapper renders its
      existing client component with
      initialData + initialDataUpdatedAt
    <InteractiveShell>                      client — dynamic(ssr:false) entry
      <WalletIsland>                        client — WagmiProvider + Query + RainbowKit + Toast
        <Header />                          client — connect button
        <ActionPanel>                       client — tab state + form shell (no wallet hooks)
          <AmountInput />                   client — pure UI
          <DepositSubmit /> | <WithdrawSubmit />  client — reads wallet, dispatches tx
```

Two things to notice:

- The server `*Server` wrappers are tiny async components that call a cached fetch and hand the result to the existing client component via props. The client components keep their `useQuery` (for polling) but now hydrate instantly from server data.
- The `InteractiveShell` wraps `Header` + `ActionPanel` so they share the same wagmi context. Only this subtree is excluded from SSR.

---

## Data-fetching and caching model

### Server side (`'use cache'` + `cacheLife` + `cacheTag`)

All Morpho queries become cached server functions. Arguments are part of the cache key automatically, so per-vault (and, for history, per-vault) caching is free.

```ts
// src/lib/morpho-api.server.ts
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { fetchVaultData, fetchVaultHistory, fetchVaultAllocations } from "./morpho-api";

export async function getVaultSummary(address: string) {
  "use cache";
  cacheLife({ revalidate: 30, stale: 60, expire: 300 });
  cacheTag("vault-summary", `vault-${address.toLowerCase()}`);
  return fetchVaultData(address);
}

export async function getVaultHistory(address: string) {
  "use cache";
  cacheLife({ revalidate: 300, stale: 600, expire: 3600 });
  cacheTag("vault-history", `vault-${address.toLowerCase()}`);
  return fetchVaultHistory(address);
}

export async function getVaultAllocations(address: string) {
  "use cache";
  cacheLife({ revalidate: 60, stale: 120, expire: 600 });
  cacheTag("vault-allocations", `vault-${address.toLowerCase()}`);
  return fetchVaultAllocations(address);
}
```

Revalidation intervals match the client refetch intervals declared in the hooks (`useVaultApi`: 30s, `useVaultAllocations`: 60s, `useVaultHistory`: 5min). This keeps server-rendered snapshots at most one client-poll interval behind live.

### Client side (`initialData` + `initialDataUpdatedAt`)

Each hook accepts an optional `initialData` and `initialDataUpdatedAt`. TanStack Query needs both — without `initialDataUpdatedAt`, it assumes the data was fetched just now, and with a cached server snapshot that could be up to `revalidate` seconds old, this leads to the client sitting on stale data for another full interval.

```ts
// src/hooks/useVaultApi.ts (after change)
"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchVaultData } from "@/lib/morpho-api";
import { VAULT_ADDRESS } from "@/config/contracts";
import { QUERY_KEYS } from "@/lib/constants";
import type { VaultApiData } from "@/types";

export function useVaultApi(options?: {
  initialData?: VaultApiData;
  initialDataUpdatedAt?: number;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.vaultApi,
    queryFn: () => fetchVaultData(VAULT_ADDRESS),
    staleTime: 30_000,
    refetchInterval: 30_000,
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialDataUpdatedAt,
  });
}
```

Same shape for `useVaultHistory` and `useVaultAllocations`.

### Chart time-range handling

The share-price chart already fetches the **full** history once and filters client-side by range (`useState<TimeRange>`). Server prefetch hands over the full dataset; the range selector stays a pure client-side filter. No `searchParams` round-trip, no per-range server fetches.

### Why not pass the promise via `use()` instead of `initialData`?

Considered. The `initialData` pattern is kept because:
1. It composes with TanStack's polling loop without custom glue.
2. Serialization failures surface at render (server) rather than in the client. Our data is plain JSON, so either works, but `initialData` is the lower-risk choice.
3. React Compiler has no opinion either way.

---

## File-by-file changes

### New files

| File | Purpose |
|---|---|
| `src/lib/morpho-api.server.ts` | Server-only cached wrappers around `fetchVaultData` / `fetchVaultHistory` / `fetchVaultAllocations`. |
| `src/app/wallet-island.tsx` | Client component. Hosts `WagmiProvider` + `QueryClientProvider` + `RainbowKitProvider` + `ToastProvider`. Body identical to today's `providers.tsx`. |
| `src/app/interactive-shell.tsx` | Client component. `dynamic`-imports `wallet-island` with `ssr: false` and renders `<Header />` + its children. Replaces today's `client-shell.tsx`. |
| `src/app/loading.tsx` | Server component. Reuses the existing `ShellSkeleton` markup for route-level Suspense fallback. |
| `src/components/vault/VaultHeaderServer.tsx` | Async server wrapper. Calls `getVaultSummary` and renders `<VaultHeader name curator />`. |
| `src/components/vault/VaultStatsServer.tsx` | Async server wrapper. Passes `initialData` + `initialDataUpdatedAt` to `<VaultStats />`. |
| `src/components/vault/SharePriceChartServer.tsx` | Async server wrapper for `<SharePriceChart />`. |
| `src/components/vault/VaultAllocationsServer.tsx` | Async server wrapper for `<VaultAllocations />`. |
| `src/components/vault/skeletons.tsx` | Per-section skeletons for each Suspense boundary (stats, chart, allocations, header). Extract from the existing `ShellSkeleton` in `client-shell.tsx`. |
| `src/components/actions/DepositSubmit.tsx` | Wallet-gated submit button + balance readout for deposits. |
| `src/components/actions/WithdrawSubmit.tsx` | Same for withdrawals. |

### Modified files

| File | Change |
|---|---|
| `next.config.ts` | Add `cacheComponents: true`. |
| `src/app/layout.tsx` | Remove `<ClientShell>` wrapper. Render `{children}` directly. Metadata stays. |
| `src/app/page.tsx` | Becomes a server component that composes `*Server` wrappers, each inside its own `<Suspense>`. Renders `<InteractiveShell>` containing `<ActionPanel />`. |
| `src/components/layout/VaultPage.tsx` | **Delete.** Composition moves to `page.tsx`. |
| `src/components/vault/VaultHeader.tsx` | Drop `"use client"` + `useVaultApi`. Becomes a plain server-or-client component accepting `name` and `curator` as props. |
| `src/components/vault/VaultStats.tsx` | Accept `initialData` + `initialDataUpdatedAt` props. Forward to `useVaultApi`. Stays client. |
| `src/components/vault/SharePriceChart.tsx` | Accept `initialHistory` + `initialDataUpdatedAt` props. Forward to `useVaultHistory`. Stays client. |
| `src/components/vault/VaultAllocations.tsx` | Accept `initialData` + `initialDataUpdatedAt` props. Forward to `useVaultAllocations`. Stays client. |
| `src/hooks/useVaultApi.ts` | Accept optional `initialData` / `initialDataUpdatedAt`. |
| `src/hooks/useVaultHistory.ts` | Same. |
| `src/hooks/useVaultAllocations.ts` | Same. |
| `src/components/actions/ActionPanel.tsx` | No change. Still client, still owns tab state, no wallet hooks. |
| `src/components/actions/DepositForm.tsx` | Split submit + wallet hooks into `<DepositSubmit />`. Form owns only layout + `<AmountInput />`. `maxAmount` is read once at the top of the form via a single `useUserData()` call and passed down as a prop. |
| `src/components/actions/WithdrawForm.tsx` | Same pattern. |
| `src/components/layout/Header.tsx` | No change. Remains inside the wallet island. |

### Deleted files

- `src/app/client-shell.tsx` — replaced by `interactive-shell.tsx`.
- `src/app/providers.tsx` — replaced by `wallet-island.tsx` (same code, renamed to reflect its role as a client-only subtree).
- `src/components/layout/VaultPage.tsx` — inlined into `page.tsx`.

---

## Commit sequence

Each commit is independently deployable, keeps `pnpm build` + `pnpm test` green, and is reviewed before the next begins.

### Commit 1 — Enable Cache Components and add server fetch layer

**Files changed**

- `next.config.ts`
- `src/lib/morpho-api.server.ts` (new)

**Code**

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
};

export default nextConfig;
```

```ts
// src/lib/morpho-api.server.ts
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import {
  fetchVaultData,
  fetchVaultHistory,
  fetchVaultAllocations,
} from "./morpho-api";

export async function getVaultSummary(address: string) {
  "use cache";
  cacheLife({ revalidate: 30, stale: 60, expire: 300 });
  cacheTag("vault-summary", `vault-${address.toLowerCase()}`);
  return fetchVaultData(address);
}

export async function getVaultHistory(address: string) {
  "use cache";
  cacheLife({ revalidate: 300, stale: 600, expire: 3600 });
  cacheTag("vault-history", `vault-${address.toLowerCase()}`);
  return fetchVaultHistory(address);
}

export async function getVaultAllocations(address: string) {
  "use cache";
  cacheLife({ revalidate: 60, stale: 120, expire: 600 });
  cacheTag("vault-allocations", `vault-${address.toLowerCase()}`);
  return fetchVaultAllocations(address);
}
```

**Verify**

- `pnpm build` succeeds. Cache Components will immediately flag anywhere in the existing tree that accesses uncached runtime data outside a Suspense boundary. **Expected** because `page.tsx` still imports the client subtree.

**Expected build error from commit 1 alone:** the layout renders a client-only subtree that blocks prerendering. This is resolved in commit 2. If `pnpm build` fails here with `Uncached data was accessed outside of <Suspense>`, that's the error to fix in commit 2 — not a blocker on this commit's own correctness.

If the Cache Components error blocks `pnpm build` and we can't ship commit 1 alone, reorder: do commit 2 first, then commit 1. The substance doesn't change.

### Commit 2 — Rename providers to wallet-island, split interactive shell

Pure rename + boundary move. No behaviour change yet.

**Files changed**

- `src/app/providers.tsx` → `src/app/wallet-island.tsx` (rename, contents unchanged)
- `src/app/client-shell.tsx` → `src/app/interactive-shell.tsx` (rename + update imports)
- `src/components/vault/skeletons.tsx` (new — extract per-section skeletons from the existing `ShellSkeleton`)
- `src/app/interactive-shell.tsx` updates its internal skeleton to only the wallet-dependent bits (header connect button + action panel), since data skeletons move to their per-section Suspense fallbacks.

**wallet-island.tsx** — identical to current `providers.tsx` (rename the exported component from `Providers` to `WalletIsland` for clarity).

**interactive-shell.tsx**:

```tsx
"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { WalletIslandSkeleton } from "@/components/vault/skeletons";

const WalletIsland = dynamic(
  () => import("./wallet-island").then((mod) => mod.WalletIsland),
  { ssr: false, loading: () => <WalletIslandSkeleton /> }
);

export function InteractiveShell({ children }: { children: ReactNode }) {
  return (
    <WalletIsland>
      <Header />
      {children}
    </WalletIsland>
  );
}
```

**skeletons.tsx** exports four skeletons: `VaultHeaderSkeleton`, `VaultStatsSkeleton`, `SharePriceChartSkeleton`, `VaultAllocationsSkeleton`, plus `WalletIslandSkeleton` (header row + action panel column). Mine the exact Tailwind classes from the current `ShellSkeleton` in `client-shell.tsx` so the visual does not regress.

**Do not** wire these up yet — this commit is rename + extraction only. `layout.tsx` still renders `<InteractiveShell>` wrapping `{children}`:

```tsx
// src/app/layout.tsx (interim state)
import { InteractiveShell } from "./interactive-shell";
// ...
<InteractiveShell>{children}</InteractiveShell>
```

**Verify**

- `pnpm build` succeeds. Visual parity with `main`.
- `pnpm test` passes.

### Commit 3 — Split ActionPanel: extract DepositSubmit / WithdrawSubmit

Prep for shrinking the wallet island in commit 5. Unrelated to SSR, but needed so that the form shell (pure UI) can sit inside the wallet island without pulling wallet hooks into every form field.

**Files changed**

- `src/components/actions/DepositSubmit.tsx` (new)
- `src/components/actions/WithdrawSubmit.tsx` (new)
- `src/components/actions/DepositForm.tsx` (modified)
- `src/components/actions/WithdrawForm.tsx` (modified)

**Slicing**

- `DepositForm` keeps: tab-local state, `<AmountInput />`, validation for the typed amount.
- Single `useUserData()` call at the top of the form produces `maxAmount` and `balance`, passed as props to both `<AmountInput />` and `<DepositSubmit />`.
- `DepositSubmit` owns: `useDeposit()`, `useAccount()`, rendering the button (`Connect Wallet` when `!isConnected`, `Approve + Deposit` / `Deposit` based on allowance, loading states from the `useDeposit` status machine).

Same split for `WithdrawForm` / `WithdrawSubmit`.

**Verify**

- Deposit happy-path works end-to-end on Anvil: zero-allowance (batched approve+deposit), exact-allowance (deposit only), partial-allowance (batched), max-uint allowance.
- Withdraw happy-path works.
- Reject, RPC failure, and timeout paths reset state cleanly (no stuck buttons).
- Existing tests in `src/__tests__` still pass.

### Commit 4 — Promote layout.tsx to server, move InteractiveShell into page.tsx

**Files changed**

- `src/app/layout.tsx` (modified — remove InteractiveShell)
- `src/app/page.tsx` (modified — interim: render `<InteractiveShell><VaultPage /></InteractiveShell>`)

**layout.tsx**:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MetaMorpho Vault — 3F x Steakhouse USDC",
  description: "Deposit and withdraw USDC from the 3F x Steakhouse MetaMorpho vault",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

**page.tsx (interim)**:

```tsx
import { InteractiveShell } from "./interactive-shell";
import { VaultPage } from "@/components/layout/VaultPage";

export default function Page() {
  return (
    <InteractiveShell>
      <VaultPage />
    </InteractiveShell>
  );
}
```

**Verify**

- `pnpm build` — now runs into Cache Components error if commit 1 landed. Fix by wrapping the (still entirely client-side) tree temporarily in a top-level `<Suspense fallback={<WalletIslandSkeleton />}>`. Remove in commit 5 once each section has its own boundary.
- Visual parity.
- Transactions still work.

### Commit 5 — Server wrappers + per-section Suspense (the core of the migration)

**Files changed**

- `src/components/vault/VaultHeaderServer.tsx` (new)
- `src/components/vault/VaultStatsServer.tsx` (new)
- `src/components/vault/SharePriceChartServer.tsx` (new)
- `src/components/vault/VaultAllocationsServer.tsx` (new)
- `src/components/vault/VaultHeader.tsx` (drop `"use client"` + data hook, accept props)
- `src/components/vault/VaultStats.tsx` (accept `initialData` + `initialDataUpdatedAt`)
- `src/components/vault/SharePriceChart.tsx` (accept `initialHistory` + `initialDataUpdatedAt`)
- `src/components/vault/VaultAllocations.tsx` (accept `initialData` + `initialDataUpdatedAt`)
- `src/hooks/useVaultApi.ts` (accept `initialData` / `initialDataUpdatedAt`)
- `src/hooks/useVaultHistory.ts` (same)
- `src/hooks/useVaultAllocations.ts` (same)
- `src/app/page.tsx` (rewritten)
- `src/components/layout/VaultPage.tsx` (deleted)

**Server wrapper pattern** (same shape for all four):

```tsx
// src/components/vault/VaultStatsServer.tsx
import { getVaultSummary } from "@/lib/morpho-api.server";
import { VAULT_ADDRESS } from "@/config/contracts";
import { VaultStats } from "./VaultStats";

export async function VaultStatsServer() {
  const data = await getVaultSummary(VAULT_ADDRESS);
  return <VaultStats initialData={data} initialDataUpdatedAt={Date.now()} />;
}
```

Note: `Date.now()` is called in the **server wrapper body**, which runs inside the cached fetch's caller — not inside the cached function. The cached function result is memoized by arguments; the `Date.now()` call sits outside that memo, so it reflects when this request's render actually began. This is the correct handoff signal for TanStack's `initialDataUpdatedAt`.

**page.tsx (final)**:

```tsx
import { Suspense } from "react";
import { InteractiveShell } from "./interactive-shell";
import { VaultHeaderServer } from "@/components/vault/VaultHeaderServer";
import { VaultStatsServer } from "@/components/vault/VaultStatsServer";
import { SharePriceChartServer } from "@/components/vault/SharePriceChartServer";
import { VaultAllocationsServer } from "@/components/vault/VaultAllocationsServer";
import { ActionPanel } from "@/components/actions/ActionPanel";
import {
  VaultHeaderSkeleton,
  VaultStatsSkeleton,
  SharePriceChartSkeleton,
  VaultAllocationsSkeleton,
} from "@/components/vault/skeletons";

export default function Page() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <Suspense fallback={<VaultHeaderSkeleton />}>
        <VaultHeaderServer />
      </Suspense>

      <Suspense fallback={<VaultStatsSkeleton />}>
        <VaultStatsServer />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Suspense fallback={<SharePriceChartSkeleton />}>
            <SharePriceChartServer />
          </Suspense>
          <Suspense fallback={<VaultAllocationsSkeleton />}>
            <VaultAllocationsServer />
          </Suspense>
        </div>
        <div>
          <InteractiveShell>
            <ActionPanel />
          </InteractiveShell>
        </div>
      </div>
    </main>
  );
}
```

`<Header />` is rendered inside `<InteractiveShell>`. If the design puts `<Header />` above `<main>`, lift the `<InteractiveShell>` to wrap both: a single island with `<Header />` and `<ActionPanel />` as its two children. The current `interactive-shell.tsx` already renders `<Header />` as its first child, so the pattern is:

```tsx
<InteractiveShell>
  <ActionPanel />
</InteractiveShell>
```
produces:
```
<Header />
<ActionPanel />
```

If the design requires `<Header />` outside the island's DOM neighbourhood (i.e. above `<main>`), change `interactive-shell.tsx` to accept two slots (`header`, `children`) and position them separately. Check the rendered layout against `main` before committing.

**VaultHeader.tsx (simplified)**:

```tsx
// src/components/vault/VaultHeader.tsx
// No "use client" — plain component, renders on the server.
import type { VaultApiData } from "@/types";

type Props = {
  name: string;
  curator: VaultApiData["curator"];
};

export function VaultHeader({ name, curator }: Props) {
  // existing JSX, reading props instead of hook
}
```

**VaultStats.tsx (shape)**:

```tsx
"use client";
import { useVaultApi } from "@/hooks/useVaultApi";
import type { VaultApiData } from "@/types";

type Props = {
  initialData: VaultApiData;
  initialDataUpdatedAt: number;
};

export function VaultStats({ initialData, initialDataUpdatedAt }: Props) {
  const { data } = useVaultApi({ initialData, initialDataUpdatedAt });
  // existing JSX, no more isLoading branch — data is always defined now
}
```

Same treatment for `SharePriceChart` and `VaultAllocations`. Because `initialData` is provided, the `data` return is non-nullable at the type level (TanStack narrows with `initialData`). Drop the `isLoading` fallbacks; keep `isError` guards only.

**Verify**

- `pnpm build` succeeds with no `indexedDB is not defined` error and no Cache Components error.
- View the built HTML (`pnpm build && pnpm start`, then `curl -s localhost:3000 | grep -oE '(3F|Steakhouse|TVL|APY)'`): TVL number, APY, liquidity, vault name, curator, allocation rows all present in the server response.
- Network tab on first load: no Morpho GraphQL request until the first client refetch interval fires (30s for summary, 60s for allocations, 5min for history).
- Disconnected state: amount input renders, `MAX` is disabled, submit reads `Connect Wallet`.
- Connected state: deposit + withdraw still work end-to-end on Anvil, all four allowance cases.
- `pnpm test` passes. Update any test that previously rendered `<VaultStats />` without props to supply `initialData` + `initialDataUpdatedAt` from a fixture.

### Commit 6 — Add route-level loading.tsx

Covers client-side navigations and the window between request arrival and static-shell flush.

**File** `src/app/loading.tsx`:

```tsx
import {
  VaultHeaderSkeleton,
  VaultStatsSkeleton,
  SharePriceChartSkeleton,
  VaultAllocationsSkeleton,
  WalletIslandSkeleton,
} from "@/components/vault/skeletons";

export default function Loading() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <VaultHeaderSkeleton />
      <VaultStatsSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <SharePriceChartSkeleton />
          <VaultAllocationsSkeleton />
        </div>
        <div>
          <WalletIslandSkeleton />
        </div>
      </div>
    </main>
  );
}
```

**Verify**

- Throttle network to Slow 3G in DevTools; navigate from `/` to `/` (force reload). Loading skeleton visible before content.
- No visual regression in steady state.

### Commit 7 — Cleanup

- Delete `src/components/layout/VaultPage.tsx` (already unused after commit 5).
- Delete dead skeleton markup left in `interactive-shell.tsx` if it duplicates `skeletons.tsx`.
- Remove any `isLoading` branches in `VaultStats`/`SharePriceChart`/`VaultAllocations` that are now unreachable because `initialData` makes `data` non-null.
- Update `README.md` data-flow section if it explicitly describes SPA rendering.

**Verify**: `pnpm build && pnpm test && pnpm lint` all green.

---

## Risks and mitigations

1. **Hydration mismatch**. If server-rendered shapes differ from client shapes (e.g. `Date` objects, floating-point precision on chart points), React will log a mismatch warning and re-render on the client. Mitigation: `fetchVaultHistory` already produces plain serializable objects (`{ timestamp: number, date: string, sharePrice: number, apy: number }`). No `Date` instances cross the boundary. Verify by logging the first server-rendered chart point and comparing to the first client-rendered one after hydration.

2. **Morpho API outage on server**. If `fetchVaultData` throws during server render, the component's `<Suspense>` boundary will bubble the error to the nearest `error.tsx`. There is no `error.tsx` today. Add `src/app/error.tsx` as part of commit 7, rendering the existing "Data unavailable" card for the vault stats section so the page degrades gracefully. Keep it minimal — a single `"use client"` component with a reset button.

3. **Cache poisoning by user-specific data**. The Morpho queries are public and parameterised only by vault address + chain ID. No auth, no cookies, no headers. Safe to cache globally. If a future query ever takes a user address or session, move it out of the cached server fetch layer and into its own Suspense-wrapped component that calls `cookies()` / `headers()` inside the boundary.

4. **Build fails on commit 1 because Cache Components flags the existing client-only tree.** If this happens, swap the order of commits 1 and 2, or wrap the interim tree in a top-level `<Suspense fallback={<WalletIslandSkeleton />}>` in `page.tsx` until commit 5 lands. Either path preserves the incremental-review workflow.

5. **React Compiler + `Date.now()` in server wrappers**. The compiler is enabled for the whole app. `Date.now()` in a server component body is outside the client compiler's scope, so it is safe. The rule against impure calls in render/`useMemo` applies to client components only.

6. **RainbowKit CSS import**. `wallet-island.tsx` must keep `import "@rainbow-me/rainbowkit/styles.css";`. Because this file is only reachable via `dynamic(..., { ssr: false })`, the CSS ships in a separate chunk and does not enter the server bundle — this is the correct behaviour.

---

## Verification checklist (final)

Run after commit 7 and before handing off.

- [ ] `pnpm build` succeeds with no warnings about uncached data outside Suspense.
- [ ] `pnpm test` passes.
- [ ] `pnpm lint` passes.
- [ ] `curl -s localhost:4999 \| grep -qE '(TVL\|APY\|Total Supply)'` — static HTML contains real data (not just the skeleton).
- [ ] Network tab on first load: zero Morpho GraphQL requests before the first client refetch interval.
- [ ] `next build` output: the `/` route is listed as **prerendered** (or PPR-enabled), not `λ (Dynamic)`.
- [ ] `pnpm lh` — Lighthouse median scores meet the gates from the Baseline section (Perf ≥97, LCP ≤0.5s, A11y ≥94, BP ≥96).
- [ ] `lighthouse-post-migration/` exists with 3 runs; manifest summary diffed against `lighthouse-baseline/manifest.json`.
- [ ] Time-range buttons on the chart still filter client-side without triggering network requests.
- [ ] Deposit flow on Anvil: zero allowance, exact allowance, partial allowance, max-uint allowance — all four end in success state with targeted cache invalidation (USDC balance, allowance, vault position, API data refetch; share-price history untouched).
- [ ] Withdraw flow on Anvil: vault position + USDC balance + API data invalidated.
- [ ] Reject in wallet, RPC error, and timeout all reset the submit button cleanly.
- [ ] Toast lifecycle: `pending` → `confirming` → `success`/`failure`. No leaked intervals (verify via `chrome://inspect` → Performance → Timers after a full deposit cycle).
- [ ] On slow network (DevTools Slow 3G), the `loading.tsx` skeleton is visible before content paints. No layout shift when content swaps in.
- [ ] Disconnected state: amount input renders, `MAX` disabled, submit button reads `Connect Wallet`. Clicking opens RainbowKit modal.

---

## Estimated effort

Roughly a day of focused work split across seven commits, assuming no surprises in the Cache Components + wagmi v3 interaction. Biggest time sinks, in order: commit 5 (server wrappers + per-section Suspense + prop-threading `initialDataUpdatedAt` through three hooks), commit 3 (ActionPanel split, because the form's state shape needs to stay identical to avoid regressing the four allowance cases), and verifying deposit/withdraw on Anvil under each allowance scenario.
