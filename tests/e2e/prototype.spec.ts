import { expect, test, type Locator, type Page } from '@playwright/test'

test.use({ locale: 'en-US' })

const CELL_SIZE = 72
const COLUMNS = 12
const ROWS = 8
const BOARD_PADDING = 24

async function cellCenter(page: Page, column: number, row: number) {
  const canvas = page.locator('#board-host canvas')
  const box = await canvas.boundingBox()
  expect(box).not.toBeNull()
  if (!box) throw new Error('Board canvas has no visible bounds')

  const scale = Math.max(
    0.5,
    Math.min(1, (box.width - BOARD_PADDING * 2) / (COLUMNS * CELL_SIZE), (box.height - BOARD_PADDING * 2) / (ROWS * CELL_SIZE)),
  )
  const offsetX = (box.width - COLUMNS * CELL_SIZE * scale) / 2
  const offsetY = (box.height - ROWS * CELL_SIZE * scale) / 2
  return {
    x: box.x + offsetX + (column + 0.5) * CELL_SIZE * scale,
    y: box.y + offsetY + (row + 0.5) * CELL_SIZE * scale,
  }
}

async function dragPointer(page: Page, source: Locator, destination: { x: number; y: number }) {
  const box = await source.boundingBox()
  expect(box).not.toBeNull()
  if (!box) throw new Error('Drag source has no visible bounds')

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(destination.x, destination.y, { steps: 10 })
  await page.mouse.up()
}

async function openPrototype(page: Page) {
  await page.addInitScript(() => localStorage.removeItem('wasl.language'))
  await page.goto('/')
  await expect(page.locator('#board-host canvas')).toBeVisible()
  await expect(page.locator('#cash-value')).toHaveAttribute('data-value', '200')
  await expect(page.locator('#trust-value')).toHaveAttribute('data-value', '0')
}

