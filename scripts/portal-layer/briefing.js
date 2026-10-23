/* =====================================================================
   COMPORTAMENTO DO BRIEFING VISUAL — Gestão Cívica Operacional
   Dub = estrutura | Visitors = dados | Orderful = fluxos e estados
   ===================================================================== */
(function() {
  'use strict';

  // 1. Estado da tabela de voluntários (Dub: paginação e ordenação)
  var estadoTabela = {
    pagina: 1,
    itensPorPagina: 10,
    colunaOrdenacao: null, // 'nome', 'areas', 'form', 'disp', 'bairro', 'status'
    ordemAsc: true,
    colunasOcultas: {} // { 2: true, ... }
  };

  // Nomes das colunas correspondentes aos índices
  var NOMES_COLUNAS = [
    'Voluntário', 'Área(s)', 'Formação', 'Disponibilidade',
    'Localização', 'Atividade', 'Status', 'Ações'
  ];

  // Adiciona data-label em todas as células da tabela para o layout mobile em cards
  function aplicarDataLabelsMobile() {
    var tabela = document.querySelector('#p-vol table');
    if (!tabela) return;
    var linhas = tabela.querySelectorAll('tbody tr');
    Array.prototype.forEach.call(linhas, function(tr) {
      var celulas = tr.children;
      for (var i = 0; i < celulas.length && i < NOMES_COLUNAS.length; i++) {
        celulas[i].setAttribute('data-label', NOMES_COLUNAS[i]);
      }
    });
  }

  // Intercepta a renderização de tabela() para suportar ordenação, paginação e meta-toolbar Dub
  function inicializarTabelaDub() {
    var pVol = document.getElementById('p-vol');
    if (!pVol) return;

    // Injeta a toolbar da tabela (contagem + seletor de colunas) se ainda não existir
    var tabelaWrap = pVol.querySelector('.tabela-wrap');
    if (!tabelaWrap) return;

    if (!document.getElementById('ub-toolbar-wrap')) {
      var toolbar = document.createElement('div');
      toolbar.id = 'ub-toolbar-wrap';
      toolbar.className = 'ub-tabela-toolbar';
      toolbar.innerHTML =
        '<div class="tabela-meta-barra">' +
          '<span id="contagem" aria-live="polite"></span>' +
          '<span id="badge-filtros-ativos" class="badge-filtros-ativos" style="display:none"></span>' +
        '</div>' +
        '<div class="ub-colunas">' +
          '<button type="button" class="btn btn-cont btn-sm" id="btn-toggle-colunas" aria-haspopup="true" aria-expanded="false" title="Exibir ou ocultar colunas">' +
            '<svg class="ico-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>' +
            ' <span>Colunas</span>' +
          '</button>' +
          '<div class="ub-colunas-menu" id="menu-colunas" hidden role="menu">' +
            '<label><input type="checkbox" data-col="2" checked> Área(s)</label>' +
            '<label><input type="checkbox" data-col="3" checked> Formação</label>' +
            '<label><input type="checkbox" data-col="4" checked> Disponibilidade</label>' +
            '<label><input type="checkbox" data-col="5" checked> Localização</label>' +
            '<label><input type="checkbox" data-col="6" checked> Atividade</label>' +
            '<label><input type="checkbox" data-col="7" checked> Status</label>' +
          '</div>' +
        '</div>';

      tabelaWrap.parentNode.insertBefore(toolbar, tabelaWrap);

      // Remove a tabela-meta-barra legada se houver duplicata
      var metaLegada = pVol.querySelectorAll('.tabela-meta-barra');
      if (metaLegada.length > 1) {
        metaLegada[0].remove();
      }

      // Event listener do menu de colunas
      var btnColunas = document.getElementById('btn-toggle-colunas');
      var menuColunas = document.getElementById('menu-colunas');
      if (btnColunas && menuColunas) {
        btnColunas.addEventListener('click', function(e) {
          e.stopPropagation();
          var aberto = !menuColunas.hasAttribute('hidden');
          if (aberto) {
            menuColunas.setAttribute('hidden', '');
            btnColunas.setAttribute('aria-expanded', 'false');
          } else {
            menuColunas.removeAttribute('hidden');
            btnColunas.setAttribute('aria-expanded', 'true');
          }
        });

        document.addEventListener('click', function(e) {
          if (!menuColunas.contains(e.target) && e.target !== btnColunas) {
            menuColunas.setAttribute('hidden', '');
            btnColunas.setAttribute('aria-expanded', 'false');
          }
        });

        menuColunas.addEventListener('change', function(e) {
          var chk = e.target;
          var colIdx = chk.getAttribute('data-col');
          var tabela = pVol.querySelector('table');
          if (!tabela || !colIdx) return;
          if (chk.checked) {
            tabela.classList.remove('ub-oculta-' + colIdx);
          } else {
            tabela.classList.add('ub-oculta-' + colIdx);
          }
        });
      }
    }

    // Injeta a barra de paginação abaixo da tabela se ainda não existir
    if (!document.getElementById('ub-paginacao-wrap')) {
      var pagWrap = document.createElement('div');
      pagWrap.id = 'ub-paginacao-wrap';
      pagWrap.className = 'ub-paginacao';
      pagWrap.innerHTML =
        '<div class="ub-pag-info">' +
          '<span id="txt-paginacao">Mostrando 1-10 de 24 voluntários</span>' +
        '</div>' +
        '<div class="ub-paginacao-btns">' +
          '<label style="display:flex;align-items:center;gap:6px;margin:0;font-size:12.5px;">Linhas por pág.: ' +
            '<select id="sel-itens-pag">' +
              '<option value="10" selected>10</option>' +
              '<option value="25">25</option>' +
              '<option value="50">50</option>' +
              '<option value="999">Todas</option>' +
            '</select>' +
          '</label>' +
          '<button type="button" class="btn btn-cont btn-sm" id="btn-pag-ant" disabled>&larr; Anterior</button>' +
          '<span id="num-pagina" style="font-weight:600;padding:0 6px;">1</span>' +
          '<button type="button" class="btn btn-cont btn-sm" id="btn-pag-prox">Próxima &rarr;</button>' +
        '</div>';

      tabelaWrap.parentNode.insertBefore(pagWrap, tabelaWrap.nextSibling);

      // Listeners de paginação
      var selItens = document.getElementById('sel-itens-pag');
      if (selItens) {
        selItens.addEventListener('change', function() {
          estadoTabela.itensPorPagina = parseInt(selItens.value, 10) || 10;
          estadoTabela.pagina = 1;
          reaplicarPaginacao();
        });
      }

      var btnAnt = document.getElementById('btn-pag-ant');
      if (btnAnt) {
        btnAnt.addEventListener('click', function() {
          if (estadoTabela.pagina > 1) {
            estadoTabela.pagina--;
            reaplicarPaginacao();
          }
        });
      }

      var btnProx = document.getElementById('btn-pag-prox');
      if (btnProx) {
        btnProx.addEventListener('click', function() {
          estadoTabela.pagina++;
          reaplicarPaginacao();
        });
      }
    }

    // Configura cabeçalhos com ordenação
    var ths = pVol.querySelectorAll('table thead th');
    Array.prototype.forEach.call(ths, function(th, idx) {
      if (idx === 8) return; // Coluna Ações não ordena
      th.classList.add('ub-ord');
      th.setAttribute('tabindex', '0');
      th.setAttribute('role', 'columnheader');
      if (!th.querySelector('.ub-seta')) {
        var seta = document.createElement('span');
        seta.className = 'ub-seta';
        seta.innerHTML = '⇅';
        th.appendChild(seta);
      }

      function dispararOrdenacao() {
        if (estadoTabela.colunaOrdenacao === idx) {
          estadoTabela.ordemAsc = !estadoTabela.ordemAsc;
        } else {
          estadoTabela.colunaOrdenacao = idx;
          estadoTabela.ordemAsc = true;
        }
        // Atualiza indicadores visuais nos THs
        Array.prototype.forEach.call(ths, function(outroTh, outroIdx) {
          var s = outroTh.querySelector('.ub-seta');
          if (!s) return;
          if (outroIdx === idx) {
            outroTh.setAttribute('aria-sort', estadoTabela.ordemAsc ? 'ascending' : 'descending');
            s.innerHTML = estadoTabela.ordemAsc ? '▲' : '▼';
          } else {
            outroTh.removeAttribute('aria-sort');
            s.innerHTML = '⇅';
          }
        });
        ordenarLinhasDOM(idx, estadoTabela.ordemAsc);
        reaplicarPaginacao();
      }

      th.addEventListener('click', dispararOrdenacao);
      th.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          dispararOrdenacao();
        }
      });
    });
  }

  // Ordena as linhas do DOM na tabela
  function ordenarLinhasDOM(colIdx, asc) {
    var tbody = document.getElementById('corpo');
    if (!tbody) return;
    var rows = Array.prototype.slice.call(tbody.querySelectorAll('tr'));
    rows.sort(function(a, b) {
      var cA = a.children[colIdx] ? a.children[colIdx].textContent.trim().toLowerCase() : '';
      var cB = b.children[colIdx] ? b.children[colIdx].textContent.trim().toLowerCase() : '';
      // Tenta ordenação numérica se possível
      var nA = parseFloat(cA.replace(/[^\d.,]/g, '').replace(',', '.'));
      var nB = parseFloat(cB.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (!isNaN(nA) && !isNaN(nB) && colIdx === 4) { // Distância
        return asc ? (nA - nB) : (nB - nA);
      }
      return asc ? cA.localeCompare(cB, 'pt-BR') : cB.localeCompare(cA, 'pt-BR');
    });
    rows.forEach(function(r) { tbody.appendChild(r); });
  }

  // Re-aplica paginação sobre as linhas visíveis do DOM
  function reaplicarPaginacao() {
    var tbody = document.getElementById('corpo');
    if (!tbody) return;
    var rows = Array.prototype.slice.call(tbody.querySelectorAll('tr'));
    var total = rows.length;
    var porPag = estadoTabela.itensPorPagina;
    var maxPag = Math.max(1, Math.ceil(total / porPag));

    if (estadoTabela.pagina > maxPag) estadoTabela.pagina = maxPag;
    if (estadoTabela.pagina < 1) estadoTabela.pagina = 1;

    var inicio = (estadoTabela.pagina - 1) * porPag;
    var fim = Math.min(inicio + porPag, total);

    rows.forEach(function(r, idx) {
      r.style.display = (idx >= inicio && idx < fim) ? '' : 'none';
    });

    var txtPag = document.getElementById('txt-paginacao');
    if (txtPag) {
      txtPag.textContent = total > 0
        ? 'Mostrando ' + (inicio + 1) + '-' + fim + ' de ' + total + ' voluntários'
        : 'Nenhum resultado';
    }

    var numPag = document.getElementById('num-pagina');
    if (numPag) numPag.textContent = estadoTabela.pagina + ' / ' + maxPag;

    var btnAnt = document.getElementById('btn-pag-ant');
    if (btnAnt) btnAnt.disabled = (estadoTabela.pagina <= 1);

    var btnProx = document.getElementById('btn-pag-prox');
    if (btnProx) btnProx.disabled = (estadoTabela.pagina >= maxPag);

    aplicarDataLabelsMobile();
  }

  // Adiciona porcentagens aos gráficos Visitors da Visão Geral
  function enriquecerGraficosVisitors() {
    var caixasGraficos = document.querySelectorAll('#g-area, #g-status');
    Array.prototype.forEach.call(caixasGraficos, function(caixa) {
      var linhas = caixa.querySelectorAll('.barra-h');
      var total = 0;
      Array.prototype.forEach.call(linhas, function(l) {
        var val = parseInt(l.lastElementChild ? l.lastElementChild.textContent : '0', 10);
        if (!isNaN(val)) total += val;
      });
      if (total <= 0) return;
      Array.prototype.forEach.call(linhas, function(l) {
        var valEl = l.lastElementChild;
        if (!valEl || valEl.querySelector('.ub-pct')) return;
        var val = parseInt(valEl.textContent, 10);
        if (!isNaN(val)) {
          var pct = Math.round((val / total) * 100);
          var span = document.createElement('span');
          span.className = 'ub-pct';
          span.textContent = '(' + pct + '%)';
          valEl.appendChild(span);
        }
      });
    });
  }

  // Enriquece os ActionCards com status Orderful explícito
  function enriquecerActionCardsOrderful() {
    var cardsReal = document.querySelectorAll('#acoes .acao');
    Array.prototype.forEach.call(cardsReal, function(card) {
      var main = card.querySelector('.acao-main > div:first-child');
      if (main && !main.querySelector('.ub-acao-status')) {
        var statusBadge = document.createElement('span');
        statusBadge.className = 'st-pill st-concluida ub-acao-status';
        statusBadge.innerHTML = '<span class="st-dot"></span>Concluída';
        main.appendChild(statusBadge);
      }
    });

    var cardsAgend = document.querySelectorAll('#agend .acao');
    Array.prototype.forEach.call(cardsAgend, function(card) {
      var main = card.querySelector('.acao-main > div:first-child');
      if (main && !main.querySelector('.ub-acao-status')) {
        var statusBadge = document.createElement('span');
        statusBadge.className = 'st-pill st-agendada ub-acao-status';
        statusBadge.innerHTML = '<span class="st-dot"></span>Agendada';
        main.appendChild(statusBadge);
      }
    });
  }

  // Hook no ciclo de vida do portal
  var origTabela = window.tabela;
  if (typeof origTabela === 'function') {
    window.tabela = function() {
      origTabela.apply(this, arguments);
      estadoTabela.pagina = 1;
      inicializarTabelaDub();
      reaplicarPaginacao();
    };
  }

  var origGeral = window.geral;
  if (typeof origGeral === 'function') {
    window.geral = function() {
      origGeral.apply(this, arguments);
      enriquecerGraficosVisitors();
    };
  }

  var origAcoes = window.acoes;
  if (typeof origAcoes === 'function') {
    window.acoes = function() {
      origAcoes.apply(this, arguments);
      enriquecerActionCardsOrderful();
    };
  }

  var origAgend = window.agend;
  if (typeof origAgend === 'function') {
    window.agend = function() {
      origAgend.apply(this, arguments);
      enriquecerActionCardsOrderful();
    };
  }

  // Inicialização no DOMContentLoaded e pós-login
  function boot() {
    inicializarTabelaDub();
    reaplicarPaginacao();
    enriquecerGraficosVisitors();
    enriquecerActionCardsOrderful();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Listener no formulário de login para re-ativar quando logar
  var fLogin = document.getElementById('f-login');
  if (fLogin) {
    fLogin.addEventListener('submit', function() {
      setTimeout(boot, 400);
      setTimeout(boot, 1000);
    });
  }

  // Listener nas abas do portal
  var barraAbas = document.querySelector('.abas');
  if (barraAbas) {
    barraAbas.addEventListener('click', function() {
      setTimeout(boot, 50);
    });
  }
})();
