# Resumo Executivo das Decisões do Projeto — Usina da Vida

Este documento consolida os **pontos importantes, regras de negócio, decisões arquiteturais e escolhas de design** definidas e implementadas no projeto da ONG Usina da Vida.

---

## 1. Identidade Visual e Landing Page
- **Tipografia e Cores Oficiais:**
  - **Azul Institucional:** `#085EC3` / `#06479A`
  - **Amarelo Ouro:** `#F1C50E`
  - **Vermelho:** `#DB150A`
  - **Laranja:** `#F08D0C`
  - **Fontes:** *Lora* (títulos/serif) e *Lexend* / *Plus Jakarta Sans* (textos/sans).
- **Hero da Página Inicial:**
  - Ajuste na frase principal: a palavra **"realidade"** recebeu exatamente a mesma cor, fonte e estilo enfático da palavra **"sonhos"** (*"Transformando sonhos em realidade"*).
  - Marca d'água da logo no bloco azul atrás da colagem de imagens ajustada para responsividade mobile e desktop, evitando cortes e sobreposições desordenadas.
  - **Preservação de Mídia:** Garantida a permanência de todas as fotos e imagens originais da landing page (`img-01` a `img-37`).
- **Endereço Oficial da ONG:**
  - **Endereço cadastrado:** `R. Estrela D'álva, 13e - Arenoso, Salvador - BA, 41211-300`.
  - Exibido na seção "Onde estamos" do site e configurado como ponto central de referência.

---

## 2. Redesign do Portal de Gestão (Eliminação de Padrões Artificiais)
Foi realizada uma reformulação visual para remover qualquer aspecto genérico de "layout gerado por inteligência artificial" (como bordas multicoloridas aleatórias ou selos desnecessários), aplicando sistemas de design consolidados:

1. **Cards de Métricas / KPI (Visão Geral):**
   - **Modelo 3 (Cabeçalho Sólido Bicolor):**
     - Cabeçalho preenchido na cor sólida da métrica (`#085EC3`, `#F1C50E`, `#DB150A`, `#F08D0C`, etc.).
     - Ícone SVG em linha de traço limpo + rótulo claro.
     - Corpo inferior com fundo tonal suave correspondente e números escuros (`#0f172a`, `tabular-nums`).
   - Removido o aviso/badge *"Base de dados sincronizada"* e quaisquer menções a protótipo/fictício.

2. **Cards das Ações e Oficinas (Aba Ações):**
   - **Layout Escolhido:** Coluna lateral sólida de calendário + conteúdo estruturado à direita.
   - **Alternância de Cores:** As colunas laterais alternam estritamente entre as **4 cores da logomarca da Usina da Vida**:
     1. Azul (`#085EC3`)
     2. Amarelo Ouro (`#F1C50E` com tipografia escura de alto contraste)
     3. Vermelho (`#DB150A`)
     4. Laranja (`#F08D0C`)
   - Em uma grade de 3 colunas, a alternância garante que nenhuma cor se repita adjacente (nem na horizontal, nem na vertical).
   - Exibição de data/calendário em bloco vertical (`14 NOV · SÁB` para agendadas; `OUT 2026 · FEITA` para realizadas), barra de ocupação/progresso e gaveta expansível para confirmação de voluntários inscritos.

---

## 3. Filtros e Mapeamento Territorial de Salvador
- **Pinos Geográficos (Substituição do Layout de IA):**
  - Substituídas as pílulas largas de texto e linhas tracejadas ("teias de aranha") por **Pinos Teardrop SVG (padrão Mapbox / Leaflet)** com ancoragem exata na ponta inferior:
    - **Sede da ONG:** Pino escuro com anel dourado (`#F1C50E`), ícone de casa/sede e rótulo `Sede · R. Estrela D'álva, 13e`.
    - **Bairros com Voluntários:** Pinos em gota com a quantidade de voluntários inscritos centralizada no círculo branco e nome do bairro abaixo.
    - Tooltip e popup limpos indicando a distância precisa em km até a Sede no Arenoso.
- **Centralização Automática:**
  - Toda vez que o usuário abre o modal/gaveta de **"Filtros Territoriais & Mapa"**, o mapa centraliza automaticamente nas coordenadas exatas da Sede (`-12.9482, -38.4418`) em Arenoso.
- **Máscara de Exclusão Mútua nos Filtros:**
  - Quando os filtros territoriais/mapa são ativados, os filtros gerais de busca são automaticamente limpos e desabilitados visualmente com máscara (`opacity: 0.48`, `disabled`), evitando conflito simultâneo entre filtros incompatíveis.

---

## 4. Arquitetura Técnica e Ambientes
- **Repositório GitHub:** `https://github.com/usinadavida/Site-usina-da-vida` (Branch `main`).
- **Produção (Vercel):**
  - Site Institucional: `https://site-usina-da-vida.vercel.app/`
  - Portal Administrativo: `https://site-usina-da-vida.vercel.app/portal`
- **Banco de Dados:** Neon PostgreSQL com rotas de API em Next.js para inscrições, manifestações de interesse e persistência de dados.
- **Sincronização Obrigatória UCSAL:** Todas as alterações no código local (`prepare-pages.cjs`) são sincronizadas automaticamente com a pasta acadêmica da UCSAL: `D:\Dev. 2025\PROJETOS- UCSAL\Projeto - PWGV`.
