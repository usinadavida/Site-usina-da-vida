import { db } from '../../../lib/db.js';

const SENHAS_PRESIDENCIA = ['0987', 'novembro'];

export function validarSenhaPresidencia(senha) {
  if (!senha || typeof senha !== 'string') return false;
  const s = senha.trim().toLowerCase();
  return SENHAS_PRESIDENCIA.includes(s);
}

export async function GET() {
  try {
    const sql = db();
    const rows = await sql`
      SELECT id, permissoes, atualizado_por, to_char(atualizado_em, 'DD/MM/YYYY HH24:MI') as atualizado_em
      FROM config_permissoes
      WHERE id = 'matriz_permissoes'
      LIMIT 1`;

    if (rows.length && rows[0].permissoes) {
      return Response.json(rows[0].permissoes, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      });
    }

    // Fallback padrão se não houver registro
    return Response.json({
      coordenacao: {
        verContatos: true,
        alterarStatus: true,
        cadastrarAcoes: true,
        confirmarInscricoes: true,
        editarVoluntarios: false,
        excluirCadastros: false,
        exportarCsv: false
      },
      colaborador: {
        verContatos: false,
        alterarStatus: false,
        cadastrarAcoes: false,
        confirmarInscricoes: false,
        editarVoluntarios: false,
        excluirCadastros: false,
        exportarCsv: false
      }
    });
  } catch (e) {
    console.error('permissoes GET:', e.message);
    return Response.json({ erro: 'Falha ao consultar permissões' }, { status: 500 });
  }
}

export async function POST(req) {
  let b;
  try {
    b = await req.json();
  } catch {
    return Response.json({ erro: 'JSON inválido' }, { status: 400 });
  }

  const permissoes = b?.permissoes;
  const senha = b?.senha || b?.senha_presidencia;

  if (!validarSenhaPresidencia(senha)) {
    return Response.json({ erro: 'Senha da Presidência incorreta para validar alterações de permissões.' }, { status: 401 });
  }

  if (!permissoes || typeof permissoes !== 'object') {
    return Response.json({ erro: 'Estrutura de permissões inválida.' }, { status: 422 });
  }

  try {
    const sql = db();
    await sql`
      INSERT INTO config_permissoes (id, permissoes, atualizado_por, atualizado_em)
      VALUES ('matriz_permissoes', ${JSON.stringify(permissoes)}::jsonb, 'Presidência', now())
      ON CONFLICT (id) DO UPDATE SET 
        permissoes = EXCLUDED.permissoes,
        atualizado_por = 'Presidência',
        atualizado_em = now()`;

    return Response.json({ ok: true, permissoes }, { status: 200 });
  } catch (e) {
    console.error('permissoes POST:', e.message);
    return Response.json({ erro: 'Falha ao gravar permissões no banco de dados.' }, { status: 500 });
  }
}
