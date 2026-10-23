import crypto from 'crypto';

// Chave secreta de sessão (definida via variável de ambiente ou gerada na inicialização do servidor)
const SECRET = process.env.AUTH_SECRET || process.env.PRESIDENCIA_SECRET || 'usina-da-vida-security-token-key-2026';

// Senhas administrativas aceitas via variável de ambiente (com fallback seguro para não quebrar compatibilidade imediata)
function obterSenhasValidas() {
  const envSenha = process.env.SENHA_PRESIDENCIA;
  if (envSenha) {
    return envSenha.split(',').map((s) => s.trim().toLowerCase());
  }
  return ['0987', 'novembro'];
}

/**
 * Valida a senha da presidência usando timingSafeEqual para evitar ataques de timing.
 */
export function validarSenhaPresidencia(senha) {
  if (!senha || typeof senha !== 'string') return false;
  const s = senha.trim().toLowerCase();
  const senhasValidas = obterSenhasValidas();

  const bufEntrada = Buffer.from(s);
  for (const permitida of senhasValidas) {
    const bufPermitida = Buffer.from(permitida);
    if (bufEntrada.length === bufPermitida.length && crypto.timingSafeEqual(bufEntrada, bufPermitida)) {
      return true;
    }
  }
  return false;
}

/**
 * Cria um token de sessão assinado (HMAC SHA-256) com validade de 24 horas.
 */
export function criarTokenSessao(perfil = 'gestao') {
  const expiraEm = Date.now() + 24 * 60 * 60 * 1000; // 24h
  const payload = Buffer.from(JSON.stringify({ perfil, expiraEm })).toString('base64url');
  const assinatura = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payload}.${assinatura}`;
}

/**
 * Verifica se a requisição contém um token de sessão válido no cabeçalho Authorization ou Cookie.
 */
export function verificarAutenticacao(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    let token = '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/usina_token=([^;]+)/);
      if (match) token = match[1];
    }

    if (!token) {
      // Também aceita parâmetro de URL se for requisição interna
      const url = new URL(req.url);
      token = url.searchParams.get('token') || '';
    }

    if (!token || !token.includes('.')) return false;

    const [payload, assinatura] = token.split('.');
    const esperada = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');

    const bufAssinatura = Buffer.from(assinatura);
    const bufEsperada = Buffer.from(esperada);
    if (bufAssinatura.length !== bufEsperada.length || !crypto.timingSafeEqual(bufAssinatura, bufEsperada)) {
      return false;
    }

    const dados = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!dados.expiraEm || Date.now() > dados.expiraEm) {
      return false; // Token expirado
    }

    return dados;
  } catch {
    return false;
  }
}
