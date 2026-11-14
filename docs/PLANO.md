# Plano de desenvolvimento

## Decisões

- Produto: Mural dos Sonhos; público a partir de 16 anos.
- Português, celular primeiro, tons pastéis, scrapbook discreto.
- Sonho principal descritivo, metas concretas e ações editáveis.
- Painel privado; sem compartilhamento, anúncios ou IA interna no MVP.
- Perguntas adaptativas com regras explícitas. Imagens geradas fora do app, com prompts orientativos.
- Visualização por texto, controlada pela pessoa; sem promessas de resultado.
- Orçamento preferencialmente zero até receita; teto informado de R$ 100/mês. Não contratar serviços automaticamente.
- Beta fechado por 14 dias com cerca de 20 convidados; oferta posterior de R$ 49 por seis meses, sem renovação implícita.

## Etapas

1. Base React/TypeScript, identidade visual e jornada local.
2. Autenticação e persistência Supabase; permissões por usuário, exclusão de conta, continuidade da jornada.
3. Mural de imagens privadas, compressão, limites, cartões e reordenação; prompts para ferramentas externas.
4. Metas e ações persistentes, rotina diária e revisão; separar conclusão de uma ação de registro histórico.
5. PWA e acessibilidade; sem cache offline de dados pessoais inicialmente.
6. Preparação do beta: política de privacidade, tratamento de menores, controles de acesso por convite, teste da jornada e das permissões.
7. Beta de 14 dias, feedback e correções; avaliar ativação e retorno sem coletar textos privados em analytics.
8. Oferta fundadora: condições de acesso e cancelamento, estrutura fiscal, contratação por menores e checkout externo a definir.

## Condições para beta

- Testar login, recuperação, retomada e exclusão.
- Provar isolamento entre duas contas para textos e arquivos.
- Validar celular, teclado, contraste e movimento reduzido.
- Limites de upload e capacidade gratuitos confirmados nos provedores.
- Revisar informações de privacidade e participação de adolescentes antes dos convites.
- Não anunciar recursos ainda não implementados como parte da oferta disponível.

## Pendências externas

Escolher/configurar projetos Supabase e hospedagem; revisar limites e termos atuais; aprovação editorial das perguntas; definir checkout e aspectos fiscais antes de cobrar. Domínio próprio opcional, sem contratação nesta etapa.
