import { db, texto, lista, emailValido } from '../../../lib/db.js';
import { validarSenhaPresidencia } from '../permissoes/route.js';
import { registrarAuditoria, obterIp } from '../../../lib/audit.js';

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
    return Response.json(rows, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (e) {
    console.error('inscricoes GET:', e.message);
    return Response.json([], { status: 200 });
  }
}

export async function PUT(req) {
  let b;
  try { b = await req.json(); } catch { return Response.json({ erro: 'JSON invalido' }, { status: 400 }); }

  const { id, nome, email, telefone, bairro, formacao, status, areas, disp, disponibilidade, ativ, acao_interesse } = b || {};
  const senha = b?.senha || b?.senha_presidencia;

  if (!id) return Response.json({ erro: 'ID do voluntário é obrigatório' }, { status: 422 });

  if (!validarSenhaPresidencia(senha)) {
    return Response.json({ erro: 'Senha da Presidência incorreta para autorizar a alteração deste cadastro.' }, { status: 401 });
  }

  const nomeLimpo = texto(nome, 150);
  const emailLimpo = texto(email, 200).toLowerCase();
  const telLimpo = texto(telefone, 30);
  const bairroLimpo = texto(bairro, 100);
  const formLimpo = texto(formacao, 60);
  const stLimpo = texto(status, 40) || 'Recebida';
  const areasArr = lista(areas);
  const dispArr = lista(disp || disponibilidade);
  const ativLimpo = texto(ativ || acao_interesse, 150);

  try {
    const sql = db();
    const rows = await sql`
      UPDATE voluntarios
      SET 
        nome = COALESCE(NULLIF(${nomeLimpo}, ''), nome),
        email = COALESCE(NULLIF(${emailLimpo}, ''), email),
        telefone = COALESCE(NULLIF(${telLimpo}, ''), telefone),
        bairro = COALESCE(NULLIF(${bairroLimpo}, ''), bairro),
        formacao = COALESCE(NULLIF(${formLimpo}, ''), formacao),
        status = ${stLimpo},
        areas = CASE WHEN cardinality(${areasArr}::text[]) > 0 THEN ${areasArr}::text[] ELSE areas END,
        disponibilidade = CASE WHEN cardinality(${dispArr}::text[]) > 0 THEN ${dispArr}::text[] ELSE disponibilidade END,
        acao_interesse = COALESCE(NULLIF(${ativLimpo}, ''), acao_interesse)
      WHERE id = ${id}
      RETURNING id, nome, email, telefone, bairro, formacao, areas, disponibilidade, status, acao_interesse, criado_em`;

    if (!rows.length) return Response.json({ erro: 'Voluntário não encontrado' }, { status: 404 });

    await registrarAuditoria({
      acao: 'EDICAO_VOLUNTARIO',
      entidade: 'voluntarios',
      entidade_id: id,
      usuario: 'Presidência',
      detalhes: {
        nome: rows[0].nome,
        email: rows[0].email,
        status: rows[0].status,
        bairro: rows[0].bairro
      },
      ip: obterIp(req)
    });

    return Response.json(rows[0], { status: 200 });
  } catch (e) {
    console.error('inscricoes PUT:', e.message);
    return Response.json({ erro: 'Falha ao atualizar voluntário no banco' }, { status: 500 });
  }
}

export async function DELETE(req) {
  const url = new URL(req.url);
  let id = url.searchParams.get('id');
  let senha = url.searchParams.get('senha') || url.searchParams.get('senha_presidencia');

  if (!id) {
    try {
      const b = await req.json();
      id = b.id;
      senha = b.senha || b.senha_presidencia;
    } catch {}
  }

  if (!id) return Response.json({ erro: 'ID do voluntário é obrigatório' }, { status: 422 });

  if (!validarSenhaPresidencia(senha)) {
    return Response.json({ erro: 'Senha da Presidência incorreta para autorizar a exclusão deste cadastro.' }, { status: 401 });
  }

  try {
    const sql = db();
    const rows = await sql`DELETE FROM voluntarios WHERE id = ${id} RETURNING id, nome, email`;
    
    await registrarAuditoria({
      acao: 'EXCLUSAO_VOLUNTARIO',
      entidade: 'voluntarios',
      entidade_id: id,
      usuario: 'Presidência',
      detalhes: {
        excluido_id: id,
        nome: rows[0]?.nome || 'Desconhecido',
        email: rows[0]?.email || 'Desconhecido'
      },
      ip: obterIp(req)
    });

    return Response.json({ ok: true, id }, { status: 200 });
  } catch (e) {
    console.error('inscricoes DELETE:', e.message);
    return Response.json({ erro: 'Falha ao excluir voluntário no banco' }, { status: 500 });
  }
}

