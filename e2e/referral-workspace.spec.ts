import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: '1', role: 'Admin', name: 'Test Admin', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  await page.addInitScript(token => sessionStorage.setItem('authToken', token), `${header}.${payload}.test`);
  await page.route('**://*/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = [];
    if (path === '/api/booking') data = [1, 2].map(id => ({
      bookingId: id, patientId: id, treatmentType: 1, priority: id === 1 ? 2 : 0, status: 0,
      date: '2026-10-23T09:00:00', createdAt: '2026-10-20T08:00:00', createdById: 1,
      referralDepartment: 'Avdelning 361', departmentId: 'Avdelning 361', treatmentUnitId: 'Testenhet',
      referralContactName: 'Kontakt Test', departmentPriority: 1,
    }));
    if (path === '/api/patients') data = [1, 2].map(id => ({ patientId: id, fullName: id === 1 ? 'Anna UX Test' : 'Johan UX Test', socialSecurityNumber: `DEMO-${id}` }));
    await route.fulfill({ json: data });
  });
  await page.goto('/remissko');
});

test('patient list, logistics and action form keep the selected patient context', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Anna UX Test' })).toBeVisible();
  for (const tab of ['Underlag', 'Logistik', 'Historik']) {
    await page.getByRole('tab', { name: tab }).click();
    await expect(page.getByRole('heading', { name: 'Anna UX Test' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Viktiga varningar' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Begär komplettering' })).toBeVisible();
  }
  await page.getByRole('tab', { name: 'Logistik' }).click();
  await expect(page.getByRole('tabpanel', { name: 'Logistik' }).getByText('Kontakt Test')).toBeVisible();
  await page.screenshot({ path: 'outputs/remissko-implementerad-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Begär komplettering' }).click();
  await expect(page.getByLabel('Kommentar *', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Avbryt', exact: true }).click();
  await page.getByRole('button', { name: 'Visa remiss för Johan UX Test' }).click();
  await expect(page.getByRole('heading', { name: 'Johan UX Test' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Översikt' })).toHaveAttribute('aria-selected', 'true');
  await page.getByLabel('Hitta en patient').fill('no-such-patient');
  await expect(page.getByRole('heading', { name: 'Johan UX Test' })).toHaveCount(0);
});

test('workspace reflows at mobile width and tabs remain keyboard accessible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('tab', { name: 'Översikt' }).focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Logistik' })).toBeFocused();
  await expect(page.getByRole('tabpanel', { name: 'Logistik' })).toBeVisible();
  await page.getByRole('button', { name: 'Öppna navigation' }).click();
  await expect(page.getByRole('complementary', { name: 'Sidopanel' })).toBeVisible();
  await page.getByRole('button', { name: 'Stäng meny' }).click();
  await expect(page.getByRole('complementary', { name: 'Sidopanel' })).toBeHidden();
  const layout = await page.locator('.referral-workspace').evaluate(element => {
    const boundary = element.getBoundingClientRect();
    return { width: element.clientWidth, content: element.scrollWidth,
      overflow: Array.from(element.querySelectorAll('*')).filter(child => {
        const rect = child.getBoundingClientRect(); return rect.width && rect.right > boundary.right + 1;
      }).map(child => ({ tag: child.tagName, class: child.className, text: child.textContent?.slice(0, 60), width: child.getBoundingClientRect().width })) };
  });
  expect(layout.content, JSON.stringify(layout)).toBeLessThanOrEqual(layout.width);
  await page.screenshot({ path: 'outputs/remissko-implementerad-mobil.png', fullPage: true });
});
