# Briefing de implementação visual
## Plataforma de Gestão da Usina da Vida

**Objetivo:** evoluir a interface atual da plataforma sem perder a identidade visual da Usina da Vida, usando três referências do Refero como orientação de arquitetura e qualidade visual.

## 1. Referências que devem ser utilizadas

As referências não devem ser copiadas literalmente. Elas devem servir como direção de layout, hierarquia, componentes e experiência de uso.

### Referência principal: Dub

[Dub — design system no Refero](https://styles.refero.design/style/b0d80806-b724-4ed1-a1d1-074edd3c9bc9)

Usar o Dub como **estrutura-base da aplicação**:

- Layout claro e administrativo;
- Fundo branco ou quase branco;
- Bordas finas em cards e tabelas;
- Navegação objetiva;
- Filtros organizados acima dos dados;
- Tabelas compactas e legíveis;
- Botões com hierarquia clara;
- Tags e badges para estados;
- Espaçamento consistente;
- Alta densidade de informação sem poluição visual.

### Referência de dashboard: Visitors

[Visitors — design system no Refero](https://styles.refero.design/style/e7876363-181a-44a9-9e5c-2255cf98aea5)

Usar o Visitors como referência para:

- Cards de indicadores;
- Gráficos;
- Métricas resumidas;
- Distribuição de cores por categoria;
- Tabelas analíticas;
- Hierarquia da tela de visão geral.

### Referência operacional: Orderful

[Orderful — design system no Refero](https://styles.refero.design/style/d95a35c2-d3f7-49e7-9ba7-282d52d3211d)

Usar o Orderful como referência para:

- Acompanhamento de processos;
- Estados de aprovação;
- Cards de ações;
- Histórico e auditoria;
- Fluxos administrativos;
- Mensagens de erro, alerta e sucesso;
- Organização das decisões por etapa.

## 2. Regra mais importante

Não misturar os estilos de forma aleatória.

A arquitetura deve seguir esta regra:

> **Dub define a estrutura. Visitors define a apresentação dos dados. Orderful define os fluxos e estados operacionais. A identidade da Usina da Vida define cores, logo, tipografia institucional e tom visual.**

A plataforma não deve parecer uma cópia do Dub, Visitors ou Orderful. O resultado deve parecer um produto próprio da Usina da Vida, inspirado nessas referências.

## 3. Identidade que deve ser preservada

Manter obrigatoriamente:

- Logo da Usina da Vida;
- Nome da organização;
- Identificação dos módulos Gestão e Presidência;
- Barra de navegação azul;
- Destaque amarelo da Presidência;
- Títulos institucionais com a personalidade tipográfica atual;
- Fundo claro;
- Uso de azul, amarelo, laranja, verde e vermelho;
- Tom visual institucional, comunitário e administrativo;
- Linguagem em português do Brasil.

Não substituir a identidade por uma estética genérica de startup, fintech ou dashboard escuro.

## 4. Direção visual final

A direção recomendada é:

> **Gestão Cívica Operacional:** uma plataforma administrativa clara, confiável, institucional e orientada a dados, com navegação simples, indicadores coloridos, tabelas eficientes, filtros fortes e estados de processo visíveis.

A interface deve comunicar:

- Organização;
- Transparência;
- Controle;
- Governança;
- Facilidade de operação;
- Rastreabilidade;
- Acesso por níveis de permissão.

## 5. Tokens visuais

Antes de alterar as telas, criar tokens centralizados. Não espalhar cores e medidas diretamente em componentes individuais.

### Cores

Usar os valores abaixo como ponto de partida. Ajustar os hexadecimais para os valores oficiais já utilizados na marca caso eles estejam definidos no projeto.

```css
:root {
  /* Superfícies */
  --color-page: #f7f9fc;
  --color-surface: #ffffff;
  --color-surface-subtle: #f1f5f9;
  --color-surface-muted: #eaf0f6;

  /* Estrutura */
  --color-border: #d9e2ec;
  --color-border-strong: #b9c7d6;
  --color-text: #172b4d;
  --color-text-secondary: #52606d;
  --color-text-muted: #7b8794;

  /* Identidade */
  --color-brand-blue: #1167b1;
  --color-brand-blue-dark: #0b3d91;
  --color-brand-blue-soft: #e8f1fb;
  --color-brand-yellow: #f2c300;

  /* Estados */
  --color-success: #168a4a;
  --color-success-soft: #e6f6ed;
  --color-warning: #d88900;
  --color-warning-soft: #fff4d6;
  --color-pending: #e56b16;
  --color-pending-soft: #fff0e5;
  --color-danger: #c62828;
  --color-danger-soft: #fdeaea;
  --color-info: #1769aa;
  --color-info-soft: #e8f2fb;
}
```

### Uso semântico das cores

As cores devem indicar significado. Não usar cor apenas como decoração.

| Cor | Uso obrigatório |
|---|---|
| Azul | Navegação, ações principais, links, dados gerais, informação institucional |
| Azul claro | Fundo de seleção, informação auxiliar e destaque neutro |
| Amarelo | Presidência, atenção moderada, aguardando decisão ou destaque institucional |
| Laranja | Em triagem, em preparação, pendente de análise |
| Verde | Aprovado, ativo, concluído, permitido, operação bem-sucedida |
| Vermelho | Erro, bloqueado, rejeitado, cancelado, situação crítica |
| Cinza | Inativo, indisponível, informação secundária ou estado neutro |

Nunca usar vermelho para elementos decorativos. Nunca usar verde para ações que ainda não foram concluídas.

## 6. Tipografia

Manter a personalidade atual dos títulos institucionais, especialmente em títulos de página e seções principais.

Usar uma fonte sem serifa para a maior parte da operação:

- Navegação;
- Botões;
- Tabelas;
- Filtros;
- Badges;
- Formulários;
- Números;
- Mensagens de sistema.

### Hierarquia recomendada

| Elemento | Tamanho aproximado | Peso |
|---|---:|---:|
| Título principal da página | 26–32px | 600 ou equivalente |
| Subtítulo | 14–16px | 400 |
| Título de card | 14–16px | 600 |
| Número de indicador | 24–32px | 700 |
| Corpo de texto | 14–16px | 400 |
| Cabeçalho de tabela | 11–12px | 600, preferencialmente em caixa alta moderada |
| Dados de tabela | 13–14px | 400 |
| Badge/status | 11–12px | 600 |
| Texto auxiliar | 12–13px | 400 |

Não usar muitos pesos, tamanhos ou famílias tipográficas. O sistema precisa parecer consistente.

## 7. Espaçamento e formas

Adotar escala baseada em 4px ou 8px.

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-pill: 999px;
}
```

Regras:

- Cards: raio de 8–12px;
- Botões: raio de 6–8px;
- Inputs: raio de 6–8px;
- Tags e badges: formato pill;
- Tabelas: raio externo de 8–12px;
- Bordas: 1px, sem excesso de sombras;
- Sombra: usar apenas quando for necessário destacar modal, menu ou elemento flutuante.

## 8. Estrutura geral da aplicação

Manter a navegação horizontal atual porque ela faz parte da identidade mostrada nas imagens.

### Cabeçalho

O cabeçalho deve conter:

- Logo da Usina da Vida à esquerda;
- Identificação do módulo atual, como “Gestão”;
- Menu principal;
- Usuário ou área atual à direita;
- Botão de contexto “Presidência” quando aplicável;
- Botão “Sair”.

### Navegação principal

Usar os módulos:

1. Visão geral;
2. Voluntários;
3. Ações;
4. Níveis de acesso;
5. Outros módulos futuros.

A aba ativa deve ter:

- Fundo ou linha azul mais forte;
- Texto com contraste alto;
- Estado visual persistente;
- Não depender apenas de cor: usar também sublinhado, borda ou peso tipográfico.

### Área de conteúdo

Cada tela deve seguir esta estrutura:

1. Breadcrumb ou identificação contextual, quando necessário;
2. Título da página;
3. Descrição curta da finalidade;
4. Ações principais no canto direito;
5. Filtros, quando houver;
6. Conteúdo principal;
7. Paginação ou resumo de resultados;
8. Mensagens de sucesso, erro ou estado vazio.

## 9. Componentes obrigatórios

Criar componentes reutilizáveis antes de refazer todas as telas.

### 9.1. PageHeader

Props recomendadas:

- `title`;
- `description`;
- `breadcrumb`;
- `actions`;
- `status` opcional.

Deve comportar títulos longos e funcionar em desktop e mobile.

### 9.2. MetricCard

Usar na Visão Geral.

Cada card deve conter:

- Nome do indicador;
- Número principal;
- Texto auxiliar ou período;
- Ícone discreto;
- Cor semântica;
- Link opcional para detalhamento.

Não colocar mais de uma métrica principal no mesmo card.

### 9.3. StatusBadge

Estados iniciais:

- Novo;
- Em análise;
- Em triagem;
- Aprovado;
- Ativo;
- Concluído;
- Pendente;
- Bloqueado;
- Cancelado;
- Arquivado.

Cada estado deve possuir cor, texto e, quando possível, ícone. A informação não pode depender apenas da cor.

### 9.4. FilterBar

A barra de filtros deve conter:

- Busca textual;
- Selects de filtro;
- Filtro por status;
- Filtro por localização ou bairro;
- Filtro por disponibilidade;
- Botão “Aplicar filtros” quando a aplicação não for instantânea;
- Botão “Limpar filtros”;
- Contador de filtros ativos.

Filtros avançados podem abrir um painel lateral ou modal. Não colocar todos os filtros possíveis visíveis ao mesmo tempo em telas pequenas.

### 9.5. DataTable

A tabela deve suportar:

- Ordenação por coluna;
- Busca;
- Paginação;
- Seleção de linha, se necessário;
- Ações por linha;
- Colunas responsivas;
- Estado vazio;
- Estado carregando;
- Estado de erro;
- Exportação CSV;
- Colunas configuráveis quando a densidade for alta.

As ações mais importantes devem aparecer na última coluna ou em menu de contexto. Não esconder ações essenciais em ícones sem tooltip.

### 9.6. StatusCell

Para cada linha, o status precisa ser visualmente identificável. Exemplo:

- Badge “Aprovado”;
- Texto auxiliar “Recebido em 18/10/2026”;
- Ação disponível “Editar” ou “Ver detalhes”.

### 9.7. ActionCard

Cada card de ação deve conter:

- Nome da ação;
- Categoria;
- Status;
- Data;
- Local;
- Responsável;
- Quantidade de voluntários;
- Barra ou indicador de progresso;
- Ações disponíveis.

Usar o padrão do Orderful para distinguir ações planejadas, em preparação, em andamento, concluídas e canceladas.

### 9.8. PermissionMatrix

A matriz de permissões deve conter:

- Nome da permissão;
- Descrição curta;
- Presidência;
- Coordenação;
- Colaborador autorizado;
- Estado permitido ou bloqueado;
- Botão para editar quando o usuário tiver autorização.

Usar “Permitido”, “Restrito” e “Bloqueado” com texto visível. Não usar apenas cadeados ou cores.

### 9.9. AuditLog

A trilha de auditoria deve registrar:

- Data e hora;
- Operação;
- Entidade alterada;
- Usuário responsável;
- Valor anterior, quando relevante;
- Novo valor, quando relevante;
- Link para detalhes.

O log deve ser legível e filtrável por data, usuário e tipo de operação.

### 9.10. MapPanel

Para a tela de voluntários, manter o mapa como painel secundário, não como elemento dominante.

O mapa deve:

- Respeitar os filtros aplicados;
- Mostrar a quantidade de resultados visíveis;
- Ter legenda clara;
- Mostrar localização da sede;
- Ter estado vazio quando não houver resultado;
- Ter alternativa textual para acessibilidade;
- Não ser o único modo de localizar um voluntário.

## 10. Tela por tela

### 10.1. Visão geral

Usar principalmente a lógica do Visitors.

Estrutura:

1. Título “Visão Geral dos Cadastros”;
2. Descrição da finalidade;
3. Seis MetricCards;
4. Gráfico “Voluntários por área de atuação”;
5. Gráfico “Inscrições por status”;
6. Bloco de pendências;
7. Atividade recente;
8. Link para cada detalhamento.

Cards sugeridos:

- Cadastros totais;
- Novas inscrições;
- Em triagem;
- Voluntários ativos;
- Ações realizadas;
- Ações pendentes.

Boas práticas:

- Não usar gráficos 3D;
- Mostrar os valores diretamente;
- Exibir legenda clara;
- Permitir período de análise;
- Usar cores consistentes com os StatusBadges;
- Mostrar estado sem dados de forma útil.

### 10.2. Voluntários

Usar o Dub como estrutura e o Orderful para status.

Estrutura:

1. Título “Voluntários Cadastrados”;
2. Descrição curta;
3. Botões “Limpar filtros” e “Exportar lista CSV”;
4. FilterBar;
5. Painel de filtros territoriais e mapa;
6. Contador de resultados;
7. DataTable;
8. Paginação.

Colunas sugeridas:

- Nome;
- Área de atuação;
- Formação;
- Disponibilidade;
- Localização;
- Atividade;
- Contato direto;
- Status;
- Ações.

No mobile, transformar cada linha em card ou permitir rolagem horizontal controlada. Não reduzir a tabela até ficar ilegível.

### 10.3. Ações

Usar o Orderful para o fluxo de acompanhamento e o Visitors para os indicadores.

Estrutura:

1. Título “Ações e Projetos Comunitários”;
2. Abas ou filtros por estado;
3. Botão “Cadastrar nova ação”;
4. Cards de ações especiais ou prioritárias;
5. Seção de ações realizadas;
6. Filtros por categoria, data, local e status;
7. Paginação ou carregamento progressivo.

Cada card deve destacar o status visualmente, mas sem colorir toda a superfície. Usar uma faixa, badge ou ícone de estado.

### 10.4. Níveis de acesso

Usar a lógica do Orderful e preservar o tom institucional.

Estrutura:

1. Título “Governança e Níveis de Acesso”;
2. Descrição sobre permissões;
3. Cards resumindo os perfis;
4. PermissionMatrix;
5. Seção de trilha de auditoria;
6. Filtros e busca de permissões.

Os perfis devem ser claramente diferenciados:

- Presidência;
- Coordenação;
- Colaborador autorizado.

Não permitir que uma alteração de permissão ocorra sem confirmação. Para ações críticas, mostrar uma mensagem explicando o impacto.

## 11. Estados que o programador precisa implementar

Cada tela deve ter, no mínimo, os seguintes estados:

### Carregando

- Skeleton ou indicador discreto;
- Preservar a estrutura da tela;
- Não mostrar dados falsos como se fossem reais.

### Vazio

- Informar que não há registros;
- Explicar o que o usuário pode fazer;
- Incluir ação quando aplicável, como “Cadastrar voluntário”.

### Erro

- Explicar o problema em linguagem simples;
- Oferecer “Tentar novamente”;
- Não exibir stack trace para o usuário final.

### Sucesso

- Mostrar confirmação após salvar, aprovar, exportar ou alterar permissões;
- Informar o que foi alterado;
- Usar toast ou mensagem contextual sem bloquear a operação.

### Sem permissão

- Explicar que o usuário não possui acesso;
- Mostrar quem pode solicitar ou conceder acesso;
- Não exibir campos editáveis quando a ação estiver bloqueada.

## 12. Responsividade

A plataforma precisa funcionar em:

- Desktop amplo;
- Notebook;
- Tablet;
- Celular.

Regras:

- Não esconder ações críticas apenas no hover;
- Transformar tabelas em cards ou rolagem horizontal no mobile;
- Permitir que a navegação horizontal tenha rolagem acessível;
- Reorganizar os cards de indicadores em uma ou duas colunas;
- Mover filtros avançados para drawer no mobile;
- Reduzir o mapa antes de reduzir a tabela ou os dados principais;
- Manter botões com área de toque adequada.

## 13. Acessibilidade

Implementar:

- Contraste mínimo adequado;
- Foco visível no teclado;
- Labels em todos os inputs;
- Texto alternativo para ícones e mapas;
- Status identificados por texto, não apenas por cor;
- Navegação por teclado;
- Tabelas com cabeçalhos semânticos;
- Mensagens de erro associadas aos campos;
- Ordem de tabulação lógica.

O vermelho, verde, amarelo e azul não podem ser a única forma de diferenciar estados.

## 14. O que não fazer

Não fazer as seguintes alterações:

- Não trocar a plataforma para modo escuro;
- Não remover a barra azul da identidade atual;
- Não substituir a tipografia institucional sem validação;
- Não usar gradientes fortes em cards administrativos;
- Não usar sombras pesadas em todos os componentes;
- Não transformar tudo em cards quando uma tabela for mais eficiente;
- Não usar cores sem significado;
- Não usar ícones sem texto em ações críticas;
- Não esconder filtros importantes;
- Não colocar todos os dados em uma única tela sem hierarquia;
- Não copiar logo, imagens ou componentes proprietários das referências;
- Não reproduzir exatamente o layout de Dub, Visitors ou Orderful;
- Não sacrificar legibilidade para deixar a tela mais “moderna”.

## 15. Ordem de implementação

### Fase 1 — Base visual

1. Criar tokens de cor, tipografia, espaçamento, raio e borda;
2. Criar componentes de botão, input, badge, card e tooltip;
3. Padronizar o cabeçalho e a navegação;
4. Definir estados de foco, hover, disabled e active;
5. Garantir acessibilidade básica.

### Fase 2 — Componentes de dados

1. Criar MetricCard;
2. Criar FilterBar;
3. Criar DataTable;
4. Criar StatusBadge;
5. Criar gráficos padronizados;
6. Criar estados loading, empty, error e success.

### Fase 3 — Telas principais

1. Refazer Visão Geral;
2. Refazer Voluntários;
3. Refazer Ações;
4. Refazer Níveis de acesso;
5. Integrar mapa, exportação e auditoria.

### Fase 4 — Qualidade

1. Testar desktop, tablet e celular;
2. Testar acessibilidade por teclado;
3. Testar contraste;
4. Validar textos e status;
5. Validar permissões;
6. Validar exportação CSV;
7. Testar estados sem dados e com erro;
8. Fazer revisão visual comparando com as imagens de referência da Usina da Vida.

## 16. Critérios de aceite

A implementação será considerada correta quando:

- A identidade visual da Usina da Vida continuar reconhecível;
- A navegação azul continuar presente e consistente;
- A Visão Geral apresentar métricas e gráficos com hierarquia clara;
- A tela de Voluntários permitir filtrar, visualizar no mapa e exportar dados;
- A tela de Ações exibir status e progresso de forma compreensível;
- A tela de Níveis de acesso mostrar permissões por perfil;
- A trilha de auditoria registrar operações importantes;
- Todas as tabelas possuírem estados de carregamento, vazio e erro;
- Todas as cores tiverem significado definido;
- A interface funcionar em desktop, tablet e celular;
- O sistema não depender exclusivamente de cor para comunicar status;
- Não houver mistura visual descontrolada entre os três estilos;
- Dub, Visitors e Orderful forem usados como referências, não como cópias;
- O resultado final parecer uma evolução própria da Usina da Vida.

## 17. Resumo para o programador

Implementar a plataforma usando o **Dub como base estrutural**, o **Visitors para dashboard e indicadores** e o **Orderful para fluxos, status, governança e auditoria**.

Manter a identidade da Usina da Vida com fundo claro, navegação azul, destaque amarelo da Presidência, títulos institucionais e cores funcionais para estados.

Priorizar legibilidade, filtros, tabelas, permissões, rastreabilidade e responsividade. A interface deve ser institucional e operacional, não uma cópia visual das referências.

A regra final é:

> **Clareza do Dub, dados do Visitors, operação do Orderful e identidade da Usina da Vida.**

## Referências

[1]: https://refero.design/ "Refero Design Research"

[2]: https://styles.refero.design/style/b0d80806-b724-4ed1-a1d1-074edd3c9bc9 "Dub design system no Refero"

[3]: https://styles.refero.design/style/e7876363-181a-44a9-9e5c-2255cf98aea5 "Visitors design system no Refero"

[4]: https://styles.refero.design/style/d95a35c2-d3f7-49e7-9ba7-282d52d3211d "Orderful design system no Refero"
