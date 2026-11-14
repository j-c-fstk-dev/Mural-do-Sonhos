# Mural dos Sonhos — relatório de desenvolvimento e decisões

**Atualizado em:** 14 de novembro de 2026.  
**Versão funcional de referência:** commit `b7e39bb`, na branch `main`.  
**Situação:** versão local implementada para avaliação do produto. Ainda sem backend, login, publicação de produção ou cobrança.

Este documento reúne o que foi feito, por que foi feito, as decisões tomadas e as pendências por etapa. Deve ser atualizado ao concluir uma etapa ou alterar uma decisão de produto. O documento inicial anexado serviu como referência; suas propostas não foram consideradas automaticamente aprovadas.

## 1. O produto que estamos construindo

O **Mural dos Sonhos** ajuda a pessoa a representar a vida que deseja por meio de fotos e frases. O diferencial principal definido é **montar um mural privado de forma rápida e fácil**.

O público inicial vem principalmente do Instagram e do TikTok do criador, com pessoas jovens que se identificam com sua trajetória no digital e com o estilo de bonequinhos, animações e recortes de scrapbook. A idade mínima escolhida é 16 anos.

Perguntas, metas e acompanhamento continuam disponíveis como apoio opcional. A pessoa não precisa passar por uma jornada de planejamento para começar a montar o mural.

A palavra “privado” tem dois estágios distintos:

- **Agora:** dados somente no navegador usado, sem publicação ou compartilhamento dentro do app. Não há senha do app; quem acessa o mesmo perfil do navegador pode acessar o mural.
- **Depois da integração:** acesso por conta, arquivos privados no servidor e regras que impeçam uma conta de ler dados de outra. Essa proteção ainda precisa ser implementada e testada.

## 2. Decisões e mudanças de direção

| Assunto                      | Decisão vigente                                               | Origem e motivo                                       | Efeito no desenvolvimento                                                                                                 |
| ---------------------------- | ------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Nome                         | Mural dos Sonhos                                              | Escolha do criador.                                   | Identidade, textos e metadados usam esse nome. O endereço do repositório permanece `Mural-do-Sonhos`.                     |
| Prioridade                   | Montagem rápida do mural                                      | Feedback posterior do criador e da esposa.            | Mural é a tela inicial; perguntas deixam de ser uma barreira de entrada.                                                  |
| Visual                       | Tons pastéis e scrapbook discreto                             | Preferência do criador e linguagem visual do público. | Recortes e cores suaves, mantendo navegação e controles legíveis.                                                         |
| Layouts                      | Cinco opções                                                  | Pedido explícito do criador.                          | Recortes, Essencial, Instantes, Mosaico e Horizonte; troca sem excluir fotos.                                             |
| Organização                  | Fotos da galeria e arrastar para o mural                      | Pedido explícito do criador.                          | Galeria separada dos espaços do mural, arrastar e alternativa por toque/teclado.                                          |
| Visualização guiada em texto | Removida                                                      | Feedback posterior do criador e da esposa.            | Não aparece no app nem integra a proposta vigente de recursos pagos.                                                      |
| Linguagem                    | Acolhedora e abrangente                                       | Preferência do criador.                               | Sem exigir identificação com espiritualidade e sem prometer resultados inevitáveis.                                       |
| Planejamento                 | Um sonho principal descritivo, com metas e ações              | Definição construída com o criador.                   | O sonho pode ser amplo; resultados concretos e próximos passos ficam nas metas e tarefas.                                 |
| Perguntas                    | Adaptativas por regras, sem IA interna                        | Proposta aprovada pelo criador para o início.         | Caminhos explícitos e exemplos; sem custo de modelo por resposta.                                                         |
| Imagens com IA               | Geração fora do app                                           | Solução aceita pelo criador.                          | Prompts copiáveis; a pessoa traz a imagem pronta para a galeria.                                                          |
| Compartilhamento             | Não implementar no MVP                                        | Preferência do criador.                               | Sem feed, links públicos ou publicação automática. Baixar uma imagem é uma ação voluntária.                               |
| Idade mínima                 | 16 anos                                                       | Escolha confirmada pelo criador.                      | Autodeclaração inicial; regras e condições para adolescentes ainda precisam de revisão antes do beta.                     |
| Infraestrutura inicial       | Armazenamento local, separado da interface                    | Pedido explícito para testar antes do Supabase.       | IndexedDB e contrato de repositório substituível.                                                                         |
| Orçamento                    | Preferencialmente zero até ter assinantes; teto de R$ 100/mês | Limite informado pelo criador.                        | Sem contratação de serviços pagos nesta etapa. Gratuidade futura não está garantida.                                      |
| Anúncios                     | Não contar com anúncios                                       | Direção aceita pelo criador.                          | Nenhuma integração publicitária.                                                                                          |
| Beta                         | Fechado, gratuito, por 14 dias                                | Premissa aceita anteriormente, ainda não executada.   | Planejamento para cerca de 20 convidados. O prazo não começou.                                                            |
| Preço fundador               | A decidir após testar o mural                                 | Última resposta explícita do criador.                 | A proposta de R$ 49 por seis meses foi descartada. Não há novo preço, duração comercial definitiva ou checkout aprovados. |

