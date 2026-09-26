import { Application, Container, Graphics } from 'pixi.js'
import {
  BoardCamera,
  CELL_SIZE,
  GRID_COLUMNS,
  GRID_ROWS,
  type Cell,
  type Point,
} from './camera'
import { PrototypeGraphics, type PrototypeGraphicsState } from './prototype-graphics'
import { ReferralEffect } from './referral-effect'

export interface BoardView {
  clientToCell(clientX: number, clientY: number): Cell | null
  cellToClientPoint(cell: Cell): Point
  updatePrototype(state: PrototypeGraphicsState): void
  startReferral(source: Cell, destination: Cell): void
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

function pointInCanvas(clientX: number, clientY: number, canvas: HTMLCanvasElement): Point {
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((clientX - rect.left) / rect.width) * canvas.clientWidth,
    y: ((clientY - rect.top) / rect.height) * canvas.clientHeight,
  }
}

export async function createBoard(
  host: HTMLElement,
  onPointerCell: (cell: Cell | null, zoom: number) => void,
  onCellClick: (cell: Cell) => void,
  onStationDrag?: (stationId: string, targetCell: Cell | null) => void,
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
  const prototypeGraphics = new PrototypeGraphics()
  const referralEffect = new ReferralEffect()
  world.addChild(drawGrid(), highlight, prototypeGraphics.container, referralEffect.container)
  app.stage.addChild(world)
  const tickEffect = (ticker: { deltaMS: number }) => referralEffect.update(ticker.deltaMS)
  app.ticker.add(tickEffect)
  let hoveredCell: Cell | null = null
  let stations: PrototypeGraphicsState['stations'] = []
  let prototypeState: PrototypeGraphicsState | null = null
  let activeDrag: { pointerId: number; stationId: string; startX: number; startY: number; dragging: boolean } | null = null
  let suppressClick = false

  const clientToCell = (clientX: number, clientY: number): Cell | null => {
    const rect = app.canvas.getBoundingClientRect()
    if (clientX < rect.left || clientX >= rect.right || clientY < rect.top || clientY >= rect.bottom) return null
    return camera.screenToCell(pointInCanvas(clientX, clientY, app.canvas))
  }

  const cellToClientPoint = (cell: Cell): Point => {
    const rect = app.canvas.getBoundingClientRect()
    const screen = camera.worldToScreen({
      x: (cell.column + 0.5) * CELL_SIZE,
      y: (cell.row + 0.5) * CELL_SIZE,
    })
    return {
      x: rect.left + screen.x / app.canvas.clientWidth * rect.width,
      y: rect.top + screen.y / app.canvas.clientHeight * rect.height,
    }
  }

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
    const cell = clientToCell(event.clientX, event.clientY)
    if (activeDrag?.pointerId === event.pointerId) {
      if (!activeDrag.dragging && Math.hypot(event.clientX - activeDrag.startX, event.clientY - activeDrag.startY) > 5) {
        activeDrag.dragging = true
      }
      if (activeDrag.dragging) {
        if (cell?.column !== hoveredCell?.column || cell?.row !== hoveredCell?.row) showCell(cell)
        if (prototypeState) {
          prototypeGraphics.update({
            ...prototypeState,
            selectedStationId: activeDrag.stationId,
            placementCell: cell,
            placementValid: !!cell && !stations.some((station) => station.id !== activeDrag?.stationId
              && station.cell.column === cell.column && station.cell.row === cell.row),
          })
        }
        return
      }
    }
    if (cell?.column !== hoveredCell?.column || cell?.row !== hoveredCell?.row) {
      showCell(cell)
    }
  }
  const onPointerLeave = () => {
    if (!activeDrag?.dragging) showCell(null)
  }
  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || !onStationDrag) return
    const cell = clientToCell(event.clientX, event.clientY)
    const station = cell && stations.find((candidate) => candidate.cell.column === cell.column && candidate.cell.row === cell.row)
    if (!station) return
    activeDrag = {
      pointerId: event.pointerId,
      stationId: station.id,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
    }
    app.canvas.setPointerCapture(event.pointerId)
  }
  const onPointerUp = (event: PointerEvent) => {
    if (activeDrag?.pointerId !== event.pointerId) return
    const drag = activeDrag
    if (drag.dragging) {
      const cell = clientToCell(event.clientX, event.clientY)
      if (cell?.column !== hoveredCell?.column || cell?.row !== hoveredCell?.row) showCell(cell)
      onStationDrag?.(drag.stationId, cell)
      suppressClick = true
      window.setTimeout(() => { suppressClick = false }, 0)
    }
    activeDrag = null
    if (app.canvas.hasPointerCapture(event.pointerId)) app.canvas.releasePointerCapture(event.pointerId)
  }
  const onPointerCancel = (event: PointerEvent) => {
    if (activeDrag?.pointerId === event.pointerId) activeDrag = null
  }
  const onClick = (event: MouseEvent) => {
    if (suppressClick) {
      suppressClick = false
      return
    }
    const cell = clientToCell(event.clientX, event.clientY)
    if (cell) onCellClick(cell)
  }
  const onWheel = (event: WheelEvent) => {
    event.preventDefault()
    const point = pointInCanvas(event.clientX, event.clientY, app.canvas)
    camera.zoomAt(point, event.deltaY < 0 ? 1.1 : 1 / 1.1)
    applyCamera()
    showCell(camera.screenToCell(point))
  }

  app.canvas.addEventListener('pointerdown', onPointerDown)
  app.canvas.addEventListener('pointermove', onPointerMove)
  app.canvas.addEventListener('pointerup', onPointerUp)
  app.canvas.addEventListener('pointercancel', onPointerCancel)
  app.canvas.addEventListener('pointerleave', onPointerLeave)
  app.canvas.addEventListener('click', onClick)
  app.canvas.addEventListener('wheel', onWheel, { passive: false })
  const resizeObserver = new ResizeObserver(() => {
    const nextWidth = Math.max(1, host.clientWidth)
    const nextHeight = Math.max(1, host.clientHeight)
    app.renderer.resize(nextWidth, nextHeight)
    camera.resize(nextWidth, nextHeight)
    applyCamera()
    onPointerCell(hoveredCell, camera.transform.scale)
  })
  resizeObserver.observe(host)
  applyCamera()
  onPointerCell(null, camera.transform.scale)

  return {
    clientToCell,
    cellToClientPoint,
    updatePrototype(state) {
      stations = state.stations
      prototypeState = state
      prototypeGraphics.update(state)
    },
    startReferral(source, destination) {
      referralEffect.start(source, destination)
    },
    destroy() {
      app.ticker.remove(tickEffect)
      resizeObserver.disconnect()
      app.canvas.removeEventListener('pointermove', onPointerMove)
      app.canvas.removeEventListener('pointerdown', onPointerDown)
      app.canvas.removeEventListener('pointerup', onPointerUp)
      app.canvas.removeEventListener('pointercancel', onPointerCancel)
      app.canvas.removeEventListener('pointerleave', onPointerLeave)
      app.canvas.removeEventListener('click', onClick)
      app.canvas.removeEventListener('wheel', onWheel)
      app.destroy(true)
    },
  }
}
