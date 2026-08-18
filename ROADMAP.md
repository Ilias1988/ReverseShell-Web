# Web Reverse Shell Generator v2 Roadmap

This document is the source of truth for the v2 development cycle. Production
hardening is isolated on `agent/catalog-hardening` until the complete release
checklist passes; the deployed `main` branch remains unchanged during the work.

## Stable baseline

- Production baseline: the current `main` branch and GitHub Pages deployment
- Dependency audit: 0 known vulnerabilities
- Unit tests: 26/26 passing on the hardening branch
- Catalog audit: 111/111 selectable reverse/bind entries pass
- Linux Docker runtime matrix: 23/23 checks pass; 19 entries are end-to-end verified
- Production build and prerender: passing
- Desktop and mobile browser verification: passing
- Recovery point: the local `main` branch must remain unchanged until v2 is ready

## Delivery rules

Every phase must satisfy all of the following before it can be marked complete:

1. New logic has focused unit tests.
2. Existing tests remain green.
3. ESLint reports no errors or warnings.
4. `npm run verify` passes, including production prerender and browser E2E.
5. `npm audit` reports no known vulnerabilities.
6. Keyboard and mobile behavior are checked for every new UI surface.
7. Documentation is updated in the same phase as the feature.
8. A local checkpoint commit is created only after all checks pass.

## Phase 1 — Payload metadata foundation

**Status: complete.** The validated catalog currently covers all 111 selectable
reverse/bind payloads and is protected by catalog-wide unit tests.

Create a normalized metadata layer without rewriting the existing payload
dictionaries.

### Required metadata

- Target operating system
- Reverse or bind mode
- Interpreter/runtime requirements
- Required binaries
- Transport (`tcp` or `udp`)
- Shell substitution support
- Payload family/category
- Reliability notes and compatibility warnings
- Educational explanation sections

### Acceptance criteria

- Existing payload output remains byte-for-byte compatible unless a documented
  bug is fixed.
- Every selectable payload receives deterministic metadata or a safe fallback.
- Metadata validation rejects malformed records and duplicate identifiers.
- Tests cover inference, explicit overrides, and fallback behavior.

## Phase 2 — Smart Payload Advisor

**Status: complete.** The Advisor provides deterministic ranking, transport and
family filters, target-capability matching, explicit compatibility states, and
one-click payload application. Its modal includes focus trapping, Escape-key
closure, scroll locking, and production browser E2E coverage.

Add a guided workflow that asks what is available on the target and filters or
ranks suitable payloads.

### Inputs

- Operating system
- Reverse or bind direction
- Available binaries/interpreters
- TCP or UDP transport
- Preferred payload family

### Outputs

- Ranked compatible recommendations
- `Compatible`, `Warning`, and `Unavailable` states
- Human-readable reasons for every recommendation
- One-click application of a recommendation to the generator

### Acceptance criteria

- Ranking is deterministic and implemented as testable pure functions.
- The advisor never silently changes IP, port, encoding, or target OS.
- Empty/no-match states offer a clear recovery path.
- Advisor interaction is included in browser E2E coverage.

## Phase 3 — Payload Explanation and guided workflow

**Status: complete.** Every selectable reverse/bind payload can now open a
local, metadata-backed explanation containing direction, requirements,
placeholders, compatibility notes, the current command, a guided workflow, and
applicable Linux TTY-stabilization options. Unit and browser E2E coverage are
included.

Add an explanation drawer for the selected payload.

### Content

- What the command does
- Placeholder and argument breakdown
- Required tools/interpreter
- Listener/connect command
- Compatibility limitations
- Safe shell-stabilization guidance where applicable
- Troubleshooting notes

### Acceptance criteria

- Explanations are derived from trusted local metadata, not generated remotely.
- Content remains usable with JavaScript-disabled prerender for SEO basics.
- The drawer is keyboard accessible and responsive.

## Production catalog hardening

**Status: static hardening and representative Linux runtime matrix complete;
Windows and Metasploit runtime matrices pending.**

- Fixed staged and Meterpreter MSFVenom handler selection.
- Fixed invalid doubled braces in generated C, C#, Go, and PowerShell source.
- Corrected Bash UDP and GNU Awk runtime assumptions.
- Removed duplicate and incomplete hosted-resource payload stubs.
- Added capability coverage for every declared Advisor requirement.
- Added `conditional` and `experimental` confidence states without making false runtime-verification claims.
- Added a catalog-wide automated audit to the release verification command.
- Added a pinned, network-isolated Debian runtime harness with unprivileged containers and resource limits.
- Executed 19 Linux reverse/bind payloads end-to-end and 4 C/Node source checks.
- Fixed the Ruby reverse `Bad file descriptor` bug and nested-brace corruption discovered by runtime testing.

Runtime verification remains pending for Windows, PowerShell-on-Windows, and
Metasploit environments. A payload must not be promoted to `verified` until its
environment, verification date, and test source are recorded.

## Phase 4 — Favorites, history, presets, and sharing

Implement local-only productivity features.

### Features

- Favorite payloads
- Recent payload history
- Named presets
- JSON import/export for settings
- Shareable URL configuration

### Acceptance criteria

- No account, backend, analytics, or telemetry is required.
- Sensitive values are not placed in URLs unless the user explicitly chooses to
  create a share link.
- Stored data is versioned and migration-tested.
- Reset and delete controls are explicit and reversible where practical.

## Phase 5 — Installable offline PWA

- Web app manifest with 192px and 512px icons
- Standalone display mode and theme colors
- Versioned service-worker cache
- Offline application shell
- Update notification when a new version is available

### Acceptance criteria

- First online load installs the cache successfully.
- A subsequent offline load opens the complete generator.
- New deployments invalidate old caches safely.
- The normal website continues to work when service workers are unavailable.

## Phase 6 — MSFVenom intelligence

- Staged/stageless explanations
- Payload/format/architecture/platform compatibility guidance
- Recommended output extension
- Handler explanation and copy workflow
- Clear encoder/bad-character guidance

### Acceptance criteria

- Guidance does not claim that encoding guarantees security-product evasion.
- Compatibility rules are centralized, documented, and unit tested.
- Generated commands continue to quote all user-controlled values safely.

## Phase 7 — Custom payload packs

- Versioned JSON schema
- Local import preview
- Placeholder and identifier validation
- Duplicate/conflict handling
- Export of user-created packs

### Acceptance criteria

- Imports never execute code.
- Unknown fields and unsupported schema versions fail safely.
- Payload content stays local to the browser.
- Import/export round trips are covered by tests.

## Phase 8 — Final quality pass

- Full keyboard and screen-reader audit
- Desktop, tablet, and mobile visual regression checks
- Performance and bundle-size review
- Updated screenshots and README
- Complete regression run on Chrome and Edge
- Release checklist and migration notes

## Explicit non-goals

The browser application will not:

- Execute payloads or listeners on the user's machine
- Connect to target systems
- Upload payload configurations to a remote service
- Add telemetry without explicit user consent
- Present encoders as guaranteed antivirus or EDR bypass mechanisms

These boundaries keep the project predictable, local-first, and appropriate for
authorized labs, CTFs, and penetration-testing education.
