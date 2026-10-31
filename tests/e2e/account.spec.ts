import { expect, test, type Page } from "@playwright/test";

const slug = "entretien-difficile-technicien-it";
const password = "parcours-local-12";

async function authPost(page: Page, path: string, data: Record<string, string>) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await page.request.post(path, {
      data,
      headers: { origin: "http://127.0.0.1:3000" },
    });
    if (response.status() === 429) {
      const retryAfter = Number(response.headers()["x-retry-after"] ?? "10");
      const seconds = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 10;
      await page.waitForTimeout(seconds * 1000);
      continue;
    }
    const body = await response.text();
    expect(response.ok(), `${response.status()} ${body.slice(0, 300)}`).toBeTruthy();
    return;
  }
  throw new Error(`Auth still rate-limited: ${path}`);
}

async function signUp(page: Page, email: string) {
  await authPost(page, "/api/auth/sign-up/email", { email, password, name: "Essai local" });
}

async function signIn(page: Page, email: string) {
  await authPost(page, "/api/auth/sign-in/email", { email, password });
}

test("two accounts stay isolated and a session can resume", async ({ page, browser }) => {
  const stamp = Date.now();
  const emailA = `sprint2-a-${stamp}@example.com`;
  const emailB = `sprint2-b-${stamp}@example.com`;

  await signUp(page, emailA);
  const created = await page.request.post("/api/v1/attempts", { data: { slug } });
  expect(created.status()).toBe(201);
  const body = (await created.json()) as { attempt: { id: string } };
  const attemptId = body.attempt.id;

  await page.goto("/compte");
  await expect(page.getByRole("heading", { name: "Compte", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Reprendre" })).toBeVisible();
  await expect(page.getByText("ne sont pas fusionnées")).toBeVisible();

  await page.request.post("/api/auth/sign-out", { headers: { origin: "http://127.0.0.1:3000" } });
  await signIn(page, emailA);
  await page.goto(`/demo/${slug}?attempt=${attemptId}`);
  await expect(page.getByRole("button", { name: "Continuer" })).toBeVisible();

  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await signUp(otherPage, emailB);
  expect((await otherPage.request.get(`/api/v1/attempts/${attemptId}`)).status()).toBe(404);
  expect((await otherPage.goto(`/demo/${slug}?attempt=${attemptId}`))?.status()).toBe(404);
  const foreignExport = await otherPage.request.get("/api/v1/account/export");
  expect(foreignExport.ok()).toBeTruthy();
  expect(await foreignExport.text()).not.toContain(attemptId);

  const ownExport = await page.request.get("/api/v1/account/export");
  expect(ownExport.ok()).toBeTruthy();
  expect(await ownExport.text()).toContain(attemptId);
  await other.close();
});
