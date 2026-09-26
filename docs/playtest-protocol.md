# WASL short playtest protocol

## Purpose and status

Use short, observed sessions to decide whether WASL’s opening and layout choices are understandable before investing in upgrades. Test the current playable build; do not explain mechanics unless the participant is blocked. This document defines a future gate. **No sessions or results are recorded here; all observations and gate outcomes are pending external playtests.**

## Session setup and observation script

Run one session per first-time player, ideally five players for an initial directional read. Allow about 10–15 minutes. Use the same build and opening scenario for everyone, and capture the screen or take timestamped notes with consent. Do not coach during scored tasks.

1. **Start cold.** Say: “Please play as you normally would. Think aloud when something is unclear.” Start the timer when the opening screen appears. Do not explain the controls.
2. **First action (10-second gate).** Observe whether the player identifies the opportunity and makes the intended first drag to Product within 10 seconds. If they ask what to do, wait briefly, record the question and time, then give only the minimum help needed to continue; score the unaided task as a miss.
3. **Layout choice.** Present two otherwise comparable valid station layouts, or observe a naturally occurring placement choice. Ask: “Which would you choose, and what do you expect to happen?” Record the choice and the player’s explanation before showing the outcome. After the outcome, ask what in the layout caused the difference. If the build offers no meaningful layout comparison, mark this task **not testable** rather than infer a pass.
4. **Causal chain (three-minute gate).** From the first action, observe for up to three minutes. Ask only: “What do you think just happened?” at the first visible delivery/referral. Record whether the player can connect the opportunity, station or adjacency, delivery, and resulting cash/trust or referral. Do not supply missing links.
5. **Decision and debrief.** Ask: “What would you change on another run, and why?” and “What most limited progress: capacity, deadline, or cost—or something else?” Record the answer verbatim where practical. Do not introduce or pitch upgrades before making the gate decision.

## Measures and go/revise gate

Score each participant on the three primary measures:

| Measure | Pass for one participant |
| --- | --- |
| First-10-second comprehension | Begins the intended opportunity-to-Product drag unaided within 10 seconds. |
| Layout changes choices | Chooses between the presented layouts and gives a causal, layout-based reason for the choice or expected result. A preference without a gameplay reason does not pass. |
| Three-minute causal chain | Within 3:00, correctly explains at least one observed cause-and-effect sequence from routing/placement or adjacency through processing to delivery and its visible reward or referral. |

**Go to upgrade prototyping only if all three measures pass for at least 4 of 5 participants**, with no unresolved blocker that prevents completing the opening. Otherwise, **revise the opening, layout feedback, or chain readability implicated by the observations, then repeat this gate before adding upgrades**. If fewer than five sessions are completed, report the count and treat the decision as provisional; do not claim the 4-of-5 gate passed. Mark unavailable build features as not testable and do not count them as passes.

This is a decision rule for collected observations, not a statement about the current build. Results remain **pending** until sessions are run and notes are reviewed.

## Session note template

```text
Session ID / date:
Build or commit:
Participant experience with management/tycoon games (optional, self-described):
Consent for notes/recording: yes / no

First action
- Time from opening screen to intended drag:
- Unaided within 10 seconds: pass / fail
- Hesitation, misread, or help requested (quote/action + timestamp):

Layout choice
- Layouts shown or placement observed:
- Choice and stated expectation (quote):
- Gameplay reason given before outcome:
- What the player identified after outcome:
- Pass / fail / not testable; evidence:

Causal chain
- First visible delivery/referral and timestamp:
- Player’s explanation (quote or close paraphrase):
- Chain correctly identified by 3:00: pass / fail
- Missing or mistaken link:

Debrief
- Intended next-run change and reason:
- Stated bottleneck: capacity / deadline / cost / other / unclear
- Strongest confusion or observed workaround:

Primary score: first action __ / layout __ / chain __
Observer notes (facts separated from interpretation):
```

## Bottleneck reporting

After each session, label the observed bottleneck as **capacity**, **deadline**, **cost/runway**, **comprehension/UI**, **layout feedback**, **causal readability**, **automation/passivity**, or **other**. For every label, include a timestamped behavior or participant quote, the consequence for the run, and whether it blocked a primary measure. Keep observation separate from interpretation; for example, report “paused at 0:42 and asked what the dashed link means” before proposing “link preview needs a clearer cue.”

Summarize counts by bottleneck and by primary measure across completed sessions. Highlight recurring blockers (same issue in at least two sessions) and any single blocker that prevented task completion. End the report with **GO**, **REVISE**, or **PROVISIONAL / INSUFFICIENT SESSIONS**, cite the denominator and evidence, and name the specific design change to try next. Do not describe an unrun session, unmeasured threshold, or unavailable feature as a result or a pass.
