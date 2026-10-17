import { db, texto, emailValido } from '../../../lib/db.js';

export async function POST(req) {
  let b;
  try { b = await req.json(); } catch { return Response.json({ erro: 'JSON invalido' }, { status: 400 }); }

  const nome = texto(b.nome, 150), email = texto(b.email, 200).toLowerCase(), tel = texto(b.tel, 30), acao = texto(b.acao, 150);
  if (!nome || !emailValido(email) || tel.replace(/\D/g, '').length < 10 || !acao) {
    return Response.json({ erro: 'Dados invalidos' }, { status: 422 });
  }
  try {
    await db()`INSERT INTO interesses_acoes (nome, email, telefone, acao)
               VALUES (${nome}, ${email}, ${tel}, ${acao})
               ON CONFLICT (lower(email), acao) DO NOTHING`;
    return Response.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error('interesses:', e.message);
    return Response.json({ erro: 'Falha ao gravar' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const rows = await db()`
      SELECT id, nome, email, telefone, acao, criado_em
      FROM interesses_acoes
      ORDER BY id DESC
      LIMIT 200`;
    return Response.json(rows);
  } catch (e) {
    console.error('interesses GET:', e.message);
    return Response.json([], { status: 200 });
  }
}

