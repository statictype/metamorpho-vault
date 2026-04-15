# Docs

Durable project documentation. Read before changing architecture, touching the transaction flow, or running a performance comparison.

## Naming convention

Flat directory. Filename encodes the type:

- `{topic}-plan.md` — scoped work with a definition of done (e.g. `rsc-migration-plan.md`). Delete once shipped, or append results inline if the before/after story is worth keeping.
- `{topic}-baseline.md` — measurement snapshot tied to a specific initiative. Append post-change results as a second section rather than creating a new file.
- `decision-{topic}.md` — ADR for a non-obvious choice that's load-bearing (e.g. `decision-send-calls-over-write-contract.md`). Record only what's *non-obvious from the code* and *expensive to re-derive*.

Raw artifacts (Lighthouse HTML/JSON, bundle analyzer output) are gitignored and regenerable — don't commit them.

## Current contents

- [`rsc-migration-plan.md`](rsc-migration-plan.md) — Migration from SPA-in-Next to App Router with server-rendered public data, streaming via Suspense, and a client-only wallet island. Seven-commit sequence with success gates.
- [`rsc-migration-baseline.md`](rsc-migration-baseline.md) — Pre-migration Lighthouse baseline (desktop, 3 runs). Gate values for the RSC migration live here.
