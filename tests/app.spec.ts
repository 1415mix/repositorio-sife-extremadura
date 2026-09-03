import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const viewport of [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 1000 }
]) {
  test(`${viewport.name}: navegación y diseño`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/#inicio");
    await expect(page.getByRole("heading", { name: "La normativa SIFE, ordenada para poder usarla" })).toBeVisible();
    await page.getByRole("link", { name: "Repositorio", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Repositorio documental" })).toBeVisible();
    await page.getByLabel("Buscar en el catálogo").fill("Decreto 69/2007");
    await expect(page.getByText("3 resultados", { exact: false })).toBeVisible();
    await page.getByRole("button", { name: "Ver ficha trazable" }).first().click();
    await expect(page.getByRole("dialog")).toContainText("Decreto 69/2007");
    await page.getByRole("button", { name: "Cerrar ficha" }).click();
  });
}

test("secciones principales y procedimientos", async ({ page }) => {
  await page.goto("/#procedimientos");
  await expect(page.getByRole("heading", { name: "Procedimientos prácticos" })).toBeVisible();
  await page.getByLabel("Buscar procedimiento").fill("sexenio");
  await expect(page.getByText("1 procedimientos")).toBeVisible();
  await page.getByText("Comprobar el complemento de formación permanente").click();
  await expect(page.getByText("Pasos", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Relaciones", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Mapa de relaciones" })).toBeVisible();
  await page.getByRole("link", { name: "Vigencia y cautelas", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Vigencia y cautelas" })).toBeVisible();
});

test("marca SIFE y búsqueda global", async ({ page }) => {
  await page.goto("/#inicio");
  await expect(page.getByRole("img", { name: "Servicio de Innovación, Formación del Profesorado y Emprendimiento" })).toHaveAttribute("src", "/brand/sife-logo.png");
  await page.keyboard.press("Control+k");
  await expect(page.getByLabel("Buscar normativa")).toBeFocused();
  await page.getByLabel("Buscar normativa").fill("Decreto 69/2007");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Repositorio documental" })).toBeVisible();
  await expect(page.getByLabel("Buscar en el catálogo")).toHaveValue("Decreto 69/2007");
  await expect(page.getByText("3 resultados", { exact: false })).toBeVisible();
});

test("Informe maestro: cobertura, filtro y ficha auditada", async ({ page }) => {
  await page.goto("/#repositorio");
  await expect(page.getByLabel("Cobertura del Informe maestro SIFE")).toContainText("47 referencias");
  await expect(page.getByLabel("Cobertura del Informe maestro SIFE")).toContainText("38 con PDF oficial preservado");
  await page.getByRole("button", { name: "Ver las 47 referencias" }).click();
  await expect(page.getByText("47 resultados", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Colección")).toHaveValue("master");
  await page.getByLabel("Buscar en el catálogo").fill("ES-02");
  await expect(page.getByText("1 resultado", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Ver ficha trazable" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Informe maestro");
  await expect(dialog).toContainText("ES-02 · cola C");
  await expect(dialog).toContainText("Clasificación corregida");
  await expect(dialog.getByRole("link", { name: "Copia preservada" })).toBeVisible();
});

test("tokens esenciales del sistema de diseño", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#inicio");
  const tokens = await page.evaluate(() => {
    const hero = getComputedStyle(document.querySelector(".hero h1")!);
    const button = getComputedStyle(document.querySelector(".button.primary")!);
    const search = getComputedStyle(document.querySelector(".global-search")!);
    const card = getComputedStyle(document.querySelector(".access-card")!);
    return {
      heroSize: hero.fontSize,
      heroLine: hero.lineHeight,
      headingFont: hero.fontFamily,
      buttonHeight: button.minHeight,
      buttonRadius: button.borderRadius,
      searchHeight: search.height,
      cardRadius: card.borderRadius
    };
  });
  expect(tokens).toEqual({
    heroSize: "40px",
    heroLine: "48px",
    headingFont: expect.stringContaining("Plus Jakarta Sans"),
    buttonHeight: "42px",
    buttonRadius: "6px",
    searchHeight: "40px",
    cardRadius: "8px"
  });
});

test("sin infracciones axe automáticas en inicio y repositorio", async ({ page }) => {
  for (const hash of ["inicio", "repositorio", "asistente", "procedimientos", "relaciones", "cautelas"]) {
    await page.goto(`/#${hash}`);
    await expect(page.locator("main h1")).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  }
});

test("navegación por teclado y uso offline", async ({ page, context }) => {
  await page.goto("/#inicio");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Saltar al contenido principal" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "La normativa SIFE, ordenada para poder usarla" })).toBeVisible();
  await context.setOffline(false);
});
