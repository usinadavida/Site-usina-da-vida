import { db, texto } from '../../../lib/db.js';
import { validarSenhaPresidencia } from '../permissoes/route.js';
import { registrarAuditoria, obterIp } from '../../../lib/audit.js';

function extrairDataIso(textoData) {
  if (!textoData || typeof textoData !== 'string') return null;
  const isoMatch = textoData.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const brMatch = textoData.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (brMatch) {
    const dia = brMatch[1].padStart(2, '0');
    const mes = brMatch[2].padStart(2, '0');
    const ano = brMatch[3];
    return `${ano}-${mes}-${dia}`;
  }
  return null;
}

export async function GET() {
  try {
    const sql = db();
    const rows = await sql`
      SELECT 
        a.id, 
        a.titulo, 
        a.area, 
        a.cor, 
        a.data_texto, 
        to_char(a.data_iso, 'YYYY-MM-DD') as data_iso,
        a.local_texto, 
        a.vagas_totais, 
        GREATEST(a.vagas_preenchidas, COALESCE(sub.total_interesses, 0)) as vagas_preenchidas,
        a.descricao, 
        a.status,
        a.criado_em
      FROM acoes_agendadas a
      LEFT JOIN (
        SELECT acao, count(*)::int as total_interesses 
        FROM interesses_acoes 
        GROUP BY acao
      ) sub ON (sub.acao ILIKE '%' || a.titulo || '%' OR a.titulo ILIKE '%' || sub.acao || '%')
      WHERE a.status = 'Agendada'
      ORDER BY COALESCE(a.data_iso, '2099-12-31'::date) ASC, a.id ASC
      LIMIT 100`;

    return Response.json(rows, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'CDN-Cache-Control': 'no-store'
      }
    });
  } catch (e) {
    console.error('acoes GET:', e.message);
    return Response.json([], { status: 200 });
  }
}

export async function POST(req) {
  let b;
  try {
    b = await req.json();
  } catch {
    return Response.json({ erro: 'JSON invalido' }, { status: 400 });
  }

  const titulo = texto(b.titulo, 150);
  const area = texto(b.area, 80) || 'Geral';
  const cor = texto(b.cor, 30) || '#085EC3';
  const data_texto = texto(b.data_texto || b.dt, 60);
  const local_texto = texto(b.local_texto || b.loc, 150) || 'Sede Usina da Vida';
  const vagas_totais = parseInt(b.vagas_totais || b.vagas, 10) || 10;
  const descricao = texto(b.descricao || b.p, 500);

  if (!titulo || !data_texto) {
    return Response.json({ erro: 'Titulo e data sao obrigatorios' }, { status: 422 });
  }

  const data_iso = extrairDataIso(data_texto);

  try {
    const sql = db();
    const rows = await sql`
      INSERT INTO acoes_agendadas (
        titulo, area, cor, data_texto, data_iso, local_texto, vagas_totais, vagas_preenchidas, descricao
      )
      VALUES (
        ${titulo}, ${area}, ${cor}, ${data_texto}, ${data_iso}, ${local_texto}, ${vagas_totais}, 0, ${descricao}
      )
      RETURNING id, titulo, area, cor, data_texto, to_char(data_iso, 'YYYY-MM-DD') as data_iso, local_texto, vagas_totais, vagas_preenchidas, descricao, status, criado_em`;

    await registrarAuditoria({
      acao: 'CRIACAO_ACAO',
      entidade: 'acoes_agendadas',
      entidade_id: rows[0].id,
      usuario: 'Presidência/Coordenação',
      detalhes: {
        titulo: rows[0].titulo,
        area: rows[0].area,
        data_texto: rows[0].data_texto,
        vagas: rows[0].vagas_totais
      },
      ip: obterIp(req)
    });

    return Response.json(rows[0], { status: 201 });
  } catch (e) {
    console.error('acoes POST:', e.message);
    return Response.json({ erro: 'Falha ao cadastrar acao no banco de dados' }, { status: 500 });
  }
}

