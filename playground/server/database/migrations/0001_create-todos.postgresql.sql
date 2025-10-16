-- Migration number: 0001 	 2024-10-24T00:25:12.371Z
-- PostgreSQL-specific version with SERIAL
CREATE TABLE IF NOT EXISTS todos (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  completed INTEGER DEFAULT 0 NOT NULL,
  created_at BIGINT NOT NULL
);

