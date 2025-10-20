export default defineEventHandler(async () => {
  const db = useDrizzle()

  const drizzleTables = await db.execute(sql`
    SELECT
      name,
      type
    FROM
      sqlite_schema
    WHERE
      type = 'table' AND
      name NOT LIKE 'sqlite_%' and name NOT LIKE '_litestream_%' and name NOT LIKE '__drizzle%'
    ;
  `)

  const all = await db.select().from(tables.todos).limit(3)

  return {
    drizzleTables: drizzleTables.rows || drizzleTables,
    all
  }
})
