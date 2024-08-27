import type { Hyperdrive } from '@cloudflare/workers-types'
import postgres from 'postgres'

export default eventHandler(async (event) => {
  const hyperdrive = process.env.POSTGRES as Hyperdrive | undefined
  const dbURL = hyperdrive?.connectionString || process.env.NUXT_POSTGRES_URL

  if (!dbURL) {
    throw createError({
      statusCode: 500,
      message: 'No process.env.NUXT_POSTGRES_URL or provess.env.HYPERDRIVE found'
    })
  }
  const sql = postgres(dbURL, {
    ssl: import.meta.dev ? 'require' : false
  })

  // Create products table
  // await db.query('CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, name VARCHAR(255), price DECIMAL(10, 2))')
  // // Insert 10 products
  // await db.query('INSERT INTO products (name, price) VALUES ($1, $2)', ['Product 1', 10.00])
  // await db.query('INSERT INTO products (name, price) VALUES ($1, $2)', ['Product 2', 20.00])
  // await db.query('INSERT INTO products (name, price) VALUES ($1, $2)', ['Product 3', 30.00])
  // await db.query('INSERT INTO products (name, price) VALUES ($1, $2)', ['Product 4', 40.00])
  // await db.query('INSERT INTO products (name, price) VALUES ($1, $2)', ['Product 5', 50.00])
  // await db.query('INSERT INTO products (name, price) VALUES ($1, $2)', ['Product 6', 60.00])
  // await db.query('INSERT INTO products (name, price) VALUES ($1, $2)', ['Product 7', 70.00])
  // await db.query('INSERT INTO products (name, price) VALUES ($1, $2)', ['Product 8', 80.00])
  // await db.query('INSERT INTO products (name, price) VALUES ($1, $2)', ['Product 9', 90.00])
  // await db.query('INSERT INTO products (name, price) VALUES ($1, $2)', ['Product 10', 100.00])

  console.log('query products')
  const products = await sql`SELECT * FROM products`

  event.waitUntil(sql.end())
  return products
})
