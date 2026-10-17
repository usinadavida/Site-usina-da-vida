// Extrai imagens base64 dos HTMLs originais e gera paginas leves em public/
const fs = require('fs');
const path = require('path');

const SRC = 'D:/Dev. 2025/PROJETOS- UCSAL/Projeto - PWGV';
const OUT = path.join(__dirname, '..', 'public');
const ASSETS = path.join(OUT, 'assets');
fs.mkdirSync(ASSETS, { recursive: true });

const seen = new Map(); // hash curto -> caminho (evita duplicar imagens iguais)
let n = 0;

// Liga os formularios da landing a API (Neon). Falha alto se o HTML mudar.
function ligarLanding(html) {
  const reForm = /e2\.classList\.remove\('vis'\); b2\.className='feita';\s*var ok_ = document\.getElementById\('ok'\); ok_\.classList\.add\('vis'\); ok_\.focus\(\);\s*f\.scrollIntoView\(\{behavior:'smooth', block:'start'\}\);/;
  const reModal = /passo\(3\); document\.getElementById\('m-p3'\)\.focus\(\);/;
  if (!reForm.test(html) || !reModal.test(html)) throw new Error('Trechos do formulario nao encontrados: HTML original mudou.');
  html = html.replace(reForm, () =>
    "var corpo={}; new FormData(f).forEach(function(v,k){ corpo[k]=(corpo[k]===undefined)?v:[].concat(corpo[k],v); });\n" +
    "    var enviar=f.querySelector('button[type=submit]'); if(enviar) enviar.disabled=true;\n" +
    "    fetch('/api/inscricoes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(corpo)})\n" +
    "      .then(function(r){ if(!r.ok) throw new Error(r.status);\n" +
    "        e2.classList.remove('vis'); b2.className='feita';\n" +
    "        var ok_ = document.getElementById('ok'); ok_.classList.add('vis'); ok_.focus();\n" +
    "        f.scrollIntoView({behavior:'smooth', block:'start'}); })\n" +
    "      .catch(function(){ alert('Nao foi possivel enviar agora. Tente novamente em instantes.'); })\n" +
    "      .then(function(){ if(enviar) enviar.disabled=false; });");
  html = html.replace(reModal, () =>
    "fetch('/api/interesses',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nome:n.value.trim(),email:e.value.trim(),tel:t.value.trim(),acao:acaoAtual})})\n" +
    "      .then(function(r){ if(!r.ok) throw new Error(r.status); passo(3); document.getElementById('m-p3').focus(); })\n" +
    "      .catch(function(){ alert('Nao foi possivel registrar agora. Tente novamente em instantes.'); });");

  const estilosAjustados = `<style id="altura-padrao">
/* Escala visual de 82% calibrada para desktop (reproduz nativamente a visualização em 100% de zoom) */
html {
  scroll-behavior: smooth;
}
@media (min-width:1001px){
  body {
    zoom: 0.82;
  }
  #acoes,#proximas,#quem-somos,#programas,#inscricao,#parceiros{
    min-height: calc(100vh - 65px);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: center;
    scroll-margin-top: 65px;
  }
  #acoes>.wrap,#proximas>.wrap,#quem-somos>.wrap,#programas>.wrap,#inscricao>.wrap,#parceiros>.wrap{width:100%}
  #programas,#parceiros{padding-top:34px;padding-bottom:34px}
  #parceiros .parc-lista{margin-top:16px}
  #parceiros .paises{margin-top:18px;padding-top:14px}
  #parceiros .paises-grid{margin-top:12px;gap:16px 14px}
}
/* Marca d'água da logomarca no bloco azul (sombreamento uniforme e posicionamento responsivo) */
.hero .wrap {
  position: relative;
  z-index: 1;
}
.hero .grande {
  z-index: 0;
  filter: brightness(0.18);
  opacity: 0.14;
}
@media (max-width: 900px) {
  .hero .wrap {
    padding-bottom: 84px;
  }
  .hero .grande {
    display: block !important;
    width: min(72vw, 310px);
    right: -14px;
    bottom: 6px;
    opacity: 0.14;
    filter: brightness(0.18);
  }
  .hero .colagem {
    aspect-ratio: 1 / 0.98;
    margin-right: 10px;
  }
  .hero .colagem .c2 {
    right: 8%;
    bottom: 10%;
    width: 42%;
  }
}
</style>`;

  const scriptScrollPreciso = `<script id="scroll-preciso">
(function(){
  function scrollExato(href){
    if (href === '#' || href === '#topo') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    var target = document.querySelector(href);
    if (!target) return;
    var header = document.querySelector('header.top');
    var hH = header ? header.getBoundingClientRect().height : 0;
    var targetY = window.pageYOffset + target.getBoundingClientRect().top - hH;
    window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
  }

  document.addEventListener('click', function(e){
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (href && href !== '#' && document.querySelector(href)) {
      e.preventDefault();
      scrollExato(href);
      if (history.pushState) history.pushState(null, null, href);
    }
  });
})();
</script>`;

  html = html.replace('<h1>Transformando <em>sonhos</em> em realidade</h1>', '<h1>Transformando <em>sonhos</em> em <em>realidade</em></h1>');
  html = html.replace('</head>', () => estilosAjustados + '\n</head>');
  html = html.replace('</body>', () => scriptScrollPreciso + '\n</body>');
  html = html.split('href="portal.html"').join('href="/portal"');
  return html;
}

