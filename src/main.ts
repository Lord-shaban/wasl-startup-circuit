import './style.css'
import { createBoard, type BoardView } from './view/board'
import type { Cell } from './view/camera'
import {
  ADJACENCY_BONUS,
  canPlaceStation,
  createPrototypeState,
  deliverOpportunity,
  deliveryPreview,
  moveStation,
  placeProductStation,
  PRODUCT_STATION_COST,
  spawnPendingReferral,
} from './sim/prototype'
import { formatBoardReadout, readLocale, saveLocale, translate, type Locale } from './ui/localization'
import { prototypeText, type PrototypeTextKey } from './ui/prototype-copy'

const root = document.querySelector<HTMLDivElement>('#app')
if (!root) throw new Error('Application root is missing')
const appRoot = root

appRoot.innerHTML = `
  <main class="shell">
    <header class="topbar">
      <div class="intro">
        <p class="eyebrow" data-i18n="brand"></p>
        <h1 data-i18n="title"></h1>
        <p class="description" data-i18n="description"></p>
        <p class="status"><span class="status-dot" aria-hidden="true"></span><span data-i18n="status"></span></p>
      </div>
      <button id="language-switch" class="language-switch" type="button"></button>
    </header>
    <section class="hud" data-i18n-aria="hud">
      <div class="stat"><span data-i18n="runway"></span><strong data-prototype="future"></strong></div>
      <div class="stat"><span data-i18n="market"></span><strong data-prototype="future"></strong></div>
      <div class="stat"><span data-i18n="impact"></span><strong data-prototype="future"></strong></div>
    </section>
    <div class="workspace">
      <section class="board-panel" data-i18n-aria="board">
        <div id="board-host" class="board-host"></div>
        <p id="starter-station-label" class="starter-station-label" data-prototype="starterStation" hidden></p>
        <div id="opportunity-card" class="opportunity-card">
          <span class="card-kicker" data-prototype="opportunity"></span>
          <strong class="opportunity-value">+<span id="opportunity-value"></span></strong>
          <span class="card-hint" data-prototype="dragHint"></span>
        </div>
        <p id="board-readout" class="board-readout" aria-live="polite"></p>
      </section>
      <aside class="side-panel">
        <div class="resource-list">
          <div class="resource"><span data-prototype="cash"></span><strong id="cash-value"></strong></div>
          <div class="resource"><span data-prototype="trust"></span><strong id="trust-value"></strong></div>
        </div>
        <h2 data-i18n="teams"></h2>
        <ul class="team-list">
          <li><span class="team-icon product" aria-hidden="true">□</span><span data-i18n="product"></span></li>
          <li class="future-team"><span class="team-icon growth" aria-hidden="true">◇</span><span data-i18n="growth"></span><small class="future-badge" data-prototype="future"></small></li>
          <li class="future-team"><span class="team-icon operations" aria-hidden="true">○</span><span data-i18n="operations"></span><small class="future-badge" data-prototype="future"></small></li>
        </ul>
        <button id="buy-product" class="primary-action" type="button"></button>
        <p id="mode-hint" class="mode-hint"></p>
        <button id="cancel-action" class="secondary-action" type="button" hidden></button>
        <p id="delivery-preview" class="delivery-preview" aria-live="polite"></p>
        <p id="prototype-feedback" class="prototype-feedback" aria-live="polite"></p>
        <button id="retry-prototype" class="secondary-action" type="button" hidden></button>
        <h2 data-i18n="upgrades"></h2>
        <p class="preview-note" data-i18n="previewOnly"></p>
      </aside>
    </div>
  </main>
`

function required<T extends Element>(selector: string): T {
  const element = appRoot.querySelector<T>(selector)
  if (!element) throw new Error(`Application element is missing: ${selector}`)
  return element
}

