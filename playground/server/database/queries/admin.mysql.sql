CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);
INSERT INTO admin_users (id, email, password) VALUES (1, 'admin@nuxt.com', 'admin') ON DUPLICATE KEY UPDATE id=id;
