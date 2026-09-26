# WASL roadmap

The [GitHub Project board](https://github.com/users/Lord-shaban/projects/9) is the source of truth for work status. This page defines milestone boundaries and exit gates; individual issues carry scope, acceptance criteria, tests, and native blocking links. Dates remain unset until the interaction prototype has been playtested.

| Milestone | Inspectable result | Exit gate |
|---|---|---|
| M0 — Research & planning | Reference study, concept, art/technical decisions, board, and issues | All key decisions documented; dependency graph has no cycle. |
| M1 — Web foundation | Bilingual shell, board renderer, simulation base, CI | Build and tests pass; both languages render correctly in a browser. |
| M2 — Interaction prototype | One opportunity, mouse drag and placement, processing, visible referral | First action is understood quickly; position changes outcomes clearly. |
| M3 — Playable round | Runway, deadline, goal, ending, and retry; first playable build | Complete a round with a mouse from a public URL. |
| M4 — Builds & automation | Upgrade branches, synergies, and automated routing | Two viable builds and no unbounded referral loop. |
| M5 — Phases & feel | Later phases, original art and audio | Escalation remains readable and assets remain consistent. |
| M6 — Alpha & optimization | Performance, saves, compatibility, balance, QA | Browser risks and performance targets measured and accepted. |
| M7 — Beta & release | External playtest, polish, stable deployment | No critical defects; current README, playable URL, and release build. |

## Critical path

M0 → M1 simulation/UI → M2 drag/placement/delivery → M3 complete round → M4 builds and automation → M5 content and feel → M6 Alpha → M7 release. The first fun gate is in M2, before a large upgrade tree. If the core interaction fails that gate, open a focused issue and pause dependent features.

## Board states

- **Backlog:** planned or waiting on dependencies.
- **Ready:** dependencies complete and acceptance criteria are testable.
- **In Progress:** active work on a bounded issue.
- **Testing:** implementation complete; automated and browser checks underway.
- **Done:** acceptance criteria verified, commit/PR linked, issue closed.

## Scope guardrails

M3 is the first playable version, not a promise of all M4–M7 content. No multiplayer, store or payments, accounts, mobile-first controls, or AI-driven simulation is in the release scope. Record new ideas in Backlog with a reason and priority before scheduling them.
