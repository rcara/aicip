import { expect, test } from "@playwright/test";

async function settled(page: import("@playwright/test").Page, panelText: string) {
  const panel = page.locator("section[aria-live='polite']");
  await expect
    .poll(async () => {
      const loading = await page.getByRole("status").count();
      const text = await panel.innerText();
      return loading === 0 && text !== panelText;
    })
    .toBe(true);
}

async function playUntilDebrief(page: import("@playwright/test").Page, option: 0 | 1) {
  const panel = page.locator("section[aria-live='polite']");
  for (let step = 0; step < 12; step += 1) {
    const debrief = page.getByRole("heading", { name: "Débriefing" });
    const continueButton = page.getByRole("button", { name: "Continuer" });
    const choice = page.getByRole("radio").nth(option);
    await expect(debrief.or(continueButton).or(choice)).toBeVisible();
    if (await debrief.isVisible()) return;
    const before = await panel.innerText();
    if (await continueButton.isVisible()) {
      await continueButton.click();
      await settled(page, before);
      continue;
    }
    await choice.check();
    await page.getByRole("button", { name: "Valider ce choix" }).click();
    await settled(page, before);
    await expect(page.getByRole("radio")).toHaveCount(0);
  }
  throw new Error("La simulation ne s'est pas terminée.");
}

test("landing, full simulation, replay and original remain", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("entretien difficile");
  await page.getByRole("link", { name: "Démarrer la démo" }).click();
  await page.getByRole("button", { name: "Commencer l'entretien" }).click();
  await playUntilDebrief(page, 0);
  await expect(page.locator("[data-indicator='current']").first()).toHaveText("66");

  await page.reload();
  await expect(page.getByRole("heading", { name: "Débriefing" })).toBeVisible();
  await expect(page.locator("[data-indicator='current']").first()).toHaveText("66");

  await page.getByRole("button", { name: /Rejouer depuis cette décision/ }).first().click();
  await expect(page.getByRole("radio").first()).toBeVisible();
  await page.getByRole("radio").first().focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("radio").nth(1)).toBeChecked();
  await playUntilDebrief(page, 1);
  await expect(page.locator("[data-indicator='parent']")).toHaveText("66");
  await expect(page.locator("[data-indicator='current']").last()).toHaveText("11");

  await page.getByRole("link", { name: "Tentative d'origine" }).click();
  await expect(page.locator("[data-indicator='current']").first()).toHaveText("66");
});

test("mobile landing does not overflow and admin is closed", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(overflows).toBe(false);
  const response = await page.goto("/admin");
  expect(response?.status()).toBe(404);
});

test("unknown scenario shows the empty route", async ({ page }) => {
  const response = await page.goto("/scenarios/scenario-inexistant");
  expect(response?.status()).toBe(404);
});
