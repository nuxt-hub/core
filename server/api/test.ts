import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useDatabase()

  const rows = await db.all(sql`
    SELECT
      name
    FROM
      sqlite_schema
    WHERE
      type = 'table' AND
      name NOT LIKE 'sqlite_%' and name NOT LIKE '_litestream_%' and name NOT LIKE '__drizzle%'
    ;
  `)

  return rows
})
