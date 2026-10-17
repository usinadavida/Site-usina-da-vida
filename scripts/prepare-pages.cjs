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
  html = html.replace('← Voltar ao site da Usina da Vida', '← Retornar ao site institucional');

  // 4. Transformar Visão Geral com cabeçalho corporativo e status
  html = html.replace('<h2>Visão geral dos cadastros</h2>', 
    '<div class="painel-cab">' +
    '  <div>' +
    '    <h2>Visão Geral dos Cadastros</h2>' +
    '    <p class="subtitulo-painel">Monitoramento em tempo real de voluntários, etapas de triagem e iniciativas sociais.</p>' +
    '  </div>' +
    '  <div class="status-sinc"><span class="ponto-verde"></span> Base de dados sincronizada</div>' +
    '</div>');

  // 5. Transformar Voluntários: cabeçalho com ações no topo, filtros compactos e gaveta territorial
  const volAntigo = /<h2>Voluntários cadastrados<\/h2>\s*<div class="filtros"[\s\S]*?<\/table>\s*<div id="vazio"/;
  const volNovo = 
    '<div class="painel-cab">' +
    '  <div>' +
    '    <h2>Voluntários Cadastrados</h2>' +
    '    <p class="subtitulo-painel">Banco de talentos, triagem de disponibilidade e mobilização territorial em Salvador.</p>' +
    '  </div>' +
    '  <div class="acoes-topo-vol">' +
    '    <button class="btn btn-cont" id="limpar" type="button">Limpar filtros</button>' +
    '    <button class="btn btn-azul" id="csv" type="button">Exportar lista (CSV)</button>' +
    '  </div>' +
    '</div>\n' +
    '<!-- BARRA PRINCIPAL DE FILTROS -->' +
    '<div class="filtros-barra" role="search" aria-label="Filtros de voluntários">' +
    '  <div class="filtro-campo campo-busca">' +
    '    <label for="f-busca">Buscar por nome</label>' +
    '    <div class="busca-input-wrap">' +
    '      <span class="busca-ico">🔍</span>' +
    '      <input id="f-busca" type="text" placeholder="Digite o nome do voluntário...">' +
    '    </div>' +
    '  </div>' +
    '  <div class="filtro-campo">' +
    '    <label for="f-area">Área de atuação</label>' +
    '    <select id="f-area"></select>' +
    '  </div>' +
    '  <div class="filtro-campo">' +
    '    <label for="f-status">Status da inscrição</label>' +
    '    <select id="f-status"></select>' +
    '  </div>' +
    '  <div class="filtro-campo">' +
    '    <label for="f-disp">Disponibilidade</label>' +
    '    <select id="f-disp"></select>' +
    '  </div>' +
    '  <div class="filtro-campo campo-btn-geo">' +
    '    <label>&nbsp;</label>' +
    '    <button type="button" id="btn-toggle-geo" class="btn-geo-toggle" aria-expanded="false">' +
    '      📍 Filtros Territoriais & Mapa' +
    '    </button>' +
    '  </div>' +
    '</div>\n' +
    '<!-- GAVETA EXPANSÍVEL DE FILTROS AVANÇADOS E MAPA TERRITORIAL -->' +
    '<div class="gaveta-geo" id="gaveta-geo" style="display:none">' +
    '  <div class="gaveta-grid">' +
    '    <div class="geo-filtros-extra">' +
    '      <div class="filtro-campo"><label for="f-bairro">Bairro / Localidade</label><select id="f-bairro"></select></div>' +
    '      <div class="filtro-campo"><label for="f-form">Formação acadêmica</label><select id="f-form"></select></div>' +
    '      <div class="filtro-campo"><label for="f-ativ">Alocação em atividade</label><select id="f-ativ"></select></div>' +
    '      <div class="filtro-campo"><label for="f-ref">Ponto focal de referência</label><select id="f-ref"></select></div>' +
    '      <div class="filtro-campo"><label for="f-raio">Raio de proximidade (km)</label><input id="f-raio" type="number" min="0" max="200" step="0.5" inputmode="decimal" list="raios" placeholder="Ex.: 4,5"><datalist id="raios"><option value="3"><option value="5"><option value="8"><option value="12"><option value="20"></datalist></div>' +
    '    </div>' +
    '    <div class="geo-mapa-wrap">' +
    '      <div class="mapa-cab"><b>Distribuição Territorial de Salvador</b><span id="mapa-leg"></span></div>' +
    '      <svg id="mapa" viewBox="0 0 330 175" role="img" aria-label="Mapa esquemático dos bairros com o raio de distância"></svg>' +
    '      <p class="mapa-info">Alcance territorial estimado a partir da sede comunitária da Usina da Vida.</p>' +
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

  // 6. Transformar Ações: cabeçalho corporativo, toolbar com botão justificado à direita e padronização visual
  html = html.replace(/<h2>Ações<\/h2>\s*<p style="margin:0">[\s\S]*?<\/p>/, 
    '<div class="painel-cab">' +
    '  <div>' +
    '    <h2>Ações e Projetos Comunitários</h2>' +
    '    <p class="subtitulo-painel">Acompanhamento e registro operacional das oficinas, projetos e iniciativas sociais da Usina da Vida.</p>' +
    '  </div>' +
    '</div>');

  // Toolbar com filtros de ações à esquerda e botão de cadastrar (inovação) justificado à direita
  const subAntigo = /<div class="sub" role="tablist" aria-label="Tipo de ação">[\s\S]*?<\/div>/;
  const subNovo = 
    '<div class="acoes-toolbar">\n' +
    '  <div class="sub" role="tablist" aria-label="Tipo de ação">\n' +
    '    <button type="button" role="tab" id="s-todas" aria-selected="true">Todas <span id="n-todas"></span></button>\n' +
    '    <button type="button" role="tab" id="s-real" aria-selected="false">Realizadas <span id="n-real"></span></button>\n' +
    '    <button type="button" role="tab" id="s-agend" aria-selected="false">Agendadas <span id="n-agend"></span></button>\n' +
    '  </div>\n' +
    '  <div class="acoes-cad-wrap">\n' +
    '    <button type="button" id="btn-nova-acao" class="btn-cad-acao" title="Cadastrar nova ação ou iniciativa comunitária">\n' +
    '      <span class="badge-cad-inov">Inovação</span>\n' +
    '      <span class="txt-cad-acao">＋ Cadastrar Nova Ação</span>\n' +
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

  // Substituição das funções de renderização com padronizador rigoroso de caracteres e layout uniforme
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

  function acoes(){
    $("acoes").innerHTML = ACOES.map(function(a){
      var descInfo = padronizarDesc(a.p, 100);
      return '<article class="acao" style="--c:' + a.c + '">' +
        '<div class="acao-topo">' +
          '<span class="tag" style="background:' + a.c + '18;color:' + a.c + ';border:1px solid ' + a.c + '40;">' + esc(a.a) + '</span>' +
          '<span class="acao-data-pill">✓ ' + esc(a.d) + '</span>' +
        '</div>' +
        '<h3 class="acao-titulo" title="' + esc(a.t) + '">' + esc(a.t) + '</h3>' +
        '<p class="acao-desc" title="' + esc(descInfo.completo) + '">' + esc(descInfo.visivel) + '</p>' +
        '<div class="acao-rodape">' +
          '<div class="acao-meta-real">' +
            '<span class="meta-vol-cont">👥 <b>' + a.n + '</b> voluntários</span>' +
            '<span class="meta-status-feita">Concluída</span>' +
          '</div>' +
          '<div class="acao-impacto-barra"><div class="acao-impacto-prog" style="width:100%;background:' + a.c + '"></div></div>' +
          '<div class="acao-meta-sub">Iniciativa realizada · Arquivada na governança</div>' +
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
          '<span class="acao-data-pill dt-agendada">📅 ' + esc(a.dt) + '</span>' +
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

  // 7. Transformar Níveis de Acesso: matriz completa de governança e LGPD
  const acessoAntigo = /<!-- ACESSO -->\s*<section class="painel" id="p-acesso"[\s\S]*?<\/section>/;
  const acessoNovo = 
    '<!-- ACESSO -->\n' +
    '<section class="painel" id="p-acesso" role="tabpanel" aria-labelledby="t-acesso">\n' +
    '  <div class="painel-cab">\n' +
    '    <div>\n' +
    '      <h2>Governança e Níveis de Acesso</h2>\n' +
    '      <p class="subtitulo-painel">Matriz de permissões institucionais e conformidade com privacidade e proteção de dados (LGPD).</p>\n' +
    '    </div>\n' +
    '    <div class="sessao-badge">\n' +
    '      <span class="ponto-verde"></span>\n' +
    '      <span>Sessão autenticada: <strong id="perfil-ativo-nome">Presidência</strong></span>\n' +
    '    </div>\n' +
    '  </div>\n\n' +
    '  <!-- CARDS DOS TRÊS NÍVEIS -->\n' +
    '  <div class="cards-acesso">\n' +
    '    <div class="card-nivel" style="--cor-borda: var(--azul)">\n' +
    '      <div class="nivel-topo">\n' +
    '        <span class="nivel-tag tag-presidencia">Administração Geral</span>\n' +
    '        <h3>Presidência</h3>\n' +
    '      </div>\n' +
    '      <p class="nivel-desc">Gestão executiva e estratégica integral do voluntariado, prestação de contas institucional e governança geral.</p>\n' +
    '      <ul class="nivel-itens">\n' +
    '        <li><span class="chk">✓</span> Visão completa de métricas e indicadores</li>\n' +
    '        <li><span class="chk">✓</span> Consulta e triagem com dados sensíveis</li>\n' +
    '        <li><span class="chk">✓</span> Alteração e validação de status</li>\n' +
    '        <li><span class="chk">✓</span> Gestão de vagas e eventos comunitários</li>\n' +
    '        <li><span class="chk">✓</span> Exportação irrestrita de relatórios (CSV)</li>\n' +
    '      </ul>\n' +
    '    </div>\n\n' +
    '    <div class="card-nivel" style="--cor-borda: var(--laranja)">\n' +
    '      <div class="nivel-topo">\n' +
    '        <span class="nivel-tag tag-coordenacao">Gestão Operacional</span>\n' +
    '        <h3>Coordenação</h3>\n' +
    '      </div>\n' +
    '      <p class="nivel-desc">Alinhamento das atividades de campo, triagem direta de inscritos, contato e organização de oficinas comunitárias.</p>\n' +
    '      <ul class="nivel-itens">\n' +
    '        <li><span class="chk">✓</span> Visão completa de métricas e indicadores</li>\n' +
    '        <li><span class="chk">✓</span> Acesso aos canais diretos de contato</li>\n' +
    '        <li><span class="chk">✓</span> Alteração de status e triagem ativa</li>\n' +
    '        <li><span class="chk">✓</span> Confirmação de participantes em ações</li>\n' +
    '        <li class="bloq"><span class="chk-bloq">—</span> Sem permissão de exportação de base</li>\n' +
    '      </ul>\n' +
    '    </div>\n\n' +
    '    <div class="card-nivel" style="--cor-borda: #64748b">\n' +
    '      <div class="nivel-topo">\n' +
    '        <span class="nivel-tag tag-colaborador">Consulta Protegida</span>\n' +
    '        <h3>Colaborador Autorizado</h3>\n' +
    '      </div>\n' +
    '      <p class="nivel-desc">Apoio operacional e consulta de disponibilidades. Respeita a privacidade (LGPD), mantendo contatos pessoais resguardados.</p>\n' +
    '      <ul class="nivel-itens">\n' +
    '        <li><span class="chk">✓</span> Consulta de competências e áreas</li>\n' +
    '        <li><span class="chk">✓</span> Filtro de disponibilidade e bairros</li>\n' +
    '        <li class="bloq"><span class="chk-bloq">🔒</span> Contatos sensíveis protegidos</li>\n' +
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

  // 9. Melhorar a formatação da linha de contato na tabela
  html = html.replace(
    'var contato = pode ? \'<a href="https://wa.me/55\'+v.tel.replace(/\\D/g,"")+\'" rel="noopener">\'+esc(v.tel)+\'</a><br>\'+esc(v.email) : \'<span class="oculto">restrito</span>\';',
    'var contato = pode ? \'<a class="link-wa" href="https://wa.me/55\'+v.tel.replace(/\\D/g,"")+\'" target="_blank" rel="noopener" title="Abrir conversa no WhatsApp"><span class="wa-ico">💬</span> \'+esc(v.tel)+\'</a><div class="txt-email">\'+esc(v.email)+\'</div>\' : \'<span class="tag-restrito">🔒 Protegido (LGPD)</span>\';'
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
.status-sinc, .sessao-badge {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.85rem;
  color: #334155;
  background: #fff;
  border: 1px solid var(--borda);
  padding: 5px 12px;
  border-radius: 999px;
}
.ponto-verde {
  width: 8px;
  height: 8px;
  background: var(--verde);
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(15, 157, 88, 0.2);
}

/* BOTÕES COM NEO-BRUTALISMO HARMONIOSO */
.btn-azul {
  background: var(--tinta);
  color: #fff;
  border: 2px solid var(--tinta);
  box-shadow: 3px 3px 0 var(--amarelo);
  border-radius: 4px;
  font-weight: 600;
  padding: 8px 18px;
  cursor: pointer;
  transition: all 0.15s;
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
  transition: all 0.15s;
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
  transition: background 0.12s;
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

/* TOOLBAR PRINCIPAL DE FILTROS DOS VOLUNTÁRIOS */
.filtros-barra {
  background: #fff;
  border: 1px solid var(--borda);
  border-radius: 6px;
  padding: 14px 18px;
  display: grid;
  grid-template-columns: 2fr 1.3fr 1.2fr 1.2fr auto;
  gap: 12px;
  align-items: flex-end;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  margin-bottom: 12px;
}
@media (max-width: 1024px) {
  .filtros-barra {
    grid-template-columns: 1fr 1fr;
  }
}
.filtro-campo label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 4px;
}
.busca-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.busca-ico {
  position: absolute;
  left: 12px;
  font-size: 0.85rem;
  pointer-events: none;
  opacity: 0.6;
  z-index: 2;
}
.filtros-barra .busca-input-wrap input {
  padding-left: 36px !important;
}
.filtros-barra input, .filtros-barra select, .gaveta-geo input, .gaveta-geo select {
  width: 100%;
  border: 1.5px solid #cbd5e1;
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 0.88rem;
  color: var(--tinta);
  background: #fff;
}
.filtros-barra input:focus, .filtros-barra select:focus, .gaveta-geo input:focus, .gaveta-geo select:focus {
  border-color: var(--azul);
  outline: none;
  box-shadow: 0 0 0 3px rgba(8,94,195,0.18);
}
.btn-geo-toggle {
  background: #f1f5f9;
  border: 1.5px solid #cbd5e1;
  color: var(--azul);
  font-weight: 600;
  font-size: 0.86rem;
  padding: 9px 14px;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.btn-geo-toggle:hover, .btn-geo-toggle.ativo {
  background: var(--azul);
  border-color: var(--azul);
  color: #fff;
}

/* GAVETA DE FILTROS GEOGRÁFICOS E MAPA */
.gaveta-geo {
  background: #fff;
  border: 1px solid var(--borda);
  border-radius: 6px;
  padding: 18px;
  margin-bottom: 14px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
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
  font-size: 0.84rem;
  margin-bottom: 8px;
}
#mapa {
  width: 100%;
  height: auto;
  max-height: 190px;
  background: #eaf2fb;
  border-radius: 4px;
  display: block;
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

/* TOOLBAR DE AÇÕES E BOTÃO DE INOVAÇÃO JUSTIFICADO À DIREITA */
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
  gap: 10px;
  background: var(--amarelo);
  color: var(--tinta);
  font-family: var(--sans);
  font-size: 0.92rem;
  font-weight: 700;
  padding: 8px 18px;
  border-radius: 999px;
  border: 2px solid #000;
  box-shadow: 2px 2px 0px #000;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}
.btn-cad-acao:hover {
  background: #fcd34d;
  transform: translateY(-1px);
  box-shadow: 3px 3px 0px #000;
}
.btn-cad-acao:active {
  transform: translateY(1px);
  box-shadow: 1px 1px 0px #000;
}
.badge-cad-inov {
  background: var(--azul);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 3px 9px;
  border-radius: 999px;
  display: inline-block;
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
  border-radius: 10px;
  border: 1px solid var(--borda);
  border-top: 5px solid var(--c, var(--azul));
  padding: 16px 18px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  height: 365px;
  box-sizing: border-box;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
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
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.acao-data-pill {
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  padding: 3px 9px;
  border-radius: 6px;
  white-space: nowrap;
}
.acao-data-pill.dt-agendada {
  color: var(--azul);
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  font-weight: 700;
}
.acao-titulo {
  font-size: 1.08rem;
  font-weight: 700;
  color: var(--tinta);
  margin: 10px 0 6px;
  line-height: 1.35;
  height: 2.7em;
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
  height: 4.5em;
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
  color: #1e293b;
  font-weight: 600;
}
.meta-status-feita {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  background: #dcfce7;
  color: #15803d;
  padding: 2px 8px;
  border-radius: 999px;
}
.acao-impacto-barra {
  width: 100%;
  height: 6px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
}
.acao-impacto-prog {
  height: 100%;
  border-radius: 999px;
}
.acao-meta-sub {
  font-size: 0.76rem;
  color: #94a3b8;
}
.acao-details {
  font-size: 0.85rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
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
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  border: 2px solid #000;
  width: 100%;
  max-width: 520px;
  max-height: 94vh;
  overflow-y: auto;
  box-sizing: border-box;
  animation: modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes modalSlideUp {
  from { transform: translateY(20px) scale(0.97); }
  to { transform: translateY(0) scale(1); }
}
.modal-cab {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 10px 18px 6px;
  border-bottom: 1px solid var(--borda);
  background: #f8fafc;
}
.badge-inovacao {
  display: inline-block;
  background: var(--azul);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 7px;
  border-radius: 999px;
  margin-bottom: 2px;
}
.modal-cab h3 {
  font-family: var(--serif);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--tinta);
  margin: 0;
}
.modal-subtitulo {
  font-size: 0.78rem;
  color: #64748b;
  margin: 1px 0 0;
}
.modal-fechar {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  line-height: 1;
  color: #64748b;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s;
}
.modal-fechar:hover {
  background: #fee2e2;
  color: var(--vermelho);
}
.form-modal-acao {
  padding: 14px 22px 18px;
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
  gap: 8px;
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
}
.req {
  color: var(--vermelho);
}
.form-input, .form-select {
  width: 100%;
  box-sizing: border-box;
  padding: 4px 8px;
  border: 1.5px solid var(--borda);
  border-radius: 7px;
  font-family: var(--sans);
  font-size: 0.84rem;
  color: var(--tinta);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.form-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 4px 8px;
  border: 1.5px solid var(--borda);
  border-radius: 7px;
  font-family: var(--sans);
  font-size: 0.84rem;
  color: var(--tinta);
  outline: none;
  height: 42px;
  min-height: 38px;
  max-height: 60px;
  resize: vertical;
  transition: border-color 0.15s, box-shadow 0.15s;
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
  padding-top: 6px;
  border-top: 1px solid var(--borda);
}
.btn-salvar-acao {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--amarelo);
  color: var(--tinta);
  font-weight: 700;
  font-size: 0.85rem;
  border: 2px solid #000;
  box-shadow: 2px 2px 0px #000;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-salvar-acao:hover {
  background: #fcd34d;
  transform: translateY(-1px);
  box-shadow: 3px 3px 0px #000;
}
.toast-sucesso-acao {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #15803d;
  color: #fff;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.92rem;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  z-index: 999999;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.25s, transform 0.25s;
  display: flex;
  align-items: center;
  gap: 8px;
}
.toast-sucesso-acao.vis {
  opacity: 1;
  transform: translateY(0);
}
</style>`;

  // 12. Modal HTML de Cadastramento de Nova Ação (Inovação)
  const modalAcaoHtml = `<!-- MODAL DE CADASTRAMENTO DE NOVA AÇÃO (INOVAÇÃO) -->
<div class="modal-backdrop" id="modal-nova-acao" style="display: none;" role="dialog" aria-modal="true" aria-labelledby="modal-acao-titulo">
  <div class="modal-card">
    <div class="modal-cab">
      <div class="modal-cab-info">
        <span class="badge-inovacao">Inovação Comunitária</span>
        <h3 id="modal-acao-titulo">Cadastrar Nova Ação Social</h3>
        <p class="modal-subtitulo">Preencha os dados abaixo para cadastrar e agendar uma nova ação social com abertura de vagas para voluntários.</p>
      </div>
      <button type="button" class="modal-fechar" id="btn-fechar-modal-acao" aria-label="Fechar formulário">✕</button>
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
          <span>＋ Cadastrar e Publicar Ação</span>
        </button>
      </div>
    </form>
  </div>
</div>`;

  // 13. Script complementar para interações dinâmicas do portal
  const scriptPortal = `<script id="script-portal-harmonia">
(function(){
  // Alternar gaveta de filtros territoriais
  var btnGeo = document.getElementById("btn-toggle-geo");
  var gavetaGeo = document.getElementById("gaveta-geo");
  if (btnGeo && gavetaGeo) {
    btnGeo.addEventListener("click", function() {
      var aberto = gavetaGeo.style.display !== "none";
      gavetaGeo.style.display = aberto ? "none" : "block";
      btnGeo.classList.toggle("ativo", !aberto);
      btnGeo.setAttribute("aria-expanded", !aberto);
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

  // Lógica do Modal e Cadastro de Ações (Inovação)
  var btnNovaAcao = document.getElementById("btn-nova-acao");
  var modalNovaAcao = document.getElementById("modal-nova-acao");
  var btnFecharModal = document.getElementById("btn-fechar-modal-acao");
  var btnCancelaModal = document.getElementById("btn-cancelar-cad-acao");
  var formCadAcao = document.getElementById("form-cad-acao");
  var cadDesc = document.getElementById("cad-desc");
  var cadContador = document.getElementById("cad-desc-contador");
  var cadVagasLbl = document.getElementById("lbl-cad-vagas");
  var cadVagasInput = document.getElementById("cad-vagas");

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
    toast.innerHTML = '<span style="font-size:1.1rem">✓</span> ' + msg;
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

