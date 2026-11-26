import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
const photo = "public/icons/icon-512.png";
async function openApp(page: Page) {
  await page.goto("/");
  await page.getByLabel("Tenho 16 anos ou mais.").check();
  await page.getByRole("button", { name: "Montar meu mural" }).click();
  await expect(
    page.getByRole("heading", { name: "Seu sonho, do seu jeito." }),
  ).toBeVisible();
}
async function uploadPhoto(page: Page) {
  await page.getByLabel("Selecionar fotos da galeria").setInputFiles(photo);
  await expect(
    page.getByRole("button", { name: "Selecionar foto: icon-512" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Adicionar foto ao espaço 1", exact: true })
    .click();
  await expect(page.locator(".mural-card img")).toHaveCount(1);
}
async function navigate(page: Page, path: string) {
  await page.evaluate((value) => {
    location.hash = value;
  }, path);
}

test("quick mural: upload, touch placement, five layouts, edit, export and reopen", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openApp(page);
  await expect(
    page.getByRole("button", {
      name: /Recortes|Essencial|Instantes|Mosaico|Horizonte/,
    }),
  ).toHaveCount(5);
  await uploadPhoto(page);
  for (const name of [
    "Essencial",
    "Instantes",
    "Mosaico",
    "Horizonte",
    "Recortes",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(
      page.getByRole("button", { name, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".mural-card img")).toHaveCount(1);
  }
  await page
    .getByRole("button", { name: "Editar recorte 1", exact: true })
    .click();
  await page.getByLabel("Descrição da imagem").fill("Meu estúdio criativo");
  await page.getByLabel("Legenda").fill("Um lugar para criar");
  await page.getByRole("button", { name: "Salvar recorte" }).click();
  await expect(
    page.getByText("Um lugar para criar", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Mover recorte 1 para frente" })
    .click();
  await expect(page.locator('[data-slot="1"] .mural-card')).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar mural", exact: true }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("meu-mural-dos-sonhos.png");
  const bytes = await fs.readFile((await file.path())!);
  expect(bytes.subarray(1, 4).toString()).toBe("PNG");
  await page.reload();
  await expect(page.locator('[data-slot="1"] .mural-card img')).toHaveAttribute(
    "alt",
    "Meu estúdio criativo",
  );
  await expect(
    page.getByText("Um lugar para criar", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: `work/mural-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test("desktop native drag or mobile pointer drag moves gallery image to chosen slot", async ({
  page,
}, info) => {
  await openApp(page);
  await page.getByLabel("Selecionar fotos da galeria").setInputFiles(photo);
  await expect(
    page.getByRole("button", { name: "Selecionar foto: icon-512" }),
  ).toBeVisible();
  if (info.project.name === "mobile") {
    await page.locator(".gallery").scrollIntoViewIfNeeded();
    await page.evaluate(() =>
      window.scrollTo(
        0,
        document.querySelector<HTMLElement>(".gallery")!.offsetTop - 50,
      ),
    );
    const handle = await page
      .getByRole("button", { name: "Arrastar foto: icon-512" })
      .boundingBox();
    const target = await page.locator('[data-slot="0"]').boundingBox();
    expect(handle).toBeTruthy();
    expect(target).toBeTruthy();
    await page.mouse.move(handle!.x + 10, handle!.y + 10);
    await page.mouse.down();
    await page.mouse.move(target!.x + 30, target!.y + 30, { steps: 12 });
    await page.mouse.up();
  } else
    await page
      .getByRole("button", { name: "Selecionar foto: icon-512" })
      .dragTo(page.locator('[data-slot="2"]'));
  await expect(
    page.locator(
      info.project.name === "mobile"
        ? '[data-slot="0"] .mural-card img'
        : '[data-slot="2"] .mural-card img',
    ),
  ).toBeVisible();
});

test("complete backup round-trip includes original photos and rejects malformed backup", async ({
  page,
}) => {
  await openApp(page);
  await uploadPhoto(page);
  await navigate(page, "/ajustes");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar backup completo" }).click();
  const backup = await download;
  const contents = await fs.readFile((await backup.path())!);
  const payload = JSON.parse(contents.toString());
  expect(payload.assets).toHaveLength(1);
  expect(payload.workspace.cards).toHaveLength(1);
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Apagar todos os dados" }).click();
  await expect(page.getByLabel("Tenho 16 anos ou mais.")).toBeVisible();
  await page.getByLabel("Tenho 16 anos ou mais.").check();
  await page.getByRole("button", { name: "Montar meu mural" }).click();
  await expect(page.locator(".mural-card")).toHaveCount(0);
  await navigate(page, "/ajustes");
  await page.getByLabel("Arquivo de backup").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: contents,
  });
  await expect(
    page.getByRole("status").filter({ hasText: "Operação finalizada" }),
  ).toBeVisible();
  await navigate(page, "/");
  await expect(page.locator(".mural-card img")).toHaveCount(1);
  await navigate(page, "/ajustes");
  await page.getByLabel("Arquivo de backup").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"format":"invalid"}'),
  });
  await expect(
    page.getByRole("alert").filter({ hasText: "não é um backup válido" }),
  ).toBeVisible();
  await navigate(page, "/");
  await expect(page.locator(".mural-card img")).toHaveCount(1);
});

test("optional goals, actions, history and weekly review persist", async ({
  page,
}) => {
  await openApp(page);
  await navigate(page, "/plano");
  await page.getByRole("button", { name: "Nova meta", exact: true }).click();
  await page.getByLabel("Qual resultado concreto").fill("Montar portfólio");
  await page.getByRole("button", { name: "Salvar meta" }).click();
  await page.getByRole("button", { name: "Adicionar passo" }).click();
  await page.getByLabel("Qual ação cabe").fill("Escolher três trabalhos");
  await page.getByRole("button", { name: "Salvar passo" }).click();
  await navigate(page, "/hoje");
  await page.getByRole("button", { name: "Escolher para hoje" }).click();
  await expect(
    page.getByRole("heading", { name: "Escolher três trabalhos" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fiz esse passo" }).click();
  await navigate(page, "/historico");
  await expect(
    page.getByText("Passo concluído", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Data ajustada", { exact: true })).toBeVisible();
  await navigate(page, "/revisao");
  await page.getByLabel("O que você conseguiu").fill("Separei meus trabalhos");
  await page.getByLabel("Qual ajuste").fill("Reservar dez minutos amanhã");
  await page.getByRole("button", { name: "Salvar revisão" }).click();
  await expect(
    page.getByText("Revisão salva.", { exact: false }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("O que você conseguiu")).toHaveValue(
    "Separei meus trabalhos",
  );
});

test("PWA serves interface and local photos after going offline", async ({
  page,
  context,
}) => {
  await openApp(page);
  await uploadPhoto(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Seu sonho, do seu jeito." }),
  ).toBeVisible();
  await expect(page.locator(".mural-card img")).toBeVisible();
  await expect(
    page.getByText("Sem conexão · seu mural local continua disponível"),
  ).toBeVisible();
});

test("optional journey resumes and revising it never duplicates the plan", async ({
  page,
}) => {
  await openApp(page);
  await navigate(page, "/jornada");
  await page.getByRole("radio", { name: "Tenho muitas ideias" }).check();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(
    page.getByLabel("Qual ideia faria mais diferença"),
  ).toBeVisible();
  await page.getByRole("textbox").fill("Trabalhar com criação");
  await page.getByRole("button", { name: "Salvar e sair" }).click();
  await expect(
    page.getByRole("heading", { name: "Seu sonho, do seu jeito." }),
  ).toBeVisible();
  await navigate(page, "/jornada");
  await expect(page.getByRole("textbox")).toHaveValue("Trabalhar com criação");
  for (let step = 1; step <= 11; step++) {
    await expect(
      page.getByText(`Passo ${step + 1} de 12`, { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("textbox")
      .fill(
        step === 8
          ? "Meu portfólio publicado"
          : step === 9
            ? "Separar referências"
            : step === 11
              ? "Viver da minha criatividade"
              : "Minha resposta possível",
      );
    await page
      .getByRole("button", {
        name: step === 11 ? "Ver meu caminho" : "Continuar",
        exact: true,
      })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "Seu caminho já começou." }),
  ).toBeVisible();
  await navigate(page, "/plano");
  await expect(page.locator(".goal-card")).toHaveCount(1);
  await navigate(page, "/jornada");
  await page.getByRole("textbox").fill("Uma vida com criatividade e liberdade");
  await page
    .getByRole("button", { name: "Ver meu caminho", exact: true })
    .click();
  await navigate(page, "/plano");
  await expect(page.locator(".goal-card")).toHaveCount(1);
  await expect(
    page.getByRole("heading", {
      name: "Uma vida com criatividade e liberdade",
    }),
  ).toBeVisible();
});

test("invalid image preserves gallery; removing a card preserves its original photo", async ({
  page,
}) => {
  await openApp(page);
  await uploadPhoto(page);
  await page.getByLabel("Selecionar fotos da galeria").setInputFiles({
    name: "invalid.png",
    mimeType: "image/png",
    buffer: Buffer.from("not a picture"),
  });
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Não foi possível abrir essa imagem" }),
  ).toBeVisible();
  await expect(page.locator(".mural-card img")).toHaveCount(1);
  page.on("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Retirar recorte 1 do mural", exact: true })
    .click();
  await expect(page.locator(".mural-card")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Selecionar foto: icon-512" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Selecionar foto: icon-512" }).click();
  await page
    .getByRole("button", { name: "Adicionar foto ao espaço 2", exact: true })
    .click();
  await expect(page.locator('[data-slot="1"] .mural-card img')).toHaveCount(1);
});

test("mural livre saves drag, layer order and stickers independently of templates", async ({
  page,
}, info) => {
  await openApp(page);
  await uploadPhoto(page);
  await page.getByRole("button", { name: "Livre", exact: true }).click();
  const editor = page.getByRole("region", { name: "Editor livre" });
  await editor.getByRole("button", { name: "Foto", exact: true }).click();
  await page.getByRole("button", { name: "Adicionar foto: icon-512" }).click();
  const photoItem = editor.getByRole("button", { name: "Foto: icon-512" });
  await expect(photoItem).toBeVisible();

  await editor.getByRole("button", { name: "Texto", exact: true }).click();
  await page.getByLabel("Texto do mural").fill("Meu ateliê & jardim");
  await page.getByRole("button", { name: "Colocar no mural" }).click();
  const note = editor.getByRole("button", {
    name: "Texto: Meu ateliê & jardim",
  });

  await editor.getByRole("button", { name: "Figurinhas", exact: true }).click();
  for (const category of [
    "Viagens",
    "Natureza",
    "Vida e conquistas",
    "Recortes e fitas",
    "Sonhos",
  ]) {
    await page.getByRole("button", { name: category, exact: true }).click();
    await expect(page.locator(".free-sticker-picker button")).toHaveCount(10);
  }
  await page.getByRole("button", { name: "Estrela", exact: true }).click();
  const star = editor.getByRole("button", { name: "Figurinha: Estrela" });
  await expect(star).toBeVisible();
  await star.evaluate((element) =>
    element.scrollIntoView({ block: "center", behavior: "instant" }),
  );
  const before = await star.evaluate((element) => element.style.left);
  const rect = (await star.boundingBox())!;
  const x = Math.round(rect.x + rect.width / 2);
  const y = Math.round(rect.y + rect.height / 2);
  await expect
    .poll(() =>
      star.evaluate(
        (element, point) =>
          element.contains(document.elementFromPoint(point.x, point.y)),
        { x, y },
      ),
    )
    .toBe(true);
  if (info.project.name === "mobile") {
    const session = await page.context().newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x - 40, y: y + 25 }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await session.detach();
  } else {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 40, y + 25, { steps: 6 });
    await page.mouse.up();
  }
  await expect
    .poll(() => star.evaluate((element) => element.style.left))
    .not.toBe(before);

  const layers = editor.getByRole("list", { name: "Da frente para trás" });
  await layers.getByRole("button", { name: "icon-512" }).click();
  await editor.getByRole("button", { name: "Trazer para frente" }).click();
  await expect(layers.getByRole("listitem").nth(1)).toHaveText("icon-512");
  await expect(editor.locator(".free-item").nth(1)).toHaveAttribute(
    "aria-label",
    "Foto: icon-512",
  );

  await layers.getByRole("button", { name: "Meu ateliê & jardim" }).click();
  const prevWidth = await note.evaluate((element) => element.style.width);
  await editor.getByRole("button", { name: "Aumentar" }).click();
  await expect
    .poll(() => note.evaluate((element) => element.style.width))
    .not.toBe(prevWidth);
  await editor.getByRole("button", { name: "Editar texto" }).click();
  await page.getByLabel("Texto do mural").fill("Meu jardim & ateliê");
  await page.getByRole("button", { name: "Salvar texto" }).click();

  const savedLeft = await star.evaluate((element) => element.style.left);
  await page.getByRole("button", { name: "Recortes", exact: true }).click();
  await expect(page.locator(".mural-card img")).toHaveCount(1);
  const freeLayout = page.getByRole("button", { name: "Livre", exact: true });
  await freeLayout.click();
  await expect(freeLayout).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(star).toBeVisible();
  expect(await star.evaluate((element) => element.style.left)).toBe(savedLeft);
  await expect(layers.getByRole("listitem").nth(1)).toHaveText("icon-512");
  await expect(
    editor.getByRole("button", { name: "Texto: Meu jardim & ateliê" }),
  ).toBeVisible();

  const download = page.waitForEvent("download");
  await editor.getByRole("button", { name: "Baixar mural" }).click();
  const file = await download;
  const bytes = await fs.readFile((await file.path())!);
  expect(bytes.subarray(1, 4).toString()).toBe("PNG");
  expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([
    2000, 1500,
  ]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `work/mural-livre-${info.project.name}.png`,
    fullPage: true,
  });
});
