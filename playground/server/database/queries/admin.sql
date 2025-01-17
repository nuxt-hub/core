CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);
INSERT OR IGNORE INTO admin_users (id, email, password) VALUES (1, 'admin@nuxt.com', 'admin');