const boardHost = required<HTMLDivElement>('#board-host')
const boardPanel = required<HTMLElement>('.board-panel')
const boardReadout = required<HTMLParagraphElement>('#board-readout')
const languageSwitch = required<HTMLButtonElement>('#language-switch')
const opportunityCard = required<HTMLDivElement>('#opportunity-card')
const opportunityLabel = required<HTMLElement>('.card-kicker')
const starterStationLabel = required<HTMLElement>('#starter-station-label')
const opportunityValue = required<HTMLSpanElement>('#opportunity-value')
const cashValue = required<HTMLElement>('#cash-value')
const trustValue = required<HTMLElement>('#trust-value')
const buyProduct = required<HTMLButtonElement>('#buy-product')
const cancelAction = required<HTMLButtonElement>('#cancel-action')
const modeHint = required<HTMLParagraphElement>('#mode-hint')
const deliveryPreviewElement = required<HTMLParagraphElement>('#delivery-preview')
const feedbackElement = required<HTMLParagraphElement>('#prototype-feedback')
const retryPrototype = required<HTMLButtonElement>('#retry-prototype')

let locale: Locale = readLocale()
let currentCell: Cell | null = null
let currentZoom = 1
let board: BoardView | null = null
let prototype = createPrototypeState()
let mode: 'idle' | 'placing' | 'moving' = 'idle'
let movingStationId: string | null = null
let dropTargetStationId: string | null = null
let feedbackKey: PrototypeTextKey | null = null
let lastPayout = 0
let lastBonus = 0
let dragging = false
let processing = false
let dragOffset = { x: 0, y: 0 }

function number(value: number): string {
  return new Intl.NumberFormat(locale).format(value)
}

function stationAt(cell: Cell | null) {
  return cell && prototype.stations.find((station) => station.cell.column === cell.column && station.cell.row === cell.row)
}

function updateGraphics(): void {
  const placementCell = mode === 'idle' ? null : currentCell
  const placementValid = placementCell
    ? mode === 'placing'
      ? canPlaceStation(prototype, placementCell).ok
      : !prototype.stations.some((station) => station.id !== movingStationId
        && station.cell.column === placementCell.column && station.cell.row === placementCell.row)
    : false
  board?.updatePrototype({
    stations: prototype.stations,
    dropTargetStationId,
    placementCell,
    placementValid,
    selectedStationId: movingStationId ?? (prototype.opportunity.id === 'opportunity-1'
      && prototype.opportunity.status === 'available' && mode === 'idle' && !processing
      ? prototype.stations[0]?.id ?? null : null),
  })
}

function renderPrototype(): void {
  const showStarter = prototype.opportunity.id === 'opportunity-1'
    && prototype.opportunity.status === 'available' && mode === 'idle' && !processing
  starterStationLabel.hidden = !showStarter || !board
  if (showStarter && board) {
    const point = board.cellToClientPoint(prototype.stations[0].cell)
    const panel = boardPanel.getBoundingClientRect()
    starterStationLabel.style.left = `${point.x - panel.left}px`
    starterStationLabel.style.top = `${point.y - panel.top - 35}px`
  }
  cashValue.textContent = number(prototype.cash)
  cashValue.dataset.value = String(prototype.cash)
  trustValue.textContent = number(prototype.trust)
  trustValue.dataset.value = String(prototype.trust)
  opportunityValue.textContent = number(prototype.opportunity.value)
  opportunityLabel.textContent = prototypeText(locale, prototype.opportunity.id.startsWith('referral-') ? 'referralOpportunity' : 'opportunity')
  opportunityCard.hidden = prototype.opportunity.status !== 'available'
  buyProduct.disabled = processing
  buyProduct.textContent = `${prototypeText(locale, 'buyProduct')} · ${number(PRODUCT_STATION_COST)}`
  cancelAction.textContent = prototypeText(locale, 'cancel')
  cancelAction.hidden = mode === 'idle'
  retryPrototype.textContent = prototypeText(locale, 'retry')
  retryPrototype.hidden = processing || prototype.opportunity.status !== 'delivered' || !!prototype.referralPending
  modeHint.textContent = prototypeText(locale, processing
    ? prototype.referralPending ? 'referralInMotion' : 'processing'
    : retryPrototype.hidden ? mode === 'placing' ? 'placeStation' : mode === 'moving' ? 'moveStation' : showStarter ? 'firstAction' : 'dragHint' : 'prototypeComplete')
  feedbackElement.textContent = feedbackKey
    ? `${prototypeText(locale, feedbackKey)}${feedbackKey === 'delivered' ? ` +${number(lastPayout)}${lastBonus ? ` · ${prototypeText(locale, 'adjacencyBonus')} +${number(lastBonus)}` : ''}` : ''}`
    : ''
  const preview = dropTargetStationId && deliveryPreview(prototype, dropTargetStationId)
  const placementCell = currentCell
  const adjacentPlacement = placementCell && mode !== 'idle' && prototype.stations.some((station) =>
    station.id !== movingStationId
    && Math.abs(station.cell.column - placementCell.column) + Math.abs(station.cell.row - placementCell.row) === 1)
  deliveryPreviewElement.textContent = preview && preview.ok
    ? `+${number(preview.value.payout)}${preview.value.adjacencyBonus ? ` · ${prototypeText(locale, 'adjacencyBonus')} +${number(preview.value.adjacencyBonus)}` : ''}`
    : adjacentPlacement ? `${prototypeText(locale, 'adjacencyBonus')} +${number(ADJACENCY_BONUS)}` : ''
  updateGraphics()
}

