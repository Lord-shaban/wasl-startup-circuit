import { Application, Container, Graphics } from 'pixi.js'
import {
  BoardCamera,
  CELL_SIZE,
  GRID_COLUMNS,
  GRID_ROWS,
  type Cell,
  type Point,
} from './camera'

export interface BoardView {
  destroy(): void
}

function drawGrid(): Graphics {
  const width = GRID_COLUMNS * CELL_SIZE
  const height = GRID_ROWS * CELL_SIZE
  const grid = new Graphics()
    .roundRect(0, 0, width, height, 16)
    .fill(0x172b3b)
    .stroke({ color: 0x456075, width: 2 })

  for (let column = 1; column < GRID_COLUMNS; column++) {
    const x = column * CELL_SIZE
    grid.moveTo(x, 0).lineTo(x, height)
  }
  for (let row = 1; row < GRID_ROWS; row++) {
    const y = row * CELL_SIZE
    grid.moveTo(0, y).lineTo(width, y)
  }
  grid.stroke({ color: 0x314758, width: 1 })
  return grid
}

function pointInCanvas(event: MouseEvent, canvas: HTMLCanvasElement): Point {
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.clientWidth,
    y: ((event.clientY - rect.top) / rect.height) * canvas.clientHeight,
  }
}

/** A rendering and coordinate shell. Gameplay entities are added in M2. */
export async function createBoard(
  host: HTMLElement,
  onPointerCell: (cell: Cell | null, zoom: number) => void,
): Promise<BoardView> {
  const app = new Application()
  const width = Math.max(1, host.clientWidth)
  const height = Math.max(1, host.clientHeight)
  await app.init({
    width,
    height,
    background: 0x101c2b,
    antialias: true,
    preference: 'webgl',
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
  })
  host.appendChild(app.canvas)

  const camera = new BoardCamera(width, height)
  const world = new Container()
  const highlight = new Graphics()
  world.addChild(drawGrid(), highlight)
  app.stage.addChild(world)
  let hoveredCell: Cell | null = null

  const applyCamera = () => {
    const { x, y, scale } = camera.transform
    world.position.set(x, y)
    world.scale.set(scale)
  }

  const showCell = (cell: Cell | null) => {
    hoveredCell = cell
    highlight.clear()
    if (cell) {
      highlight
        .roundRect(
          cell.column * CELL_SIZE + 3,
          cell.row * CELL_SIZE + 3,
          CELL_SIZE - 6,
          CELL_SIZE - 6,
          8,
        )
        .fill({ color: 0x32c7ba, alpha: 0.18 })
        .stroke({ color: 0x32c7ba, width: 2 })
    }
    onPointerCell(cell, camera.transform.scale)
  }

  const onPointerMove = (event: PointerEvent) => {
    const cell = camera.screenToCell(pointInCanvas(event, app.canvas))
    if (cell?.column !== hoveredCell?.column || cell?.row !== hoveredCell?.row) {
      showCell(cell)
    }
  }
  const onPointerLeave = () => showCell(null)
  const onWheel = (event: WheelEvent) => {
    event.preventDefault()
    const point = pointInCanvas(event, app.canvas)
    camera.zoomAt(point, event.deltaY < 0 ? 1.1 : 1 / 1.1)
    applyCamera()
    showCell(camera.screenToCell(point))
  }

  app.canvas.addEventListener('pointermove', onPointerMove)
  app.canvas.addEventListener('pointerleave', onPointerLeave)
  app.canvas.addEventListener('wheel', onWheel, { passive: false })
  const resizeObserver = new ResizeObserver(() => {
    const nextWidth = Math.max(1, host.clientWidth)
    const nextHeight = Math.max(1, host.clientHeight)
    app.renderer.resize(nextWidth, nextHeight)
    camera.resize(nextWidth, nextHeight)
    applyCamera()
  })
  resizeObserver.observe(host)
  applyCamera()
  onPointerCell(null, camera.transform.scale)

  return {
    destroy() {
      resizeObserver.disconnect()
      app.canvas.removeEventListener('pointermove', onPointerMove)
      app.canvas.removeEventListener('pointerleave', onPointerLeave)
      app.canvas.removeEventListener('wheel', onWheel)
      app.destroy(true)
    },
  }
}
