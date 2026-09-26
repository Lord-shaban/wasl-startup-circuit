import { describe, expect, it } from 'vitest'
import { FixedStepClock, Simulation, TICK_DURATION_MS } from '../src/sim'

type TestEvent = { kind: 'sample' | 'chain'; label: string }

describe('deterministic simulation', () => {
  function makeScenario(seed: number) {
    const sim = new Simulation(
      { log: [] as string[], rolls: [] as number[] },
      seed,
      (state, event: TestEvent, context) => ({
        log: [...state.log, `${context.tick}:${event.label}`],
        rolls: [...state.rolls, context.random()],
      }),
    )
    sim.schedule({ kind: 'sample', label: 'later' }, 3)
    sim.schedule({ kind: 'sample', label: 'first' }, 1)
    sim.schedule({ kind: 'sample', label: 'second' }, 1)
    for (let i = 0; i < 4; i++) sim.step()
    return sim.snapshot()
  }

  it('replays the same commands and seed with identical order and values', () => {
    const first = makeScenario(42)
    expect(makeScenario(42)).toEqual(first)
    expect(first.state.log).toEqual(['1:first', '1:second', '3:later'])
    expect(makeScenario(43).state.rolls).not.toEqual(first.state.rolls)
  })

  it('caps same-tick chains and carries the remainder forward', () => {
    const sim = new Simulation(
      { count: 0 },
      1,
      (state, event: TestEvent, context) => {
        context.schedule(event)
        return { count: state.count + 1 }
      },
      { maxPendingEvents: 2, maxEventsPerTick: 3 },
    )
    sim.schedule({ kind: 'chain', label: 'repeat' })
    expect(sim.step()).toEqual({ tick: 1, processed: 3, deferred: 1, pending: 1 })
    expect(sim.step()).toEqual({ tick: 2, processed: 3, deferred: 1, pending: 1 })
    expect(sim.snapshot().state.count).toBe(6)
  })

  it('keeps earlier work ahead of a newly created same-tick event', () => {
    const sim = new Simulation([] as string[], 1, (state, event: TestEvent, context) => {
      if (event.label === 'first') context.schedule({ kind: 'chain', label: 'follow-up' })
      return [...state, event.label]
    })
    sim.schedule({ kind: 'sample', label: 'first' })
    sim.schedule({ kind: 'sample', label: 'second' })
    sim.step()
    expect(sim.snapshot().state).toEqual(['first', 'second', 'follow-up'])
  })

  it('rejects an overflowing queue and invalid scheduling', () => {
    const sim = new Simulation(0, 0, (state: number) => state, { maxPendingEvents: 1 })
    sim.schedule({ kind: 'sample', label: 'one' })
    expect(() => sim.schedule({ kind: 'sample', label: 'two' })).toThrow('queue is full')
    expect(() => sim.schedule({ kind: 'sample', label: 'bad' }, -1)).toThrow(RangeError)
  })

  it('isolates snapshots from external mutations', () => {
    const sim = new Simulation({ items: ['original'] }, 1, (state) => ({ ...state }))
    const copy = sim.snapshot()
    copy.state.items.push('changed')
    expect(sim.snapshot().state.items).toEqual(['original'])
  })

  it('continues identically after a JSON snapshot round trip', () => {
    const reduce = (state: { log: string[]; rolls: number[] }, event: TestEvent, context: {
      tick: number
      random(): number
      schedule(event: TestEvent, delayTicks?: number): void
    }) => {
      if (event.label === 'first') context.schedule({ kind: 'chain', label: 'follow-up' })
      return {
        log: [...state.log, `${context.tick}:${event.label}`],
        rolls: [...state.rolls, context.random()],
      }
    }
    const original = new Simulation({ log: [] as string[], rolls: [] as number[] }, 42, reduce, {
      maxPendingEvents: 5,
      maxEventsPerTick: 1,
    })
    original.schedule({ kind: 'sample', label: 'first' }, 1)
    original.schedule({ kind: 'sample', label: 'second' }, 1)
    original.schedule({ kind: 'sample', label: 'later' }, 3)
    original.step()

    const stored = JSON.parse(JSON.stringify(original.snapshot()))
    const resumed = Simulation.fromSnapshot<{
      log: string[]
      rolls: number[]
    }, TestEvent>(stored, reduce)
    expect(resumed.snapshot()).toEqual(original.snapshot())
    stored.state.log.push('external mutation')
    stored.pending[0].event.label = 'external mutation'
    expect(resumed.snapshot()).toEqual(original.snapshot())

    // Both runs process deferred work, a same-tick chain, and future work.
    for (let i = 0; i < 4; i++) {
      expect(resumed.step()).toEqual(original.step())
      expect(resumed.snapshot()).toEqual(original.snapshot())
    }
    resumed.schedule({ kind: 'sample', label: 'next' })
    original.schedule({ kind: 'sample', label: 'next' })
    expect(resumed.snapshot()).toEqual(original.snapshot())
    expect(resumed.step()).toEqual(original.step())
    expect(resumed.snapshot()).toEqual(original.snapshot())
  })

  it('rejects invalid or incompatible snapshots', () => {
    const reduce = (state: number) => state
    const sim = new Simulation(0, 1, reduce, { maxPendingEvents: 2 })
    sim.schedule({ kind: 'sample', label: 'one' }, 2)
    const valid = sim.snapshot()
    const changed = (change: (snapshot: Record<string, any>) => void) => {
      const snapshot = structuredClone(valid) as unknown as Record<string, any>
      change(snapshot)
      return snapshot
    }

    expect(() => Simulation.fromSnapshot(changed((s) => { s.version = 2 }), reduce)).toThrow(
      'unsupported simulation snapshot version',
    )
    expect(() => Simulation.fromSnapshot(changed((s) => { s.randomState = -1 }), reduce)).toThrow(
      'randomState',
    )
    expect(() => Simulation.fromSnapshot(changed((s) => { s.nextSequence = 0 }), reduce)).toThrow(
      'sequence',
    )
    expect(() => Simulation.fromSnapshot(changed((s) => { s.pending[0].dueTick = -1 }), reduce)).toThrow(
      'dueTick',
    )
    expect(() => Simulation.fromSnapshot(changed((s) => { s.limits.maxPendingEvents = 0 }), reduce)).toThrow(
      'maxPendingEvents',
    )
    expect(() => Simulation.fromSnapshot(changed((s) => { s.pending.push(s.pending[0]) }), reduce)).toThrow(
      'sequence',
    )
  })
})

describe('fixed step clock', () => {
  it('advances by the same tick count across frame subdivisions', () => {
    const single = new FixedStepClock()
    const split = new FixedStepClock()
    let firstTicks = 0
    let secondTicks = 0
    single.advance(3 * TICK_DURATION_MS, () => firstTicks++)
    split.advance(TICK_DURATION_MS, () => secondTicks++)
    split.advance(2 * TICK_DURATION_MS, () => secondTicks++)
    expect(firstTicks).toBe(3)
    expect(secondTicks).toBe(firstTicks)
  })

  it('caps a long stalled frame and rejects invalid elapsed time', () => {
    const clock = new FixedStepClock(1_000_000)
    expect(clock.advance(10_000, () => {})).toBeLessThanOrEqual(8)
    expect(() => clock.advance(-1, () => {})).toThrow(RangeError)
  })
})
