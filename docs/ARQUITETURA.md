# Armazenamento local e futura integração Supabase

## Hoje

O app usa IndexedDB, sem login, backend ou conta simulada. O aviso de idade é uma autodeclaração, não verificação de identidade. A privacidade local depende da proteção do aparelho e do perfil do navegador.

- `src/data/model.ts`: entidades, validação Zod, migração da primeira versão e eventos das ações.
- `src/data/repository.ts`: contrato assíncrono `Repository` e implementação `localRepository`.
- `src/data/useWorkspace.ts`: serializa alterações, persiste antes de confirmar a interface, preserva o estado anterior se a gravação falhar.
- `src/data/media.ts`: compressão, backup validado com imagens e exportação PNG.
- Banco IndexedDB `mural-dos-sonhos`: store `workspace` para o snapshot normalizado e store `assets` para Blobs. As alterações de textos e arquivos são transacionais.
- A galeria é independente dos recortes. Retirar um recorte preserva a foto; excluir a foto remove os recortes correspondentes.
- IDs UUID, nomes snake_case, datas de calendário locais e timestamps ISO/UTC. Eventos preservam o título da ação no momento do registro.
- Dados anteriores em `localStorage['mural-dos-sonhos:v1']` são migrados uma vez após persistência bem-sucedida. JSON corrompido interrompe a carga, sem sobrescrever a origem.

## Contrato para o adaptador remoto

As telas recebem `Store`; o hook recebe uma implementação `Repository`. Nenhuma tela precisa importar o SDK Supabase. O próximo adaptador deve implementar `load`, `save`, `asset`, `assets`, `replace` e `clear`.

A migration em `supabase/migrations/202611140001_initial_schema.sql` prepara as tabelas, referências compostas, RLS e bucket privado. É uma base **não aplicada e não validada em um projeto Supabase**. Antes de produção, testar a migration e provar isolamento entre contas, políticas de Storage e exclusão completa.

Mapeamento:

| Local             | Supabase                                     |
| ----------------- | -------------------------------------------- |
| `profile`         | `profiles`, com id de `auth.users`           |
| `dream`           | `dreams` + `user_id` autenticado             |
| `goals` / `tasks` | `goals` / `tasks` + `user_id`                |
| `gallery` + Blobs | `media` + arquivos no bucket `mural-private` |
| `cards`           | `mural_cards` + `user_id`                    |
| `events`          | `task_events` + `user_id`                    |
| `reviews`         | `weekly_reviews` + `user_id`                 |

O UUID do perfil local não é uma credencial. No primeiro login, pedir confirmação explícita para importar dados do aparelho e remapear o dono para `auth.uid()`. IDs das entidades podem ser preservados, mas colisões e substituições devem ser tratados explicitamente.

## Trabalho que continua necessário

1. Configurar projeto e login, variáveis públicas do cliente e recuperação de acesso. Nunca colocar chave service-role no navegador.
2. Implementar o adaptador e uma RPC transacional para alterações relacionadas, trocas de posição, substituição/restauração e conflitos de versão. Um conjunto de `upsert` independentes não equivale à transação local.
3. Fotos no caminho `<auth.uid()>/<asset-id>.jpg`, acesso autenticado ou URLs assinadas de duração curta. Uploads e banco não compartilham transação: prever compensação e limpeza de órfãos.
4. Limites por usuário no servidor; os limites atuais são de UX e não protegem um backend.
5. Política de conflitos entre dispositivos, migração de backup, exclusão de arquivos e conta, observabilidade sem conteúdo dos murais e revisão de privacidade para adolescentes.
6. Rever cache para modo autenticado: a PWA atual guarda interface e arquivos estáticos; dados pessoais permanecem no IndexedDB. Não adicionar cache genérico de APIs ou URLs assinadas.

## Limites locais

Até 40 fotos e 40 recortes. Entrada JPG/PNG/WebP de até 10 MB, saída de até 1600 px e 2 MB. Sem SVG, fetch de imagens por URL ou conteúdo HTML do usuário. Backups completos de até 60 MB são JSON sem criptografia e precisam ser guardados com cuidado. Importação valida estrutura, vínculos, IDs, dimensões e decodificação das imagens antes de substituir tudo numa transação.

A instalação requer HTTPS ou localhost e navegador compatível. Offline funciona depois que a interface foi carregada e o service worker assumiu o controle. Não existe sincronização entre origens, navegadores ou aparelhos; trocar o domínio exige exportar/importar backup.
