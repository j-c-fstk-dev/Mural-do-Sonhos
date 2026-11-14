# Plano de desenvolvimento

## Direção vigente

Atualizada após feedback do usuário e da esposa:

- Produto: **Mural dos Sonhos**, público a partir de 16 anos.
- Diferencial principal: montar um mural privado de forma rápida e fácil.
- Tela inicial é o mural. Não exigir jornada de perguntas para adicionar fotos.
- Cinco layouts: Recortes, Essencial, Instantes, Mosaico e Horizonte.
- Fotos da galeria local, arrastar para espaços do mural e alternativa por toque/teclado.
- Tons pastéis e scrapbook discreto; sem geração de IA interna, anúncios ou compartilhamento no MVP.
- **Visualização guiada em texto removida**, inclusive das telas e propostas de venda.
- Metas, perguntas adaptativas e rotina permanecem como recursos opcionais.
- Beta gratuito fechado por 14 dias; preço fundador **a decidir após testar o mural**. A proposta anterior de R$ 49 por seis meses foi descartada. Não há cobrança implementada.
- Orçamento preferencialmente zero até receita; teto informado de R$ 100/mês. Não contratar serviços automaticamente.

## Entrega local

- IndexedDB para textos e fotos, com repositório assíncrono e entidades preparadas para futura integração Supabase.
- Galeria, compressão, cinco layouts, organização por arrastar, posicionamento por toque, legendas, frases e exportação PNG.
- Jornada adaptativa com retomada, sonho principal, várias metas e ações editáveis.
- Tela Hoje, datas opcionais, conclusão/reabertura, adiamento e histórico.
- Revisão semanal editável, prompts para gerar imagens fora do app.
- Backup completo, restauração validada, exclusão local, instalação PWA e interface offline.
- Testes de dados e testes de navegador em tamanhos desktop e celular.

## Próximas etapas

1. Testar com o usuário e ajustar principalmente montagem do mural e layouts.
2. Configurar Supabase: autenticação, adaptador remoto, bucket privado, RLS e migração confirmada dos dados locais. Ver `ARQUITETURA.md`.
3. Validar segurança e privacidade entre contas, limites de arquivo, recuperação e exclusão.
4. Preparar avisos e condições para público a partir de 16 anos, hospedagem e convites do beta.
5. Rodar beta de 14 dias com cerca de 20 pessoas e coletar feedback sem conteúdo privado.
6. Definir preço, condições de acesso, cancelamento, contratação por adolescentes, estrutura fiscal e checkout externo antes de cobrar.
