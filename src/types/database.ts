import type { D1Database as CFD1Database } from '@cloudflare/workers-types/experimental'

type OmitDump<T> = Omit<T, 'dump'>

export type D1Database = OmitDump<CFD1Database>
