import { expect, test } from '@playwright/test';

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByPlaceholder('namn@vgregion.se').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.locator('form').getByRole('button', { name: /sign in|logga in/i }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

test.describe('Rollstyrda huvudflöden', () => {
  test.beforeEach(async ({ page }) => {
    // These browser tests exercise development demo roles; live JWT/SQL controls
    // are verified independently by the backend HTTP suite.
    await page.route('**://*/api/**', route => {
      if (new URL(route.request().url()).pathname.endsWith('/auth/login')) {
        const email = route.request().postDataJSON().email as string;
        const role = email === 'avdelning@test.se' ? 'Avdelning' : 'Behandlingsenhet';
        const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
        const payload = Buffer.from(JSON.stringify({ sub: '1', email, name: 'Synthetic browser user', role,
          care_unit: role === 'Avdelning' ? 'Avdelning 361' : 'ECT-enhet', exp: Math.floor(Date.now() / 1000) + 3600,
        })).toString('base64url');
        return route.fulfill({ status: 200, json: { success: true, data: `${header}.${payload}.test` } });
      }
      return route.fulfill({ status: 200, json: [] });
    });
  });
  test('avdelning kan öppna ECT och rTMS från startsidan', async ({ page }) => {
    await login(page, 'avdelning@test.se', 'Avdelning123!');

    await expect(page.getByRole('heading', { name: 'Avdelningsportal' })).toBeVisible();

    await page.getByRole('button', { name: 'Öppna ECT' }).click();
    await expect(page).toHaveURL(/\/dashboard\?module=ect/);
    await expect(page.getByRole('heading', { name: 'Huvudåtgärder i ECT' })).toBeVisible();

    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.getByRole('button', { name: 'Öppna rTMS' }).click();
    await expect(page).toHaveURL(/\/rtms\?module=rtms/);
    await expect(page.getByRole('heading', { name: 'Huvudåtgärder i rTMS' })).toBeVisible();
  });

  test('behandlingsenhet kan nå remisskö', async ({ page }) => {
    await login(page, 'behandling@test.se', 'Behandling123!');

    await page.getByRole('button', { name: /Prioriteringslista Fånga upp/ }).click();
    await expect(page).toHaveURL(/\/remissko/);
    await expect(page.getByRole('heading', { name: 'Remisskö' })).toBeVisible();
  });

  test('avdelning får 403 från admin-remisskö', async ({ page }) => {
    await login(page, 'avdelning@test.se', 'Avdelning123!');

    await page.goto('/admin-referrals');
    await expect(page.getByRole('heading', { name: 'Du saknar behörighet' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Remisskö' })).toHaveCount(0);
  });

  test('nekad serverinloggning rensar sessionen och skickar användaren till login', async ({ page }) => {
    await login(page, 'avdelning@test.se', 'Avdelning123!');
    await page.route('**/api/booking', route => route.fulfill({ status: 401, json: { message: 'Inloggningen har återkallats.' } }));
    await page.goto('/mina-patienter');
    await expect(page).toHaveURL(/\/login/);
    expect(await page.evaluate(() => sessionStorage.getItem('authToken'))).toBeNull();
  });
});
