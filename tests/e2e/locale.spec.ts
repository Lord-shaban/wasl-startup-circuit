import { expect, test } from '@playwright/test'

test.use({ locale: 'en-US' })

test('switches English and Arabic without reloading the board', async ({ page }) => {
  await page.goto('/')
  const canvas = page.locator('#board-host canvas')
  await expect(canvas).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { name: 'Build a company that comes alive.' })).toBeVisible()

  await page.getByRole('button', { name: 'Switch to Arabic' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.getByRole('heading', { name: 'ابنِ شركة تنبض بالحياة.' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'معاينة لوحة الشركة' }).locator('canvas')).toBeVisible()
  await expect(page.locator('#board-readout')).toContainText('التكبير')

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
  await page.getByRole('button', { name: 'التبديل إلى الإنجليزية' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
})
