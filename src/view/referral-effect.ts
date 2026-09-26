import { Container, Graphics } from 'pixi.js'
import { CELL_SIZE, type Cell } from './camera'

const COLORS = {
  ivory: 0xf4f0df,
  turquoise: 0x32c7ba,
}

const DURATION_MS = 840
const SOURCE_PULSE_END_MS = 230
const TRAIL_START_MS = 145
const ARRIVAL_MS = 665

function cellCenter(cell: Cell) {
  return {
    x: (cell.column + 0.5) * CELL_SIZE,
    y: (cell.row + 0.5) * CELL_SIZE,
  }
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function smoothstep(value: number): number {
  const t = clamp01(value)
  return t * t * (3 - 2 * t)
}

/** A bounded, language-neutral trail linking a Product station to a referral cell. */
export class ReferralEffect {
  public readonly container = new Container()
  private readonly drawing = new Graphics()
  private source = { x: 0, y: 0 }
  private destination = { x: 0, y: 0 }
  private elapsedMs = 0
  private running = false

  constructor() {
    this.container.addChild(this.drawing)
  }

  get active(): boolean {
    return this.running
  }

  start(source: Cell, destination: Cell): void {
    this.source = cellCenter(source)
    this.destination = cellCenter(destination)
    this.elapsedMs = 0
    this.running = true
    this.draw()
  }

  update(deltaMs: number): void {
    if (!this.running) return

    // Ignore invalid or negative frame deltas and cap the effect at its fixed lifetime.
    if (Number.isFinite(deltaMs) && deltaMs > 0) {
      this.elapsedMs = Math.min(DURATION_MS, this.elapsedMs + deltaMs)
    }
    if (this.elapsedMs >= DURATION_MS) {
      this.running = false
      this.drawing.clear()
      return
    }
    this.draw()
  }

  private draw(): void {
    const g = this.drawing.clear()
    const t = this.elapsedMs
    const { x: sx, y: sy } = this.source
    const { x: dx, y: dy } = this.destination

    // Product arrival: a restrained double pulse at the station center.
    if (t <= SOURCE_PULSE_END_MS) {
      const progress = smoothstep(t / SOURCE_PULSE_END_MS)
      const radius = 13 + 18 * progress
      const alpha = 0.82 * (1 - progress * 0.54)
      g.circle(sx, sy, radius + 5).stroke({ color: COLORS.turquoise, width: 2, alpha: alpha * 0.42 })
      g.circle(sx, sy, radius).stroke({ color: COLORS.ivory, width: 2.5, alpha })
      g.circle(sx, sy, 4 + 2 * (1 - progress)).fill({ color: COLORS.ivory, alpha: 0.9 })
    }

    // The connected line grows toward the caller-selected destination. Its direction
    // follows board coordinates, so RTL presentation does not reverse its semantics.
    if (t >= TRAIL_START_MS && t <= ARRIVAL_MS) {
      const progress = smoothstep((t - TRAIL_START_MS) / (ARRIVAL_MS - TRAIL_START_MS))
      const x = sx + (dx - sx) * progress
      const y = sy + (dy - sy) * progress
      const fadeIn = clamp01((t - TRAIL_START_MS) / 70)

      g.moveTo(sx, sy).lineTo(x, y)
        .stroke({ color: COLORS.turquoise, width: 9, alpha: 0.28 * fadeIn })
      g.moveTo(sx, sy).lineTo(x, y)
        .stroke({ color: COLORS.turquoise, width: 3, alpha: 0.9 * fadeIn })
      g.circle(x, y, 8).fill({ color: COLORS.turquoise, alpha: 0.24 * fadeIn })
      g.circle(x, y, 4.5).fill({ color: COLORS.ivory, alpha: 0.98 * fadeIn })
    }

    // Delivery: the edge cell receives a clear, short pulse before the effect retires.
    if (t >= ARRIVAL_MS) {
      const progress = smoothstep((t - ARRIVAL_MS) / (DURATION_MS - ARRIVAL_MS))
      const radius = 10 + 15 * progress
      const alpha = (1 - progress) * 0.92
      g.circle(dx, dy, radius + 5).stroke({ color: COLORS.turquoise, width: 2, alpha: alpha * 0.45 })
      g.circle(dx, dy, radius).stroke({ color: COLORS.ivory, width: 2.5, alpha })
      g.circle(dx, dy, 3.5).fill({ color: COLORS.turquoise, alpha: alpha * 0.8 })
    }
  }
}
