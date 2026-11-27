import { expect, test } from "@playwright/test";

test("brand paper and transparent stickers ship with the app", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Tenho 16 anos ou mais.").check();
  await page.getByRole("button", { name: "Montar meu mural" }).click();
  await page.getByRole("button", { name: "Pular apresentação" }).click();
  await page.getByRole("button", { name: "Livre", exact: true }).click();
  await page.getByRole("button", { name: "Pular ajuda" }).click();
  const sheet = page.locator(".free-paper");
  await expect(sheet).toHaveCSS("background-image", /flores-creme\.webp/);
  const compact =
    (await page.locator(".book-shell").getAttribute("data-compact-mural")) ===
    "true";
  if (compact) {
    await sheet.click({ position: { x: 5, y: 5 } });
    await page.getByRole("button", { name: "Fundo", exact: true }).click();
  }
  const papers = page.locator(".brand-paper-grid");
  await expect(papers.getByRole("button")).toHaveCount(20);
  await papers
    .getByRole("button", { name: "Bolinhas lilás", exact: true })
    .click();
  await expect(sheet).toHaveCSS("background-image", /poa-lilas\.webp/);

  if (compact) {
    await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
    const mural = page.getByRole("link", { name: "Meu mural", exact: true });
    if (await mural.isVisible()) await mural.click();
  }
  await page.getByRole("button", { name: "Figurinhas", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Categoria" })
    .selectOption({ label: "Coleção da marca" });
  const choices = page.locator(".free-sticker-picker button");
  await expect(choices).toHaveCount(42);
  const tape = choices.filter({ hasText: "Fita xadrez rosa" });
  await tape.evaluate((button) => button.scrollIntoView({ block: "center" }));
  await tape.click({ timeout: 8000 });
  const sticker = page.getByRole("button", {
    name: "Figurinha: Fita xadrez rosa",
    exact: true,
  });
  await expect(sticker).toBeVisible();
  const box = (await sticker.boundingBox())!;
  expect(box.width).toBeGreaterThan(box.height * 2);
  const alpha = await sticker
    .locator("img")
    .evaluate(async (node: HTMLImageElement) => {
      await node.decode();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(node, 0, 0);
      return ctx.getImageData(0, 0, 1, 1).data[3];
    });
  expect(alpha).toBe(0);
  await page.reload();
  await expect(sheet).toHaveCSS("background-image", /poa-lilas\.webp/);
  await expect(sticker).toBeVisible();
});
