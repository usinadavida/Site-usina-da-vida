import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const url = (env.match(/^DATABASE_URL=(.+)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, '');
if (!url) { console.error('Defina DATABASE_URL em .env.local'); process.exit(1); }

const sql = neon(url);

const c = await sql.query('SELECT count(*) as total FROM acoes_agendadas');
if (parseInt(c[0].total, 10) === 0) {
  await sql.query(`
    INSERT INTO acoes_agendadas (titulo, area, cor, data_texto, data_iso, local_texto, vagas_totais, vagas_preenchidas, descricao)
    VALUES 
      ('Palestra Novembro Azul', 'Saúde & bem-estar', '#085EC3', 'Sáb, 14/11/2026', '2026-11-14', 'Sede Usina da Vida · 09h', 10, 6, 'Palestra de conscientização sobre saúde integral do homem com acolhimento, recepção e apoio comunitário.'),
      ('Oficina de culinária', 'Empreendedorismo', '#c99a00', 'Sáb, 28/11/2026', '2026-11-28', 'Cozinha Comunitária · 14h', 8, 3, 'Preparo de receitas simples e práticas com as crianças, estimulando autonomia e empreendedorismo local.'),
      ('Reforço escolar de dezembro', 'Educação', '#F08D0C', 'Sáb, 05/12/2026', '2026-12-05', 'Sala de Estudos · 08h30', 6, 2, 'Apoio pedagógico intensivo em português e matemática na reta final do calendário escolar comunitário.')
  `);
  console.log('Seed de acoes agendadas inserido com sucesso!');
} else {
  console.log('Tabela acoes_agendadas ja possui registros:', c[0].total);
}
