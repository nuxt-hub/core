export default eventHandler(async () => {
  const db = useDatabaseClient()

  const { results } = await db.prepare('PRAGMA table_list').all<{
    schema: string;
    name: string;
    type: string;
    ncol: number;
    wr: number;
    strict: number;
  }>()

  if (!results) {
    throw createError({ statusCode: 404, message: 'No tables found' })
  }

  const tables = results.filter(({ name }) => {
    const isInternal = name.startsWith('sqlite_') || name.startsWith('_cf_') || name.startsWith('d1_') || name.startsWith('__drizzle')

    return !isInternal
  })

  const [columns, count] = await Promise.all([
    db.batch(tables.map(({ name }) => db.prepare(`PRAGMA table_info("${name}")`)))
      .then(res => res.map(({ results }) => results as { name: string; type: string }[])),
    db.batch<{ c: number }>(tables.map(({ name }) => db.prepare(`SELECT COUNT(*) AS c FROM "${name}"`)))
      .then(res => res.map(({ results }) => results[0].c))
  ])


  return tables.map(({ name }, i) => ({
    name,
    columns: columns[i],
    count: count[i]
  }))
})
