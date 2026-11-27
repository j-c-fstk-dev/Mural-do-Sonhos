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
  await page.getByRole("button", { name: "Pular apresentação" }).click();
  await page.getByRole("button", { name: "Recortes", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Pular ajuda", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Ajuda do mural" }),
  ).toHaveCount(0);
}

async function compactMural(page: Page) {
  return (
    (await page.locator(".book-shell").getAttribute("data-compact-mural")) ===
    "true"
  );
}
async function dockTool(page: Page, name: string) {
  if (!(await compactMural(page))) return;
  const tool = page
    .getByRole("group", { name: "Opções da seleção" })
    .getByRole("button", { name, exact: true });
  await expect(tool).toBeVisible();
  if ((await tool.getAttribute("aria-expanded")) !== "true") await tool.click();
}
async function tapPaper(page: Page) {
  await page.locator(".free-paper").click({ position: { x: 5, y: 5 } });
}
async function openSidebar(page: Page) {
  const button = page.getByRole("button", { name: "Abrir menu", exact: true });
  if (await button.isVisible()) await button.click();
  const mural = page.getByRole("link", { name: "Meu mural", exact: true });
  if ((await compactMural(page)) && (await mural.isVisible()))
    await mural.click();
}

async function chooseLayout(page: Page, name: string) {
  await openSidebar(page);
  await page.getByRole("button", { name: "Modelo da página" }).click();
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
  if (await compactMural(page)) {
    await page.locator('[data-slot="0"] img').click();
    await dockTool(page, "Editar cartão");
    await page.getByRole("button", { name: "Abrir editor do cartão" }).click();
  } else
    await page
      .getByRole("button", { name: "Editar cartão 1", exact: true })
      .click();
  await page.getByLabel("O que aparece na foto?").fill("Meu estúdio criativo");
  await page.getByLabel("Legenda").fill("Um lugar para criar");
  await page.getByRole("button", { name: "Salvar cartão" }).click();
  await expect(
    page.getByText("Um lugar para criar", { exact: true }),
  ).toBeVisible();
  if (await compactMural(page)) {
    await dockTool(page, "Ordem na folha");
    await page
      .getByRole("button", { name: "Mover para frente", exact: true })
      .click();
    await page.getByRole("button", { name: "Recolher opções" }).click();
  } else
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
  await page.getByRole("button", { name: "Baixar cópia completa" }).click();
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
  await page.getByRole("button", { name: "Pular apresentação" }).click();
  await page.getByRole("button", { name: "Recortes", exact: true }).click();
  await page.getByRole("button", { name: "Pular ajuda", exact: true }).click();
  await expect(page.locator(".mural-card")).toHaveCount(0);
  await navigate(page, "/ajustes");
  await page.getByLabel("Arquivo da cópia").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: contents,
  });
  await expect(
    page.getByRole("status").filter({ hasText: "Cópia aberta" }),
  ).toBeVisible();
  await navigate(page, "/");
  await expect(page.locator(".mural-card img")).toHaveCount(1);
  await navigate(page, "/ajustes");
  await page.getByLabel("Arquivo da cópia").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"format":"invalid"}'),
  });
  await expect(
    page.getByRole("alert").filter({ hasText: "não é uma cópia válida" }),
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
  await page.getByLabel("O que você quer conseguir?").fill("Montar portfólio");
  await page.getByRole("button", { name: "Salvar meta" }).click();
  await page.getByRole("button", { name: "Adicionar passo" }).click();
  await page
    .getByLabel("O que você vai fazer?")
    .fill("Escolher três trabalhos");
  await page.getByRole("button", { name: "Salvar passo" }).click();
  await navigate(page, "/hoje");
  await page.getByRole("button", { name: "Escolher para hoje" }).click();
  await expect(
    page.getByRole("heading", { name: "Escolher três trabalhos" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fiz esse passo" }).click();
  await navigate(page, "/historico");
  await expect(page.getByText("Passo feito", { exact: true })).toBeVisible();
  await expect(page.getByText("Mudou de dia", { exact: true })).toBeVisible();
  await navigate(page, "/revisao");
  await page.getByLabel("O que deu certo?").fill("Separei meus trabalhos");
  await page
    .getByLabel("O que você quer tentar agora?")
    .fill("Reservar dez minutos amanhã");
  await page.getByRole("button", { name: "Salvar minha semana" }).click();
  await expect(
    page.getByText("Sua semana foi salva.", { exact: false }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("O que deu certo?")).toHaveValue(
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
    page.getByLabel("Qual ideia você quer tentar primeiro?"),
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
        name: step === 11 ? "Ver metas e passos" : "Continuar",
        exact: true,
      })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "Seu sonho está salvo" }),
  ).toBeVisible();
  await navigate(page, "/plano");
  await expect(page.locator(".goal-card")).toHaveCount(1);
  await navigate(page, "/jornada");
  await page.getByRole("textbox").fill("Uma vida com criatividade e liberdade");
  await page
    .getByRole("button", { name: "Ver metas e passos", exact: true })
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
  if (await compactMural(page)) {
    await page.locator('[data-slot="0"] img').click();
    await dockTool(page, "Remover");
    await page.getByRole("button", { name: "Tirar cartão da folha" }).click();
  } else
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
    "Junte ideias no mural",
    "Use uma folha para cada ideia",
    "Escolha algo para fazer",
  ]) {
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await page.getByRole("button", { name: "Próximo", exact: true }).click();
  }
  await page.getByRole("button", { name: "Começar", exact: true }).click();
  await page.getByRole("button", { name: "Livre", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Editor livre" }),
  ).toBeVisible();
  await expect(
    page.getByRole("complementary", { name: "Menu e biblioteca" }),
  ).toBeVisible();
  if (!(await compactMural(page)))
    await expect(
      page.getByRole("complementary", { name: "Painel de edição" }),
    ).toBeVisible();
  const guide = page.getByRole("region", { name: "Ajuda do mural" });
  for (const target of [
    "layout",
    "photos",
    "text",
    "stickers",
    "sheet",
    "shapes",
    "format",
    "layers",
    "paper",
    "pages",
  ]) {
    await expect(
      page
        .locator(
          `[data-guide="${target}"]${target === "format" ? ", #book-inspector, .free-paper" : ""}`,
        )
        .and(page.locator('[data-guide-active="true"]')),
    ).toBeVisible();
    if (target !== "pages")
      await guide
        .getByRole("button", { name: "Continuar", exact: true })
        .click();
  }
  await guide.getByRole("button", { name: "Pronto", exact: true }).click();
  await expect(guide).toHaveCount(0);

  await openSidebar(page);
  await page.getByLabel("Escolher fotos do aparelho").setInputFiles(photo);
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
    page.getByRole("button", { name: "Arraste para girar" }),
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
  await page.getByRole("button", { name: "Frase curta" }).click();
  await page.getByRole("button", { name: "Editar texto na folha" }).click();
  const inline = page.getByRole("textbox", { name: "Escreva na folha" });
  await inline.fill("Um sonho de praia");
  await page
    .locator(".book-inline-text")
    .getByRole("button", { name: "Pronto" })
    .click();
  await expect(
    page.getByRole("button", { name: "Texto: Um sonho de praia" }),
  ).toBeVisible();
  if (await compactMural(page)) {
    await photoItem.click();
    await dockTool(page, "Moldura");
    await expect(
      page
        .locator("#book-inspector")
        .getByRole("combobox", { name: "Moldura da foto" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Texto: Um sonho de praia", exact: true })
      .click();
    await expect(page.locator("#book-inspector")).toBeHidden();
  }
  await dockTool(page, "Editar texto");
  const note = page.getByRole("textbox", {
    name: "O que está escrito",
    exact: true,
  });
  await expect(note).toHaveValue("Um sonho de praia");
  if (await compactMural(page)) {
    await note.focus();
    await page.evaluate(() => {
      const viewport = window.visualViewport!;
      Object.defineProperty(viewport, "height", {
        configurable: true,
        value: window.innerHeight - 230,
      });
      viewport.dispatchEvent(new Event("resize"));
    });
    await expect(page.locator(".book-mobile-dock")).toHaveCSS(
      "bottom",
      "230px",
    );
    await expect(note).toBeFocused();
    await page.evaluate(() => {
      const viewport = window.visualViewport!;
      Reflect.deleteProperty(viewport, "height");
      viewport.dispatchEvent(new Event("resize"));
    });
  }
  await note.fill("Meu ateliê\nUm jardim para criar");
  await note.blur();
  await dockTool(page, "Letra");
  await page
    .getByRole("combobox", { name: "Letra do texto", exact: true })
    .selectOption("handwritten");
  await dockTool(page, "Estilo");
  await page.getByRole("button", { name: "Negrito", exact: true }).click();
  await page.getByRole("button", { name: "Sublinhado", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Lista", exact: true })
    .selectOption("numbered");
  const curve = page.getByRole("slider", {
    name: "Curvar o texto",
    exact: true,
  });
  await curve.press("ArrowRight");
  await expect(curve).toHaveValue("5");
  const textBackground = page.getByRole("combobox", {
    name: "Fundo do texto",
  });
  await expect(textBackground).toHaveValue("transparent");
  await textBackground.selectOption("filled");
  await page.getByLabel("Cor do fundo do texto").fill("#f1aabc");
  const noteArt = page.locator(".free-item-text canvas");
  await expect
    .poll(() =>
      noteArt.evaluate((canvas: HTMLCanvasElement) =>
        Array.from(canvas.getContext("2d")!.getImageData(1, 1, 1, 1).data),
      ),
    )
    .toEqual([241, 170, 188, 255]);

  await dockTool(page, "Ordem na folha");
  const layers = page.getByRole("list", { name: "Da frente para trás" });
  await layers.getByRole("button", { name: "icon-512" }).click();
  await dockTool(page, "Ordem na folha");
  await page.getByRole("button", { name: "Trazer para frente" }).click();
  await expect(layers.getByRole("listitem").nth(1)).toHaveText("icon-512");

  if (await compactMural(page)) {
    await page.getByRole("button", { name: "Recolher opções" }).click();
    await tapPaper(page);
    await dockTool(page, "Formas");
  }
  await page.getByRole("button", { name: "Hexágono", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Forma: Hexágono" }),
  ).toBeVisible();
  if (await compactMural(page)) await tapPaper(page);
  await dockTool(page, "Título");
  await page.getByLabel("Título da página").fill("Minha primeira folha");
  await page.getByLabel("Título da página").blur();
  await page.getByLabel("Fonte do título").selectOption("mono");
  await dockTool(page, "Fundo");
  await page.getByRole("button", { name: "Piquenique", exact: true }).click();
  await expect(page.locator(".free-paper")).toHaveAttribute(
    "data-texture",
    "gingham",
  );
  await expect(
    page.getByRole("heading", { name: "Minha primeira folha" }),
  ).toBeVisible();
  if (await compactMural(page))
    await page.getByRole("button", { name: "Recolher opções" }).click();
  else await page.getByRole("button", { name: "Fechar ferramentas" }).click();

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
  await page.getByRole("button", { name: "Baixar cópia completa" }).click();
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

test("tablet keeps the sheet beside a hierarchical library and tools at the bottom", async ({
  page,
}) => {
  await page.setViewportSize({ width: 820, height: 1080 });
  await page.goto("/");
  await confirmAge(page);
  await page.getByRole("button", { name: "Pular apresentação" }).click();
  await page.getByRole("button", { name: "Livre", exact: true }).click();
  await page.getByRole("button", { name: "Pular ajuda" }).click();
  await openSidebar(page);
  const sidebar = page.getByRole("complementary", {
    name: "Menu e biblioteca",
  });
  await expect(
    sidebar.getByRole("button", { name: "Fotos", exact: true }),
  ).toBeVisible();
  const paper = page.locator(".free-paper");
  expect((await paper.boundingBox())!.x).toBeGreaterThan(
    (await sidebar.boundingBox())!.width,
  );
  await sidebar.getByRole("button", { name: "Voltar à navegação" }).click();
  await expect(
    sidebar.getByRole("link", { name: "Hoje", exact: true }),
  ).toBeVisible();
  await expect(
    sidebar.getByRole("button", { name: "Fotos", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Fechar menu", exact: true }).click();
  await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
  await expect(
    sidebar.getByRole("link", { name: "Hoje", exact: true }),
  ).toBeVisible();
  await sidebar.getByRole("link", { name: "Meu mural", exact: true }).click();
  await page.getByRole("button", { name: "Fechar menu", exact: true }).click();

  await tapPaper(page);
  const dock = page.getByRole("complementary", {
    name: "Ferramentas do mural",
  });
  await expect(dock).toBeVisible();
  const dockBox = (await dock.boundingBox())!;
  expect(Math.abs(dockBox.y + dockBox.height - 1080)).toBeLessThan(2);
  await dockTool(page, "Título");
  await page.getByLabel("Título da página").fill("Meu mural no tablet");
  await tapPaper(page);
  await expect(dock).toBeHidden();
  await tapPaper(page);
  await expect(
    dock.getByRole("button", { name: "Fundo", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Meu mural no tablet" }),
  ).toBeVisible();
});

test("auto assembly uses the layout, keeps its cards and exports a custom paper", async ({
  page,
}) => {
  await openApp(page);
  await chooseLayout(page, "Horizonte");
  async function image(
    name: string,
    width: number,
    height: number,
    color: string,
  ) {
    const encoded = await page.evaluate(
      ({ width, height, color }) => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
        return canvas.toDataURL().split(",")[1];
      },
      { width, height, color },
    );
    return {
      name,
      mimeType: "image/png",
      buffer: Buffer.from(encoded, "base64"),
    };
  }
  const images = await Promise.all([
    image("Retrato.png", 80, 180, "#a43172"),
    image("Paisagem.png", 240, 80, "#d07832"),
    image("Praia.png", 160, 120, "#5772a8"),
  ]);
  const pattern = await image("Estampa da marca.png", 80, 80, "#229952");

  await page
    .getByRole("button", { name: "Montar com fotos", exact: true })
    .click();
  await page.getByLabel("Carregar fotos para montar").setInputFiles(images);
  await page.getByRole("checkbox", { name: "Praia", exact: true }).uncheck();
  await page
    .getByRole("dialog", { name: "Montar com fotos" })
    .getByRole("combobox", { name: "Moldura da foto" })
    .selectOption("polaroid");
  await page
    .getByRole("button", { name: "Montar página", exact: true })
    .click();
  await expect(page.locator('[data-slot="0"] img')).toHaveAttribute(
    "alt",
    "Paisagem",
  );
  await expect(page.locator('.mural-card[data-frame="polaroid"]')).toHaveCount(
    2,
  );

  await page
    .getByRole("button", { name: "Montar com fotos", exact: true })
    .click();
  await page.getByRole("button", { name: "Escolher todas" }).click();
  await page
    .getByRole("button", { name: "Montar página", exact: true })
    .click();
  await expect(page.locator('[data-slot="0"] img')).toHaveAttribute(
    "alt",
    "Paisagem",
  );
  await expect(page.locator('[data-slot="2"] img')).toHaveAttribute(
    "alt",
    "Praia",
  );

  await page.getByRole("button", { name: "Nova página", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Editor livre" }),
  ).toBeVisible();
  const tools = page.getByRole("button", {
    name: "Abrir ferramentas",
    exact: true,
  });
  if (await tools.isVisible()) await tools.click();
  if (await compactMural(page)) await tapPaper(page);
  await dockTool(page, "Fundo");
  await page.getByLabel("Colocar uma estampa").setInputFiles(pattern);
  await expect(page.locator(".book-leaf")).toHaveAttribute(
    "data-pattern",
    "true",
  );
  await dockTool(page, "Título");
  await page
    .getByRole("combobox", { name: "Fonte do título" })
    .selectOption("collage");
  await expect(page.locator(".book-page-title")).toHaveCSS(
    "font-family",
    /Barriecito/,
  );

  await page
    .getByRole("button", { name: "Montar com fotos", exact: true })
    .click();
  await page.getByRole("button", { name: "Escolher todas" }).click();
  await page
    .getByRole("dialog", { name: "Montar com fotos" })
    .getByRole("combobox", { name: "Moldura da foto" })
    .selectOption("polaroid");
  await page
    .getByRole("button", { name: "Montar página", exact: true })
    .click();
  const photos = page.locator('.free-item[data-frame="polaroid"]');
  await expect(photos).toHaveCount(3);
  const rectangles = await photos.evaluateAll((items) =>
    items.map((item) => {
      const r = item.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    }),
  );
  for (const [i, box] of rectangles.entries()) {
    for (const next of rectangles.slice(i + 1))
      expect(
        box.left < next.right &&
          box.right > next.left &&
          box.top < next.bottom &&
          box.bottom > next.top,
      ).toBe(false);
  }

  await openSidebar(page);
  await page.getByRole("button", { name: "Figurinhas", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Categoria" })
    .selectOption({ label: "Mesa de scrapbook" });
  await page
    .getByRole("button", { name: "Etiqueta kraft", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Figurinha: Etiqueta kraft" }),
  ).toBeVisible();

  await page.reload();
  await expect(page.locator(".book-leaf")).toHaveAttribute(
    "data-pattern",
    "true",
  );
  await expect(photos).toHaveCount(3);
  const pendingPng = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar mural", exact: true }).click();
  const png = await pendingPng;
  const bytes = await fs.readFile((await png.path())!);
  const pixel = await page.evaluate(async (base64) => {
    const img = await createImageBitmap(
      new Blob([Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))], {
        type: "image/png",
      }),
    );
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    return Array.from(ctx.getImageData(0, 0, 1, 1).data);
  }, bytes.toString("base64"));
  expect(pixel[1]).toBeGreaterThan(130);
  expect(pixel[0]).toBeLessThan(55);
  expect(pixel[3]).toBe(255);

  await navigate(page, "/ajustes");
  const pendingBackup = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar cópia completa" }).click();
  const backup = await pendingBackup;
  const payload = JSON.parse(await fs.readFile((await backup.path())!, "utf8"));
  const { id: patternId } = payload.workspace.patterns[0];
  expect(payload.workspace.pages[0].paper.patternId).toBe(patternId);
  expect(
    payload.assets.some((asset: { id: string }) => asset.id === patternId),
  ).toBe(true);
});

test("installation settings offer device guides, a native prompt and a valid manifest", async ({
  page,
}) => {
  await openApp(page);
  await navigate(page, "/ajustes");
  const section = page.getByRole("region", { name: "Instalar o app" });
  await section.getByText("Android · Chrome", { exact: true }).click();
  await expect(section.getByText(/Instalar e criar atalho/)).toBeVisible();
  await section.getByText("iPhone e iPad · Safari", { exact: true }).click();
  await expect(
    section.getByText("Adicionar à Tela de Início", { exact: true }),
  ).toBeVisible();
  await section
    .getByText("Computador · Chrome, Edge ou Safari", { exact: true })
    .click();
  await expect(section.getByText(/Adicionar ao Dock/)).toBeVisible();

  await page.evaluate(() => {
    const install = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(install, {
      prompt: async () => {
        document.body.dataset.installPrompted = "true";
      },
      userChoice: Promise.resolve({ outcome: "dismissed" }),
    });
    window.dispatchEvent(install);
  });
  await section
    .getByRole("button", { name: "Instalar neste aparelho" })
    .click();
  await expect(page.locator("body")).toHaveAttribute(
    "data-install-prompted",
    "true",
  );
  await expect(section.getByText(/Instalação cancelada/)).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(
    section.getByText(/está instalado neste aparelho/),
  ).toBeVisible();

  const manifest = await page.evaluate(async () => {
    const manifestLink = document.querySelector<HTMLLinkElement>(
      'link[rel="manifest"]',
    )!;
    const response = await fetch(manifestLink.href);
    return response.json();
  });
  expect(manifest).toMatchObject({
    id: "/",
    start_url: "/",
    display: "standalone",
  });
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ sizes: "192x192" }),
      expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
    ]),
  );
  for (const icon of manifest.icons)
    expect((await page.request.get(icon.src)).ok()).toBe(true);
  expect((await page.request.get("/icons/icon-192.png")).ok()).toBe(true);
});
