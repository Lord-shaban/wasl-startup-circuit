import { expect, test } from '@playwright/test'

for (const viewport of [{ width: 1280, height: 720 }, { width: 800, height: 600 }]) {
  test(`board pointer alignment at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.setViewportSize(viewport)
    await page.goto('/')

    const canvas = page.locator('#board-host canvas')
    await expect(canvas).toBeVisible()
    await expect(page.locator('#board-readout')).toContainText('Zoom')
    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()
    if (!box) return

    const point = { x: box.x + box.width / 2 - 18, y: box.y + box.height / 2 - 10 }
    await page.mouse.move(point.x, point.y)
    const readout = page.locator('#board-readout')
    await expect(readout).toContainText(/^Cell \d+, \d+ · Zoom \d+%$/)
    const before = await readout.innerText()
    const cell = before.split(' · ')[0]

    await page.mouse.wheel(0, -120)
    await expect.poll(() => readout.innerText()).not.toBe(before)
    await expect(readout).toContainText(cell)
    expect(errors).toEqual([])
  })
}
