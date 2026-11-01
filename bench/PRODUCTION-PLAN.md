# Production-readiness plan: Velocita + Strada (2026-11-01)

## Audit findings

### Velocita (6t9xstar/velocita)
| # | Finding | Severity |
|---|---|---|
| V-a | Dev server: a malformed URL (`/%E0%A4`) throws inside the request handler and crashes the process | High |
| V-b | Dev server: path check `p.startsWith(out)` lets requests reach sibling folders (`/../dist-old/x`) | High |
| V-c | Dev server listens on all interfaces (LAN-exposed) | Medium |
| V-d | CI runs only on push to `main` (none on PRs), only Node 22 on Linux; `engines` claims Node ≥18 (EOL) | High |
| V-e | No release workflow, no npm provenance; package never published | High |
| V-f | No TypeScript declarations for the public API or config | Medium |
| V-g | No CHANGELOG, CONTRIBUTING, SECURITY policy, issue/PR templates, Dependabot | Medium |
| V-h | Build-cache work (this session) and `bench/` harness are uncommitted | — |

### Strada (6t9xstar/strada)
| # | Finding | Severity |
|---|---|---|
| S-a | `Request::bytes()`/`json()` read unbounded bodies (memory DoS) | High |
| S-b | No header-read timeout (slowloris holds connections forever) | High |
| S-c | A panicking handler kills the connection instead of returning 500; release profile uses `panic = "abort"`, which kills the process | High |
| S-d | Shutdown abandons in-flight connections | Medium |
| S-e | Accept errors (EMFILE) busy-loop | Medium |
| S-f | `license = "MIT OR Apache-2.0"` but no LICENSE files; no repository/keywords metadata; no CI; no fmt/clippy gate; MSRV unverified | High (crates.io/legal) |

## Build order
1. **Velocita runtime fixes** (V-a, V-b, V-c): add tests for each.
2. **Velocita CI and release:** `ci.yml` runs a matrix of Node 20/22/24 × Linux/Windows/macOS on PRs and pushes. It runs the tests, strict builds of the example and the site, and `npm pack` checks. `release.yml` publishes to npm with provenance on a `v*` tag. Set `engines` to ≥20.
3. **Velocita types and docs:** `src/index.d.ts` with a `Config` type and a `defineConfig` helper, plus CHANGELOG, CONTRIBUTING, SECURITY, issue templates and Dependabot.
4. **Strada hardening** (S-a to S-e): body limit (413), header timeout, panic → 500, graceful shutdown, accept backoff. Add tests for each.
5. **Strada repo:** LICENSE files, crate metadata, CI (fmt, clippy `-D warnings`, test on 3 OSes, MSRV 1.75, `cargo package`), CHANGELOG, SECURITY, Dependabot.
6. **Verify:** all tests pass, CI YAML is valid, `npm pack` and `cargo package` dry-runs succeed. Then commit to both repos; pushing waits for your OK.

## Out of scope for this pass
Feature work from `PLAN.md` (TypeScript authoring, schemas, UI-framework islands, SSR), and an npm/crates.io publish itself, which needs your tokens.