// Redesenha o portal: remove avisos de IA/protótipo, alinha identidade e ajusta proporção para 1360x768
function redesenharPortal(html) {
  // 1. Remover faixas e textos de "protótipo", "fictício", "demonstração" e "RF11"
  html = html.replace(/<div class="protot">[\s\S]*?<\/div>/, '');
  html = html.replace(/<div class="aviso">[\s\S]*?<\/div>/, '');
  html = html.replace(/<p class="nota">Clique em qualquer número[\s\S]*?<\/p>/, '');
  html = html.replace(/<p class="nota">Mapa esquemático[\s\S]*?<\/p>/, '');
  html = html.replace(/<p class="nota">As vagas e as confirmações abaixo são uma simulação[\s\S]*?<\/p>/, '');
  html = html.replace(/<p class="nota">Sugestão inicial para validar com a ONG[\s\S]*?<\/p>/, '');
  html = html.replace(/<em>Ver detalhes &rarr;<\/em>/g, '');

  // 2. Corrigir textos de login e placeholders institucionais
  html = html.replace('Acesso exclusivo à presidência, à coordenação e a colaboradores autorizados.', 'Painel Administrativo do Voluntariado · Autenticação Restrita');
  html = html.replace('placeholder="nome@exemplo.com"', 'placeholder="admin@usinadavida.org.br"');
  html = html.replace('<button class="btn btn-azul" type="submit" style="width:100%">Entrar</button>', '<button class="btn btn-azul" type="submit" style="width:100%;font-size:1rem;padding:12px">Entrar no Portal de Gestão</button>');

  // 3. Corrigir links para a raiz da landing page
  html = html.split('href="index.html"').join('href="/"');
  html = html.replace('← Voltar ao site da Usina da Vida', '<svg class="ico-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg> Retornar ao site institucional');

  // 4. Transformar Visão Geral com cabeçalho institucional limpo (sem badge 'Base de dados sincronizada')
  html = html.replace('<h2>Visão geral dos cadastros</h2>', 
    '<div class="painel-cab">' +
    '  <div>' +
    '    <h2>Visão Geral dos Cadastros</h2>' +
    '    <p class="subtitulo-painel">Acompanhamento de voluntários inscritos, etapas de triagem e ações comunitárias.</p>' +
    '  </div>' +
    '</div>');

  // Ícones SVG reutilizáveis
  const svgSearch = '<svg class="ico-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>';
  const svgPin = '<svg class="ico-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
  const svgMap = '<svg class="ico-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>';
  const svgCheck = '<svg class="ico-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
  const svgUsers = '<svg class="ico-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
  const svgCalendar = '<svg class="ico-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  const svgLock = '<svg class="ico-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
  const svgWa = '<svg class="ico-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  const svgPlus = '<svg class="ico-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
  const svgShield = '<svg class="ico-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';

  // 5. Transformar Voluntários: cabeçalho com ações no topo, filtros com máscara de exclusividade e gaveta territorial
  const volAntigo = /<h2>Voluntários cadastrados<\/h2>\s*<div class="filtros"[\s\S]*?<\/table>\s*<div id="vazio"/;
  const volNovo = 
    '<div class="painel-cab">' +
    '  <div>' +
    '    <h2>Voluntários Cadastrados</h2>' +
    '    <p class="subtitulo-painel">Consulta de perfis, disponibilidade e localização por bairro em Salvador.</p>' +
    '  </div>' +
    '  <div class="acoes-topo-vol">' +
    '    <button class="btn btn-cont" id="limpar" type="button">Limpar filtros</button>' +
    '    <button class="btn btn-azul" id="csv" type="button">Exportar lista (CSV)</button>' +
    '  </div>' +
    '</div>\n' +
    '<!-- BARRA PRINCIPAL DE FILTROS -->' +
    '<div class="filtros-barra" id="filtros-barra-principal" role="search" aria-label="Filtros de voluntários">' +
    '  <div class="filtros-gerais-grupo" id="filtros-gerais-grupo">' +
    '    <div class="filtro-campo campo-busca">' +
    '      <label for="f-busca">Buscar por nome</label>' +
    '      <div class="busca-input-wrap">' +
    '        <span class="busca-ico">' + svgSearch + '</span>' +
    '        <input id="f-busca" type="text" placeholder="Digite o nome do voluntário...">' +
    '      </div>' +
    '    </div>' +
    '    <div class="filtro-campo">' +
    '      <label for="f-area">Área de atuação</label>' +
    '      <select id="f-area"></select>' +
    '    </div>' +
    '    <div class="filtro-campo">' +
    '      <label for="f-status">Status da inscrição</label>' +
    '      <select id="f-status"></select>' +
    '    </div>' +
    '    <div class="filtro-campo">' +
    '      <label for="f-disp">Disponibilidade</label>' +
    '      <select id="f-disp"></select>' +
    '    </div>' +
    '  </div>' +
    '  <div class="filtro-campo campo-btn-geo">' +
    '    <label>&nbsp;</label>' +
    '    <button type="button" id="btn-toggle-geo" class="btn-geo-toggle" aria-expanded="false">' +
    '      ' + svgPin + ' <span id="txt-btn-geo">Filtros Territoriais &amp; Mapa</span>' +
    '    </button>' +
    '  </div>' +
    '</div>\n' +
    '<!-- GAVETA EXPANSÍVEL DE FILTROS AVANÇADOS E MAPA TERRITORIAL -->' +
    '<div class="gaveta-geo" id="gaveta-geo" style="display:none">' +
    '  <div class="gaveta-grid">' +
    '    <div class="geo-filtros-extra">' +
    '      <div class="filtro-campo" id="wrap-f-bairro"><label for="f-bairro">Bairro / Localidade</label><select id="f-bairro"></select></div>' +
    '      <div class="filtro-campo" id="wrap-f-form"><label for="f-form">Formação acadêmica</label><select id="f-form"></select></div>' +
    '      <div class="filtro-campo" id="wrap-f-ativ"><label for="f-ativ">Alocação em atividade</label><select id="f-ativ"></select></div>' +
    '      <div class="filtro-campo" id="wrap-f-ref"><label for="f-ref">Ponto focal de referência</label><select id="f-ref"></select></div>' +
    '      <div class="filtro-campo" id="wrap-f-raio"><label for="f-raio">Raio de proximidade (km)</label><input id="f-raio" type="number" min="0" max="200" step="0.5" inputmode="decimal" list="raios" placeholder="Ex.: 4,5"><datalist id="raios"><option value="3"><option value="5"><option value="8"><option value="12"><option value="20"></datalist></div>' +
    '    </div>' +
    '    <div class="geo-mapa-wrap">' +
    '      <div class="mapa-cab"><b class="mapa-titulo-ic">' + svgMap + ' Mapa Territorial de Salvador</b><span id="mapa-leg"></span></div>' +
    '      <div id="mapa-leaflet" role="region" aria-label="Mapa interativo dos bairros de Salvador"></div>' +
    '      <svg id="mapa" viewBox="0 0 330 175" role="img" aria-label="Mapa esquemático dos bairros com o raio de distância" style="display:none"></svg>' +
    '      <p class="mapa-info">Sede da ONG destacada no <b>Arenoso</b>. Clique em qualquer bairro para filtrar voluntários ou alterar o ponto focal.</p>' +
    '    </div>' +
    '  </div>' +
    '</div>\n' +
    '<div class="tabela-meta-barra">' +
    '  <span id="contagem" aria-live="polite"></span>' +
    '</div>\n' +
    '<div class="tabela-wrap">' +
    '  <table>' +
    '    <caption class="oculto" style="position:absolute;left:-999px">Lista de voluntários</caption>' +
    '    <thead><tr><th>Nome</th><th>Área(s)</th><th>Formação</th><th>Disponibilidade</th><th>Localização</th><th>Atividade</th><th>Contato Direto</th><th>Status</th></tr></thead>' +
    '    <tbody id="corpo"></tbody>' +
    '  </table>\n' +
    '  <div id="vazio"';

  if (volAntigo.test(html)) {
    html = html.replace(volAntigo, volNovo);
  }

  // Conectar função mapa(lista) ao mapa interativo Leaflet e incluir Arenoso como sede da ONG
  html = html.replace(
    'var BAIRROS = ["Pituba","Brotas","Itapuã","Liberdade","Cabula","Federação","Barra","Ondina"];',
    'var BAIRROS = ["Arenoso","Pituba","Brotas","Itapuã","Liberdade","Cabula","Federação","Barra","Ondina"];'
  );
  html = html.replace(
    'var COORD = {"Pituba":[-12.9996,-38.4586],"Brotas":[-12.9858,-38.4979],"Itapuã":[-12.9533,-38.3563],"Liberdade":[-12.9486,-38.4887],"Cabula":[-12.9570,-38.4560],"Federação":[-12.9980,-38.5060],"Barra":[-13.0105,-38.5330],"Ondina":[-13.0050,-38.5120]};',
    'var COORD = {"Arenoso":[-12.9465,-38.4385],"Pituba":[-12.9996,-38.4586],"Brotas":[-12.9858,-38.4979],"Itapuã":[-12.9533,-38.3563],"Liberdade":[-12.9486,-38.4887],"Cabula":[-12.9645,-38.4595],"Federação":[-12.9980,-38.5060],"Barra":[-13.0105,-38.5330],"Ondina":[-13.0050,-38.5120]};'
  );
  html = html.replace(
    '$("f-ref").value="Brotas"; tabela();',
    '$("f-ref").value="Arenoso"; tabela();'
  );
  html = html.replace(
    'popula("f-ref","",BAIRROS); $("f-ref").remove(0); $("f-ref").value="Brotas";',
    'popula("f-ref","",BAIRROS); $("f-ref").remove(0); Array.prototype.forEach.call($("f-ref").options,function(op){ if(op.value==="Arenoso"){ op.value="Arenoso"; op.textContent="Arenoso (Sede da ONG)"; } }); $("f-ref").value="Arenoso";'
  );
  html = html.replace(
    '$("mapa-leg").textContent = r ? "Raio de "+String(r).replace(".",",")+" km a partir de "+ref : "Selecione um raio para ver o alcance";',
    '$("mapa-leg").textContent = r ? "Raio de "+String(r).replace(".",",")+" km a partir de "+(ref==="Arenoso"?"Arenoso (Sede ONG)":ref) : "Referência: "+(ref==="Arenoso"?"Arenoso (Sede ONG)":ref); if (typeof window.atualizarMapaLeaflet === "function") window.atualizarMapaLeaflet(lista, ref, r, cont, COORD, BAIRROS, km);'
  );
  html = html.replace(
    "(raioKm()?'<br><small class=\"oculto\">'+km(v.bairro,$(\"f-ref\").value).toFixed(1).replace(\".\",\",\")+' km</small>':'')",
    "('<br><small class=\"dist-sede\">'+(v.bairro===$(\"f-ref\").value ? (v.bairro===\"Arenoso\"?\"Sede da ONG (0 km)\":\"Ponto focal (0 km)\") : km(v.bairro,$(\"f-ref\").value).toFixed(1).replace(\".\",\",\")+' km '+($(\"f-ref\").value===\"Arenoso\"?\"da Sede\":\"de \"+$(\"f-ref\").value))+'</small>')"
  );

  // 6. Transformar Ações: cabeçalho institucional, toolbar com botão justificado à direita e padronização visual
  html = html.replace(/<h2>Ações<\/h2>\s*<p style="margin:0">[\s\S]*?<\/p>/, 
    '<div class="painel-cab">' +
    '  <div>' +
    '    <h2>Ações e Projetos Comunitários</h2>' +
    '    <p class="subtitulo-painel">Registro de oficinas realizadas e agendamento de novas atividades para voluntários.</p>' +
    '  </div>' +
    '</div>');

  // Toolbar com filtros de ações à esquerda e botão de cadastrar ação justificado à direita (sem selo artificial 'Inovação')
  const subAntigo = /<div class="sub" role="tablist" aria-label="Tipo de ação">[\s\S]*?<\/div>/;
  const subNovo = 
    '<div class="acoes-toolbar">\n' +
    '  <div class="sub" role="tablist" aria-label="Tipo de ação">\n' +
    '    <button type="button" role="tab" id="s-todas" aria-selected="true">Todas <span id="n-todas"></span></button>\n' +
    '    <button type="button" role="tab" id="s-real" aria-selected="false">Realizadas <span id="n-real"></span></button>\n' +
    '    <button type="button" role="tab" id="s-agend" aria-selected="false">Agendadas <span id="n-agend"></span></button>\n' +
    '  </div>\n' +
    '  <div class="acoes-cad-wrap">\n' +
    '    <button type="button" id="btn-nova-acao" class="btn-cad-acao" title="Cadastrar nova ação comunitária">\n' +
    '      ' + svgPlus + '\n' +
    '      <span class="txt-cad-acao">Cadastrar nova ação</span>\n' +
    '    </button>\n' +
    '  </div>\n' +
    '</div>';
  if (subAntigo.test(html)) {
    html = html.replace(subAntigo, subNovo);
  }

  // Padronização rigorosa dos dados iniciais de ações (mesma média de ~95-100 caracteres)
  const agendOriginal = /var AGEND = \[[\s\S]*?var ACOES = \[[\s\S]*?\];/;
  const agendPadronizado = 
`var AGEND = [
    {t:"Palestra Novembro Azul",a:"Saúde & bem-estar",c:"#085EC3",dt:"Sáb, 14/11/2026",loc:"Sede Usina da Vida · 09h",vagas:10,p:"Palestra de conscientização sobre saúde integral do homem com acolhimento, recepção e apoio comunitário.",insc:[[1,1],[3,1],[4,1],[6,1],[9,1],[12,1],[15,0],[18,0]]},
    {t:"Oficina de culinária",a:"Empreendedorismo",c:"#c99a00",dt:"Sáb, 28/11/2026",loc:"Cozinha Comunitária · 14h",vagas:8,p:"Preparo de receitas simples e práticas com as crianças, estimulando autonomia e empreendedorismo local.",insc:[[2,1],[5,1],[8,1],[11,0]]},
    {t:"Reforço escolar de dezembro",a:"Educação",c:"#F08D0C",dt:"Sáb, 05/12/2026",loc:"Sala de Estudos · 08h30",vagas:6,p:"Apoio pedagógico intensivo em português e matemática na reta final do calendário escolar comunitário.",insc:[[7,1],[10,1]]}
  ];
  var ACOES = [
    {t:"Oficina de culinária",a:"Empreendedorismo",c:"#c99a00",d:"Out/2026",n:6,p:"Preparo de receitas simples com crianças e noções de empreendedorismo comunitário e sustentável."},
    {t:"Reforço escolar",a:"Educação",c:"#F08D0C",d:"Out/2026",n:5,p:"Apoio pedagógico em matemática e português para fortalecimento do aprendizado de crianças e jovens."},
    {t:"Aula de karatê",a:"Esportes",c:"#8e1fc2",d:"Set/2026",n:2,p:"Treino coletivo com instrutores voluntários, desenvolvendo disciplina, respeito e preparo físico."},
    {t:"Roda de socialização",a:"Socialização",c:"#DB150A",d:"Set/2026",n:4,p:"Atividades integrativas de convivência, escuta afetiva e oficinas lúdicas com jovens e famílias."},
    {t:"Música e dança",a:"Cultura",c:"#085EC3",d:"Ago/2026",n:3,p:"Oficina de musicalização e expressão corporal para estímulo cultural e artístico na comunidade."},
    {t:"Ação de saúde e bem-estar",a:"Saúde & bem-estar",c:"#0f9d58",d:"Ago/2026",n:4,p:"Orientações práticas sobre nutrição preventiva, bem-estar familiar e hábitos de vida saudável."}
  ];`;
  if (agendOriginal.test(html)) {
    html = html.replace(agendOriginal, agendPadronizado);
  }

  // Substituição das funções de renderização com ícones SVG vetoriais e sem barras/frases artificiais
  const fnAcoesAntigo = /function acoes\(\)\{[\s\S]*?Array\.prototype\.forEach\.call\(document\.querySelectorAll\("#agend details"\),function\(d,i\)\{d\.open=abertos\[i\]\}\);\s*\}\);/;
  const fnAcoesNovo = 
`function padronizarDesc(texto, limite) {
    limite = limite || 100;
    var t = String(texto || '').trim();
    if (t.length <= limite) {
      return { visivel: t, completo: t };
    }
    var corte = t.slice(0, limite);
    var ultimoEspaco = corte.lastIndexOf(' ');
    if (ultimoEspaco > 60) {
      corte = corte.slice(0, ultimoEspaco);
    }
    return { visivel: corte + '...', completo: t };
  }

  var icoCheckCard = '${svgCheck}';
  var icoUsersCard = '${svgUsers}';
  var icoCalCard = '${svgCalendar}';

  function acoes(){
    $("acoes").innerHTML = ACOES.map(function(a){
      var descInfo = padronizarDesc(a.p, 100);
      return '<article class="acao" style="--c:' + a.c + '">' +
        '<div class="acao-topo">' +
          '<span class="tag" style="background:' + a.c + '18;color:' + a.c + ';border:1px solid ' + a.c + '40;">' + esc(a.a) + '</span>' +
          '<span class="acao-data-pill">' + icoCheckCard + ' ' + esc(a.d) + '</span>' +
        '</div>' +
        '<h3 class="acao-titulo" title="' + esc(a.t) + '">' + esc(a.t) + '</h3>' +
        '<p class="acao-desc" title="' + esc(descInfo.completo) + '">' + esc(descInfo.visivel) + '</p>' +
        '<div class="acao-rodape">' +
          '<div class="acao-meta-real">' +
            '<span class="meta-vol-cont">' + icoUsersCard + ' <b>' + a.n + '</b> voluntários participantes</span>' +
            '<span class="meta-status-feita">Realizada</span>' +
          '</div>' +
        '</div>' +
      '</article>';
    }).join("");
  }
  function ocupadas(a){ return a.insc.filter(function(i){return i[1]===1}).length; }
  function agend(){
    var pode = perfil!=="colaborador";
    $("n-todas").textContent="("+(ACOES.length+AGEND.length)+")"; $("n-real").textContent="("+ACOES.length+")"; $("n-agend").textContent="("+AGEND.length+")";
    $("agend").innerHTML = AGEND.map(function(a,k){
      var oc=ocupadas(a), pend=a.insc.length-oc, rest=Math.max(0,a.vagas-oc);
      var descInfo = padronizarDesc(a.p, 100);
      var li = a.insc.map(function(i,j){
        var v=vols[i[0]-1], ok=i[1]===1;
        return '<li><span>'+esc(v.nome)+(pode?' <small class="oculto">· '+esc(v.tel)+'</small>':'')+'</span><span>'+(ok?'<span class="ok">Confirmada</span>':'<span class="pend">Pendente</span> '+(pode?'<button type="button" data-k="'+k+'" data-j="'+j+'"'+(rest===0?' disabled title="Sem vagas"':'')+'>Confirmar</button>':''))+'</span></li>';
      }).join("");
      return '<article class="acao" style="--c:' + a.c + '">' +
        '<div class="acao-topo">' +
          '<span class="tag" style="background:' + a.c + '18;color:' + a.c + ';border:1px solid ' + a.c + '40;">' + esc(a.a) + '</span>' +
          '<span class="acao-data-pill dt-agendada">' + icoCalCard + ' ' + esc(a.dt) + '</span>' +
        '</div>' +
        '<h3 class="acao-titulo" title="' + esc(a.t) + '">' + esc(a.t) + '</h3>' +
        '<p class="acao-desc" title="' + esc(descInfo.completo) + '">' + esc(descInfo.visivel) + '</p>' +
        '<div class="acao-rodape">' +
          '<div class="vg">' +
            '<div class="l"><span>' + (rest ? rest + (rest===1 ? ' vaga restante' : ' vagas restantes') : 'Vagas preenchidas') + '</span><span>' + oc + ' de ' + a.vagas + '</span></div>' +
            '<div class="b"><i style="width:' + Math.min(100, oc / a.vagas * 100) + '%;background:' + a.c + '"></i></div>' +
          '</div>' +
          '<details class="acao-details">' +
            '<summary>Inscritos (' + a.insc.length + (pend ? ' · ' + pend + ' pendente' + (pend>1 ? 's' : '') : '') + ')</summary>' +
            '<ul class="insc">' + (li || '<li style="color:#94a3b8;font-size:0.8rem;padding:4px 0;">Nenhum voluntário inscrito no momento.</li>') + '</ul>' +
          '</details>' +
        '</div>' +
      '</article>';
    }).join("");
  }
  $("agend").addEventListener("click", function(e){
    var b=e.target.closest("button[data-k]"); if(!b||b.disabled) return;
    var a=AGEND[+b.dataset.k]; if(ocupadas(a)>=a.vagas) return;
    var abertos=[]; Array.prototype.forEach.call(document.querySelectorAll("#agend details"),function(d,i){abertos[i]=d.open});
    a.insc[+b.dataset.j][1]=1; agend();
    Array.prototype.forEach.call(document.querySelectorAll("#agend details"),function(d,i){d.open=abertos[i]});
  });
  window.vols = vols;
  window.tabela = tabela;
  window.AGEND = AGEND;
  window.ACOES = ACOES;
  window.agend = agend;
  window.acoes = acoes;
  window.visao = visao;
  window.geral = geral;`;
  if (fnAcoesAntigo.test(html)) {
    html = html.replace(fnAcoesAntigo, fnAcoesNovo);
  }

  // 7. Transformar Níveis de Acesso: matriz completa de governança e LGPD com ícones SVG
  const acessoAntigo = /<!-- ACESSO -->\s*<section class="painel" id="p-acesso"[\s\S]*?<\/section>/;
  const acessoNovo = 
    '<!-- ACESSO -->\n' +
    '<section class="painel" id="p-acesso" role="tabpanel" aria-labelledby="t-acesso">\n' +
    '  <div class="painel-cab">\n' +
    '    <div>\n' +
    '      <h2>Governança e Níveis de Acesso</h2>\n' +
    '      <p class="subtitulo-painel">Permissões por perfil de acesso e proteção de dados pessoais (LGPD).</p>\n' +
    '    </div>\n' +
    '    <div class="sessao-badge">\n' +
    '      ' + svgShield + '\n' +
    '      <span>Perfil ativo: <strong id="perfil-ativo-nome">Presidência</strong></span>\n' +
    '    </div>\n' +
    '  </div>\n\n' +
    '  <!-- CARDS DOS TRÊS NÍVEIS -->\n' +
    '  <div class="cards-acesso">\n' +
    '    <div class="card-nivel" style="--cor-borda: var(--azul)">\n' +
    '      <div class="nivel-topo">\n' +
    '        <span class="nivel-tag tag-presidencia">Administração Geral</span>\n' +
    '        <h3>Presidência</h3>\n' +
    '      </div>\n' +
    '      <p class="nivel-desc">Gestão executiva do voluntariado, acompanhamento de indicadores e governança institucional.</p>\n' +
    '      <ul class="nivel-itens">\n' +
    '        <li><span class="chk">' + svgCheck + '</span> Visão completa de métricas e indicadores</li>\n' +
    '        <li><span class="chk">' + svgCheck + '</span> Consulta e triagem com dados sensíveis</li>\n' +
    '        <li><span class="chk">' + svgCheck + '</span> Alteração e validação de status</li>\n' +
    '        <li><span class="chk">' + svgCheck + '</span> Gestão de vagas e eventos comunitários</li>\n' +
    '        <li><span class="chk">' + svgCheck + '</span> Exportação irrestrita de relatórios (CSV)</li>\n' +
    '      </ul>\n' +
    '    </div>\n\n' +
    '    <div class="card-nivel" style="--cor-borda: var(--laranja)">\n' +
    '      <div class="nivel-topo">\n' +
    '        <span class="nivel-tag tag-coordenacao">Gestão Operacional</span>\n' +
    '        <h3>Coordenação</h3>\n' +
    '      </div>\n' +
    '      <p class="nivel-desc">Alinhamento das atividades de campo, triagem de inscritos, contato e organização das oficinas.</p>\n' +
    '      <ul class="nivel-itens">\n' +
    '        <li><span class="chk">' + svgCheck + '</span> Visão completa de métricas e indicadores</li>\n' +
    '        <li><span class="chk">' + svgCheck + '</span> Acesso aos canais diretos de contato</li>\n' +
    '        <li><span class="chk">' + svgCheck + '</span> Alteração de status e triagem ativa</li>\n' +
    '        <li><span class="chk">' + svgCheck + '</span> Confirmação de participantes em ações</li>\n' +
    '        <li class="bloq"><span class="chk-bloq">—</span> Sem permissão de exportação de base</li>\n' +
    '      </ul>\n' +
    '    </div>\n\n' +
    '    <div class="card-nivel" style="--cor-borda: #64748b">\n' +
    '      <div class="nivel-topo">\n' +
    '        <span class="nivel-tag tag-colaborador">Consulta Protegida</span>\n' +
    '        <h3>Colaborador Autorizado</h3>\n' +
    '      </div>\n' +
    '      <p class="nivel-desc">Apoio operacional e consulta de disponibilidades, mantendo contatos pessoais resguardados (LGPD).</p>\n' +
    '      <ul class="nivel-itens">\n' +
    '        <li><span class="chk">' + svgCheck + '</span> Consulta de competências e áreas</li>\n' +
    '        <li><span class="chk">' + svgCheck + '</span> Filtro de disponibilidade e bairros</li>\n' +
    '        <li class="bloq"><span class="chk-bloq">' + svgLock + '</span> Contatos sensíveis protegidos</li>\n' +
    '        <li class="bloq"><span class="chk-bloq">—</span> Alterações de status restritas</li>\n' +
    '        <li class="bloq"><span class="chk-bloq">—</span> Sem permissão de exportação de dados</li>\n' +
    '      </ul>\n' +
    '    </div>\n' +
    '  </div>\n\n' +
    '  <!-- TABELA MATRIZ DE PERMISSÕES -->\n' +
    '  <div class="box" style="margin-top: 24px; padding: 0; overflow: hidden;">\n' +
    '    <div style="padding: 16px 20px; border-bottom: 1px solid var(--borda); background: #f8fafc;">\n' +
    '      <h3 style="margin: 0; font-size: 1.05rem; color: var(--azul);">Matriz Comparativa de Permissões</h3>\n' +
    '    </div>\n' +
    '    <div class="tabela-wrap" style="box-shadow: none; border-radius: 0; border: none;">\n' +
    '      <table class="tabela-matriz">\n' +
    '        <thead>\n' +
    '          <tr>\n' +
    '            <th style="width: 46%;">Funcionalidade / Operação</th>\n' +
    '            <th style="text-align: center;">Presidência</th>\n' +
    '            <th style="text-align: center;">Coordenação</th>\n' +
    '            <th style="text-align: center;">Colaborador</th>\n' +
    '          </tr>\n' +
    '        </thead>\n' +
    '        <tbody>\n' +
    '          <tr>\n' +
    '            <td><b>Painel Geral:</b> Acompanhar indicadores e gráficos</td>\n' +
    '            <td style="text-align: center;"><span class="tag-sim">Permitido</span></td>\n' +
    '            <td style="text-align: center;"><span class="tag-sim">Permitido</span></td>\n' +
    '            <td style="text-align: center;"><span class="tag-sim">Permitido</span></td>\n' +
    '          </tr>\n' +
    '          <tr>\n' +
    '            <td><b>Banco de Voluntários:</b> Filtrar competências e disponibilidade</td>\n' +
    '            <td style="text-align: center;"><span class="tag-sim">Permitido</span></td>\n' +
    '            <td style="text-align: center;"><span class="tag-sim">Permitido</span></td>\n' +
    '            <td style="text-align: center;"><span class="tag-sim">Permitido</span></td>\n' +
    '          </tr>\n' +
    '          <tr>\n' +
    '            <td><b>Privacidade (LGPD):</b> Visualizar WhatsApp e e-mail</td>\n' +
    '            <td style="text-align: center;"><span class="tag-sim">Permitido</span></td>\n' +
    '            <td style="text-align: center;"><span class="tag-sim">Permitido</span></td>\n' +
    '            <td style="text-align: center;"><span class="tag-restrito">Protegido</span></td>\n' +
    '          </tr>\n' +
    '          <tr>\n' +
    '            <td><b>Triagem de Inscrição:</b> Atualizar status do voluntário</td>\n' +
    '            <td style="text-align: center;"><span class="tag-sim">Permitido</span></td>\n' +
    '            <td style="text-align: center;"><span class="tag-sim">Permitido</span></td>\n' +
    '            <td style="text-align: center;"><span class="tag-nao">Bloqueado</span></td>\n' +
    '          </tr>\n' +
    '          <tr>\n' +
    '            <td><b>Ações Sociais:</b> Confirmar voluntários em oficinas</td>\n' +
    '            <td style="text-align: center;"><span class="tag-sim">Permitido</span></td>\n' +
    '            <td style="text-align: center;"><span class="tag-sim">Permitido</span></td>\n' +
    '            <td style="text-align: center;"><span class="tag-nao">Bloqueado</span></td>\n' +
    '          </tr>\n' +
    '          <tr>\n' +
    '            <td><b>Exportação Corporativa:</b> Download da lista em formato CSV</td>\n' +
    '            <td style="text-align: center;"><span class="tag-sim">Exclusivo</span></td>\n' +
    '            <td style="text-align: center;"><span class="tag-nao">Bloqueado</span></td>\n' +
    '            <td style="text-align: center;"><span class="tag-nao">Bloqueado</span></td>\n' +
    '          </tr>\n' +
    '        </tbody>\n' +
    '      </table>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '</section>';

  if (acessoAntigo.test(html)) {
    html = html.replace(acessoAntigo, acessoNovo);
  }

  // 8. Ajustar geração de e-mails de voluntários e CSV no script original
  html = html.replace('+"@exemplo.com"', '+(i%3===0?"@usinadavida.org.br":i%3===1?"@gmail.com":"@outlook.com")');
  html = html.replace('a.download="voluntarios-exemplo.csv";', 'a.download="voluntarios-usina-da-vida.csv";');

  // 9. Melhorar a formatação da linha de contato na tabela com ícones SVG
  html = html.replace(
    'var contato = pode ? \'<a href="https://wa.me/55\'+v.tel.replace(/\\D/g,"")+\'" rel="noopener">\'+esc(v.tel)+\'</a><br>\'+esc(v.email) : \'<span class="oculto">restrito</span>\';',
    'var contato = pode ? \'<a class="link-wa" href="https://wa.me/55\'+v.tel.replace(/\\D/g,"")+\'" target="_blank" rel="noopener" title="Abrir conversa no WhatsApp"><span class="wa-ico">' + svgWa + '</span> \'+esc(v.tel)+\'</a><div class="txt-email">\'+esc(v.email)+\'</div>\' : \'<span class="tag-restrito">' + svgLock + ' Protegido (LGPD)</span>\';'
  );

  // 10. Atualizar função K dos KPIs para não ter setas genéricas
  html = html.replace(
    'function K(c,num,txt,go){ return \'<a class="kpi" href="#" data-go="\'+go+\'" style="--c:\'+c+\'"><b>\'+num+\'</b><small>\'+txt+\'</small><em>Ver detalhes &rarr;</em></a>\'; }',
    'function K(c,num,txt,go){ return \'<a class="kpi" href="#" data-go="\'+go+\'" style="--c:\'+c+\'"><span class="kpi-num">\'+num+\'</span><span class="kpi-lbl">\'+txt+\'</span><span class="kpi-link">Ver listagem</span></a>\'; }'
  );

  // 11. Estilos completos e harmoniosos (semelhantes à landing page)
  const estilosPortal = `<style id="estilos-portal-harmonia">
:root {
  --azul: #085EC3;
  --azul-esc: #06479a;
  --vermelho: #DB150A;
  --amarelo: #F1C50E;
  --laranja: #F08D0C;
  --verde: #0f9d58;
  --cinza: #4F4F4F;
  --tinta: #1d2430;
  --borda: #e2e8f0;
  --suave: #f8fafc;
  --serif: "Lora", Georgia, serif;
  --sans: "Lexend", "Segoe UI", system-ui, sans-serif;
}
html {
  background: var(--suave);
  min-height: 100%;
}
body {
  margin: 0;
  font-family: var(--sans);
  background: var(--suave);
  color: var(--tinta);
  line-height: 1.6;
}

/* Escala desktop 82% focada no aplicativo interno (elimina quebras em tela cheia do login) */
@media (min-width: 1001px) {
  #app {
    zoom: 0.82;
    width: 100%;
  }
}

/* TELA DE LOGIN FIXA E 100% PREENCHIDA */
#login {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  background: var(--azul);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
  overflow-y: auto;
  box-sizing: border-box;
}
#login::after {
  content: '';
  position: absolute;
  right: -60px;
  bottom: -60px;
  width: 520px;
  height: 520px;
  background: url('/assets/img-03.png') no-repeat center / contain;
  opacity: 0.08;
  pointer-events: none;
}
.cartao {
  position: relative;
  z-index: 2;
  background: #fff;
  border: 2px solid var(--tinta);
  border-radius: 6px;
  box-shadow: 8px 8px 0 var(--amarelo);
  padding: 38px 34px;
  width: 100%;
  max-width: 440px;
}
.cartao .marca img {
  height: 46px;
  width: auto;
  margin: 0 auto 12px;
  display: block;
}
.cartao h1 {
  color: var(--azul);
  font-size: 1.75rem;
  margin: 8px 0 4px;
  text-align: center;
}
.login-sub {
  text-align: center;
  font-size: 0.86rem;
  color: #64748b;
  margin: 0 0 20px;
}
.cartao label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--tinta);
  margin-top: 14px;
  display: block;
}
.cartao input, .cartao select {
  margin-top: 4px;
  border: 1.5px solid #cbd5e1;
  border-radius: 4px;
  padding: 10px 12px;
  font-size: 0.95rem;
}
.cartao input:focus, .cartao select:focus {
  border-color: var(--azul);
  outline: none;
  box-shadow: 0 0 0 3px rgba(8,94,195,0.18);
}
.cartao .voltar {
  display: block;
  text-align: center;
  margin-top: 18px;
  font-size: 0.88rem;
  color: var(--azul);
  text-decoration: none;
  font-weight: 500;
}
.cartao .voltar:hover {
  text-decoration: underline;
}

/* BARRA SUPERIOR */
.barra {
  background: #fff;
  border-bottom: 3px solid var(--tinta);
  position: sticky;
  top: 0;
  z-index: 50;
}
.barra .wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 68px;
}
.marca {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--azul);
}
.marca img {
  height: 42px;
  width: auto;
}
.marca .gest {
  background: var(--azul);
  color: #fff;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 4px;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-left: none;
  margin-left: 6px;
}
.usuario {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.92rem;
}
.perfil {
  background: var(--amarelo);
  color: var(--tinta);
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  border: 1.5px solid var(--tinta);
}
#sair {
  border: 1.5px solid var(--tinta);
  background: #fff;
  color: var(--tinta);
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}
#sair:hover {
  background: #f1f5f9;
}

/* NAVEGAÇÃO POR ABAS */
.abas {
  background: var(--azul);
  border-bottom: 1px solid rgba(0,0,0,0.08);
}
.abas .wrap {
  display: flex;
  gap: 6px;
}
.abas button {
  background: transparent;
  border: 0;
  color: #dbeafe;
  font: 500 0.95rem var(--sans);
  padding: 13px 22px;
  cursor: pointer;
  border-bottom: 4px solid transparent;
  transition: all 0.2s ease;
  border-radius: 4px 4px 0 0;
}
.abas button:hover {
  color: #fff;
  background: rgba(255,255,255,0.08);
}
.abas button[aria-selected="true"] {
  color: #fff;
  font-weight: 700;
  border-bottom-color: var(--amarelo);
  background: rgba(255,255,255,0.12);
}

/* CABEÇALHOS DE PAINEL */
.painel-cab {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--borda);
  padding-bottom: 14px;
}
.painel-cab h2 {
  color: var(--azul);
  font-size: 1.55rem;
  margin: 0;
}
.subtitulo-painel {
  margin: 4px 0 0;
  font-size: 0.92rem;
  color: #64748b;
}
.ico-svg {
  width: 15px;
  height: 15px;
  vertical-align: -2px;
  flex-shrink: 0;
  display: inline-block;
}
.sessao-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.85rem;
  color: var(--tinta);
  background: #fff;
  border: 1.5px solid var(--borda);
  padding: 6px 12px;
  border-radius: 4px;
}
.sessao-badge .ico-svg {
  color: var(--azul);
}

/* BOTÕES COM IDENTIDADE USINA DA VIDA */
.btn-azul {
  background: var(--tinta);
  color: #fff;
  border: 2px solid var(--tinta);
  box-shadow: 3px 3px 0 var(--amarelo);
  border-radius: 4px;
  font-weight: 600;
  padding: 8px 18px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}
.btn-azul:hover:not(:disabled) {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 var(--amarelo);
}
.btn-cont {
  border: 2px solid var(--tinta);
  color: var(--tinta);
  background: #fff;
  border-radius: 4px;
  font-weight: 600;
  padding: 8px 18px;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}
.btn-cont:hover {
  background: #f1f5f9;
}
.btn[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

/* CARDS DE KPI (VISÃO GERAL) */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 14px;
  margin: 16px 0 24px;
}
.kpi {
  background: #fff;
  border: 1px solid var(--borda);
  border-left: 6px solid var(--c, var(--azul));
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 16px 18px;
  display: block;
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.kpi:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(0,0,0,0.08);
}
.kpi .kpi-num {
  display: block;
  font-family: var(--serif);
  font-size: 2.1rem;
  font-weight: 700;
  color: var(--c, var(--azul));
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.kpi .kpi-lbl {
  display: block;
  font-size: 0.88rem;
  color: #475569;
  margin-top: 4px;
}
.kpi .kpi-link {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--c, var(--azul));
  margin-top: 10px;
}

/* CAIXAS DE GRÁFICOS */
.duas {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
.box {
  background: #fff;
  border: 1px solid var(--borda);
  border-radius: 6px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.box h3 {
  color: var(--azul);
  font-size: 1.12rem;
  margin-bottom: 14px;
}
.barra-h {
  display: grid;
  grid-template-columns: 140px 1fr 36px;
  gap: 10px;
  align-items: center;
  padding: 5px 8px;
  margin: 4px 0;
  border-radius: 4px;
  text-decoration: none;
  color: inherit;
  font-size: 0.88rem;
  font-variant-numeric: tabular-nums;
  transition: background-color 0.12s ease;
}
.barra-h:hover {
  background: #f1f5f9;
}
.barra-h .trilho {
  background: #e2e8f0;
  border-radius: 999px;
  height: 11px;
  overflow: hidden;
}
.barra-h .enche {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}

/* TOOLBAR PRINCIPAL DE FILTROS DOS VOLUNTÁRIOS + MÁSCARA DE EXCLUSIVIDADE */
.filtros-barra {
  background: #fff;
  border: 1px solid var(--borda);
  border-radius: 6px;
  padding: 14px 18px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 14px;
  align-items: flex-end;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  margin-bottom: 12px;
}
.filtros-gerais-grupo {
  position: relative;
  display: grid;
  grid-template-columns: 2fr 1.3fr 1.2fr 1.2fr;
  gap: 12px;
  align-items: flex-end;
}
.filtros-barra.modo-mapa-ativo .filtros-gerais-grupo > .filtro-campo label {
  opacity: 0.48;
}
.filtros-barra.modo-mapa-ativo .filtros-gerais-grupo input,
.filtros-barra.modo-mapa-ativo .filtros-gerais-grupo select {
  opacity: 0.48;
  background: #f1f5f9 !important;
  color: #94a3b8 !important;
  border-color: #cbd5e1 !important;
  cursor: not-allowed !important;
}
.filtros-barra.modo-mapa-ativo .busca-ico {
  opacity: 0.4;
}
@media (max-width: 1024px) {
  .filtros-barra {
    grid-template-columns: 1fr;
  }
  .filtros-gerais-grupo {
    grid-template-columns: 1fr 1fr;
  }
}
.filtro-campo {
  position: relative;
}
.filtro-campo label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 4px;
  transition: opacity 0.15s ease;
}
.filtro-campo.campo-mascarado label {
  opacity: 0.48;
}
.filtro-campo.campo-mascarado select,
.filtro-campo.campo-mascarado input {
  opacity: 0.48;
  background: #f1f5f9 !important;
  color: #94a3b8 !important;
  border-color: #cbd5e1 !important;
  cursor: not-allowed !important;
}
.dist-sede {
  display: inline-block;
  margin-top: 2px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 1px 6px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.busca-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.busca-ico {
  position: absolute;
  left: 11px;
  display: inline-flex;
  align-items: center;
  color: #64748b;
  pointer-events: none;
  z-index: 2;
}
.filtros-barra .busca-input-wrap input {
  padding-left: 34px !important;
}
.filtros-barra input, .filtros-barra select, .gaveta-geo input, .gaveta-geo select {
  width: 100%;
  border: 1.5px solid #cbd5e1;
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 0.88rem;
  color: var(--tinta);
  background: #fff;
  transition: opacity 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;
}
.filtros-barra input:focus, .filtros-barra select:focus, .gaveta-geo input:focus, .gaveta-geo select:focus {
  border-color: var(--azul);
  outline: none;
  box-shadow: 0 0 0 3px rgba(8,94,195,0.18);
}
.btn-geo-toggle {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: #f1f5f9;
  border: 1.5px solid #cbd5e1;
  color: var(--azul);
  font-weight: 600;
  font-size: 0.86rem;
  padding: 9px 14px;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.btn-geo-toggle:hover, .btn-geo-toggle.ativo {
  background: var(--azul);
  border-color: var(--azul);
  color: #fff;
}

/* GAVETA DE FILTROS GEOGRÁFICOS E MAPA */
.gaveta-geo {
  background: #fff;
  border: 1.5px solid var(--azul);
  border-radius: 6px;
  padding: 18px;
  margin-bottom: 14px;
  box-shadow: 0 4px 12px rgba(8, 94, 195, 0.08);
}
.gaveta-grid {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: 20px;
}
@media (max-width: 860px) {
  .gaveta-grid {
    grid-template-columns: 1fr;
  }
}
.geo-filtros-extra {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-content: start;
}
.geo-mapa-wrap {
  background: #f8fafc;
  border: 1px solid var(--borda);
  border-radius: 6px;
  padding: 12px;
}
.mapa-cab {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.84rem;
  margin-bottom: 8px;
}
.mapa-titulo-ic {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--tinta);
}
.mapa-titulo-ic .ico-svg {
  color: var(--azul);
}
#mapa-leaflet {
  width: 100%;
  height: 275px;
  background: #dce8f5;
  border-radius: 6px;
  border: 1.5px solid #cbd5e1;
  z-index: 2;
  overflow: hidden;
}
#mapa {
  width: 100%;
  height: auto;
  max-height: 190px;
  background: #eaf2fb;
  border-radius: 4px;
  display: none;
}
.pin-bairro-wrap {
  background: transparent;
  border: none;
}
.pin-bairro {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 999px;
  font: 700 0.66rem/1.1 var(--sans);
  color: #fff;
  background: #DB150A;
  border: 1.5px solid #fff;
  box-shadow: 0 2px 5px rgba(15,23,42,0.35);
  white-space: nowrap;
  transform: translate(-50%, -50%);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  cursor: pointer;
}
.pin-bairro:hover {
  transform: translate(-50%, -50%) scale(1.12);
  z-index: 1000 !important;
}
.pin-bairro.vazio {
  background: #64748b;
  opacity: 0.85;
}
.pin-bairro.focal {
  background: #085EC3;
  border-color: #F1C50E;
  border-width: 2px;
  font-size: 0.7rem;
  box-shadow: 0 0 0 3px rgba(241,197,14,0.55), 0 3px 8px rgba(8,94,195,0.45);
}
.pin-bairro.sede-ong {
  background: #F1C50E;
  color: #1d2430;
  border: 2px solid #1d2430;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 3px 9px;
  box-shadow: 0 0 0 3px rgba(8,94,195,0.45), 2px 2px 0 #1d2430;
}
.pin-bairro.sede-ong .qtd {
  background: #085EC3;
  color: #fff;
}
.pin-bairro .qtd {
  background: rgba(0,0,0,0.22);
  padding: 1px 4px;
  border-radius: 99px;
  font-size: 0.63rem;
  font-variant-numeric: tabular-nums;
}
.pin-bairro .pin-km {
  font-weight: 600;
  font-size: 0.6rem;
  opacity: 0.92;
  font-variant-numeric: tabular-nums;
}
.leaflet-popup-content-wrapper {
  border-radius: 6px !important;
  border: 1.5px solid #1d2430;
  box-shadow: 4px 4px 0 #F1C50E !important;
  font-family: var(--sans) !important;
}
.leaflet-popup-content {
  margin: 10px 12px !important;
  font-size: 0.82rem !important;
  line-height: 1.45 !important;
}
.btn-popup-mapa {
  display: inline-block;
  margin-top: 6px;
  padding: 4px 9px;
  font: 600 0.74rem var(--sans);
  background: var(--azul);
  color: #fff !important;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
}
.btn-popup-mapa:hover {
  background: var(--azul-esc);
}
.mapa-info {
  font-size: 0.76rem;
  color: #64748b;
  margin: 6px 0 0;
  text-align: right;
}

/* BARRA DE META DA TABELA */
.tabela-meta-barra {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.88rem;
  font-weight: 600;
  color: #334155;
  margin: 10px 0 8px;
}

/* TABELA DE VOLUNTÁRIOS */
.tabela-wrap {
  background: #fff;
  border: 1px solid var(--borda);
  border-radius: 6px;
  overflow-x: auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
table {
  border-collapse: collapse;
  width: 100%;
  min-width: 860px;
}
th {
  background: #f1f5f9;
  color: var(--azul-esc);
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  padding: 12px 14px;
  border-bottom: 2px solid var(--borda);
  position: sticky;
  top: 0;
}
td {
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.9rem;
  vertical-align: middle;
}
tr:hover td {
  background: #f8fafc;
}
.tag {
  display: inline-block;
  background: #eff6ff;
  color: var(--azul);
  border: 1px solid #bfdbfe;
  border-radius: 4px;
  padding: 2px 7px;
  font-size: 0.76rem;
  font-weight: 600;
  margin: 1px;
}
.link-wa {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #0f7a43;
  font-weight: 600;
  text-decoration: none;
  font-size: 0.88rem;
}
.link-wa:hover {
  text-decoration: underline;
}
.wa-ico {
  font-size: 0.9rem;
}
.txt-email {
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 2px;
}
.tag-restrito {
  display: inline-block;
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 0.78rem;
  font-weight: 600;
}
.st {
  border: 1.5px solid #cbd5e1;
  border-radius: 4px;
  padding: 5px 8px;
  font-weight: 600;
  font-size: 0.85rem;
  background: #fff;
}

/* NÍVEIS DE ACESSO */
.cards-acesso {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}
@media (max-width: 900px) {
  .cards-acesso {
    grid-template-columns: 1fr;
  }
}
.card-nivel {
  background: #fff;
  border: 1px solid var(--borda);
  border-top: 5px solid var(--cor-borda);
  border-radius: 6px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.nivel-topo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.nivel-topo h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--tinta);
}
.nivel-tag {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 4px;
}
.tag-presidencia { background: #dbeafe; color: var(--azul); }
.tag-coordenacao { background: #ffedd5; color: #c2410c; }
.tag-colaborador { background: #f1f5f9; color: #475569; }
.nivel-desc {
  font-size: 0.88rem;
  color: #475569;
  line-height: 1.5;
  margin-bottom: 14px;
}
.nivel-itens {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.85rem;
}
.nivel-itens li {
  padding: 5px 0;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 8px;
}
.nivel-itens li.bloq {
  color: #94a3b8;
}
.chk { color: var(--verde); font-weight: 700; }
.chk-bloq { color: #94a3b8; font-weight: 700; }

.tabela-matriz td, .tabela-matriz th {
  padding: 10px 14px;
}
.tag-sim {
  background: #dcfce7;
  color: #166534;
  font-weight: 700;
  font-size: 0.78rem;
  padding: 3px 10px;
  border-radius: 999px;
  display: inline-block;
}
.tag-nao {
  background: #f1f5f9;
  color: #94a3b8;
  font-weight: 600;
  font-size: 0.78rem;
  padding: 3px 10px;
  border-radius: 999px;
  display: inline-block;
}

/* TOOLBAR DE AÇÕES E BOTÃO DE CADASTRO JUSTIFICADO À DIREITA */
.acoes-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 18px 0 14px;
  flex-wrap: wrap;
}
.acoes-toolbar .sub {
  margin: 0;
}
.acoes-cad-wrap {
  margin-left: auto;
}
.btn-cad-acao {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--amarelo);
  color: var(--tinta);
  font-family: var(--sans);
  font-size: 0.9rem;
  font-weight: 700;
  padding: 9px 18px;
  border-radius: 4px;
  border: 2px solid var(--tinta);
  box-shadow: 3px 3px 0px var(--tinta);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}
.btn-cad-acao:hover {
  background: #fcd34d;
  transform: translateY(-1px);
  box-shadow: 4px 4px 0px var(--tinta);
}
.btn-cad-acao:active {
  transform: translateY(1px);
  box-shadow: 1px 1px 0px var(--tinta);
}
.txt-cad-acao {
  letter-spacing: -0.01em;
}

/* PADRONIZAÇÃO ESTRUTURAL E VISUAL DOS CARDS DE AÇÕES */
.acoes-lista, .acoes-lista.agend {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin-top: 14px;
}
.acao {
  background: #fff;
  border-radius: 6px;
  border: 1px solid var(--borda);
  border-top: 5px solid var(--c, var(--azul));
  padding: 16px 18px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  min-height: 310px;
  box-sizing: border-box;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
#acoes .acao {
  min-height: 230px;
}
.acao:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.08);
}
.acao-topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 26px;
}
.acao-topo .tag {
  font-size: 0.74rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.acao-data-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  padding: 3px 9px;
  border-radius: 4px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.acao-data-pill.dt-agendada {
  color: var(--azul);
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  font-weight: 700;
}
.acao-titulo {
  font-size: 1.06rem;
  font-weight: 700;
  color: var(--tinta);
  margin: 10px 0 6px;
  line-height: 1.35;
  min-height: 2.7em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
.acao-desc {
  font-size: 0.88rem;
  line-height: 1.5;
  color: #475569;
  margin: 0 0 12px;
  min-height: 4.5em;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
.acao-rodape {
  margin-top: auto;
  border-top: 1px solid #f1f5f9;
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.acao-meta-real {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
}
.meta-vol-cont {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #1e293b;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.meta-status-feita {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  background: #dcfce7;
  color: #15803d;
  padding: 2px 8px;
  border-radius: 4px;
}
.acao-details {
  font-size: 0.85rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 6px 10px;
}
.acao-details summary {
  cursor: pointer;
  font-weight: 600;
  color: #334155;
  user-select: none;
}
.acao-details .insc {
  list-style: none;
  padding: 6px 0 0;
  margin: 0;
  max-height: 85px;
  overflow-y: auto;
}
.acao-details .insc li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
  border-bottom: 1px dashed #e2e8f0;
  font-size: 0.8rem;
}

/* MODAL DE CADASTRAMENTO E FEEDBACK */
.modal-backdrop {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  box-sizing: border-box;
  animation: modalFadeIn 0.2s ease;
}
@keyframes modalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.modal-card {
  background: #fff;
  border-radius: 6px;
  box-shadow: 8px 8px 0 var(--amarelo);
  border: 2px solid var(--tinta);
  width: 100%;
  max-width: 520px;
  max-height: 94vh;
  overflow-y: auto;
  box-sizing: border-box;
  animation: modalSlideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes modalSlideUp {
  from { transform: translateY(16px) scale(0.98); }
  to { transform: translateY(0) scale(1); }
}
.modal-cab {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px 20px 10px;
  border-bottom: 1px solid var(--borda);
  background: #f8fafc;
}
.modal-cab h3 {
  font-family: var(--serif);
  font-size: 1.18rem;
  font-weight: 700;
  color: var(--tinta);
  margin: 0;
}
.modal-subtitulo {
  font-size: 0.8rem;
  color: #64748b;
  margin: 3px 0 0;
}
.modal-fechar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  color: #64748b;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.modal-fechar:hover {
  background: #fee2e2;
  color: var(--vermelho);
}
.form-modal-acao {
  padding: 14px 20px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.form-campo {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.form-linha-dupla {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.form-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #334155;
}
.form-label-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.char-counter {
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}
.req {
  color: var(--vermelho);
}
.form-input, .form-select {
  width: 100%;
  box-sizing: border-box;
  padding: 7px 10px;
  border: 1.5px solid var(--borda);
  border-radius: 4px;
  font-family: var(--sans);
  font-size: 0.86rem;
  color: var(--tinta);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.form-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 7px 10px;
  border: 1.5px solid var(--borda);
  border-radius: 4px;
  font-family: var(--sans);
  font-size: 0.86rem;
  color: var(--tinta);
  outline: none;
  height: 48px;
  min-height: 42px;
  max-height: 70px;
  resize: vertical;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: var(--azul);
  box-shadow: 0 0 0 3px rgba(8, 94, 195, 0.15);
}
.form-ajuda {
  font-size: 0.7rem;
  color: #64748b;
  margin-top: 1px;
}
.modal-rodape {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--borda);
}
.btn-salvar-acao {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--amarelo);
  color: var(--tinta);
  font-weight: 700;
  font-size: 0.85rem;
  border: 2px solid var(--tinta);
  box-shadow: 2px 2px 0px var(--tinta);
  padding: 7px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}
.btn-salvar-acao:hover {
  background: #fcd34d;
  transform: translateY(-1px);
  box-shadow: 3px 3px 0px var(--tinta);
}
.toast-sucesso-acao {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #15803d;
  color: #fff;
  padding: 12px 20px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.92rem;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  z-index: 999999;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.25s ease, transform 0.25s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}
.toast-sucesso-acao.vis {
  opacity: 1;
  transform: translateY(0);
}
</style>`;

  const svgClose = `<svg class="ico-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

  // 12. Modal HTML de Cadastramento de Nova Ação
  const modalAcaoHtml = `<!-- MODAL DE CADASTRAMENTO DE NOVA AÇÃO -->
<div class="modal-backdrop" id="modal-nova-acao" style="display: none;" role="dialog" aria-modal="true" aria-labelledby="modal-acao-titulo">
  <div class="modal-card">
    <div class="modal-cab">
      <div class="modal-cab-info">
        <h3 id="modal-acao-titulo">Cadastrar Nova Ação Social</h3>
        <p class="modal-subtitulo">Preencha os dados abaixo para cadastrar e agendar uma nova ação social com abertura de vagas para voluntários.</p>
      </div>
      <button type="button" class="modal-fechar" id="btn-fechar-modal-acao" aria-label="Fechar formulário">${svgClose}</button>
    </div>

    <form id="form-cad-acao" class="form-modal-acao">
      <div class="form-campo">
        <label for="cad-titulo" class="form-label">Título da Ação ou Oficina <span class="req">*</span></label>
        <input type="text" id="cad-titulo" class="form-input" required placeholder="Ex.: Oficina de Robótica e Criatividade" maxlength="60">
      </div>

      <div class="form-linha-dupla">
        <div class="form-campo">
          <label for="cad-area" class="form-label">Área de Atuação <span class="req">*</span></label>
          <select id="cad-area" class="form-select" required>
            <option value="Educação" data-cor="#F08D0C">Educação</option>
            <option value="Saúde & bem-estar" data-cor="#085EC3">Saúde & bem-estar</option>
            <option value="Empreendedorismo" data-cor="#c99a00">Empreendedorismo</option>
            <option value="Esportes" data-cor="#8e1fc2">Esportes</option>
            <option value="Cultura" data-cor="#085EC3">Cultura</option>
            <option value="Socialização" data-cor="#DB150A">Socialização</option>
            <option value="Inovação & Tecnologia" data-cor="#0f9d58">Inovação & Tecnologia</option>
          </select>
        </div>
        <div class="form-campo">
          <label for="cad-data" class="form-label">Data ou Período <span class="req">*</span></label>
          <input type="text" id="cad-data" class="form-input" required placeholder="Ex.: Sáb, 21/11/2026 ou Nov/2026">
        </div>
      </div>

      <div class="form-linha-dupla">
        <div class="form-campo" id="wrap-cad-vagas">
          <label for="cad-vagas" class="form-label" id="lbl-cad-vagas">Número de Vagas Disponíveis <span class="req">*</span></label>
          <input type="number" id="cad-vagas" class="form-input" min="1" max="100" value="10" required>
        </div>
        <div class="form-campo">
          <label for="cad-local" class="form-label">Local / Horário</label>
          <input type="text" id="cad-local" class="form-input" placeholder="Ex.: 09h às 12h · Sede Comunitária">
        </div>
      </div>

      <div class="form-campo">
        <div class="form-label-wrap">
          <label for="cad-desc" class="form-label">Descrição Resumida da Ação <span class="req">*</span></label>
          <span class="char-counter" id="cad-desc-contador">0 / 100 caracteres (padrão)</span>
        </div>
        <textarea id="cad-desc" class="form-textarea" rows="2" required placeholder="Descreva os objetivos da ação de forma clara e padronizada..." maxlength="140"></textarea>
      </div>

      <div class="modal-rodape">
        <button type="button" class="btn btn-cont" id="btn-cancelar-cad-acao">Cancelar</button>
        <button type="submit" class="btn btn-amarelo btn-salvar-acao">
          ${svgPlus} <span>Cadastrar e Publicar Ação</span>
        </button>
      </div>
    </form>
  </div>
</div>`;

  // 13. Script complementar para interações dinâmicas do portal
  const scriptPortal = `<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
<script id="script-portal-harmonia">
(function(){
  var lMap = null;
  var lLayer = null;
  var ultimoEstadoMapa = null;
  var icoPinInline = '${svgPin}';
  var icoUsersInline = '${svgUsers}';
  var icoCheckInline = '${svgCheck}';
  var icoSedeInline = '<svg class="ico-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z"/></svg>';

  function calcKmCoords(a, b) {
    if (!a || !b) return 0;
    var R = 6371, r = Math.PI / 180;
    var dl = (b[0] - a[0]) * r, dn = (b[1] - a[1]) * r;
    var h = Math.sin(dl / 2) * Math.sin(dl / 2) + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dn / 2) * Math.sin(dn / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function renderizarCamadasLeaflet() {
    if (!lMap || !ultimoEstadoMapa || typeof window.L === "undefined") return;
    var st = ultimoEstadoMapa;
    if (lLayer) lLayer.clearLayers();
    else lLayer = L.layerGroup().addTo(lMap);

    var sedeCoord = st.COORD["Arenoso"] || [-12.9522, -38.4414];
    var refCoord = st.COORD[st.ref] || sedeCoord;

    if (st.r && st.r > 0) {
      L.circle(refCoord, {
        radius: st.r * 1000,
        color: "#085EC3",
        weight: 2,
        dashArray: "6 4",
        fillColor: "#085EC3",
        fillOpacity: 0.12
      }).addTo(lLayer);
    }

    // Linhas tracejadas sutis ligando a Sede da ONG (Arenoso) aos bairros com voluntários ativos
    st.BAIRROS.forEach(function(b) {
      if (b === "Arenoso") return;
      var c = st.COORD[b];
      var qtd = st.cont[b] || 0;
      if (c && qtd > 0) {
        L.polyline([sedeCoord, c], {
          color: "#085EC3",
          weight: 1.4,
          opacity: 0.42,
          dashArray: "4 4"
        }).addTo(lLayer);
      }
    });

    st.BAIRROS.forEach(function(b) {
      var c = st.COORD[b];
      if (!c) return;
      var qtd = st.cont[b] || 0;
      var eSede = (b === "Arenoso");
      var eRef = (b === st.ref);
      var distSede = eSede ? 0 : calcKmCoords(sedeCoord, c);
      var distSedeTxt = distSede.toFixed(1).replace(".", ",") + " km";

      var cls = "pin-bairro" + (eSede ? " sede-ong" : (eRef ? " focal" : (qtd === 0 ? " vazio" : "")));
      var rotuloPin = eSede
        ? '<span style="display:inline-flex;align-items:center;gap:4px">' + icoSedeInline + ' Sede ONG · Arenoso</span>'
        : '<span style="display:inline-flex;align-items:center;gap:3px">' + (eRef ? icoPinInline : '') + b + ' <span class="pin-km">· ' + distSedeTxt + '</span></span>';

      var icone = L.divIcon({
        className: "pin-bairro-wrap",
        html: '<div class="' + cls + '" title="' + (eSede ? 'Sede Usina da Vida (Arenoso): ' : b + ' (' + distSedeTxt + ' da Sede): ') + qtd + ' voluntário(s)">' +
              rotuloPin +
              '<span class="qtd">' + qtd + '</span></div>',
        iconSize: [1, 1],
        iconAnchor: [0, 0]
      });

      var m = L.marker(c, {
        icon: icone,
        zIndexOffset: eSede ? 1000 : (eRef ? 900 : (qtd > 0 ? 400 : 100))
      }).addTo(lLayer);

      var infoDistPopup = eSede
        ? '<span style="display:inline-block;margin-top:2px;color:#085EC3;font-weight:700">Sede Institucional da Usina da Vida (0 km)</span><br>'
        : '<span style="display:inline-block;margin-top:2px;color:#475569">Distância até a Sede (Arenoso): <b>' + distSedeTxt + '</b></span><br>';

      var popupHtml =
        '<div><b>' + (eSede ? 'Arenoso · Sede da ONG' : b) + (eRef && !eSede ? ' (Ponto Focal)' : '') + '</b><br>' +
        infoDistPopup +
        '<span style="display:inline-flex;align-items:center;gap:4px;margin-top:3px">' + icoUsersInline + ' <b>' + qtd + '</b> voluntário(s) nos filtros atuais</span><br>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
        '<button type="button" class="btn-popup-mapa" data-acao-mapa="filtrar" data-bairro="' + b + '">Filtrar bairro</button>' +
        (!eRef ? '<button type="button" class="btn-popup-mapa" style="background:#1d2430" data-acao-mapa="focal" data-bairro="' + b + '">Definir ponto focal</button>' : '') +
        '</div></div>';
      m.bindPopup(popupHtml);
    });

    if (st.r && st.r > 0) {
      var z = st.r <= 4 ? 13 : (st.r <= 10 ? 12 : 11);
      lMap.setView(refCoord, z);
    } else {
      lMap.setView([-12.9780, -38.4620], 12);
    }
  }

  function inicializarLeaflet() {
    var elMapa = document.getElementById("mapa-leaflet");
    if (!elMapa || typeof window.L === "undefined") {
      var svgFallback = document.getElementById("mapa");
      if (svgFallback && typeof window.L === "undefined") svgFallback.style.display = "block";
      return null;
    }
    if (lMap) return lMap;

    var camadaRuas = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
      attribution: "Tiles &copy; Esri &mdash; OpenStreetMap",
      maxZoom: 19
    });
    var camadaSatelite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: "Tiles &copy; Esri",
      maxZoom: 19
    });

    lMap = L.map(elMapa, {
      center: [-12.9780, -38.4620],
      zoom: 12,
      layers: [camadaRuas],
      zoomControl: true,
      scrollWheelZoom: true
    });

    L.control.layers({ "Mapa de Ruas": camadaRuas, "Visão de Satélite": camadaSatelite }, null, { position: "topright" }).addTo(lMap);

    lLayer = L.layerGroup().addTo(lMap);

    elMapa.addEventListener("click", function(e) {
      var btn = e.target.closest("button[data-acao-mapa]");
      if (!btn) return;
      var acao = btn.getAttribute("data-acao-mapa");
      var bairro = btn.getAttribute("data-bairro");
      if (acao === "filtrar") {
        var selBairro = document.getElementById("f-bairro");
        if (selBairro) {
          selBairro.value = (selBairro.value === bairro) ? "" : bairro;
          selBairro.dispatchEvent(new Event("input", { bubbles: true }));
        }
      } else if (acao === "focal") {
        var selRef = document.getElementById("f-ref");
        if (selRef) {
          selRef.value = bairro;
          selRef.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
      if (lMap) lMap.closePopup();
    });

    return lMap;
  }

  window.atualizarMapaLeaflet = function(lista, ref, r, cont, COORD, BAIRROS, kmFn) {
    ultimoEstadoMapa = { lista: lista, ref: ref, r: r, cont: cont, COORD: COORD, BAIRROS: BAIRROS, km: kmFn };
    if (lMap) {
      renderizarCamadasLeaflet();
    }
  };

  // Lógica de Máscara de Exclusão Mútua entre Filtros Gerais e Filtro por Mapa
  var btnGeo = document.getElementById("btn-toggle-geo");
  var gavetaGeo = document.getElementById("gaveta-geo");
  var barraPrincipal = document.getElementById("filtros-barra-principal");
  var idsGerais = ["f-busca", "f-area", "f-status", "f-disp"];
  var idsGeo = ["f-bairro", "f-form", "f-ativ", "f-raio"];
  var selBairroGeo = document.getElementById("f-bairro");
  var selRaioGeo = document.getElementById("f-raio");
  var selRefGeo = document.getElementById("f-ref");
  var wrapBairroGeo = document.getElementById("wrap-f-bairro");
  var wrapRefGeo = document.getElementById("wrap-f-ref");
  var wrapRaioGeo = document.getElementById("wrap-f-raio");

  function sincronizarMascaraSubGeo(origem) {
    if (!selBairroGeo || !selRaioGeo) return;
    var valBairro = selBairroGeo.value;
    var valRaio = Number(selRaioGeo.value || 0);

    if (origem === "raio" && valRaio > 0) {
      selBairroGeo.value = "";
      valBairro = "";
    } else if (origem === "bairro" && valBairro !== "") {
      selRaioGeo.value = "";
      valRaio = 0;
    }

    var mascararBairro = valRaio > 0;
    var mascararRaio = valBairro !== "";

    if (wrapBairroGeo) wrapBairroGeo.classList.toggle("campo-mascarado", mascararBairro);
    if (selBairroGeo) selBairroGeo.disabled = mascararBairro;

    if (wrapRefGeo) wrapRefGeo.classList.toggle("campo-mascarado", mascararRaio);
    if (wrapRaioGeo) wrapRaioGeo.classList.toggle("campo-mascarado", mascararRaio);
    if (selRefGeo) selRefGeo.disabled = mascararRaio;
    if (selRaioGeo) selRaioGeo.disabled = mascararRaio;
  }

  function definirModoMapa(ativo) {
    if (!barraPrincipal || !gavetaGeo || !btnGeo) return;
    gavetaGeo.style.display = ativo ? "block" : "none";
    btnGeo.classList.toggle("ativo", ativo);
    btnGeo.setAttribute("aria-expanded", String(ativo));
    barraPrincipal.classList.toggle("modo-mapa-ativo", ativo);

    if (ativo) {
      // Ao ativar o filtro por mapa, limpa e bloqueia os filtros gerais com máscara
      idsGerais.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) {
          el.value = "";
          el.disabled = true;
        }
      });
      sincronizarMascaraSubGeo();
      if (typeof window.tabela === "function") window.tabela();
      setTimeout(function() {
        inicializarLeaflet();
        if (lMap) {
          lMap.invalidateSize();
          renderizarCamadasLeaflet();
        }
      }, 60);
    } else {
      // Ao desativar o filtro por mapa, limpa os filtros territoriais e reativa os filtros gerais
      idsGerais.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.disabled = false;
      });
      idsGeo.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) {
          el.value = "";
          el.disabled = false;
        }
      });
      if (selRefGeo) selRefGeo.disabled = false;
      if (wrapBairroGeo) wrapBairroGeo.classList.remove("campo-mascarado");
      if (wrapRefGeo) wrapRefGeo.classList.remove("campo-mascarado");
      if (wrapRaioGeo) wrapRaioGeo.classList.remove("campo-mascarado");
      if (typeof window.tabela === "function") window.tabela();
    }
  }

  if (btnGeo && gavetaGeo) {
    btnGeo.addEventListener("click", function() {
      var aberto = gavetaGeo.style.display !== "none";
      definirModoMapa(!aberto);
    });
  }

  if (selBairroGeo) {
    selBairroGeo.addEventListener("input", function() {
      sincronizarMascaraSubGeo("bairro");
      if (typeof window.tabela === "function") window.tabela();
    });
  }

  if (selRaioGeo) {
    selRaioGeo.addEventListener("input", function() {
      sincronizarMascaraSubGeo("raio");
      if (typeof window.tabela === "function") window.tabela();
    });
  }

  var btnLimpar = document.getElementById("limpar");
  if (btnLimpar) {
    btnLimpar.addEventListener("click", function() {
      setTimeout(function() {
        var mapaAberto = gavetaGeo && gavetaGeo.style.display !== "none";
        if (mapaAberto) {
          idsGerais.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.disabled = true;
          });
          sincronizarMascaraSubGeo();
        }
      }, 10);
    });
  }

  // Atualizar nome do perfil ativo na tela de governança e sincronizar com banco Neon ao logar
  function sincronizarNeon() {
    if (location.protocol === "file:") return;
    fetch("/api/inscricoes")
      .then(function(r) { return r.ok ? r.json() : []; })
      .then(function(rows) {
        if (!Array.isArray(rows) || !rows.length || !window.vols) return;
        rows.forEach(function(dbVol) {
          var jaExiste = window.vols.some(function(v) {
            return v.email && dbVol.email && v.email.toLowerCase() === dbVol.email.toLowerCase();
          });
          if (!jaExiste) {
            window.vols.unshift({
              id: 1000 + Number(dbVol.id || Date.now()),
              nome: dbVol.nome || "Voluntário",
              areas: Array.isArray(dbVol.areas) && dbVol.areas.length ? dbVol.areas : ["Apoio operacional"],
              form: dbVol.formacao || "Graduado(a)",
              disp: Array.isArray(dbVol.disponibilidade) && dbVol.disponibilidade.length ? dbVol.disponibilidade : ["Fins de semana"],
              bairro: dbVol.bairro || "Brotas",
              status: dbVol.status || "Recebida",
              tel: dbVol.telefone || "(71) 90000-0000",
              email: dbVol.email || "",
              ativ: dbVol.acao_interesse || "Ainda sem atividade"
            });
          }
        });
        if (typeof window.geral === "function") window.geral();
        if (typeof window.tabela === "function") window.tabela();
      })
      .catch(function() {});
  }

  var formLogin = document.getElementById("f-login");
  if (formLogin) {
    formLogin.addEventListener("submit", function() {
      setTimeout(function() {
        var elTag = document.getElementById("perfil-tag");
        var elNomeAcesso = document.getElementById("perfil-ativo-nome");
        if (elTag && elNomeAcesso) {
          elNomeAcesso.textContent = elTag.textContent;
        }
        sincronizarNeon();
      }, 50);
    });
  }

  // Lógica do Modal e Cadastro de Ações
  var btnNovaAcao = document.getElementById("btn-nova-acao");
  var modalNovaAcao = document.getElementById("modal-nova-acao");
  var btnFecharModal = document.getElementById("btn-fechar-modal-acao");
  var btnCancelaModal = document.getElementById("btn-cancelar-cad-acao");
  var formCadAcao = document.getElementById("form-cad-acao");
  var cadDesc = document.getElementById("cad-desc");
  var cadContador = document.getElementById("cad-desc-contador");

  function abrirModalAcao() {
    if (!modalNovaAcao) return;
    modalNovaAcao.style.display = "flex";
    document.body.style.overflow = "hidden";
    var inTitulo = document.getElementById("cad-titulo");
    if (inTitulo) inTitulo.focus();
  }

  function fecharModalAcao() {
    if (!modalNovaAcao) return;
    modalNovaAcao.style.display = "none";
    document.body.style.overflow = "";
    if (formCadAcao) formCadAcao.reset();
    atualizarContadorDesc();
  }

  if (btnNovaAcao) btnNovaAcao.addEventListener("click", abrirModalAcao);
  if (btnFecharModal) btnFecharModal.addEventListener("click", fecharModalAcao);
  if (btnCancelaModal) btnCancelaModal.addEventListener("click", fecharModalAcao);

  if (modalNovaAcao) {
    modalNovaAcao.addEventListener("click", function(e) {
      if (e.target === modalNovaAcao) fecharModalAcao();
    });
  }

  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && modalNovaAcao && modalNovaAcao.style.display === "flex") {
      fecharModalAcao();
    }
  });

  function atualizarContadorDesc() {
    if (!cadDesc || !cadContador) return;
    var len = cadDesc.value.length;
    cadContador.textContent = len + " / 100 caracteres (padrão)";
    if (len > 100) {
      cadContador.style.color = "var(--laranja)";
    } else {
      cadContador.style.color = "#64748b";
    }
  }

  if (cadDesc) {
    cadDesc.addEventListener("input", atualizarContadorDesc);
  }

  function mostrarToastAcao(msg) {
    var toast = document.createElement("div");
    toast.className = "toast-sucesso-acao";
    toast.innerHTML = icoCheckInline + ' <span>' + msg + '</span>';
    document.body.appendChild(toast);
    setTimeout(function() { toast.classList.add("vis"); }, 20);
    setTimeout(function() {
      toast.classList.remove("vis");
      setTimeout(function() { toast.remove(); }, 300);
    }, 3200);
  }

  if (formCadAcao) {
    formCadAcao.addEventListener("submit", function(e) {
      e.preventDefault();
      var titulo = document.getElementById("cad-titulo").value.trim();
      var selArea = document.getElementById("cad-area");
      var area = selArea ? selArea.value : "Educação";
      var cor = (selArea && selArea.selectedIndex >= 0) ? (selArea.options[selArea.selectedIndex].getAttribute("data-cor") || "#085EC3") : "#085EC3";
      var dataTxt = document.getElementById("cad-data").value.trim();
      var localTxt = (document.getElementById("cad-local") && document.getElementById("cad-local").value.trim()) || "Sede Usina da Vida";
      var num = parseInt(document.getElementById("cad-vagas").value, 10) || 10;
      var desc = document.getElementById("cad-desc").value.trim();

      if (window.AGEND) {
        window.AGEND.unshift({
          t: titulo,
          a: area,
          c: cor,
          dt: dataTxt,
          loc: localTxt,
          vagas: num,
          p: desc,
          insc: []
        });
      }
      if (typeof window.agend === "function") window.agend();
      if (typeof window.visao === "function") window.visao("agend");
      if (typeof window.geral === "function") window.geral();
      fecharModalAcao();
      mostrarToastAcao("Nova ação cadastrada e agendada com sucesso!");
    });
  }
})();
</script>`;

  html = html.replace('</head>', () => estilosPortal + '\n</head>');
  html = html.replace('</body>', () => modalAcaoHtml + '\n' + scriptPortal + '\n</body>');
  return html;
}

function processar(origem, destino, prefixo, patch) {
  let html = fs.readFileSync(path.join(SRC, origem), 'utf8');
  html = html.replace(/data:image\/(jpeg|jpg|png|webp|gif|svg\+xml);base64,([A-Za-z0-9+/=]+)/g, (m, tipo, b64) => {
    const chave = b64.length + ':' + b64.slice(0, 80) + b64.slice(-80);
    if (seen.has(chave)) return seen.get(chave);
    const ext = tipo === 'jpeg' ? 'jpg' : tipo === 'svg+xml' ? 'svg' : tipo;
    n += 1;
    const nome = `${prefixo}-${String(n).padStart(2, '0')}.${ext}`;
    fs.writeFileSync(path.join(ASSETS, nome), Buffer.from(b64, 'base64'));
    const url = `/assets/${nome}`;
    seen.set(chave, url);
    return url;
  });
  if (patch) html = patch(html);
  fs.writeFileSync(path.join(OUT, destino), html, 'utf8');
  console.log(destino, (html.length / 1024).toFixed(0) + ' KB');
}

processar('index.original.html', 'landing.html', 'img', ligarLanding);
processar('portal.original.html', 'portal-app.html', 'img', redesenharPortal);

// Disponibiliza o arquivo como index.html em public/ e na raiz do projeto
fs.copyFileSync(path.join(OUT, 'landing.html'), path.join(OUT, 'index.html'));

// Na raiz do projeto, ajusta para caminhos relativos para funcionar tanto no servidor quanto dando duplo clique no Windows
let htmlRaiz = fs.readFileSync(path.join(OUT, 'landing.html'), 'utf8');
htmlRaiz = htmlRaiz.replace(/(src|href)=["']\/assets\//g, '$1="assets/');
fs.writeFileSync(path.join(__dirname, '..', 'index.html'), htmlRaiz, 'utf8');

const ROOT_ASSETS = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(ROOT_ASSETS)) fs.mkdirSync(ROOT_ASSETS, { recursive: true });
for (const f of fs.readdirSync(ASSETS)) {
  fs.copyFileSync(path.join(ASSETS, f), path.join(ROOT_ASSETS, f));
}
console.log('index.html disponibilizado em public/ e na raiz com assets');
console.log('imagens unicas:', n);

