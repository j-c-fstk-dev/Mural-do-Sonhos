# Mural dos Sonhos

Monte um mural de sonhos em um dos cinco templates ou no modo **Livre**, com fotos, textos e 50 figurinhas de scrapbook. No modo Livre, arraste os elementos pelo mural e use **Camadas** para ajustar tamanho e sobreposição. As duas composições compartilham a galeria, e ambas podem ser baixadas em PNG. Metas, perguntas guiadas e acompanhamento são opcionais.

O tour inicial apresenta a galeria, a edição e as áreas de metas e revisão. A escolha do layout aparece na primeira visita ao mural e depois fica em **Layout da página**, no menu esquerdo. Use as setas ou deslize sobre a folha no celular para folhear o caderno. A galeria é compartilhada pelo caderno.

No modo **Livre**, selecione um elemento e arraste suas alças para mudar tamanho ou rotação. O painel direito reúne as camadas, dez formas, cinco fontes locais, controles de texto e opções de papel. O fundo de uma caixa de texto pode ser transparente ou preenchido com uma cor própria. Cada página é baixada separadamente em PNG. O backup JSON guarda o caderno inteiro.

## Rodar localmente

Node.js 22.12+ ou 24+.

```sh
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite. Para acessar pela rede local: `npm run dev -- --host 0.0.0.0`. Instalação PWA e algumas APIs exigem HTTPS ou localhost; um endereço HTTP na rede pode não oferecer esses recursos.

## Verificações

```sh
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Os testes de navegador iniciam a prévia do build na porta 4173. Para verificar a PWA manualmente, execute `npm run preview` após o build. O service worker não é habilitado no servidor de desenvolvimento.

## Recursos para teste

- Cinco templates: Recortes, Essencial, Instantes, Mosaico e Horizonte.
- Modo Livre com até 100 elementos, ordenação por camadas e 50 figurinhas em cinco categorias.
- Galeria com upload múltiplo e compressão; até 40 fotos e 40 recortes.
- Arrastar pelo mouse ou alça de toque; alternativa acessível: selecionar foto e tocar no espaço. Reordenação por setas.
- Legendas, frases, relação opcional com metas e exportação do mural em PNG.
- Perguntas adaptativas com retomada, sonho principal, metas e ações editáveis.
- Rotina diária, adiamento, histórico de ações e revisão semanal.
- Prompts copiáveis para usar em ferramentas externas, sem enviar dados a APIs de IA.
- Backup completo JSON com fotos, restauração validada e exclusão local.
- PWA instalável, interface offline e movimento reduzido.

## Dados e limitações

Sem Supabase, login, pagamentos, anúncios ou visualização guiada. Dados ficam no IndexedDB do navegador, sem proteção por senha do app ou sincronização. Use aparelho de confiança e faça backups; limpar os dados do site pode apagar tudo. O arquivo de backup não é criptografado.

O armazenamento tem uma interface assíncrona separada das telas. Há uma migration SQL preparatória com RLS e bucket privado, **não aplicada nem testada em Supabase**. Isso não significa que o backend já está integrado.

O app usa fontes do sistema e não inclui analytics. A hospedagem pode registrar acessos técnicos. Público a partir de 16 anos; a checagem local é uma autodeclaração.

Preço a decidir após testar o mural. A oferta anterior de R$ 49 foi descartada. Beta fechado planejado por 14 dias.

- [Relatório de desenvolvimento e decisões](docs/RELATORIO_DE_DESENVOLVIMENTO.md)
- [Plano vigente](docs/PLANO.md)
- [Arquitetura e integração Supabase](docs/ARQUITETURA.md)
