import { db } from '../../../lib/db.js';

export async function GET() {
  try {
    const sql = db();
    const rows = await sql`
      SELECT 
        id, 
        acao, 
        entidade, 
        entidade_id, 
        usuario, 
        detalhes, 
        ip,
        to_char(criado_em, 'DD/MM/YYYY HH24:MI:SS') as criado_em_fmt,
        criado_em
      FROM log_auditoria
      ORDER BY id DESC
      LIMIT 100
    `;

    return Response.json(rows, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (e) {
    console.error('auditoria GET:', e.message);
    return Response.json([], { status: 200 });
  }
}
