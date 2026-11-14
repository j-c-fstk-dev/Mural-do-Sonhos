# Mural dos Sonhos

Monte um mural de sonhos com fotos da galeria, frases e cinco layouts em tons pastéis. Organize por arrastar ou por toque. Metas, perguntas guiadas e acompanhamento são opcionais.

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

- Cinco layouts: Recortes, Essencial, Instantes, Mosaico e Horizonte.
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

- [Plano vigente](docs/PLANO.md)
- [Arquitetura e integração Supabase](docs/ARQUITETURA.md)
