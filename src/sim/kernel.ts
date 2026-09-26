/** The simulation advances in fixed, deterministic steps. Rendering may run at any rate. */
export const TICKS_PER_SECOND = 30
export const TICK_DURATION_MS = 1000 / TICKS_PER_SECOND

export interface ScheduledEvent<Event> {
  readonly dueTick: number
  readonly sequence: number
  readonly event: Event
}

export interface SimulationSnapshot<State, Event> {
  readonly version: 1
  readonly tick: number
  readonly state: State
  readonly randomState: number
  readonly nextSequence: number
  readonly limits: Required<SimulationLimits>
  readonly pending: readonly ScheduledEvent<Event>[]
}

export interface EventContext<Event> {
  readonly tick: number
  random(): number
  schedule(event: Event, delayTicks?: number): void
}

export type EventReducer<State, Event> = (
  state: Readonly<State>,
  event: Readonly<Event>,
  context: EventContext<Event>,
) => State

export interface SimulationLimits {
  readonly maxPendingEvents?: number
  readonly maxEventsPerTick?: number
}

export interface StepResult {
  readonly tick: number
  readonly processed: number
  readonly deferred: number
  readonly pending: number
}

const DEFAULT_MAX_PENDING_EVENTS = 4096
const DEFAULT_MAX_EVENTS_PER_TICK = 256
const SNAPSHOT_VERSION = 1

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function nonnegativeSafeInteger(value: unknown, name: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new RangeError(`${name} must be a nonnegative safe integer`)
  }
  return value as number
}

function uint32(value: unknown, name: string): number {
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > 0xffffffff) {
    throw new RangeError(`${name} must be an unsigned 32-bit integer`)
  }
  return value as number
}

