import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs/promises";

async function checkDrag(
  page: Page,
  name: string,
  target: { left: number; top: number },
  touch: boolean,
  offset = -2,
) {
  const moving = page.getByRole("button", { name, exact: true });
  const bounds = (await moving.boundingBox())!;
  const paper = (await page.locator(".free-paper").boundingBox())!;
  const x = Math.round(bounds.x + bounds.width / 2);
  const y = Math.round(bounds.y + bounds.height / 2);
  const endX = Math.round(x + (paper.x + target.left - bounds.x) + offset);
  const endY = Math.round(y + (paper.y + target.top - bounds.y) + offset);

  const session = touch ? await page.context().newCDPSession(page) : null;
  if (session) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: endX, y: endY }],
    });
  } else {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 8 });
  }
  await expect(
    page.locator('.book-alignment-guide[data-axis="x"]'),
  ).toBeVisible();
  await expect(
    page.locator('.book-alignment-guide[data-axis="y"]'),
  ).toBeVisible();
  if (session) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await session.detach();
  } else {
    await page.mouse.up();
  }
  await expect(page.locator(".book-alignment-guide")).toHaveCount(0);
  await expect
    .poll(async () => {
      const box = (await moving.boundingBox())!;
      return Math.max(
        Math.abs(box.x - paper.x - target.left),
        Math.abs(box.y - paper.y - target.top),
      );
    })
    .toBeLessThan(1);
}

test("free-board guides snap photos to each other, then to the page center and edges", async ({
  page,
}, info) => {
  await page.goto("/");
  await page.getByLabel("Tenho 16 anos ou mais.").check();
  await page.getByRole("button", { name: "Montar meu mural" }).click();
  await page.getByRole("button", { name: "Pular apresentação" }).click();
  await page.getByRole("button", { name: "Livre", exact: true }).click();
  await page.getByRole("button", { name: "Pular ajuda", exact: true }).click();

  await page
    .getByRole("button", { name: "Montar com fotos", exact: true })
    .click();
  const buffer = await fs.readFile("public/icons/icon-512.png");
  await page.getByLabel("Carregar fotos para montar").setInputFiles(
    ["Referência.png", "Mover.png"].map((name) => ({
      name,
      mimeType: "image/png",
      buffer,
    })),
  );
  await page
    .getByRole("button", { name: "Montar página", exact: true })
    .click();
  const moving = page.getByRole("button", { name: "Foto: Mover", exact: true });
  const reference = page.getByRole("button", {
    name: "Foto: Referência",
    exact: true,
  });
  await expect(moving).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  const paper = page.locator(".free-paper");
  await paper.scrollIntoViewIfNeeded();
  const sheet = (await paper.boundingBox())!;
  const bounds = (await moving.boundingBox())!;
  const other = (await reference.boundingBox())!;
  const touch = info.project.name === "mobile";

  await checkDrag(
    page,
    "Foto: Mover",
    { left: other.x - sheet.x, top: other.y - sheet.y },
    touch,
  );
  await checkDrag(
    page,
    "Foto: Mover",
    {
      left: (sheet.width - bounds.width) / 2,
      top: (sheet.height - bounds.height) / 2,
    },
    touch,
    0,
  );
  const final = {
    left: sheet.width - bounds.width,
    top: sheet.height - bounds.height,
  };
  await checkDrag(page, "Foto: Mover", final, touch);

  await page.reload();
  await expect(moving).toBeVisible();
  await expect
    .poll(async () => {
      const resized = (await paper.boundingBox())!;
      const moved = (await moving.boundingBox())!;
      return Math.max(
        Math.abs(moved.x + moved.width - resized.x - resized.width),
        Math.abs(moved.y + moved.height - resized.y - resized.height),
      );
    })
    .toBeLessThan(1);
});
