export default eventHandler(async (event) => {
  const db = useDatabaseClient()
  // return useProjectKV(projectUrl).getKeys()
  // return await db.prepare("SELECT * from todos").all()
  // return await db.prepare("SELECT * from todos").first()
  // return await db.prepare("SELECT * from todos").raw()
  // return await db.prepare("SELECT * from todos").run()
  // return await db.exec('SELECT * from todos;')

  const stmt = db.prepare('SELECT * from todos WHERE id = ?1')
  // return {
  //   one: await stmt.bind(1).first(),
  //   three: await stmt.bind(3).first()
  // }

  // return db.batch([
  //   stmt.bind(1),
  //   stmt.bind(2)
  // ])
  return db.batch([
    db.prepare('PRAGMA table_list'),
    db.prepare('PRAGMA table_info(todos)'),
  ])

  // return useProjectDatabase(projectUrl).all(sql`SELECT * from todos``)
  // return {}
})
