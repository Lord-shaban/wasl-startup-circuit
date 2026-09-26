# WASL: Startup Circuit

A short browser strategy game about turning one customer opportunity into a company-wide network of products, referrals, and automation. Play with a mouse in English or Arabic.

> **Current status:** Phase 0 research and planning are complete. Gameplay implementation awaits plan review. There is no playable build yet.

## Game at a glance

Drag a customer opportunity to a workstation. Each successful delivery earns cash and trust, and may generate referrals. Place teams where they reinforce each other, choose a specialization, and build a resilient company before the round's runway expires.

## Tech stack

- TypeScript and Vite
- PixiJS 8 for the board and visual effects
- HTML/CSS for accessible UI, English LTR, and Arabic RTL
- A deterministic simulation independent of rendering
- Vitest and Playwright for tests

The comparison and architecture are in [Technical Design](docs/technical-design.md).

## How to run

The application package has not been created. M1 will add `npm install`, `npm run dev`, `npm test`, and `npm run build`. The Phase 0 documents require no local setup.

## Project structure

```text
docs/
  reference-study.md   Primary-source research and design lessons
  game-design.md       Rules, loop, progression, and fun gates
  art-bible.md         Original visual, motion, and audio direction
  technical-design.md  Stack choice and architecture
  roadmap.md           Milestones, gates, and critical path
planning/
  issues.tsv           Reviewable issue specifications
  publish.ps1          Idempotent GitHub planning publisher
```

## Development workflow

The [GitHub Project board](https://github.com/users/Lord-shaban/projects/9) is the source of truth for status. Every issue has a bounded scope, acceptance criteria, dependencies, and tests. Move work through Backlog → Ready → In Progress → Testing → Done. An implementation issue reaches Done only after automated and browser verification, a clear commit, a push, and a linked issue or PR. Log new ideas in Backlog before expanding scope.

## Roadmap and builds

- [Project board](https://github.com/users/Lord-shaban/projects/9)
- [Milestones](https://github.com/Lord-shaban/wasl-startup-circuit/milestones)
- [Issues](https://github.com/Lord-shaban/wasl-startup-circuit/issues)
- [Milestone gates and critical path](docs/roadmap.md)

GitHub Actions will build and test each PR. M3 targets the first playable public build. A validated `main` build will deploy to GitHub Pages; no playable URL exists yet.

## Originality and assets

WASL uses the reference game only for general design lessons. Its rules, theme, interface, graphics, text, and audio are original. No reference-game asset is copied.
