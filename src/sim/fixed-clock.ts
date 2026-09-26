import { TICK_DURATION_MS } from './kernel'

const MAX_STEPS_PER_ADVANCE = 8

/** Converts frame elapsed time into fixed steps without an unbounded catch-up loop. */
export class FixedStepClock {
  private accumulatorMs = 0

  constructor(private readonly maxFrameMs = 250) {
    if (!Number.isFinite(maxFrameMs) || maxFrameMs <= 0) {
      throw new RangeError('maxFrameMs must be positive and finite')
    }
  }

  advance(elapsedMs: number, onStep: () => void): number {
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
      throw new RangeError('elapsedMs must be nonnegative and finite')
    }
    this.accumulatorMs += Math.min(
      elapsedMs,
      this.maxFrameMs,
      MAX_STEPS_PER_ADVANCE * TICK_DURATION_MS,
    )
    let steps = 0
    while (steps < MAX_STEPS_PER_ADVANCE && this.accumulatorMs + 1e-9 >= TICK_DURATION_MS) {
      onStep()
      this.accumulatorMs -= TICK_DURATION_MS
      steps++
    }
    if (this.accumulatorMs >= TICK_DURATION_MS) {
      this.accumulatorMs %= TICK_DURATION_MS
    }
    return steps
  }

  reset(): void {
    this.accumulatorMs = 0
  }
}