test('guides the first action and labels future features in English and Arabic', async ({ page }) => {
  await openPrototype(page)

  const starterLabel = page.locator('#starter-station-label')
  const modeHint = page.locator('#mode-hint')
  const futureTeamBadges = page.locator('.future-team .future-badge')
  const futureHudValues = page.locator('.hud strong[data-prototype="future"]')

  await expect(starterLabel).toBeVisible()
  await expect(starterLabel).toHaveText('Product station')
  await expect(modeHint).toHaveText('Drag the +50 card to the turquoise Product station.')
  await expect(futureTeamBadges).toHaveCount(2)
  await expect(futureTeamBadges).toHaveText(['Later', 'Later'])
  await expect(futureHudValues).toHaveCount(3)
  await expect(futureHudValues).toHaveText(['Later', 'Later', 'Later'])

  await page.locator('#buy-product').click()
  await expect(modeHint).toHaveText('Click an empty board cell to place the station')
  await page.locator('#cancel-action').click()

  await page.getByRole('button', { name: 'Switch to Arabic' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
  await expect(starterLabel).toBeVisible()
  await expect(starterLabel).toHaveText('محطة المنتج')
  await expect(modeHint).toHaveText('اسحب بطاقة +50 إلى محطة المنتج الفيروزية.')
  await expect(futureTeamBadges).toHaveText(['لاحقًا', 'لاحقًا'])
  await expect(futureHudValues).toHaveText(['لاحقًا', 'لاحقًا', 'لاحقًا'])

  await page.locator('#buy-product').click()
  await expect(modeHint).toHaveText('انقر خلية فارغة في اللوحة لوضع المحطة')
})

test('buys a Product station and places it on an open board cell', async ({ page }) => {
  await openPrototype(page)

  await page.locator('#buy-product').click()
  await expect(page.locator('#mode-hint')).toBeVisible()
  const openCell = await cellCenter(page, 7, 4)
  await page.mouse.click(openCell.x, openCell.y)

  await expect(page.locator('#cash-value')).toHaveAttribute('data-value', '100')
  await expect(page.locator('#prototype-feedback')).toContainText(/placed/i)
  await expect(page.locator('#delivery-preview')).toBeEmpty()
})

test('first delivery pays with the adjacent station bonus and produces a referral', async ({ page }) => {
  await openPrototype(page)

  await page.locator('#buy-product').click()
  const adjacentCell = await cellCenter(page, 7, 4)
  await page.mouse.click(adjacentCell.x, adjacentCell.y)
  await expect(page.locator('#cash-value')).toHaveAttribute('data-value', '100')

  await dragPointer(page, page.locator('#opportunity-card'), adjacentCell)
  await expect(page.locator('#cash-value')).toHaveAttribute('data-value', '155')
  await expect(page.locator('#trust-value')).toHaveAttribute('data-value', '1')
  await expect(page.locator('#opportunity-card')).toBeVisible()
  await expect(page.locator('#opportunity-card .card-kicker')).toHaveText('Customer referral')
  await expect(page.locator('#opportunity-value')).toHaveText('40')
})

test('bounds referrals to one: deliver, receive referral, deliver it, then retry', async ({ page }) => {
  await openPrototype(page)

  await page.locator('#buy-product').click()
  const stationCell = await cellCenter(page, 7, 4)
  await page.mouse.click(stationCell.x, stationCell.y)
  await expect(page.locator('#cash-value')).toHaveAttribute('data-value', '100')

  await dragPointer(page, page.locator('#opportunity-card'), stationCell)
  await expect(page.locator('#cash-value')).toHaveAttribute('data-value', '155')
  await expect(page.locator('#trust-value')).toHaveAttribute('data-value', '1')
  // The card remains unavailable during delivery and the Pixi trail; its DOM
  // state marks arrival once the bounded effect finishes.
  await expect(page.locator('#opportunity-card')).toBeVisible()
  await expect(page.locator('#opportunity-card .card-kicker')).toHaveText('Customer referral')
  await expect(page.locator('#opportunity-value')).toHaveText('40')
  await expect(page.locator('#prototype-feedback')).toContainText(/referral arrived/i)

  await dragPointer(page, page.locator('#opportunity-card'), stationCell)
  await expect(page.locator('#cash-value')).toHaveAttribute('data-value', '200')
  await expect(page.locator('#trust-value')).toHaveAttribute('data-value', '2')
  await expect(page.locator('#prototype-feedback')).toContainText(/delivered/i)
  await expect(page.locator('#opportunity-card')).toBeHidden()
  await expect(page.locator('#retry-prototype')).toBeVisible()

  // Retry is available only after the referral has been consumed and no next
  // referral is pending, so no timed observation is needed here.
  await page.locator('#retry-prototype').click()
  await expect(page.locator('#cash-value')).toHaveAttribute('data-value', '200')
  await expect(page.locator('#trust-value')).toHaveAttribute('data-value', '0')
  await expect(page.locator('#opportunity-card')).toBeVisible()
  await expect(page.locator('#opportunity-value')).toHaveText('50')
  await expect(page.locator('#retry-prototype')).toBeHidden()
})

test('invalid opportunity drops snap back without a reward', async ({ page }) => {
  await openPrototype(page)

  const emptyCell = await cellCenter(page, 7, 4)
  await dragPointer(page, page.locator('#opportunity-card'), emptyCell)

  await expect(page.locator('#cash-value')).toHaveAttribute('data-value', '200')
  await expect(page.locator('#trust-value')).toHaveAttribute('data-value', '0')
  await expect(page.locator('#prototype-feedback')).toContainText(/open space|drop onto a product station/i)
  await expect(page.locator('#opportunity-card')).toBeVisible()
  await expect(page.locator('#delivery-preview')).toBeEmpty()
})

test('blocks placement on an occupied cell without charging for another station', async ({ page }) => {
  await openPrototype(page)

  const occupiedCell = await cellCenter(page, 7, 4)
  await page.locator('#buy-product').click()
  await page.mouse.click(occupiedCell.x, occupiedCell.y)
  await expect(page.locator('#cash-value')).toHaveAttribute('data-value', '100')

  await page.locator('#buy-product').click()
  await page.mouse.click(occupiedCell.x, occupiedCell.y)

  await expect(page.locator('#cash-value')).toHaveAttribute('data-value', '100')
  await expect(page.locator('#mode-hint')).toBeVisible()
  await expect(page.locator('#prototype-feedback')).toContainText(/open space/i)
})

test('cancels purchase mode without placing or charging', async ({ page }) => {
  await openPrototype(page)

  await page.locator('#buy-product').click()
  await expect(page.locator('#mode-hint')).toBeVisible()
  await page.locator('#cancel-action').click()

  await expect(page.locator('#cancel-action')).toBeHidden()
  await expect(page.locator('#cash-value')).toHaveAttribute('data-value', '200')
  const openCell = await cellCenter(page, 7, 4)
  await page.mouse.click(openCell.x, openCell.y)
  await expect(page.locator('#cash-value')).toHaveAttribute('data-value', '200')
})

test('moves a station by clicking its old and new cells without changing cash', async ({ page }) => {
  await openPrototype(page)

  await page.locator('#buy-product').click()
  const originalCell = await cellCenter(page, 7, 4)
  const destinationCell = await cellCenter(page, 8, 4)
  await page.mouse.click(originalCell.x, originalCell.y)
  await expect(page.locator('#cash-value')).toHaveAttribute('data-value', '100')

  await page.mouse.click(originalCell.x, originalCell.y)
  await expect(page.locator('#mode-hint')).toHaveText('Move station')
  await page.mouse.click(destinationCell.x, destinationCell.y)

  await expect(page.locator('#cash-value')).toHaveAttribute('data-value', '100')
  await expect(page.locator('#mode-hint')).toContainText(/drag.*turquoise Product station/i)
  await expect(page.locator('#prototype-feedback')).toContainText(/moved/i)
})

test('moves a station by dragging it to an open cell without changing cash', async ({ page }) => {
  await openPrototype(page)

  const originalCell = await cellCenter(page, 6, 4)
  const destinationCell = await cellCenter(page, 8, 4)
  await page.mouse.move(originalCell.x, originalCell.y)
  await page.mouse.down()
  await page.mouse.move(destinationCell.x, destinationCell.y, { steps: 10 })
  await page.mouse.up()

  await expect(page.locator('#cash-value')).toHaveAttribute('data-value', '200')
  await expect(page.locator('#prototype-feedback')).toContainText(/moved/i)
})

test('switches language without losing prototype state', async ({ page }) => {
  await openPrototype(page)

  await page.locator('#buy-product').click()
  const adjacentCell = await cellCenter(page, 7, 4)
  await page.mouse.click(adjacentCell.x, adjacentCell.y)
  await dragPointer(page, page.locator('#opportunity-card'), adjacentCell)
  await expect(page.locator('#cash-value')).toHaveAttribute('data-value', '155')
  await expect(page.locator('#trust-value')).toHaveAttribute('data-value', '1')
  await expect(page.locator('#opportunity-card .card-kicker')).toHaveText('Customer referral')
  await expect(page.locator('#opportunity-value')).toHaveText('40')

  await page.getByRole('button', { name: 'Switch to Arabic' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
  await expect(page.locator('#cash-value')).toHaveAttribute('data-value', '155')
  await expect(page.locator('#trust-value')).toHaveAttribute('data-value', '1')
  await expect(page.locator('#opportunity-card .card-kicker')).toHaveText('إحالة عميل')

  await page.getByRole('button', { name: 'التبديل إلى الإنجليزية' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('#cash-value')).toHaveAttribute('data-value', '155')
  await expect(page.locator('#trust-value')).toHaveAttribute('data-value', '1')
})
