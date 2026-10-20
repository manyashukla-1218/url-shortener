CREATE TABLE IF NOT EXISTS urls (
  id         BIGSERIAL PRIMARY KEY,
  code       VARCHAR(12) UNIQUE,
  long_url   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Start IDs at 62^5 so every code is at least 6 chars long
ALTER SEQUENCE urls_id_seq RESTART WITH 916132832;
