# DeckForge × TestSprite — cloud verification suite

[TestSprite](https://github.com/TestSprite/testsprite-cli) (`@testsprite/testsprite-cli` v0.14.0, installed globally) tests this app **in the cloud with a real browser agent**: it opens the live app, follows plain-language test plans like a user, and returns one self-consistent failure bundle (video, screenshots, DOM snapshots, agent log) per failing test.

## Status

| Step | State |
| --- | --- |
| CLI installed (`npm i -g @testsprite/testsprite-cli`) | ✅ v0.14.0, Node 24 |
| 13 frontend test plans authored (`plans/*.json`) | ✅ **13/13 pass TestSprite's own validator** (`testsprite test lint --plan-from-dir ./plans`) |
| Create path proven offline (`--dry-run` canned contract) | ✅ |
| Real cloud runs | ⏳ **needs your API key** — cloud execution and the localhost tunnel are authenticated services; the key is created from your dashboard (account-bound), so it cannot be minted from here |

## Run everything (one command)

```bash
# 1) create an API key: https://www.testsprite.com/dashboard/settings/apikey
# 2) start the app (already running in this sandbox: bun run dev → :3000)
# 3) run the suite:
TESTSPRITE_API_KEY=sk-user-... bash testsprite/run-suite.sh
```

The script: verifies the app is up → configures the key → finds/creates the **DeckForge** frontend project on `localhost:3000` (runs open an automatic TLS tunnel) → renders + lints the 13 plans → `create-batch --run --wait` paced at **3 concurrent runs** (several tests drive the app's AI endpoints, which are rate-limited) → saves JSON results to `testsprite/.build/last-run.json` and prints triage commands.

Per-test rerun / failure triage:

```bash
testsprite test failure get <test_id> --out ./.testsprite/failure
testsprite test rerun <test_id> --wait --output json
```

## Cost

Free-tier tunneling is supported; each **frontend run bills 0.5 credits** → a full 13-test pass ≈ **6.5 credits**. The runner prints `testsprite usage` (balance) before spending.

## The 13 tests

| # | Plan | Priority | Covers |
| --- | --- | --- | --- |
| 01 | landing-renders-and-mode-switch | p0 | Hero, sections, footer, Studio ⇄ Template studio tabs |
| 02 | studio-brief-validation | p2 | Empty/1-char brief → error toast, no navigation |
| 03 | studio-outline-generation | p0 | Brief → "Forge the outline" → editable Outline proposal → Approve → editor |
| 04 | editor-theme-switching | p0 | Theme select re-renders canvas, content preserved deck-wide |
| 05 | editor-export-menu | p1 | PPTX/PDF/HTML/PNG menu, PPTX + HTML downloads, no error toasts |
| 06 | recent-decks-persistence | p1 | Deck survives reload, listed under Decks, reopens |
| 07 | template-picker-search | p1 | 57-card gallery, search "biennale" → 1, "reveal" → ≥1, selection state |
| 08 | template-studio-ai-fill | p0 | Pick template → brief → "Fill … with AI" → SSE progress → viewer |
| 09 | html-deck-viewer-navigation | p1 | Counter/keys navigation, Present fullscreen, PNG export |
| 10 | html-deck-list-delete | p1 | List + engine badge, delete confirm (Cancel keeps, confirm removes) |
| 11 | template-scratch-reveal | p1 | From-scratch reveal.js generation, keyboard nav |
| 12 | mobile-responsive-landing | p2 | 390×844 viewport: no overflow, tabs/CTA usable |
| 13 | outline-editing | p1 | Edit mode: rename deck/slide, add/remove slide, CTA count updates |

Plan format = TestSprite's official schema (`{ projectId, type: "frontend", name, planSteps: action|assertion }`); `__PROJECT_ID__` is substituted by the runner after project creation.