## 3. Mapa das etapas

| Etapa                                 | Estado atual                                            | Próximo resultado esperado                                             |
| ------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1. Definição do produto               | Direção inicial definida; depende de feedback de uso    | Confirmar se a montagem do mural é simples para o público.             |
| 2. Base técnica e armazenamento local | Implementada                                            | Manter estabilidade durante os testes e preparar a transição de dados. |
| 3. Mural e galeria                    | Implementados para teste local                          | Aprovação prática dos layouts e dos controles.                         |
| 4. Planejamento opcional e prompts    | Implementados para teste local                          | Revisão editorial e validação de utilidade.                            |
| 5. Backup, PWA e verificação          | Implementados e testados no ambiente de desenvolvimento | Teste em aparelhos reais do público.                                   |
| 6. Supabase e contas privadas         | Estrutura preparatória; integração não iniciada         | Login, dados remotos e isolamento entre usuários comprovado.           |
| 7. Publicação e beta fechado          | Planejados; não iniciados                               | App acessível por HTTPS e teste com convidados.                        |
| 8. Monetização e lançamento           | Em aberto                                               | Oferta, preço, condições e pagamento definidos após validação.         |

## 4. Etapa 1 — definição do produto

### O que foi feito

Foram analisados o documento inicial, o público, a transformação desejada, o método orgânico do criador, as restrições de orçamento e os retornos durante o desenvolvimento. O nome, o público a partir de 16 anos e a direção visual foram definidos.

A prioridade mudou de uma jornada completa de visão e ação para um mural fácil de montar. A visualização guiada em texto foi retirada. Perguntas e metas foram mantidas como recursos opcionais.

### Por que

O mural permite entregar um primeiro resultado visual sem exigir várias respostas antes. Isso combina com pessoas que chegam das redes sociais e com a identidade de scrapbook já reconhecida pelo público.

### O que falta

- O criador testar a experiência atual e indicar ajustes.
- Validar os nomes, a composição e a utilidade dos cinco layouts.
- Confirmar se planejamento e prompts ajudam ou distraem da montagem do mural.
- Verificar disponibilidade de marca e domínio antes de investir na identidade definitiva.

**Critério de conclusão da validação inicial:** conseguir montar um mural representativo sem ajuda durante o uso e identificar claramente os ajustes prioritários. Ainda não temos evidência de uso pelo público.

## 5. Etapa 2 — base técnica e dados locais

### O que foi feito

- Interface em React e TypeScript, com build pelo Vite.
- Organização do código por funcionalidades e uma camada de dados separada.
- IndexedDB para guardar textos e imagens no navegador.
- Identificadores UUID, datas e relações entre sonho, metas, ações, galeria, cartões, eventos e revisões.
- Validação de estrutura e relações antes de gravar ou restaurar dados.
- Fila de alterações para evitar que operações simultâneas dentro da instância do app sobrescrevam o estado em memória.
- Gravação transacional de textos e arquivos relacionados.
- Migração dos textos da primeira versão, que usava localStorage.

### Por que