function renderLocale(): void {
  document.documentElement.lang = locale
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  document.title = locale === 'ar' ? 'وصل: شبكة الشركة' : 'WASL: Startup Circuit'
  appRoot.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
    const key = element.dataset.i18n as Parameters<typeof translate>[1]
    element.textContent = translate(locale, key)
  })
  appRoot.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((element) => {
    const key = element.dataset.i18nAria as Parameters<typeof translate>[1]
    element.setAttribute('aria-label', translate(locale, key))
  })
  appRoot.querySelectorAll<HTMLElement>('[data-prototype]').forEach((element) => {
    element.textContent = prototypeText(locale, element.dataset.prototype as PrototypeTextKey)
  })
  languageSwitch.textContent = locale === 'en' ? 'العربية' : 'English'
  languageSwitch.setAttribute('aria-label', translate(locale, 'switchLanguage'))
  boardReadout.textContent = formatBoardReadout(locale, currentCell, currentZoom)
  renderPrototype()
}

function resetDrag(): void {
  dragging = false
  processing = false
  opportunityCard.classList.remove('dragging')
  opportunityCard.classList.remove('processing')
  opportunityCard.style.left = ''
  opportunityCard.style.top = ''
  opportunityCard.style.right = ''
  dropTargetStationId = null
  renderPrototype()
}

languageSwitch.addEventListener('click', () => {
  locale = locale === 'en' ? 'ar' : 'en'
  saveLocale(locale)
  renderLocale()
})

buyProduct.addEventListener('click', () => {
  if (processing) return
  if (prototype.cash < PRODUCT_STATION_COST) {
    feedbackKey = 'insufficientCash'
  } else {
    mode = 'placing'
    movingStationId = null
    feedbackKey = null
  }
  renderPrototype()
})

cancelAction.addEventListener('click', () => {
  mode = 'idle'
  movingStationId = null
  feedbackKey = null
  renderPrototype()
})

retryPrototype.addEventListener('click', () => {
  prototype = createPrototypeState()
  mode = 'idle'
  movingStationId = null
  dropTargetStationId = null
  feedbackKey = null
  lastPayout = 0
  lastBonus = 0
  renderPrototype()
})

opportunityCard.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || processing || prototype.opportunity.status !== 'available') return
  if (mode !== 'idle') {
    mode = 'idle'
    movingStationId = null
  }
  const rect = opportunityCard.getBoundingClientRect()
  dragOffset = { x: event.clientX - rect.left, y: event.clientY - rect.top }
  dragging = true
  opportunityCard.setPointerCapture(event.pointerId)
  opportunityCard.classList.add('dragging')
  feedbackKey = null
  renderPrototype()
  event.preventDefault()
})

opportunityCard.addEventListener('pointermove', (event) => {
  if (!dragging) return
  const panel = boardPanel.getBoundingClientRect()
  opportunityCard.style.left = `${event.clientX - panel.left - dragOffset.x}px`
  opportunityCard.style.top = `${event.clientY - panel.top - dragOffset.y}px`
  opportunityCard.style.right = 'auto'
  dropTargetStationId = stationAt(board?.clientToCell(event.clientX, event.clientY) ?? null)?.id ?? null
  renderPrototype()
})