export async function PUT(req) {
  let b;
  try {
    b = await req.json();
  } catch {
    return Response.json({ erro: 'JSON invalido' }, { status: 400 });
  }

  const { id, titulo, area, cor, data_texto, dt, local_texto, loc, vagas_totais, vagas, descricao, p } = b || {};
  const senha = b?.senha || b?.senha_presidencia;

  if (!id) return Response.json({ erro: 'ID da ação é obrigatório' }, { status: 422 });

  if (!validarSenhaPresidencia(senha)) {
    return Response.json({ erro: 'Senha da Presidência incorreta para autorizar a alteração desta ação.' }, { status: 401 });
  }

  const tituloLimpo = texto(titulo, 150);
  const areaLimpa = texto(area, 80) || 'Geral';
  const corLimpa = texto(cor, 30) || '#085EC3';
  const dataTxtLimpo = texto(data_texto || dt, 60);
  const localLimpo = texto(local_texto || loc, 150) || 'Sede Usina da Vida';
  const vagasNum = parseInt(vagas_totais || vagas, 10) || 10;
  const descLimpa = texto(descricao || p, 500);
  const data_iso = extrairDataIso(dataTxtLimpo);

  try {
    const sql = db();
    const rows = await sql`
      UPDATE acoes_agendadas
      SET 
        titulo = COALESCE(NULLIF(${tituloLimpo}, ''), titulo),
        area = COALESCE(NULLIF(${areaLimpa}, ''), area),
        cor = ${corLimpa},
        data_texto = COALESCE(NULLIF(${dataTxtLimpo}, ''), data_texto),
        data_iso = COALESCE(${data_iso}, data_iso),
        local_texto = ${localLimpo},
        vagas_totais = ${vagasNum},
        descricao = ${descLimpa},
        atualizado_em = now()
      WHERE id = ${id}
      RETURNING id, titulo, area, cor, data_texto, to_char(data_iso, 'YYYY-MM-DD') as data_iso, local_texto, vagas_totais, vagas_preenchidas, descricao, status, criado_em`;

    if (!rows.length) return Response.json({ erro: 'Ação não encontrada' }, { status: 404 });

    await registrarAuditoria({
      acao: 'EDICAO_ACAO',
      entidade: 'acoes_agendadas',
      entidade_id: id,
      usuario: 'Presidência',
      detalhes: {
        titulo: rows[0].titulo,
        data_texto: rows[0].data_texto,
        local: rows[0].local_texto,
        vagas: rows[0].vagas_totais
      },
      ip: obterIp(req)
    });

    return Response.json(rows[0], { status: 200 });
  } catch (e) {
    console.error('acoes PUT:', e.message);
    return Response.json({ erro: 'Falha ao atualizar ação no banco' }, { status: 500 });
  }
}

export async function DELETE(req) {
  const url = new URL(req.url);
  let id = url.searchParams.get('id');
  let titulo = url.searchParams.get('titulo') || url.searchParams.get('t');
  let senha = url.searchParams.get('senha') || url.searchParams.get('senha_presidencia');

  if (!id && !titulo) {
    try {
      const b = await req.json();
      id = b?.id;
      titulo = b?.titulo || b?.t;
      senha = b?.senha || b?.senha_presidencia;
    } catch {}
  }

  if (!validarSenhaPresidencia(senha)) {
    return Response.json({ erro: 'Senha da Presidência incorreta para autorizar a exclusão desta ação.' }, { status: 401 });
  }

  try {
    const sql = db();
    let rows = [];

    if (id && !isNaN(Number(id))) {
      rows = await sql`DELETE FROM acoes_agendadas WHERE id = ${Number(id)} RETURNING id, titulo, data_texto`;
    } else if (titulo) {
      rows = await sql`DELETE FROM acoes_agendadas WHERE lower(titulo) = lower(${titulo.trim()}) RETURNING id, titulo, data_texto`;
    } else if (id) {
      rows = await sql`DELETE FROM acoes_agendadas WHERE lower(titulo) = lower(${String(id).trim()}) RETURNING id, titulo, data_texto`;
    }

    await registrarAuditoria({
      acao: 'EXCLUSAO_ACAO',
      entidade: 'acoes_agendadas',
      entidade_id: String(rows[0]?.id || id || '0'),
      usuario: 'Presidência',
      detalhes: {
        id_excluido: rows[0]?.id || id || null,
        titulo: rows[0]?.titulo || titulo || 'Ação comunitária',
        data_texto: rows[0]?.data_texto || ''
      },
      ip: obterIp(req)
    });

    return Response.json({ ok: true, id: rows[0]?.id || id, removido: true }, { status: 200 });
  } catch (e) {
    console.error('acoes DELETE:', e.message);
    return Response.json({ erro: 'Falha ao excluir ação no banco: ' + e.message }, { status: 500 });
  }
}