Fotos exigem um armazenamento mais adequado que localStorage. A camada separada permite reaproveitar as telas quando o armazenamento remoto entrar. As validações reduzem a chance de gravar referências quebradas ou restaurar um backup inconsistente.

### O que falta

- Implementar o repositório Supabase; o contrato atual não conecta o backend sozinho.
- Definir conflitos e sincronização entre aparelhos e múltiplas sessões.
- Definir como importar os dados locais para a conta real, com confirmação da pessoa.

**Critério de conclusão desta entrega local:** salvar, reabrir, editar, restaurar e excluir dados no navegador sem depender de serviços externos. Esses fluxos têm cobertura de testes; ainda é necessário testar o uso cotidiano em aparelhos reais.

## 6. Etapa 3 — mural, galeria e layouts

### O que foi feito

- Mural como tela inicial após a confirmação de faixa etária.
- Cinco layouts: **Recortes**, **Essencial**, **Instantes**, **Mosaico** e **Horizonte**.
- Envio de várias fotos de uma vez, com compressão local.
- Galeria independente do mural: retirar um cartão não apaga a foto original.
- Posicionamento por arrastar com mouse, pela alça de toque ou selecionando a foto e depois um espaço.
- Reordenação por setas, troca de fotos entre espaços e substituição de foto em espaço ocupado.
- Frases, legendas, descrição das imagens e cores dos cartões.
- Título editável e associação opcional de cartões a metas.
- Download do mural em PNG, considerando o layout escolhido.

### Por que

Layouts prontos reduzem o esforço de composição e o custo de construir um editor totalmente livre. Controles por toque e teclado oferecem uma alternativa ao arrastar. Separar galeria e mural permite experimentar a composição sem perder a imagem enviada.

### Limites da versão

Até 40 fotos na galeria e 40 cartões. Entrada JPG, PNG ou WebP de até 10 MB; imagens processadas com até 1600 pixels no maior lado e saída de até 2 MB. O navegador pode impor limites adicionais de armazenamento.

### O que falta

- Testar com fotos e murais reais do criador, além das imagens usadas na automação.
- Avaliar cortes das fotos, tamanhos e legibilidade das legendas em diferentes aparelhos.
- Ajustar a experiência de arrastar conforme o feedback de uso.
- Confirmar se os limites são suficientes para o beta.
- Conectar as imagens ao armazenamento privado remoto na etapa Supabase.

**Critério de aprovação:** a pessoa consegue escolher um layout, subir fotos, posicioná-las, trocar o layout e baixar o mural sem perder o trabalho.

## 7. Etapa 4 — recursos opcionais de apoio

### O que foi feito

- Perguntas com ramificações conforme a resposta inicial, retomada e revisão.
- Descrição de um sonho principal.
- Criação de metas com prazo opcional, obstáculo e alternativa.
- Criação, edição, conclusão, reabertura e reagendamento de ações.
- Tela Hoje para escolher uma ação e reconhecer o avanço.
- Histórico de eventos separado do estado atual das tarefas.
- Revisão semanal editável, com avanços, dificuldades e próximo ajuste.
- Montagem e cópia de prompts para ferramentas externas de imagem.

### Por que

Esses recursos conectam o mural a ações práticas sem tornar o planejamento obrigatório. Regras explícitas permitem personalização básica sem custo de IA. O histórico preserva o percurso mesmo quando uma tarefa muda de estado.

### O que falta

- Revisão do criador sobre perguntas, exemplos e tom de voz.
- Observar quais recursos o público realmente usa.
- Decidir se a navegação deve destacar menos os recursos secundários.
- Persistir os registros por conta quando o backend estiver conectado.

**Critério de aprovação:** os recursos ajudam quem quer planejar sem atrapalhar quem só quer montar o mural.

## 8. Etapa 5 — backup, instalação e verificação

### O que foi feito

- Backup JSON completo com fotos, mural e registros de planejamento.
- Restauração com validação dos dados, referências e imagens antes de substituir o conteúdo local.
- Exclusão dos dados locais e solicitação opcional de armazenamento persistente ao navegador.
- PWA com manifesto, ícones, mecanismo de atualização e cache da interface.
- Funcionamento offline após carregamento e controle pelo service worker.
- Layout responsivo, controles identificados, alternativa de navegação por teclado e respeito à preferência de movimento reduzido.
- Workflow de verificações preparado no GitHub Actions.

