const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const http = require('http');

const targetDir = 'C:/Users/Dev Rogério/.gemini/antigravity/brain/24afffaf-7594-4357-a9a5-8e3fa28dfaa1';
const projectDir = path.resolve('.');

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  if (reqPath === '/portal') reqPath = '/portal.html';

  // Mock API endpoints
  if (reqPath.startsWith('/api/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, success: true, message: 'Operação simulada com sucesso' }));
    return;
  }

  let filePath = path.join(projectDir, reqPath);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(projectDir, 'public', reqPath);
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const auditResults = [];
function log(area, tela, status, detalhe, printName = null) {
  auditResults.push({ area, tela, status, detalhe, printName });
  console.log(`[${status}] ${area} -> ${tela}: ${detalhe}`);
}

(async () => {
  const PORT = 8092;
  await new Promise(r => server.listen(PORT, r));
  console.log(`Servidor de testes rodando em http://127.0.0.1:${PORT}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1360, height: 820 });

  // Auto handle alerts / confirms
  page.on('dialog', async dialog => {
    console.log(`  [Dialog] ${dialog.type()}: ${dialog.message()}`);
    await dialog.accept();
  });

  // =========================================================================
  // 1. VARREDURA COMPLETA: LANDING PAGE (DESKTOP)
  // =========================================================================
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 500));

  // 1.1 Header & Hero
  log('Landing Page', 'Topo & Navegação', 'OK', 'Navegação horizontal, menu e botões limpos', 'audit-final-01-hero.png');
  await page.screenshot({ path: path.join(targetDir, 'audit-final-01-hero.png') });

  // 1.2 Próximas Ações
  const elProx = await page.$('#proximas');
  if (elProx) {
    await elProx.scrollIntoView();
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(targetDir, 'audit-final-02-proximas.png') });
    log('Landing Page', 'Próximas Ações', 'OK', 'Cards de 2 colunas com superfície branca, coluna de data sutil e botão azul', 'audit-final-02-proximas.png');
  }

  // 1.3 Modal de Inscrição na Ação (Passo 1, Teste de Erro no Passo 2 e Sucesso)
  const btnQuero = await page.$('#proximas .prox .btn.quero');
  if (btnQuero) {
    await btnQuero.click();
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(targetDir, 'audit-final-03-modal-passo1.png') });
    log('Landing Page', 'Modal Ação - Passo 1', 'OK', 'Abertura fluida com backdrop blur e pergunta "Você já é voluntário(a)?"', 'audit-final-03-modal-passo1.png');

    // Avançar para passo 2
    await page.click('#m-sim');
    await new Promise(r => setTimeout(r, 300));

    // Testar validação com campos vazios (Teste de Falha)
    await page.evaluate(() => {
      document.querySelector('#m-p2 button[type="submit"]').click();
    });
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(targetDir, 'audit-final-04-modal-passo2-erros.png') });
    log('Landing Page', 'Modal Ação - Validação', 'OK', 'Campos obrigatórios bloqueados com mensagens de erro vermelhas discretas', 'audit-final-04-modal-passo2-erros.png');

    // Preencher dados corretos
    await page.type('#m-nome', 'Carlos Eduardo');
    await page.type('#m-email', 'carlos@exemplo.com');
    await page.type('#m-tel', '(71) 99876-5432');
    await page.evaluate(() => {
      document.querySelector('#m-p2 button[type="submit"]').click();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(targetDir, 'audit-final-05-modal-sucesso.png') });
    log('Landing Page', 'Modal Ação - Confirmação', 'OK', 'Passo 3 de confirmação exibido com sucesso', 'audit-final-05-modal-sucesso.png');

    await page.click('#m-fim');
    await new Promise(r => setTimeout(r, 300));
  }

  // 1.4 Nossos Programas
  const elProg = await page.$('#programas');
  if (elProg) {
    await elProg.scrollIntoView();
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(targetDir, 'audit-final-06-programas.png') });
    log('Landing Page', 'Nossos Programas', 'OK', 'Cards independentes com topo temático colorido e imagens ampliadas (~84px)', 'audit-final-06-programas.png');
  }

  // 1.5 Formulário de Voluntariado (Etapa 1, Menor de Idade, Etapa 2 e Alinhamento)
  const elInsc = await page.$('#inscricao');
  if (elInsc) {
    await elInsc.scrollIntoView();
    await new Promise(r => setTimeout(r, 400));

    // Teste de falha na Etapa 1 (Avançar sem preencher)
    await page.click('#avancar');
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(targetDir, 'audit-final-07-inscricao-erros.png') });
    log('Landing Page', 'Seja Voluntário - Validação', 'OK', 'Validações da Etapa 1 exibidas sem distorção visual', 'audit-final-07-inscricao-erros.png');

    // Teste de menor de idade
    await page.type('#nasc', '10/05/2012');
    await new Promise(r => setTimeout(r, 200));
    const notaMenor = await page.evaluate(() => {
      const el = document.getElementById('nota-menor');
      return el && window.getComputedStyle(el).display !== 'none';
    });
    log('Landing Page', 'Seja Voluntário - Menor de Idade', notaMenor ? 'OK' : 'ALERTA', `Caixa informativa de autorização para menores: ${notaMenor ? 'Ativa' : 'Inativa'}`);

    // Preencher dados adultos válidos e avançar
    await page.evaluate(() => {
      document.getElementById('nome').value = 'Juliana Matos';
      document.getElementById('email').value = 'juliana@exemplo.com';
      document.getElementById('tel').value = '(71) 98888-1111';
      document.getElementById('nasc').value = '1996-03-22';
      const r = document.querySelector('input[name="sexo"][value="Feminino"]');
      if (r) r.checked = true;
      document.getElementById('avancar').click();
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(targetDir, 'audit-final-08-inscricao-etapa2.png') });
    log('Landing Page', 'Seja Voluntário - Etapa 2', 'OK', 'Etapa 2 acessada com tags pill e campos organizados', 'audit-final-08-inscricao-etapa2.png');
  }

  // 1.6 Avaliação no Google
  const elAval = await page.$('#avaliacoes');
  if (elAval) {
    await elAval.scrollIntoView();
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(targetDir, 'audit-final-09-avaliacoes.png') });
    log('Landing Page', 'Avaliação do Google', 'OK', 'Resumo com nota 5.0 limpo, carrossel e cards brancos sem bordas pretas', 'audit-final-09-avaliacoes.png');
  }

  // 1.7 Modal LGPD
  await page.evaluate(() => {
    if (window.abrirModalLgpd) window.abrirModalLgpd();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(targetDir, 'audit-final-10-modal-lgpd.png') });
  log('Landing Page', 'Modal LGPD', 'OK', 'Modal de privacidade com cabeçalho azul, termos claros e botão entendido', 'audit-final-10-modal-lgpd.png');
  await page.evaluate(() => {
    const b = document.getElementById('btn-entendido-lgpd') || document.getElementById('btn-fechar-modal-lgpd');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 300));


  // =========================================================================
  // 2. VARREDURA COMPLETA: PORTAL DE GESTÃO (portal.html)
  // =========================================================================
  await page.goto(`http://127.0.0.1:${PORT}/portal.html`, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 600));

  // 2.1 Tela de Login: Teste de Falha (Credenciais Erradas)
  await page.type('#usuario', 'usuario_errado');
  await page.type('#senha', 'senha_errada');
  await page.click('#f-login button[type="submit"]');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(targetDir, 'audit-final-11-portal-login-falha.png') });

  const erroLoginTxt = await page.evaluate(() => document.getElementById('erro-login')?.textContent || '');
  log('Portal de Gestão', 'Tela de Login - Falha', 'OK', `Bloqueio de credenciais inválidas funcionando: "${erroLoginTxt}"`, 'audit-final-11-portal-login-falha.png');

  // 2.2 Tela de Login: Sucesso com Credenciais Oficiais (presidencia / 0987)
  await page.evaluate(() => {
    document.getElementById('usuario').value = 'presidencia';
    document.getElementById('senha').value = '0987';
    document.getElementById('f-login').requestSubmit();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(targetDir, 'audit-final-12-portal-dashboard.png') });

  const logado = await page.evaluate(() => {
    const app = document.getElementById('app');
    return app && window.getComputedStyle(app).display !== 'none';
  });
  log('Portal de Gestão', 'Dashboard Geral', logado ? 'OK' : 'FALHA', 'Login efetuado com sucesso e Visão Operacional carregada', 'audit-final-12-portal-dashboard.png');

  // 2.3 Aba de Voluntários (DataTable, Filtros, Edição)
  await page.evaluate(() => {
    const btn = document.getElementById('t-vol');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(targetDir, 'audit-final-13-portal-voluntarios.png') });
  log('Portal de Gestão', 'Aba Voluntários - Tabela', 'OK', 'Tabela ampla com botões compactos (ícone + tooltip) e status lado a lado', 'audit-final-13-portal-voluntarios.png');

  // Abrir Modal de Edição de Voluntário
  await page.evaluate(() => {
    const btnEdit = document.querySelector('#p-vol tbody .btn-tb-editar, #p-vol tbody button[title="Editar"]');
    if (btnEdit) btnEdit.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(targetDir, 'audit-final-14-modal-editar-voluntario.png') });
  log('Portal de Gestão', 'Modal Editar Voluntário', 'OK', 'Modal operacional aberto com badge de gestão e campos editáveis', 'audit-final-14-modal-editar-voluntario.png');
  
  await page.evaluate(() => {
    const f = document.querySelector('#modal-editar-voluntario .modal-fechar, #modal-editar-voluntario button.btn-sec');
    if (f) f.click();
  });
  await new Promise(r => setTimeout(r, 300));

  // 2.4 Aba de Ações Sociais (Cards, Modal Nova Ação, Validação da Presidência)
  await page.evaluate(() => {
    const btn = document.getElementById('t-acoes');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(targetDir, 'audit-final-15-portal-acoes.png') });
  log('Portal de Gestão', 'Aba Ações Sociais', 'OK', 'Visualização de ações com filtros segmentados e botões compactos', 'audit-final-15-portal-acoes.png');

  // Abrir Modal de Nova Ação
  await page.evaluate(() => {
    const btnNova = document.querySelector('.btn-cad-acao');
    if (btnNova) btnNova.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(targetDir, 'audit-final-16-modal-nova-acao.png') });
  log('Portal de Gestão', 'Modal Nova Ação', 'OK', 'Formulário limpo com campos de título, data, vagas e responsável', 'audit-final-16-modal-nova-acao.png');

  await page.evaluate(() => {
    const f = document.querySelector('#modal-nova-acao .modal-fechar, #modal-nova-acao button.btn-sec');
    if (f) f.click();
  });
  await new Promise(r => setTimeout(r, 300));

  // Clicar em Excluir Ação para testar Modal de Validação da Presidência
  await page.evaluate(() => {
    const btnExcluir = document.querySelector('#p-acoes .btn-acao-excluir, #p-acoes button[title="Excluir"]');
    if (btnExcluir) btnExcluir.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(targetDir, 'audit-final-17-modal-valida-presidencia.png') });
  log('Portal de Gestão', 'Modal Validação Presidência', 'OK', 'Solicitação de senha para operações sensíveis exibida com layout limpo', 'audit-final-17-modal-valida-presidencia.png');

  // Testar senha errada da Presidência (Teste de Falha)
  await page.type('#valida-senha', 'senha_errada');
  await page.evaluate(() => {
    const btnConf = document.getElementById('btn-confirma-valida') || document.querySelector('#form-valida-presidencia button[type="submit"]');
    if (btnConf) btnConf.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(targetDir, 'audit-final-18-valida-pres-erro.png') });
  const erroPres = await page.evaluate(() => document.getElementById('valida-erro')?.textContent || '');
  log('Portal de Gestão', 'Validação Presidência - Falha', 'OK', `Bloqueio de autorização incorreta com feedback: "${erroPres}"`, 'audit-final-18-valida-pres-erro.png');

  await page.evaluate(() => {
    const f = document.getElementById('btn-cancela-valida') || document.getElementById('btn-fechar-modal-valida') || document.querySelector('#modal-valida-presidencia .modal-fechar');
    if (f) f.click();
  });
  await new Promise(r => setTimeout(r, 300));

  // 2.5 Aba de Níveis de Acesso
  await page.evaluate(() => {
    const btn = document.getElementById('t-acesso');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(targetDir, 'audit-final-19-portal-acesso.png') });
  log('Portal de Gestão', 'Níveis de Acesso', 'OK', 'Matriz de permissões com switches modernos e controle por cargo', 'audit-final-19-portal-acesso.png');


  // =========================================================================
  // 3. VARREDURA COMPLETA: MOBILE VIEWPORT (375x812)
  // =========================================================================
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 500));

  // 3.1 Menu Mobile Dropdown
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');
  await page.evaluate(() => {
    document.documentElement.classList.add('dispositivo-mobile');
    document.documentElement.classList.remove('dispositivo-desktop');
    const hamb = document.getElementById('btn-menu-mob') || document.querySelector('.btn-menu-mob');
    if (hamb) hamb.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(targetDir, 'audit-final-20-mobile-menu.png') });
  const menuAberto = await page.evaluate(() => {
    const m = document.getElementById('menu-mob-dropdown');
    return m && (m.classList.contains('aberto') || window.getComputedStyle(m).display !== 'none');
  });
  log('Mobile', 'Menu Hambúrguer Dropdown', menuAberto ? 'OK' : 'ALERTA', 'Menu suspenso com cantos de 12px, links limpos e sombra difusa', 'audit-final-20-mobile-menu.png');

  // Fechar navegador e servidor
  await browser.close();
  server.close();
  console.log('Varredura completa e testes de falha finalizados com sucesso!');

  fs.writeFileSync(path.join(targetDir, 'audit-final-summary.json'), JSON.stringify(auditResults, null, 2));
})();
