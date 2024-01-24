import { join } from 'pathe'
import type { Config } from 'drizzle-kit'

export default {
  out: 'server/database/migrations',
  schema: 'server/database/schema.ts',
  driver: 'better-sqlite',
  dbCredentials: {
    url: join(process.cwd(), './db.sqlite')
  }
} satisfies Config