opportunityCard.addEventListener('pointerup', (event) => {
  if (!dragging) return
  const stationId = stationAt(board?.clientToCell(event.clientX, event.clientY) ?? null)?.id
  if (stationId) {
    dragging = false
    processing = true
    dropTargetStationId = stationId
    feedbackKey = 'processing'
    const panel = boardPanel.getBoundingClientRect()
    opportunityCard.style.left = `${event.clientX - panel.left - opportunityCard.offsetWidth / 2}px`
    opportunityCard.style.top = `${event.clientY - panel.top - opportunityCard.offsetHeight / 2}px`
    opportunityCard.classList.remove('dragging')
    opportunityCard.classList.add('processing')
    renderPrototype()
    window.setTimeout(() => {
      const preview = deliveryPreview(prototype, stationId)
      const result = deliverOpportunity(prototype, prototype.opportunity.id, stationId)
      if (result.ok && preview.ok) {
        prototype = result.value
        lastPayout = preview.value.payout
        lastBonus = preview.value.adjacencyBonus
        feedbackKey = 'delivered'
      } else {
        feedbackKey = 'invalidOpportunityDrop'
      }
      resetDrag()
      const pending = prototype.referralPending
      if (pending) {
        const source = prototype.stations.find((station) => station.id === pending.sourceStationId)?.cell
        if (source) board?.startReferral(source, { column: locale === 'ar' ? 0 : 11, row: 0 })
        processing = true
        renderPrototype()
        window.setTimeout(() => {
          const spawned = spawnPendingReferral(prototype)
          processing = false
          if (spawned.ok) {
            prototype = spawned.value
            feedbackKey = 'referralCreated'
          }
          renderPrototype()
          if (spawned.ok) {
            opportunityCard.classList.add('arriving')
            window.setTimeout(() => opportunityCard.classList.remove('arriving'), 260)
          }
        }, 840)
      }
    }, 420)
  } else {
    feedbackKey = 'invalidOpportunityDrop'
    resetDrag()
  }
})

opportunityCard.addEventListener('pointercancel', () => {
  if (dragging) resetDrag()
})

renderLocale()
createBoard(boardHost, (cell, zoom) => {
  currentCell = cell
  currentZoom = zoom
  boardReadout.textContent = formatBoardReadout(locale, cell, zoom)
  renderPrototype()
}, (cell) => {
  if (processing) return
  const station = stationAt(cell)
  if (mode === 'placing') {
    const result = placeProductStation(prototype, cell)
    if (result.ok) {
      prototype = result.value
      mode = 'idle'
      feedbackKey = 'stationPlaced'
    } else {
      feedbackKey = result.reason === 'Not enough cash' ? 'insufficientCash' : 'invalidDrop'
    }
  } else if (mode === 'moving' && movingStationId) {
    const result = moveStation(prototype, movingStationId, cell)
    if (result.ok) {
      prototype = result.value
      mode = 'idle'
      movingStationId = null
      feedbackKey = 'stationMoved'
    } else {
      feedbackKey = 'invalidDrop'
    }
  } else if (station) {
    mode = 'moving'
    movingStationId = station.id
    feedbackKey = null
  }
  renderPrototype()
}, (stationId, cell) => {
  if (processing || mode === 'placing') return
  if (!cell) {
    feedbackKey = 'invalidDrop'
  } else {
    const result = moveStation(prototype, stationId, cell)
    if (result.ok) {
      prototype = result.value
      mode = 'idle'
      movingStationId = null
      feedbackKey = 'stationMoved'
    } else {
      mode = 'moving'
      movingStationId = stationId
      feedbackKey = 'invalidDrop'
    }
  }
  renderPrototype()
}).then((view) => {
  board = view
  renderPrototype()
}).catch((error: unknown) => {
  boardReadout.textContent = translate(locale, 'boardError')
  console.error('Board initialization failed', error)
})
