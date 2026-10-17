import { db, texto, lista, emailValido } from '../../../lib/db.js';

export async function POST(req) {
  let b;
  try { b = await req.json(); } catch { return Response.json({ erro: 'JSON invalido' }, { status: 400 }); }

  const nome = texto(b.nome, 150), email = texto(b.email, 200).toLowerCase(), tel = texto(b.tel, 30);
  if (!nome || !emailValido(email) || tel.replace(/\D/g, '').length < 10 || !b.lgpd) {
    return Response.json({ erro: 'Dados obrigatorios ausentes ou invalidos' }, { status: 422 });
  }
  const nasc = /^\d{4}-\d{2}-\d{2}$/.test(b.nasc || '') ? b.nasc : null;

  try {
    const sql = db();
    await sql`
      INSERT INTO voluntarios (nome, email, telefone, nascimento, sexo, cep, cidade, bairro, formacao, curso,
        ocupacao, idiomas, experiencia, areas, disponibilidade, publico, acao_interesse, aceita_newsletter, lgpd_aceite)
      VALUES (${nome}, ${email}, ${tel}, ${nasc}, ${texto(b.sexo, 20)}, ${texto(b.cep, 12)}, ${texto(b.cidade, 100)},
        ${texto(b.bairro, 100)}, ${texto(b.formacao, 60)}, ${texto(b.curso, 120)}, ${texto(b.ocup, 120)},
        ${texto(b.idioma, 120)}, ${texto(b.expvol || b.exp, 1000)}, ${lista(b.area)}, ${lista(b.disp)},
        ${lista(b.publico)}, ${texto(b.acao, 150)}, ${!!b.news}, true)
      ON CONFLICT (lower(email)) DO UPDATE SET nome = EXCLUDED.nome, telefone = EXCLUDED.telefone,
        areas = EXCLUDED.areas, disponibilidade = EXCLUDED.disponibilidade, bairro = EXCLUDED.bairro,
        acao_interesse = COALESCE(NULLIF(EXCLUDED.acao_interesse, ''), voluntarios.acao_interesse)`;
    return Response.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error('inscricoes:', e.message);
    return Response.json({ erro: 'Falha ao gravar' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const sql = db();
    const rows = await sql`
      SELECT id, nome, email, telefone, bairro, formacao, areas, disponibilidade, status, acao_interesse, criado_em
      FROM voluntarios
      ORDER BY id DESC
      LIMIT 200`;
    return Response.json(rows);
  } catch (e) {
    console.error('inscricoes GET:', e.message);
    return Response.json([], { status: 200 });
  }
}

