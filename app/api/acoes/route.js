import { db, texto } from '../../../lib/db.js';

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
    return Response.json({ erro: e.message, hasUrl: !!(process.env.DATABASE_URL || process.env.POSTGRES_URL) }, { status: 500 });
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

    return Response.json(rows[0], { status: 201 });
  } catch (e) {
    console.error('acoes POST:', e.message);
    return Response.json({ erro: 'Falha ao cadastrar acao no banco de dados' }, { status: 500 });
  }
}
