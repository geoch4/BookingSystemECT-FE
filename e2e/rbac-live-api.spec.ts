import { expect, test } from '@playwright/test';

const apiUrl = process.env.RBAC_LIVE_API;
const token = process.env.RBAC_LIVE_TOKEN;
test.skip(!apiUrl || !token, 'Requires the isolated SQL/HTTP test host.');

test.beforeEach(async ({ page }) => {
  await page.route('**://*/api/**', async route => {
    const original = new URL(route.request().url());
    const response = await route.fetch({ url: apiUrl + original.pathname + original.search });
    await route.fulfill({ response });
  });
  await page.addInitScript(value => { if (location.pathname !== '/login') sessionStorage.setItem('authToken', value!); }, token);
});

test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
});

test('signed medical account sees its SQL-backed referral and receives 403 for administration', async ({ page }) => {
  await page.goto('/remissko');
  await expect(page.getByRole('heading', { name: 'Remisskö', exact: true })).toBeVisible();
  await expect(page.getByText('Synthetic A', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Synthetic B', { exact: true })).toHaveCount(0);
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Du saknar behörighet' })).toBeVisible();
});

test('actual HTTP rejection clears an invalid token in the browser', async ({ page }) => {
  await page.addInitScript(value => { if (location.pathname !== '/login') sessionStorage.setItem('authToken', value + 'tampered'); }, token);
  await page.goto('/remissko');
  await expect(page).toHaveURL(/\/login/);
  expect(await page.evaluate(() => sessionStorage.getItem('authToken'))).toBeNull();
});

test('logout revokes a copied token on the actual server', async ({ page, request }) => {
  await page.goto('/remissko');
  await expect(page.getByText('Synthetic A', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: /Logga ut/ }).click();
  await expect(page).toHaveURL(/\/login/);
  expect(await page.evaluate(() => sessionStorage.getItem('authToken'))).toBeNull();
  const response = await request.get(`${apiUrl}/api/referrals/queue`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.status()).toBe(401);
});
