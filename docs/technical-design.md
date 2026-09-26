# Technical design: WASL

## Stack decision

Choose **TypeScript + Vite + PixiJS 8 + HTML/CSS**. Pixi renders workstation networks, moving opportunities, and effects with WebGL. Accessible English and Arabic text, buttons, and upgrade panels stay in DOM. A deterministic TypeScript simulation owns gameplay state. No general rigid-body physics engine is planned for the first version: the interesting decisions are workflow and placement, not collision realism.

| Option | Strength | Decision |
|---|---|---|
| Raw Canvas 2D | Minimal dependency and total control | Rebuilding batching, scene management, and effects would slow the first prototype. |
| PixiJS 8 | Fast 2D rendering, pointer events, precise bundle control | **Selected** for a dense network board beside a DOM-based bilingual UI. |
| Phaser | Full browser-game framework with Arcade and Matter physics | Attractive if physics becomes central; more scene and physics machinery than this network simulation needs. |
| Godot Web | Strong editor and content pipeline | WebAssembly/WebGL2 delivery and DOM integration complicate the lightweight browser-first goal. |
| Unity Web | Mature production ecosystem; the reference's browser demo uses Unity | Less suitable for our initial-load and bilingual DOM priorities, without implying a weakness in the reference game. |

Sources: [PixiJS renderer guide](https://pixijs.com/8.x/guides/components/renderers), [Phaser overview](https://docs.phaser.io/) and [physics guide](https://docs.phaser.io/phaser/concepts/physics), [Godot web export guide](https://docs.godotengine.org/en/4.5/tutorials/export/exporting_for_web.html), and [Unity web build guide](https://docs.unity3d.com/Manual/webgl-building.html). Actual dependency versions will be pinned in M1.

## System boundaries

```text
Pointer input and HTML controls
            ↓ commands
Deterministic simulation: fixed tick, seeded RNG, rules
            ↓ events and read-only view model
Pixi board renderer + DOM HUD + audio cue manager
            ↓
Versioned local save and local playtest measurements
```

Proposed folders: `src/sim` for rules, `src/view` for rendering, `src/ui` for bilingual DOM, `src/content` for data-defined workstations and upgrades, `src/platform` for persistence and audio, and `tests` for verification. No account or backend is required for the first release.

## Input, simulation, and rendering

- Fixed simulation tick, initially 30Hz, independent of rendering up to 60fps. Seeded scenarios make balance and bug reports reproducible.
- A bounded event queue, referral-generation limit, and stable processing order prevent endless loops from combined synergies.
- Pointer Events support drag/drop, click, and wheel zoom. The full run must work with a mouse alone. Convert canvas coordinates through camera and zoom before picking a grid cell.
- Easing and curved paths provide tactile motion, but visual motion does not determine gameplay results.

## Localization, save, assets, and audio

- English and Arabic strings live in one typed catalog. Set `lang` and `dir` on the root and update them live on language change. Use `Intl.NumberFormat` by locale; test mixed-direction numbers and terms. Persist language selection.
- Versioned `localStorage` stores settings, persistent unlocks, and a resumable run. Migrations handle old saves and invalid data without duplicate rewards.
- Original SVG/PNG/WebP graphics use a compact atlas and staged loading. The opening scene does not wait for late-phase assets.
- Web Audio starts after first user interaction, pools short sounds, and persists mute/volume settings.

## Performance and testing

Initial targets for a mid-range laptop: approximately 2MB or less compressed first-load transfer where feasible, 60fps in an ordinary scene, and at least 30fps in the final phase. These are measurement targets for M6, not untested promises. WebGL is the primary renderer; failure should show a clear compatibility message.

Vitest covers simulation determinism, chain bounds, save migration, and balance scenarios. Playwright covers starting a run, mouse-only actions, bilingual direction changes, and persistence. Manual visual checks cover desktop Chrome, Edge, and Firefox at representative window sizes. Each implementation issue states its required test.

## CI/CD and deployment

GitHub Actions will run `npm ci`, typecheck, unit tests, build, and browser smoke checks on PRs. A validated `main` will publish a static playable build to GitHub Pages after the application shell exists. PR builds will retain downloadable artifacts. A dedicated preview URL can be added if hosting permissions and build feedback justify it; it is not promised before verification. Do not present an empty shell as a playable release.
