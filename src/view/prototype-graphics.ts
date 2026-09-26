import { Container, Graphics } from 'pixi.js'
import { CELL_SIZE } from './camera'

export interface StationMarker {
  id: string
  cell: { column: number; row: number }
}

export interface PrototypeGraphicsState {
  stations: readonly StationMarker[]
  dropTargetStationId: string | null
  placementCell: { column: number; row: number } | null
  placementValid: boolean
  selectedStationId: string | null
}

const COLORS = {
  ink: 0x101c2b,
  ivory: 0xf4f0df,
  turquoise: 0x32c7ba,
  coral: 0xf4995c,
  risk: 0xe26569,
}

const center = (cell: StationMarker['cell']) => ({
  x: (cell.column + 0.5) * CELL_SIZE,
  y: (cell.row + 0.5) * CELL_SIZE,
})

/** Original, language-neutral Pixi visuals for the first WASL board prototype. */
export class PrototypeGraphics {
  public readonly container = new Container()
  private readonly drawing = new Graphics()

  constructor() {
    this.container.addChild(this.drawing)
  }

  update(state: PrototypeGraphicsState): void {
    const g = this.drawing.clear()
    const byCell = new Map(state.stations.map((station) => [`${station.cell.column},${station.cell.row}`, station]))

    // Draw each orthogonal link once, with an ivory core to read as an active circuit.
    for (const station of state.stations) {
      const start = center(station.cell)
      for (const [column, row] of [[station.cell.column + 1, station.cell.row], [station.cell.column, station.cell.row + 1]]) {
        const neighbor = byCell.get(`${column},${row}`)
        if (!neighbor) continue
        const end = center(neighbor.cell)
        g.moveTo(start.x, start.y).lineTo(end.x, end.y).stroke({ color: COLORS.turquoise, width: 8, alpha: 0.34 })
        g.moveTo(start.x, start.y).lineTo(end.x, end.y).stroke({ color: COLORS.ivory, width: 2, alpha: 0.72 })
      }
    }

    if (state.placementCell) {
      const x = state.placementCell.column * CELL_SIZE + 8
      const y = state.placementCell.row * CELL_SIZE + 8
      const color = state.placementValid ? COLORS.turquoise : COLORS.risk
      if (state.placementValid) {
        const previewCenter = center(state.placementCell)
        for (const station of state.stations) {
          if (station.id === state.selectedStationId) continue
          const distance = Math.abs(station.cell.column - state.placementCell.column)
            + Math.abs(station.cell.row - state.placementCell.row)
          if (distance !== 1) continue
          const stationCenter = center(station.cell)
          g.moveTo(previewCenter.x, previewCenter.y)
            .lineTo(stationCenter.x, stationCenter.y)
            .stroke({ color: COLORS.turquoise, width: 6, alpha: 0.55 })
        }
      }
      g.roundRect(x, y, CELL_SIZE - 16, CELL_SIZE - 16, 14)
        .fill({ color, alpha: 0.14 })
        .stroke({ color, width: 3, alpha: 0.95 })
      // Corner ticks make the preview legible without filling the cell.
      for (const [dx, dy, sx, sy] of [[12, 0, 1, 1], [CELL_SIZE - 12, 0, -1, 1], [12, CELL_SIZE - 16, 1, -1], [CELL_SIZE - 12, CELL_SIZE - 16, -1, -1]]) {
        g.moveTo(x + dx, y + dy + sy * 8).lineTo(x + dx, y + dy).lineTo(x + dx + sx * 8, y + dy)
          .stroke({ color, width: 2, alpha: 0.9 })
      }
    }

    for (const station of state.stations) {
      const { x, y } = center(station.cell)
      const selected = station.id === state.selectedStationId
      const dropTarget = station.id === state.dropTargetStationId

      if (dropTarget) {
        g.circle(x, y, 29).stroke({ color: COLORS.coral, width: 4, alpha: 0.95 })
        g.circle(x, y, 34).stroke({ color: COLORS.ivory, width: 1.5, alpha: 0.62 })
      } else if (selected) {
        // Dark keyline keeps the selected halo distinct from both the tile and the icon.
        g.circle(x, y, 34).stroke({ color: COLORS.ink, width: 8, alpha: 0.96 })
        g.circle(x, y, 34).stroke({ color: COLORS.ivory, width: 4, alpha: 1 })
      }

      // Factory silhouette: a broad production floor, raised roof crown, and three clear ports.
      // The 56px body and 60px overall height remain inside the 72px board cell.
      g.roundRect(x - 28, y - 18, 56, 42, 10)
        .fill({ color: COLORS.turquoise })
        .stroke({ color: COLORS.ink, width: 3.5, alpha: 0.98 })
      // Raised crown/vent gives Product a distinctive factory roofline at fitted zoom.
      g.roundRect(x - 14, y - 30, 28, 14, 4)
        .fill({ color: COLORS.ivory })
        .stroke({ color: COLORS.ink, width: 2.5 })
      // Dark port bank with three large light apertures reads as production machinery.
      g.roundRect(x - 19, y - 5, 38, 18, 5)
        .fill({ color: COLORS.ink, alpha: 0.92 })
        .stroke({ color: COLORS.ink, width: 1.5 })
      for (const portX of [-11, 0, 11]) {
        g.circle(x + portX, y + 4, 3.5).fill({ color: COLORS.ivory })
      }
      g.circle(x - 19, y + 18, 3).fill({ color: COLORS.ivory, alpha: 0.95 })
      g.circle(x + 19, y + 18, 3).fill({ color: COLORS.ivory, alpha: 0.95 })
    }
  }
}
