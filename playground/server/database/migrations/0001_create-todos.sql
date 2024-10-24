-- Migration number: 0001 	 2024-10-24T00:25:12.371Z
CREATE TABLE todos (
  id integer PRIMARY KEY NOT NULL,
  title text NOT NULL,
  completed integer DEFAULT 0 NOT NULL,
  created_at integer NOT NULL
);