function positiveInteger(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive safe integer`)
  }
  return value
}

/** A small seeded generator. The state is saved so a scenario can be replayed. */
function nextRandom(state: number): { state: number; value: number } {
  const nextState = (state + 0x6d2b79f5) >>> 0
  let value = nextState
  value = Math.imul(value ^ (value >>> 15), value | 1)
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
  return { state: nextState, value: ((value ^ (value >>> 14)) >>> 0) / 4294967296 }
}

/**
 * Owns rule state, event order, and randomness. Reducers should use the supplied
 * random source and return a new serializable state rather than reading wall time.
 */
export class Simulation<State, Event> {
  private tick = 0
  private state: State
  private randomState: number
  private nextSequence = 0
  private readonly pending: ScheduledEvent<Event>[] = []
  private readonly maxPendingEvents: number
  private readonly maxEventsPerTick: number

  constructor(
    initialState: State,
    seed: number,
    private readonly reduceEvent: EventReducer<State, Event>,
    limits: SimulationLimits = {},
  ) {
    if (!Number.isSafeInteger(seed)) {
      throw new RangeError('seed must be a safe integer')
    }
    this.state = structuredClone(initialState)
    this.randomState = seed >>> 0
    this.maxPendingEvents = positiveInteger(
      limits.maxPendingEvents ?? DEFAULT_MAX_PENDING_EVENTS,
      'maxPendingEvents',
    )
    this.maxEventsPerTick = positiveInteger(
      limits.maxEventsPerTick ?? DEFAULT_MAX_EVENTS_PER_TICK,
      'maxEventsPerTick',
    )
  }

  /** Restore a versioned snapshot with the same reducer used by the original run. */
  static fromSnapshot<State, Event>(
    snapshot: unknown,
    reduceEvent: EventReducer<State, Event>,
  ): Simulation<State, Event> {
    if (!record(snapshot) || snapshot.version !== SNAPSHOT_VERSION) {
      throw new RangeError('unsupported simulation snapshot version')
    }
    const tick = nonnegativeSafeInteger(snapshot.tick, 'snapshot tick')
    const randomState = uint32(snapshot.randomState, 'snapshot randomState')
    const nextSequence = nonnegativeSafeInteger(snapshot.nextSequence, 'snapshot nextSequence')
    if (!record(snapshot.limits)) {
      throw new TypeError('snapshot limits are invalid')
    }
    const maxPendingEvents = positiveInteger(snapshot.limits.maxPendingEvents as number, 'maxPendingEvents')
    const maxEventsPerTick = positiveInteger(snapshot.limits.maxEventsPerTick as number, 'maxEventsPerTick')
    if (!Object.hasOwn(snapshot, 'state') || !Array.isArray(snapshot.pending)) {
      throw new TypeError('snapshot state or pending events are invalid')
    }
    if (snapshot.pending.length > maxPendingEvents) {
      throw new RangeError('snapshot event queue exceeds its limit')
    }

    let previousDueTick = -1
    let previousSequence = -1
    const seenSequences = new Set<number>()
    for (const item of snapshot.pending) {
      if (!record(item) || !Object.hasOwn(item, 'event')) {
        throw new TypeError('snapshot pending event is invalid')
      }
      const dueTick = nonnegativeSafeInteger(item.dueTick, 'snapshot event dueTick')
      const sequence = nonnegativeSafeInteger(item.sequence, 'snapshot event sequence')
      if (sequence >= nextSequence || seenSequences.has(sequence)) {
        throw new RangeError('snapshot event sequence is invalid')
      }
      if (dueTick < previousDueTick || (dueTick === previousDueTick && sequence <= previousSequence)) {
        throw new RangeError('snapshot pending events are out of order')
      }
      seenSequences.add(sequence)
      previousDueTick = dueTick
      previousSequence = sequence
    }

    // Cloning here also rejects values that the regular snapshot API cannot preserve.
    const saved = structuredClone(snapshot) as unknown as SimulationSnapshot<State, Event>
    const simulation = new Simulation(saved.state, 0, reduceEvent, { maxPendingEvents, maxEventsPerTick })
    simulation.tick = tick
    simulation.randomState = randomState
    simulation.nextSequence = nextSequence
    simulation.pending.push(...saved.pending)
    return simulation
  }

  /** Delay 0 also permits a causal chain within the currently processing tick. */
  schedule(event: Event, delayTicks = 0): void {
    if (!Number.isSafeInteger(delayTicks) || delayTicks < 0) {
      throw new RangeError('delayTicks must be a nonnegative safe integer')
    }
    if (this.pending.length >= this.maxPendingEvents) {
      throw new RangeError('simulation event queue is full')
    }
    const dueTick = this.tick + delayTicks
    if (!Number.isSafeInteger(dueTick)) {
      throw new RangeError('scheduled tick exceeds the safe integer range')
    }
    if (this.nextSequence >= Number.MAX_SAFE_INTEGER) {
      throw new RangeError('event sequence exceeds the safe integer range')
    }
    const item: ScheduledEvent<Event> = {
      dueTick,
      sequence: this.nextSequence++,
      event: structuredClone(event),
    }

    // Insert after events with the same due tick to preserve causal FIFO order.
    let low = 0
    let high = this.pending.length
    while (low < high) {
      const middle = (low + high) >>> 1
      if (this.pending[middle].dueTick <= dueTick) low = middle + 1
      else high = middle
    }
    this.pending.splice(low, 0, item)
  }

  step(): StepResult {
    if (this.tick >= Number.MAX_SAFE_INTEGER) {
      throw new RangeError('simulation tick exceeds the safe integer range')
    }
    this.tick++
    let processed = 0
    const context: EventContext<Event> = {
      tick: this.tick,
      random: () => {
        const result = nextRandom(this.randomState)
        this.randomState = result.state
        return result.value
      },
      schedule: (event, delayTicks) => this.schedule(event, delayTicks),
    }

    while (
      processed < this.maxEventsPerTick &&
      this.pending.length > 0 &&
      this.pending[0].dueTick <= this.tick
    ) {
      const item = this.pending.shift()!
      this.state = this.reduceEvent(this.state, item.event, context)
      processed++
    }

    let deferred = 0
    while (deferred < this.pending.length && this.pending[deferred].dueTick <= this.tick) {
      deferred++
    }
    return { tick: this.tick, processed, deferred, pending: this.pending.length }
  }

  snapshot(): SimulationSnapshot<State, Event> {
    return structuredClone({
      version: SNAPSHOT_VERSION,
      tick: this.tick,
      state: this.state,
      randomState: this.randomState,
      nextSequence: this.nextSequence,
      limits: {
        maxPendingEvents: this.maxPendingEvents,
        maxEventsPerTick: this.maxEventsPerTick,
      },
      pending: this.pending,
    })
  }
}
