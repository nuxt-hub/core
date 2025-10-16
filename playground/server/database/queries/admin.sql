CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);
INSERT INTO admin_users (id, email, password) VALUES (1, 'admin@nuxt.com', 'admin') ON CONFLICT (id) DO NOTHING;
