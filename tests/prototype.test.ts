import { describe, expect, it } from 'vitest'
import {
  ADJACENCY_BONUS,
  PRODUCT_STATION_COST,
  canPlaceStation,
  createPrototypeState,
  deliverOpportunity,
  deliveryPreview,
  moveStation,
  placeProductStation,
} from '../src/sim/prototype'

describe('prototype rules', () => {
  it('creates a centered station, available opportunity, and budget for one purchase', () => {
    const state = createPrototypeState()
    expect(state.stations).toHaveLength(1)
    expect(state.stations[0].cell).toEqual({ column: 6, row: 4 })
    expect(state.opportunity.status).toBe('available')
    expect(state.cash).toBeGreaterThanOrEqual(PRODUCT_STATION_COST)
  })

  it('rejects out-of-grid and occupied placement, and charges once on success', () => {
    const state = createPrototypeState()
    expect(canPlaceStation(state, { column: -1, row: 0 }).ok).toBe(false)
    expect(canPlaceStation(state, state.stations[0].cell).ok).toBe(false)

    const result = placeProductStation(state, { column: 0, row: 0 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.cash).toBe(state.cash - PRODUCT_STATION_COST)
    expect(result.value.stations).toHaveLength(2)
    expect(state.cash).toBe(PRODUCT_STATION_COST * 2)
  })

  it('moves a station without changing cash and rejects overlap', () => {
    const state = createPrototypeState()
    const purchase = placeProductStation(state, { column: 0, row: 0 })
    if (!purchase.ok) throw new Error(purchase.reason)
    const moved = moveStation(purchase.value, 'product-1', { column: 5, row: 4 })
    expect(moved.ok).toBe(true)
    if (!moved.ok) return
    expect(moved.value.stations[0].cell).toEqual({ column: 5, row: 4 })
    expect(moved.value.cash).toBe(purchase.value.cash)
    expect(moveStation(moved.value, 'product-1', { column: 0, row: 0 }).ok).toBe(false)
  })

  it('shows the adjacency bonus and pays an opportunity exactly once', () => {
    const state = createPrototypeState()
    const purchase = placeProductStation(state, { column: 0, row: 0 })
    if (!purchase.ok) throw new Error(purchase.reason)
    const neighbor = moveStation(purchase.value, 'product-2', { column: 7, row: 4 })
    if (!neighbor.ok) throw new Error(neighbor.reason)

    const preview = deliveryPreview(neighbor.value, 'product-1')
    expect(preview.ok).toBe(true)
    if (!preview.ok) return
    expect(preview.value.adjacencyBonus).toBe(ADJACENCY_BONUS)
    expect(preview.value.payout).toBe(preview.value.basePayout + ADJACENCY_BONUS)

    const result = deliverOpportunity(neighbor.value, 'opportunity-1', 'product-1')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.cash).toBe(neighbor.value.cash + preview.value.payout)
    expect(result.value.trust).toBe(neighbor.value.trust + 1)
    const duplicate = deliverOpportunity(result.value, 'opportunity-1', 'product-1')
    expect(duplicate.ok).toBe(false)
    if (!duplicate.ok) expect(duplicate.reason).toMatch(/already delivered/i)
    expect(result.value.cash).toBe(neighbor.value.cash + preview.value.payout)
  })
})
