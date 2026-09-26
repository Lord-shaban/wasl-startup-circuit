export interface Point {
  readonly x: number
  readonly y: number
}

export interface Cell {
  readonly column: number
  readonly row: number
}

export const CELL_SIZE = 72
export const GRID_COLUMNS = 12
export const GRID_ROWS = 8
export const MIN_ZOOM = 0.5
export const MAX_ZOOM = 2.2
const BOARD_PADDING = 24

/** CSS-pixel coordinates and board-world coordinates share this one transform. */
export class BoardCamera {
  private zoom = 1
  private offsetX: number
  private offsetY: number

  constructor(private width: number, private height: number) {
    const worldWidth = GRID_COLUMNS * CELL_SIZE
    const worldHeight = GRID_ROWS * CELL_SIZE
    this.zoom = Math.max(
      MIN_ZOOM,
      Math.min(1, (width - BOARD_PADDING * 2) / worldWidth, (height - BOARD_PADDING * 2) / worldHeight),
    )
    this.offsetX = (width - worldWidth * this.zoom) / 2
    this.offsetY = (height - worldHeight * this.zoom) / 2
  }

  get transform() {
    return { x: this.offsetX, y: this.offsetY, scale: this.zoom }
  }

  resize(width: number, height: number): void {
    this.offsetX += (width - this.width) / 2
    this.offsetY += (height - this.height) / 2
    this.width = width
    this.height = height
  }

  screenToWorld(point: Point): Point {
    return {
      x: (point.x - this.offsetX) / this.zoom,
      y: (point.y - this.offsetY) / this.zoom,
    }
  }

  worldToScreen(point: Point): Point {
    return {
      x: point.x * this.zoom + this.offsetX,
      y: point.y * this.zoom + this.offsetY,
    }
  }

  screenToCell(point: Point): Cell | null {
    const world = this.screenToWorld(point)
    const column = Math.floor(world.x / CELL_SIZE)
    const row = Math.floor(world.y / CELL_SIZE)
    if (column < 0 || column >= GRID_COLUMNS || row < 0 || row >= GRID_ROWS) return null
    return { column, row }
  }

  zoomAt(point: Point, factor: number): void {
    if (!Number.isFinite(factor) || factor <= 0) {
      throw new RangeError('zoom factor must be positive and finite')
    }
    const world = this.screenToWorld(point)
    this.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this.zoom * factor))
    this.offsetX = point.x - world.x * this.zoom
    this.offsetY = point.y - world.y * this.zoom
  }
}
