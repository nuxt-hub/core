import { describe, expect, it } from 'vitest'
import { splitSqlQueries } from '../src/runtime/database/server/utils/migrations/helpers'

describe('splitSqlQueries', () => {
  it('Should split minified sql', () => {
    const sqlFileContent = `CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255));INSERT INTO users (id, name) VALUES (1, 'Jo;hn');`
    const queries = splitSqlQueries(sqlFileContent)
    expect(queries).toHaveLength(2)
    expect(queries).toMatchObject([
      'CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255));',
      'INSERT INTO users (id, name) VALUES (1, \'Jo;hn\');'
    ])
  })

  it('Should respect ; within a query', () => {
    const sqlFileContent = `
      CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255));
      INSERT INTO users (id, name) VALUES (1, 'Jo;hn');
    `
    const queries = splitSqlQueries(sqlFileContent)
    expect(queries).toHaveLength(2)
  })

  it('Should ignore extra semicolons', () => {
    const sqlFileContent = `
      ;;;;;
      CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255));
      INSERT INTO users (id, name) VALUES (1, 'Jo;hn');;;;;;;
      INSERT INTO users (id, name) VALUES (1, 'Jo;hn');;;;;;;
      ;;;;
    `
    const queries = splitSqlQueries(sqlFileContent)
    expect(queries).toHaveLength(3)
  })

  it('Should handle last query without semicolon', () => {
    const sqlFileContent = `
      CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255));
      INSERT INTO users (id, name) VALUES (1, 'Jo;hn')
    `
    const queries = splitSqlQueries(sqlFileContent)
    expect(queries).toHaveLength(2)
  })

  it('should split the SQL file into separate queries', () => {
    const sqlFileContent = `
      CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255));
      INSERT INTO users (id, name) VALUES (1, 'John');
    `
    const queries = splitSqlQueries(sqlFileContent)
    expect(queries).toHaveLength(2)
  })

  it('should respect -- and /* */ comments', () => {
    const sqlFileContent = `
      -- This is a comment
      CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255));
      /*
        This is a multi-line comment
      */
      INSERT INTO users (id, name) VALUES (1, 'John');
    `
    const queries = splitSqlQueries(sqlFileContent)
    expect(queries).toHaveLength(2)
  })

  it('Should respect -- within a query', () => {
    const sqlFileContent = `
      CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255));
      INSERT INTO users (id, name) VALUES (1, 'John'); -- This is a comment
    `
    const queries = splitSqlQueries(sqlFileContent)
    expect(queries).toHaveLength(2)
  })

  it('Should respect -- within a string', () => {
    const sqlFileContent = `
      CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255));
      INSERT INTO users (id, name) VALUES (1, 'John -- This is a comment');
    `
    const queries = splitSqlQueries(sqlFileContent)
    expect(queries).toHaveLength(2)
    expect(queries[1]).toBe('INSERT INTO users (id, name) VALUES (1, \'John -- This is a comment\');')
  })

  it('Should respect /* */ within a string', () => {
    const sqlFileContent = `
      CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255));
      INSERT INTO users (id, name) VALUES (1, 'John /* This is a comment */');
    `
    const queries = splitSqlQueries(sqlFileContent)
    expect(queries).toHaveLength(2)
    expect(queries[1]).toBe('INSERT INTO users (id, name) VALUES (1, \'John /* This is a comment */\');')
  })

  it('Should work with a large number of edge cases', () => {
    const sqlFileContent = `
      -- 1. Null Handling
      INSERT INTO users (id, name, email) VALUES (1, 'Alice', NULL);
      SELECT * FROM users WHERE email IS NULL;
      SELECT * FROM users WHERE email = '';

      -- 2. Empty Results
      SELECT * FROM users WHERE id = -1;
      SELECT orders.id, users.name
      FROM orders
      LEFT JOIN users ON orders.user_id = users.id
      WHERE users.id IS NULL;

      -- 3. Duplicate Handling
      INSERT INTO products (id, name) VALUES (1, 'Widget'), (1, 'Widget');
      SELECT name, COUNT(*) AS cnt
      FROM products
      GROUP BY name
      HAVING cnt > 1;

      -- 4. Aggregation Edge Cases
      SELECT AVG(price), SUM(price) FROM orders WHERE 1 = 0;
      SELECT user_id, COUNT(*) FROM orders WHERE user_id = 1 GROUP BY user_id;

      -- 5. Extreme Numeric Values
      INSERT INTO transactions (id, amount) VALUES (1, 999999999999), (2, -999999999999);
      SELECT * FROM transactions WHERE amount > 1000000000000 OR amount < -1000000000000;

      -- 6. Non-ASCII or Special Characters
      INSERT INTO users (id, name) VALUES (2, '李小龙'), (3, 'O\\'Connor');
      SELECT * FROM users WHERE name LIKE 'O%';

      -- 7. Recursive Query (CTE Edge Case)
      WITH RECURSIVE cte AS (
          SELECT 1 AS num
          UNION ALL
          SELECT num + 1 FROM cte WHERE num < 5
      )
      SELECT * FROM cte;

      -- 8. Cross Join Edge Case
      SELECT * FROM users CROSS JOIN roles;

      -- 9. Overlapping Ranges
      SELECT * FROM events WHERE start_time <= '2024-01-01' AND end_time >= '2024-01-01';

      -- 10. Case Sensitivity
      INSERT INTO tags (id, label) VALUES (1, 'SQL'), (2, 'sql');
      SELECT * FROM tags WHERE label = 'SQL';

      -- 11. Index Edge Case
      SELECT * FROM orders FORCE INDEX (order_date_index) WHERE order_date = '2024-01-01';

      -- 12. Date Handling
      INSERT INTO events (id, event_date) VALUES (1, '2024-02-29'), (2, '0000-00-00'), (3, '9999-12-31');
      SELECT * FROM events WHERE event_date BETWEEN '2024-01-01' AND '2024-12-31';

      -- 13. Self-JOIN
      SELECT a.id AS parent_id, b.id AS child_id
      FROM users a
      JOIN users b ON a.id = b.parent_id;

      -- 14. Triggers or Constraints
      INSERT INTO users (id, name, email) VALUES (NULL, 'Test', 'test@example.com'); -- Violates NOT NULL
      INSERT INTO orders (id, status) VALUES (NULL, NULL); -- Default status should be applied
    `
    const queries = splitSqlQueries(sqlFileContent)
    expect(queries).toHaveLength(24)

    expect(queries).toMatchObject([
      'INSERT INTO users (id, name, email) VALUES (1, \'Alice\', NULL);',
      'SELECT * FROM users WHERE email IS NULL;',
      'SELECT * FROM users WHERE email = \'\';',
      'SELECT * FROM users WHERE id = -1;',
      'SELECT orders.id, users.name\n'
      + '      FROM orders\n'
      + '      LEFT JOIN users ON orders.user_id = users.id\n'
      + '      WHERE users.id IS NULL;',
      'INSERT INTO products (id, name) VALUES (1, \'Widget\'), (1, \'Widget\');',
      'SELECT name, COUNT(*) AS cnt\n'
      + '      FROM products\n'
      + '      GROUP BY name\n'
      + '      HAVING cnt > 1;',
      'SELECT AVG(price), SUM(price) FROM orders WHERE 1 = 0;',
      'SELECT user_id, COUNT(*) FROM orders WHERE user_id = 1 GROUP BY user_id;',
      'INSERT INTO transactions (id, amount) VALUES (1, 999999999999), (2, -999999999999);',
      'SELECT * FROM transactions WHERE amount > 1000000000000 OR amount < -1000000000000;',
      'INSERT INTO users (id, name) VALUES (2, \'李小龙\'), (3, \'O\\\'Connor\');',
      'SELECT * FROM users WHERE name LIKE \'O%\';',
      'WITH RECURSIVE cte AS (\n'
      + '          SELECT 1 AS num\n'
      + '          UNION ALL\n'
      + '          SELECT num + 1 FROM cte WHERE num < 5\n'
      + '      )\n'
      + '      SELECT * FROM cte;',
      'SELECT * FROM users CROSS JOIN roles;',
      'SELECT * FROM events WHERE start_time <= \'2024-01-01\' AND end_time >= \'2024-01-01\';',
      'INSERT INTO tags (id, label) VALUES (1, \'SQL\'), (2, \'sql\');',
      'SELECT * FROM tags WHERE label = \'SQL\';',
      'SELECT * FROM orders FORCE INDEX (order_date_index) WHERE order_date = \'2024-01-01\';',
      'INSERT INTO events (id, event_date) VALUES (1, \'2024-02-29\'), (2, \'0000-00-00\'), (3, \'9999-12-31\');',
      'SELECT * FROM events WHERE event_date BETWEEN \'2024-01-01\' AND \'2024-12-31\';',
      'SELECT a.id AS parent_id, b.id AS child_id\n'
      + '      FROM users a\n'
      + '      JOIN users b ON a.id = b.parent_id;',
      'INSERT INTO users (id, name, email) VALUES (NULL, \'Test\', \'test@example.com\');',
      'INSERT INTO orders (id, status) VALUES (NULL, NULL);'
    ])
  })

  it('Should keep trigger sql queries as one query', () => {
    const sqlFileContent = `
      -- Create a table. And an external content fts5 table to index it.
      CREATE TABLE t1(a INTEGER PRIMARY KEY, b, c);
      CREATE VIRTUAL TABLE fts_idx USING fts5(b, c, content='t1', content_rowid='a');

      -- Triggers to keep the FTS index up to date.
      CREATE TRIGGER t1_ai AFTER INSERT ON t1 BEGIN
        INSERT INTO fts_idx(rowid, b, c) VALUES (new.a, new.b, new.c);
      END;
      CREATE TRIGGER t1_ad AFTER DELETE ON t1 BEGIN
        INSERT INTO fts_idx(fts_idx, rowid, b, c) VALUES('delete', old.a, old.b, old.c);
      END;
      CREATE TRIGGER t1_au AFTER UPDATE ON t1 BEGIN
        INSERT INTO fts_idx(fts_idx, rowid, b, c) VALUES('delete', old.a, old.b, old.c);
        INSERT INTO fts_idx(rowid, b, c) VALUES (new.a, new.b, new.c);
      END;
    `
    const queries = splitSqlQueries(sqlFileContent)
    expect(queries).toHaveLength(5)
  })
})
