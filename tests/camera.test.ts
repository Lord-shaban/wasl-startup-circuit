import { describe, expect, it } from 'vitest'
import { BoardCamera, CELL_SIZE, GRID_COLUMNS, GRID_ROWS, MAX_ZOOM } from '../src/view/camera'

describe('board camera', () => {
  const target = { column: 5, row: 3 }
  const worldPoint = { x: (target.column + 0.4) * CELL_SIZE, y: (target.row + 0.6) * CELL_SIZE }

  it('picks the same cell after zooming at the pointer', () => {
    const camera = new BoardCamera(1200, 800)
    const before = camera.worldToScreen(worldPoint)
    camera.zoomAt(before, 1.5)
    expect(camera.worldToScreen(worldPoint).x).toBeCloseTo(before.x)
    expect(camera.worldToScreen(worldPoint).y).toBeCloseTo(before.y)
    expect(camera.screenToCell(before)).toEqual(target)
  })

  it('preserves alignment when the viewport is resized', () => {
    const camera = new BoardCamera(1200, 800)
    const before = camera.worldToScreen(worldPoint)
    camera.resize(720, 480)
    const after = camera.worldToScreen(worldPoint)
    expect(after.x).toBeCloseTo(before.x - 240)
    expect(after.y).toBeCloseTo(before.y - 160)
    expect(camera.screenToCell(after)).toEqual(target)
  })

  it('rejects points outside the board and clamps zoom', () => {
    const camera = new BoardCamera(1200, 800)
    const outside = camera.worldToScreen({ x: GRID_COLUMNS * CELL_SIZE, y: GRID_ROWS * CELL_SIZE })
    expect(camera.screenToCell(outside)).toBeNull()
    camera.zoomAt({ x: 0, y: 0 }, 100)
    expect(camera.transform.scale).toBe(MAX_ZOOM)
  })

  it('fits the full board in a compact viewport on first load', () => {
    const camera = new BoardCamera(720, 400)
    const lowerRight = camera.worldToScreen({ x: GRID_COLUMNS * CELL_SIZE, y: GRID_ROWS * CELL_SIZE })
    expect(camera.transform.x).toBeGreaterThanOrEqual(0)
    expect(camera.transform.y).toBeGreaterThanOrEqual(0)
    expect(lowerRight.x).toBeLessThanOrEqual(720)
    expect(lowerRight.y).toBeLessThanOrEqual(400)
  })
})
