import { test, expect } from '@playwright/test';

test.describe('Queue Join & Live Position Flow', () => {
  test('customer completes booking and sees live queue position', async ({
    page,
  }) => {
    await page.goto('/en/b/pedros-barbershop');

    // Select service and slot
    await page.click('text=Haircut');
    await page.click('button:has-text("09:00 AM")');

    // Fill form
    await page.fill('input[name="customerName"]', 'Juan Dela Cruz');
    await page.fill('input[name="customerPhone"]', '09171234567');
    await page.click('button[type="submit"]');

    // Assert land on confirm page with position card
    await expect(page).toHaveURL(/\/confirm\?booking=/);
    await expect(page.locator('text=Your Queue Number')).toBeVisible();
    await expect(page.locator('text=#1')).toBeVisible();
  });
});
