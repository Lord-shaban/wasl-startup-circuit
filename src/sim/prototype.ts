import { GRID_COLUMNS, GRID_ROWS, type Cell } from './board-types'

export const PRODUCT_STATION_COST = 100
export const ADJACENCY_BONUS = 5

export interface ProductStation {
  readonly id: string
  readonly cell: Cell
}

export interface PrototypeOpportunity {
  readonly id: string
  readonly value: number
  readonly status: 'available' | 'delivered'
}

export interface PrototypeState {
  readonly cash: number
  readonly trust: number
  readonly opportunity: PrototypeOpportunity
  readonly stations: readonly ProductStation[]
  readonly nextStationId: number
  readonly referralBudget: number
  readonly referralPending: { readonly sourceStationId: string; readonly fromOpportunityId: string } | null
}

export type RuleResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly reason: string }

export interface DeliveryPreview {
  readonly basePayout: number
  readonly adjacencyBonus: number
  readonly payout: number
}

const CENTER_CELL: Cell = { column: Math.floor(GRID_COLUMNS / 2), row: Math.floor(GRID_ROWS / 2) }

export function createPrototypeState(): PrototypeState {
  return {
    cash: PRODUCT_STATION_COST * 2,
    trust: 0,
    opportunity: { id: 'opportunity-1', value: 50, status: 'available' },
    stations: [{ id: 'product-1', cell: CENTER_CELL }],
    nextStationId: 2,
    referralBudget: 1,
    referralPending: null,
  }
}

function isInsideGrid(cell: Cell): boolean {
  return Number.isInteger(cell.column) && Number.isInteger(cell.row)
    && cell.column >= 0 && cell.column < GRID_COLUMNS
    && cell.row >= 0 && cell.row < GRID_ROWS
}

function sameCell(left: Cell, right: Cell): boolean {
  return left.column === right.column && left.row === right.row
}

function reject<T>(reason: string): RuleResult<T> {
  return { ok: false, reason }
}

export function canPlaceStation(state: Readonly<PrototypeState>, cell: Cell): RuleResult<true> {
  if (!isInsideGrid(cell)) return reject('Cell is outside the grid')
  if (state.stations.some((station) => sameCell(station.cell, cell))) return reject('Cell is occupied')
  if (state.cash < PRODUCT_STATION_COST) return reject('Not enough cash')
  return { ok: true, value: true }
}

export function placeProductStation(
  state: PrototypeState,
  cell: Cell,
): RuleResult<PrototypeState> {
  const placement = canPlaceStation(state, cell)
  if (!placement.ok) return placement
  const station: ProductStation = {
    id: `product-${state.nextStationId}`,
    cell: { column: cell.column, row: cell.row },
  }
  return {
    ok: true,
    value: {
      ...state,
      cash: state.cash - PRODUCT_STATION_COST,
      stations: [...state.stations, station],
      nextStationId: state.nextStationId + 1,
    },
  }
}

export function moveStation(
  state: PrototypeState,
  stationId: string,
  cell: Cell,
): RuleResult<PrototypeState> {
  const station = state.stations.find((candidate) => candidate.id === stationId)
  if (!station) return reject('Station not found')
  if (!isInsideGrid(cell)) return reject('Cell is outside the grid')
  if (state.stations.some((candidate) => candidate.id !== stationId && sameCell(candidate.cell, cell))) {
    return reject('Cell is occupied')
  }
  return {
    ok: true,
    value: {
      ...state,
      stations: state.stations.map((candidate) => candidate.id === stationId
        ? { ...candidate, cell: { column: cell.column, row: cell.row } }
        : candidate),
    },
  }
}

export function deliveryPreview(
  state: Readonly<PrototypeState>,
  stationId: string,
): RuleResult<DeliveryPreview> {
  const station = state.stations.find((candidate) => candidate.id === stationId)
  if (!station) return reject('Station not found')
  if (state.opportunity.status !== 'available') return reject('Opportunity already delivered')
  const adjacent = state.stations.some((candidate) => candidate.id !== stationId
    && Math.abs(candidate.cell.column - station.cell.column)
      + Math.abs(candidate.cell.row - station.cell.row) === 1)
  const adjacencyBonus = adjacent ? ADJACENCY_BONUS : 0
  return {
    ok: true,
    value: {
      basePayout: state.opportunity.value,
      adjacencyBonus,
      payout: state.opportunity.value + adjacencyBonus,
    },
  }
}

export function deliverOpportunity(
  state: PrototypeState,
  opportunityId: string,
  stationId: string,
): RuleResult<PrototypeState> {
  if (opportunityId !== state.opportunity.id) return reject('Opportunity not found')
  const preview = deliveryPreview(state, stationId)
  if (!preview.ok) return preview
  return {
    ok: true,
    value: {
      ...state,
      cash: state.cash + preview.value.payout,
      trust: state.trust + 1,
      opportunity: { ...state.opportunity, status: 'delivered' },
      referralBudget: state.referralBudget > 0 ? state.referralBudget - 1 : state.referralBudget,
      referralPending: state.referralBudget > 0
        ? { sourceStationId: stationId, fromOpportunityId: opportunityId }
        : state.referralPending,
    },
  }
}

export function spawnPendingReferral(state: PrototypeState): RuleResult<PrototypeState> {
  if (!state.referralPending) return reject('No pending referral')
  if (state.opportunity.status !== 'delivered') return reject('Current opportunity is not delivered')
  return {
    ok: true,
    value: {
      ...state,
      opportunity: { id: 'referral-1', value: 40, status: 'available' },
      referralPending: null,
    },
  }
}
