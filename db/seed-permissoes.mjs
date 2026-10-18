import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const url = (env.match(/^DATABASE_URL=(.+)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, '');
if (!url) { console.error('Defina DATABASE_URL em .env.local'); process.exit(1); }

const sql = neon(url);

const def = {
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
};

await sql.query(
  `INSERT INTO config_permissoes (id, permissoes, atualizado_por)
   VALUES ('matriz_permissoes', $1::jsonb, 'Presidência')
   ON CONFLICT (id) DO NOTHING`,
  [JSON.stringify(def)]
);

console.log('Permissoes seed configurado no Neon.');
