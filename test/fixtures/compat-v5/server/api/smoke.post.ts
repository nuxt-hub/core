import { defineEventHandler } from 'h3'
import { db, schema } from 'hub:db'
import { kv } from 'hub:kv'

export default defineEventHandler(async () => {
  const [todo] = await db.insert(schema.todos).values({ title: 'compat v5' }).returning()
  await kv.set('compat', { ok: true })
  return { todo, kv: await kv.get('compat') }
})
