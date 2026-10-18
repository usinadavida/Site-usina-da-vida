import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.error('DATABASE_URL ausente');
  process.exit(1);
}

const sql = neon(url);

async function main() {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS log_auditoria (
      id            BIGSERIAL PRIMARY KEY,
      acao          TEXT NOT NULL,
      entidade      TEXT NOT NULL,
      entidade_id   TEXT,
      usuario       TEXT NOT NULL DEFAULT 'Presidência',
      detalhes      JSONB NOT NULL DEFAULT '{}',
      ip            TEXT,
      criado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await sql.query(`
    CREATE INDEX IF NOT EXISTS idx_log_auditoria_criado_em ON log_auditoria (criado_em DESC)
  `);
  console.log('Tabela log_auditoria e índice criados com sucesso!');
}

main().catch(console.error);
