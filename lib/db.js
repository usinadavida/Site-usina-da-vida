import { neon } from '@neondatabase/serverless';

export function db() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error('DATABASE_URL nao configurada (.env.local)');
  return neon(url);
}

export const texto = (v, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
export const lista = (v) => (Array.isArray(v) ? v : v ? [v] : []).map((x) => texto(x, 80)).filter(Boolean);
export const emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