### Por que

Sem conta e sincronização, o backup é necessário para transferir ou recuperar o trabalho. A instalação aproxima a experiência de um app sem exigir publicação em lojas. O modo offline permite abrir a interface e acessar os dados locais após a primeira carga adequada.

### Evidências de verificação

| Verificação                            | Resultado registrado nesta entrega | Limite da evidência                                                                        |
| -------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------ |
| Build de produção e TypeScript         | Passaram                           | Não prova que um serviço de hospedagem já foi configurado.                                 |
| Análise estática e formatação          | Passaram                           | Não substituem avaliação de uso.                                                           |
| Cinco testes de dados                  | Passaram                           | Executados localmente com IndexedDB simulado para a camada de repositório.                 |
| 14 cenários de navegador               | Passaram após os ajustes           | Chromium em perfis de desktop e celular; não são testes em Safari ou em aparelhos físicos. |
| Upload, layouts, edição e exportação   | Verificados no navegador           | Não há comparação automática de cada detalhe visual do PNG em todos os layouts.            |
| Arrastar e alternativa por toque       | Verificados                        | Gestos em navegador automatizado; precisam de validação em dispositivos reais.             |
| Backup, restauração e arquivo inválido | Verificados                        | Não cobrem todas as falhas possíveis de espaço ou arquivos.                                |
| Reabertura offline com foto local      | Verificada                         | Depende de carregamento anterior, suporte do navegador e preservação dos dados do site.    |
| GitHub Actions                         | Workflow adicionado ao repositório | O resultado da execução remota não foi confirmado neste relatório.                         |

Os 14 cenários correspondem a sete fluxos executados nos dois perfis: mural completo; arrastar; backup e restauração; metas e revisão; offline; retomada da jornada sem duplicar o plano; e rejeição de imagem inválida com preservação da galeria.

### O que falta

- Testar em Android e iPhone reais, incluindo Safari.
- Avaliar instalação, atualização e downloads nos aparelhos escolhidos para o beta.
- Confirmar o resultado do workflow remoto.
- Reavaliar caches, saída da conta e dados offline quando houver autenticação.
- Completar a avaliação de acessibilidade com usuários e dispositivos; a implementação atual não é uma certificação.

**Critério de aprovação:** os fluxos essenciais funcionam nos aparelhos alvo e os limites de backup, armazenamento e instalação estão claros para os testadores.

## 9. Etapa 6 — Supabase e contas privadas

### O que já está preparado

- Contrato de repositório assíncrono separado das telas.
- Modelo de entidades compatível com a futura organização relacional.
- Arquivo SQL inicial para tabelas, referências, regras de acesso por usuário e bucket privado de imagens.
- Documento técnico com o mapeamento entre dados locais e Supabase.

**O SQL não foi aplicado nem validado em um projeto Supabase. Não existe login ou sincronização remota funcionando.**

### Por que essa etapa é necessária

Ela permite recuperar o mural ao trocar de aparelho e controlar o acesso por conta. Isso é diferente de apenas deixar os dados no aparelho de uso atual.

### O que falta

1. Escolher/configurar o projeto Supabase e conferir custos, limites e termos atuais.
2. Definir o método de login e recuperação de acesso.
3. Aplicar e testar o schema em ambiente de desenvolvimento.
4. Implementar o adaptador remoto e operações transacionais para registros relacionados.
5. Implementar upload privado, leitura autorizada e exclusão de imagens.
6. Definir falhas parciais entre upload de arquivo e gravação do banco, incluindo limpeza de arquivos órfãos.
7. Importar dados locais somente após confirmação, vinculando-os à identidade autenticada.
8. Definir conflitos entre dispositivos, saída de conta e comportamento offline autenticado.
9. Implementar limites efetivos no servidor e exclusão completa de conta e arquivos.
10. Testar com duas contas que nenhuma pode acessar dados ou fotos da outra.

