import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs/promises";
const photo = "public/icons/icon-512.png";
async function confirmAge(page: Page) {
  await page.getByLabel("Tenho 16 anos ou mais.").check();
  await page.getByRole("button", { name: "Montar meu mural" }).click();
}

async function openApp(page: Page) {
  await page.goto("/");
  await confirmAge(page);
  await page.getByRole("button", { name: "Pular tour" }).click();
  await page.getByRole("button", { name: "Recortes", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

async function openSidebar(page: Page) {
  const button = page.getByRole("button", { name: "Abrir menu", exact: true });
  if (await button.isVisible()) await button.click();
}

async function chooseLayout(page: Page, name: string) {
  await openSidebar(page);
  await page.getByRole("button", { name: "Layout da página" }).click();
  await page.getByRole("button", { name, exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

async function uploadPhoto(page: Page) {
  await openSidebar(page);
  await page.getByLabel("Selecionar fotos da galeria").setInputFiles(photo);
  await page.getByRole("button", { name: "Selecionar foto: icon-512" }).click();
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
  await uploadPhoto(page);
  for (const name of [
    "Essencial",
    "Instantes",
    "Mosaico",
    "Horizonte",
    "Recortes",
  ]) {
    await chooseLayout(page, name);
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

test("desktop dragging or mobile tapping places a gallery image in a template", async ({
  page,
}, info) => {
  await openApp(page);
  await openSidebar(page);
  await page.getByLabel("Selecionar fotos da galeria").setInputFiles(photo);
  await expect(
    page.getByRole("button", { name: "Selecionar foto: icon-512" }),
  ).toBeVisible();
  if (info.project.name === "mobile") {
    await page.getByRole("button", { name: "Selecionar foto: icon-512" }).tap();
    await page
      .getByRole("button", { name: "Adicionar foto ao espaço 1", exact: true })
      .tap();
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
  await page.getByRole("button", { name: "Pular tour" }).click();
  await page.getByRole("button", { name: "Recortes", exact: true }).click();
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
  await expect(page.locator(".book-page-title")).toBeVisible();
  await expect(page.locator(".mural-card img")).toBeVisible();
  await expect(page.getByText("Sem conexão", { exact: true })).toBeVisible();
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
  await expect(page.locator(".book-page-title")).toBeVisible();
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
  await openSidebar(page);
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
  if (
    await page.getByRole("button", { name: "Fechar barra lateral" }).isVisible()
  )
    await page
      .getByRole("button", { name: "Fechar menu", exact: true })
      .click();
  await page
    .getByRole("button", { name: "Retirar recorte 1 do mural", exact: true })
    .click();
  await expect(page.locator(".mural-card")).toHaveCount(0);
  await openSidebar(page);
  await expect(
    page.getByRole("button", { name: "Selecionar foto: icon-512" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Selecionar foto: icon-512" }).click();
  await page
    .getByRole("button", { name: "Adicionar foto ao espaço 2", exact: true })
    .click();
  await expect(page.locator('[data-slot="1"] .mural-card img')).toHaveCount(1);
});

async function drag(
  page: Page,
  target: ReturnType<Page["locator"]>,
  dx: number,
  dy: number,
  touch: boolean,
) {
  await target.scrollIntoViewIfNeeded();
  const rect = (await target.boundingBox())!;
  const x = Math.round(rect.x + rect.width / 2);
  const y = Math.round(rect.y + rect.height / 2);
  if (touch) {
    const session = await page.context().newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x + dx, y: y + dy }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await session.detach();
  } else {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + dx, y + dy, { steps: 7 });
    await page.mouse.up();
  }
}

test("tour, book pages, transforms, typography and PNG persist", async ({
  page,
}, info) => {
  page.setDefaultTimeout(8000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await confirmAge(page);
  for (const title of [
    "Comece por uma página",
    "Traga sua ideia para o papel",
    "Ajuste os detalhes",
  ]) {
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await page.getByRole("button", { name: "Próximo", exact: true }).click();
  }
  await page.getByRole("button", { name: "Começar", exact: true }).click();
  await page.getByRole("button", { name: "Livre", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Editor livre" }),
  ).toBeVisible();

  await openSidebar(page);
  await page.getByLabel("Adicionar fotos à galeria").setInputFiles(photo);
  await page
    .getByRole("button", { name: "Adicionar foto: icon-512", exact: true })
    .click();
  const photoItem = page.getByRole("button", {
    name: "Foto: icon-512",
    exact: true,
  });
  const photoBox = page.locator(".book-element").filter({ has: photoItem });
  await expect(photoItem).toBeVisible();
  const width = await photoBox.evaluate((element) => element.style.width);
  await drag(
    page,
    page.getByRole("button", { name: "Redimensionar e", exact: true }),
    28,
    0,
    info.project.name === "mobile",
  );
  await expect
    .poll(() => photoBox.evaluate((element) => element.style.width))
    .not.toBe(width);
  await drag(
    page,
    page.getByRole("button", { name: "Arrastar para rotacionar" }),
    38,
    21,
    info.project.name === "mobile",
  );
  await expect
    .poll(() => photoBox.evaluate((element) => element.style.transform))
    .not.toBe("rotate(0deg)");
  const initialPosition = await photoBox.evaluate(
    (element) => element.style.left,
  );
  await drag(page, photoItem, -32, 22, info.project.name === "mobile");
  await expect
    .poll(() => photoBox.evaluate((element) => element.style.left))
    .not.toBe(initialPosition);

  await openSidebar(page);
  await page.getByRole("button", { name: "Figurinhas", exact: true }).click();
  for (const category of [
    "Viagens",
    "Natureza",
    "Vida e conquistas",
    "Recortes e fitas",
    "Sonhos",
  ]) {
    await page
      .getByRole("combobox", { name: "Categoria", exact: true })
      .selectOption({ label: category });
    await expect(page.locator(".free-sticker-picker button")).toHaveCount(10);
  }
  await page
    .getByRole("complementary", { name: "Menu e biblioteca" })
    .getByRole("button", { name: "Estrela", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Figurinha: Estrela", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await openSidebar(page);
  await page.getByRole("button", { name: "Texto", exact: true }).click();
  await page.getByRole("button", { name: "Adicionar caixa de texto" }).click();
  const note = page.getByRole("textbox", {
    name: "Texto do mural",
    exact: true,
  });
  await note.fill("Meu ateliê\nUm jardim para criar");
  await note.blur();
  await page
    .getByRole("combobox", { name: "Fonte do texto", exact: true })
    .selectOption("handwritten");
  await page.getByRole("button", { name: "Negrito", exact: true }).click();
  await page.getByRole("button", { name: "Sublinhado", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Lista", exact: true })
    .selectOption("numbered");
  const curve = page.getByRole("slider", {
    name: "Curvatura do texto",
    exact: true,
  });
  await curve.press("ArrowRight");
  await expect(curve).toHaveValue("5");
  const textBackground = page.getByRole("combobox", {
    name: "Fundo da caixa de texto",
  });
  await expect(textBackground).toHaveValue("transparent");
  await textBackground.selectOption("filled");
  await page.getByLabel("Cor da caixa de texto").fill("#f1aabc");
  const noteArt = page.locator(".free-item-text canvas");
  await expect
    .poll(() =>
      noteArt.evaluate((canvas: HTMLCanvasElement) =>
        Array.from(canvas.getContext("2d")!.getImageData(1, 1, 1, 1).data),
      ),
    )
    .toEqual([241, 170, 188, 255]);

  const layers = page.getByRole("list", { name: "Da frente para trás" });
  await layers.getByRole("button", { name: "icon-512" }).click();
  await page.getByRole("button", { name: "Trazer para frente" }).click();
  await expect(layers.getByRole("listitem").nth(1)).toHaveText("icon-512");

  await page.getByRole("button", { name: "Hexágono", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Forma: Hexágono" }),
  ).toBeVisible();
  await page.getByLabel("Título da página").fill("Minha primeira folha");
  await page.getByLabel("Título da página").blur();
  await page.getByLabel("Fonte do título").selectOption("mono");
  await page.getByRole("button", { name: "Piquenique", exact: true }).click();
  await expect(page.locator(".free-paper")).toHaveAttribute(
    "data-texture",
    "gingham",
  );
  await expect(
    page.getByRole("heading", { name: "Minha primeira folha" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Recolher edição" }).click();

  await page.getByRole("button", { name: "Nova página" }).click();
  await expect(page.getByText("Página 2 de 2", { exact: true })).toBeVisible();
  await expect(photoItem).toHaveCount(0);
  await openSidebar(page);
  await page.getByRole("button", { name: "Adicionar foto: icon-512" }).click();
  await expect(photoItem).toHaveAttribute("aria-pressed", "true");
  await chooseLayout(page, "Mosaico");
  await expect(page.locator(".mural-grid.mosaic")).toBeVisible();
  await chooseLayout(page, "Livre");
  await expect(photoItem).toBeVisible();
  await page
    .getByRole("button", { name: "Página anterior", exact: true })
    .click();
  await expect(page.getByText("Página 1 de 2", { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Minha primeira folha" }),
  ).toBeVisible();
  await expect(page.locator(".free-item")).toHaveCount(4);
  await expect(page.getByRole("dialog")).toHaveCount(0);

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar mural", exact: true }).click();
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
  expect(errors).toEqual([]);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: `work/caderno-${info.project.name}.png`,
    scale: "css",
  });
  await navigate(page, "/ajustes");
  const backupDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar backup completo" }).click();
  const backupFile = await backupDownload;
  const backup = JSON.parse(
    await fs.readFile((await backupFile.path())!, "utf-8"),
  );
  expect(backup.workspace.pages).toHaveLength(1);
  expect(backup.workspace.pages[0].free_items).toHaveLength(1);
  expect(
    backup.workspace.free_items.find(
      (item: { kind: string }) => item.kind === "text",
    ),
  ).toMatchObject({
    body: "Meu ateliê\nUm jardim para criar",
    font: "handwritten",
    bold: true,
    underline: true,
    list: "numbered",
    curve: 5,
    backgroundMode: "filled",
    backgroundColor: "#f1aabc",
  });
});
