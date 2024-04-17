export default eventHandler(async () => {
  const kv = hubKV()

  await kv.set('vue', { year: 2014 })
  await kv.set('vue:nuxt', { year: 2016 })
  await kv.set('vue:quasar', { version: 2015 })
  await kv.set('react', { version: 2013 })
  await kv.set('react:next', { version: 2016 })
  await kv.set('react:gatsby', { version: 2015 })

  return kv.keys()
  // const db = hubDatabase()
  // return useProjectKV(projectUrl).getKeys()
  // return await db.prepare('SELECT * from todos').all()
  // return await db.prepare("SELECT * from todos").first()
  // return await db.prepare('SELECT * from todos').raw()
  // return await db.prepare("SELECT * from todos").run()
  // return await db.exec('SELECT * from todos;')

  // const stmt = db.prepare('SELECT * from todos WHERE id = ?1')
  // return {
  //   one: await stmt.bind(1).first(),
  //   three: await stmt.bind(3).first()
  // }

  // return db.batch([
  //   stmt.bind(1),
  //   stmt.bind(2)
  // ])
  // return db.batch([
  //   db.prepare('insert into todos (title, completed, created_at) values (?1, ?2, ?3)').bind('created', 0, Date.now()),
  //   db.prepare('update todos SET title = ?1 where id = ?2').bind('updated', 1),
  //   db.prepare('select * from todos where id = ?1').bind(1),
  // ])

  return await db.exec('CREATE TABLE IF NOT EXISTS frameworks (id INTEGER PRIMARY KEY, name TEXT NOT NULL, year INTEGER NOT NULL DEFAULT 0)')

  // return useProjectDatabase(projectUrl).all(sql`SELECT * from todos``)
  // return {}
})