**Critério de conclusão:** login, recuperação, retomada em outro aparelho, isolamento entre contas e exclusão completa comprovados por testes. Preparar tabelas, sozinho, não conclui esta etapa.

## 10. Etapa 7 — publicação e beta fechado

### O que já foi definido

Beta gratuito por 14 dias, com possibilidade de convidar cerca de 20 pessoas da audiência. Código está no GitHub; não há uma URL de produção do app registrada nesta entrega.

### Por que

O beta deve mostrar se a montagem do mural é fácil e se a experiência merece evoluir para uma oferta paga. O tamanho reduzido permite acompanhar dificuldades e corrigir problemas antes de ampliar o acesso.

### O que falta

- Aprovação da experiência pelo criador.
- Concluir a etapa de contas privadas antes do beta com contas reais.
- Escolher e configurar a hospedagem com HTTPS, endereço estável e processo de atualização.
- Preparar avisos de privacidade, termos, condições para adolescentes e canal de suporte.
- Definir como os convites e o prazo de beta serão controlados; isso não está automatizado hoje.
- Preparar um roteiro de teste e coletar feedback sem solicitar o conteúdo privado dos murais.
- Definir como medir conclusão do mural, dificuldade, retorno e interesse em pagar. Não há analytics implementado.
- Definir a data de início. Os 14 dias ainda não estão correndo.

**Critério de conclusão:** convidados conseguem usar o app; problemas e feedback ficam registrados; há uma decisão clara sobre o próximo ajuste e sobre avançar ou não com a oferta paga.

## 11. Etapa 8 — monetização e lançamento

### O que já foi decidido

Não depender de anúncios. A intenção é monetizar cedo com ticket acessível, mas o preço será decidido após testar o mural. A proposta anterior de R$ 49 por seis meses foi descartada.

### Por que

É necessário entender a utilidade percebida e o uso recorrente antes de escolher entre acesso por prazo, assinatura ou outro formato. O preço não pode ser definido apenas pelo custo de infraestrutura.

### O que falta

- Definir o que será gratuito e o que será pago.
- Escolher formato, preço e duração da oferta.
- Conferir custos reais de hospedagem, banco, fotos, e-mail, taxas e suporte.
- Definir gateway, meios de pagamento e condições de acesso após vencimento ou cancelamento.
- Preparar condições comerciais, reembolso, atendimento e estrutura fiscal.
- Revisar a contratação envolvendo menores de 18 anos.
- Implementar checkout e liberação de acesso; automatizar notificações de pagamento de forma segura.
- Testar aprovação, recusa, reembolso e cancelamento antes de vender.

**Critério de conclusão:** oferta aprovada, custos conhecidos, condições claras e fluxo de pagamento/acesso validado. Nenhuma cobrança deve ser considerada pronta na versão atual.

## 12. O que não faz parte da entrega atual

Geração de imagens dentro do app, assistente conversacional de IA, meditações, visualização guiada, notificações push, lembretes por e-mail, comunidade, compartilhamento público, integrações com calendários, aplicativo nativo de loja e outros idiomas não foram implementados.

Esses itens não entram automaticamente no roadmap. Qualquer inclusão depende de nova decisão, principalmente para preservar a simplicidade do mural e o orçamento.

## 13. Próxima sequência recomendada

1. O criador montar um mural com fotos próprias e testar os cinco layouts.
2. Registrar ajustes de composição, toque, arrastar, exportação e navegação.
3. Aprovar a experiência local.
4. Conectar e validar o Supabase.
5. Preparar hospedagem e condições do beta.
6. Executar o beta e usar os resultados para definir a oferta paga.

## 14. Como manter este documento atualizado

Ao concluir uma etapa, registrar a data, a versão de referência, o que foi entregue, os motivos, decisões alteradas, verificações executadas e pendências. Distinguir implementação, teste local, validação com pessoas e publicação. Não marcar uma etapa como concluída apenas porque sua estrutura foi preparada.

Documentos complementares:

- [Plano vigente](PLANO.md): visão resumida do escopo e da sequência.
- [Arquitetura](ARQUITETURA.md): detalhes técnicos e preparação para Supabase.
- [README](../README.md): comandos e instruções para rodar e testar.
