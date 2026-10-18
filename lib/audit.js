import { db } from './db.js';

export async function registrarAuditoria({ acao, entidade, entidade_id = null, usuario = 'Presidência', detalhes = {}, ip = null }) {
  try {
    const sql = db();
    await sql`
      INSERT INTO log_auditoria (acao, entidade, entidade_id, usuario, detalhes, ip)
      VALUES (
        ${acao}, 
        ${entidade}, 
        ${entidade_id ? String(entidade_id) : null}, 
        ${usuario}, 
        ${JSON.stringify(detalhes)}::jsonb, 
        ${ip || null}
      )
    `;
  } catch (err) {
    console.error('Falha ao registrar auditoria:', err.message);
  }
}

export function obterIp(req) {
  try {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return req.headers.get('x-real-ip') || null;
  } catch {
    return null;
  }
}
