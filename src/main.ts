import './style.css'
import { createBoard } from './view/board'

const root = document.querySelector<HTMLDivElement>('#app')

if (!root) {
  throw new Error('Application root is missing')
}

root.innerHTML = `
  <main class="shell">
    <section class="intro" aria-labelledby="game-title">
      <p class="eyebrow">WASL / STARTUP CIRCUIT</p>
      <h1 id="game-title">Build a company that comes alive.</h1>
      <p class="description">
        Turn one customer opportunity into a connected network of teams,
        deliveries, and referrals.
      </p>
      <p class="status"><span class="status-dot" aria-hidden="true"></span>Board prototype · Gameplay is in development</p>
    </section>
    <section class="board-panel" aria-label="Startup board preview">
      <div id="board-host" class="board-host"></div>
      <p id="board-readout" class="board-readout" aria-live="polite">Move the mouse over the grid · Use the wheel to zoom</p>
    </section>
  </main>
`

const boardHost = root.querySelector<HTMLDivElement>('#board-host')
const boardReadout = root.querySelector<HTMLParagraphElement>('#board-readout')

if (!boardHost || !boardReadout) {
  throw new Error('Board shell is missing')
}

createBoard(boardHost, (cell, zoom) => {
  if (!cell) {
    boardReadout.textContent = `Move the mouse over the grid · Zoom ${Math.round(zoom * 100)}%`
    return
  }
  boardReadout.textContent = `Cell ${cell.column + 1}, ${cell.row + 1} · Zoom ${Math.round(zoom * 100)}%`
}).catch((error: unknown) => {
  boardReadout.textContent = 'The board could not start in this browser.'
  console.error('Board initialization failed', error)
})
