export default defineNitroPlugin(() => {
  if (import.meta.dev) {
    onHubReady(async () => {
      const db = useDB()

      await db.run(sql`CREATE TABLE IF NOT EXISTS todos (
        id integer PRIMARY KEY NOT NULL,
        title text NOT NULL,
        completed integer DEFAULT 0 NOT NULL,
        created_at integer NOT NULL
      );`)
    })
  }
})
