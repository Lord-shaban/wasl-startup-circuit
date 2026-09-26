# Reference study: My Fire Is Bigger Than Yours

Research date: 26 September 2026. This study extracts design principles and game feel, not content to reproduce.

## Sources and limits

I inspected the [official Steam page](https://store.steampowered.com/app/4428630/My_Fire_Is_Bigger_Than_Yours/), its screenshots and animated trailer frames; the developer's [March demo trailer](https://www.youtube.com/watch?v=TCOdoc3L0Xc) and [June trailer](https://www.youtube.com/watch?v=H3jwGpkktKs); the [browser demo on itch.io](https://amarravi.itch.io/my-fire-is-bigger) and its main menu; and the developer's [March strategic update](https://amarravi.itch.io/my-fire-is-bigger/devlog/1466736/demo-20-is-live-strategic-gameplay-update) and [June layout and visual update](https://amarravi.itch.io/my-fire-is-bigger/devlog/1545349/flip-spawners-new-upgrade-tree-updated-visuals). The HTML5 demo loaded, but canvas interaction did not respond in this inspection session. I therefore distinguish direct visual observations from descriptions and do not claim a complete hands-on playthrough. Later-stage details come from official material.

## Design DNA

1. **An instantly legible first action.** Throwing an object toward a small fire yields visible feedback without lengthy onboarding.
2. **Visible causality.** Contact leads to burning, spread, income, and stronger future reactions.
3. **A shift in the player's job.** Manual throwing gives way to fuel choice, spawner layout, build specialization, and automation.
4. **Theatrical escalation.** A small bright focal point in a dark scene expands dramatically in scale, light, event density, and stakes. Steam describes three phases and more than 200 upgrades.
5. **Pressure that tests a build.** Rain and the Sun provide reasons to seek resilience alongside growth. Exact round timing is not established by the inspected sources.
6. **Replay through meaningful choices.** The developer reports redesigning demo 2.0 for a clearer goal, stronger strategic choices, and distinct builds.

## Direct visual and motion observations

- Screenshots place a high-contrast, bright, changing centerpiece against a restrained dark violet environment. This keeps the action readable as density grows.
- The fire uses bold color blocks, strong silhouettes, and persistent movement. Growth is embodied in the scene rather than expressed only by a counter.
- Branching effects and colored reward numbers make chain reactions and payoff visible at their source.
- The March demo trailer shows escalating scene density, branching connections, lightning, reward pop-ups, and a visible rain countdown while the fire remains the focal point.
- The demo menu uses large color-coded buttons. Later Steam imagery becomes much busier, which makes readability at peak density a design problem.
- In the June devlog, the developer says spawners respond to fire light and that bonus pop-ups and lightning-chain sound received distinct feedback. The game connects systems through synchronized visual and audio cues.

## Gameplay lessons

| Topic | Evidence | Lesson for WASL |
|---|---|---|
| Mouse input | The developer describes moving spawners and live trajectory previews. | Show the expected effect before a drop or rotation. |
| Placement | Spawner position and direction influence trajectories. | A placed unit must change outcomes for a reason the player can see. |
| Upgrade tree | Steam advertises 200+ upgrades; the June update shows all nodes in a more stable view. | More choices require clearer grouping and stronger visual explanations. |
| Synergy | Steam explicitly mentions specialization, cascading reactions, and automated layouts. | Each branch should combine meaningfully with another branch. |
| Phases | The demo covers the first escalation; Steam describes three phases. | Teach one new layer when the current system creates a need for it. |
| Physics | The official description calls the game physics-based. | Preserve tactile cause and effect, but use an original workflow-network simulation. |

## Difficulty and pacing

The reference begins with a single meaningful action, then introduces constraints and specialized builds, and finally supports complex automation. The March devlog is important evidence that simply adding content was insufficient: the goal and build choices needed to become clearer. WASL's proposed test targets are comprehension of the first action within 10 seconds, the first visible chain within three minutes, and a meaningful placement choice within five minutes. These are **WASL design hypotheses**, not measured properties of the reference.

## Performance: inference, not an implementation claim

Official sources do not describe the reference game's internal pooling, batching, or simulation limits. The visible density of particles, reward numbers, and reacting objects does show the need to budget them in a browser game. WASL will cap live objects and visual effects, separate effects from simulation outcomes, and profile peak scenes. These are our proposed techniques, not claims about the developer's implementation.

## Inspiration boundary

We adopt the first-action clarity, visible chains, a growing system, meaningful build choices, and staged escalation. WASL instead models **customer opportunities flowing through a startup's teams**. It uses workstations, referrals, runway, trust, English/Arabic UI, and an original diagram-like visual language. It will not reuse fire, the Sun, rain, fuel throwing, cults, reference-game text, upgrade names, images, or sounds.
