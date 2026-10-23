import { validarSenhaPresidencia, criarTokenSessao } from '../../../lib/auth.js';

export async function POST(req) {
  let b;
  try {
    b = await req.json();
  } catch {
    return Response.json({ erro: 'JSON inválido' }, { status: 400 });
  }

  const { usuario, senha } = b || {};
  if (!usuario || !senha) {
    return Response.json({ erro: 'Usuário e senha são obrigatórios' }, { status: 422 });
  }

  const uNorm = String(usuario).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const loginsValidos = ['gestao', 'presidencia', 'presidente', 'coordenacao', 'coordenador', 'colaborador', 'admin', 'novembro'];

  if (!loginsValidos.includes(uNorm) || !validarSenhaPresidencia(senha)) {
    return Response.json({ erro: 'Credenciais incorretas' }, { status: 401 });
  }

  const perfil = (uNorm === 'presidencia' || uNorm === 'presidente') 
    ? 'presidencia' 
    : (uNorm === 'coordenacao' || uNorm === 'coordenador') 
      ? 'coordenacao' 
      : 'colaborador';

  const token = criarTokenSessao(perfil);

  return Response.json({ 
    ok: true, 
    token,
    perfil,
    usuario: uNorm
  }, {
    status: 200,
    headers: {
      'Set-Cookie': `usina_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
      'Cache-Control': 'no-store, no-cache'
    }
  });
}
