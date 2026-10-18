-- Esquema Neon (Postgres) - Usina da Vida
CREATE TABLE IF NOT EXISTS voluntarios (
  id            BIGSERIAL PRIMARY KEY,
  nome          TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  telefone      TEXT        NOT NULL,
  nascimento    DATE,
  sexo          TEXT,
  cep           TEXT,
  cidade        TEXT,
  bairro        TEXT,
  formacao      TEXT,
  curso         TEXT,
  ocupacao      TEXT,
  idiomas       TEXT,
  experiencia   TEXT,
  areas         TEXT[]      NOT NULL DEFAULT '{}',
  disponibilidade TEXT[]    NOT NULL DEFAULT '{}',
  publico       TEXT[]      NOT NULL DEFAULT '{}',
  acao_interesse TEXT,
  aceita_newsletter BOOLEAN NOT NULL DEFAULT FALSE,
  lgpd_aceite   BOOLEAN     NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'Recebida',
  dados_extras  JSONB       NOT NULL DEFAULT '{}',
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS voluntarios_email_uq ON voluntarios (lower(email));

CREATE TABLE IF NOT EXISTS interesses_acoes (
  id        BIGSERIAL PRIMARY KEY,
  nome      TEXT NOT NULL,
  email     TEXT NOT NULL,
  telefone  TEXT NOT NULL,
  acao      TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS interesses_uq ON interesses_acoes (lower(email), acao);

CREATE TABLE IF NOT EXISTS acoes_agendadas (
  id                BIGSERIAL PRIMARY KEY,
  titulo            TEXT NOT NULL,
  area              TEXT NOT NULL,
  cor               TEXT NOT NULL DEFAULT '#085EC3',
  data_texto        TEXT NOT NULL,
  data_iso          DATE,
  local_texto       TEXT NOT NULL DEFAULT 'Sede Usina da Vida',
  vagas_totais      INTEGER NOT NULL DEFAULT 10,
  vagas_preenchidas INTEGER NOT NULL DEFAULT 0,
  descricao         TEXT NOT NULL DEFAULT '',
  status            TEXT NOT NULL DEFAULT 'Agendada',
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_acoes_status_data ON acoes_agendadas (status, data_iso);

CREATE TABLE IF NOT EXISTS config_permissoes (
  id              TEXT PRIMARY KEY,
  permissoes      JSONB NOT NULL,
  atualizado_por  TEXT NOT NULL DEFAULT 'Presidência',
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);
