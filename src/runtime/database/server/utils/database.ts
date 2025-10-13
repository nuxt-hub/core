import type { ExecResult, Database, Statement as DB0Statement, PreparedStatement as DB0PreparedStatement, Primitive } from 'db0'
import { requireNuxtHubFeature } from '../../../utils/features'
import { useDatabase } from '#imports'

import type { HubDatabase, D1PreparedStatement, D1AllResult, D1RunResult, D1Statement } from '../../../../types'

let _db: HubDatabase

// Wrapper functions to create D1-compatible interfaces since db0 differs very slightly
function createD1PreparedStatement(preparedStmt: DB0PreparedStatement, originalStmt?: any): D1PreparedStatement {
  const statement: D1PreparedStatement = {
    bind(...params: Primitive[]): D1PreparedStatement {
      return createD1PreparedStatement(preparedStmt.bind(...params), originalStmt)
    },
    // adds results object to all()
    async all(): Promise<D1AllResult> {
      const results = await preparedStmt.all()
      return {
        success: true,
        meta: {},
        results: results as any[]
      }
    },
    async run(): Promise<D1RunResult> {
      return preparedStmt.run()
    },
    // changes db0 .get() to .first()
    first() {
      return preparedStmt.get()
    }
  }

  // Store reference to original statement for batch operations
  if (originalStmt) {
    ;(statement as any)._originalStmt = originalStmt
  }

  return statement
}

function createD1Statement(stmt: DB0Statement, originalStmt?: any): D1Statement {
  return {
    bind(...params: Primitive[]): D1PreparedStatement {
      return createD1PreparedStatement(stmt.bind(...params), originalStmt)
    },
    async all(...params: Primitive[]): Promise<D1AllResult> {
      const results = await stmt.all(...params)
      return {
        success: true,
        meta: {},
        results: results as any[]
      }
    },
    async run(...params: Primitive[]): Promise<D1RunResult> {
      return stmt.run(...params)
    },
    // db0 get() method
    async get(...params: Primitive[]): Promise<unknown> {
      return stmt.get(...params)
    },
    // D1 first() method (alias for get())
    async first(...params: Primitive[]): Promise<any> {
      return stmt.get(...params)
    }
  }
}

function createD1CompatibleDatabase(db: Database): HubDatabase {
  return {
    dialect: db.dialect,
    exec(sql: string): Promise<ExecResult> {
      return db.exec(sql)
    },
    prepare(sql: string): D1Statement {
      return createD1Statement(db.prepare(sql))
    },
    sql<T = any>(strings: TemplateStringsArray, ...values: Primitive[]): Promise<T> {
      return db.sql(strings, ...values)
    },
    getInstance(): Promise<any> {
      return db.getInstance()
    },
    async batch(statements: D1PreparedStatement[]): Promise<D1AllResult[]> {
      // Try to detect the actual driver type and use native batch functionality
      try {
        const instance = await db.getInstance()

        // Check if this is a D1 database by looking for the batch method
        if (instance && typeof instance === 'object' && 'batch' in instance && typeof instance.batch === 'function') {
          // Use native D1 batch functionality
          const d1Statements = statements.map((stmt) => {
            // Extract the original prepared statement from our wrapper
            // This is a bit hacky but necessary to get the underlying D1 prepared statement
            return (stmt as any)._originalStmt || stmt
          })
          const results = await (instance as any).batch(d1Statements)
          return results.map((result: any) => ({
            success: true,
            meta: result.meta || {},
            results: result.results || []
          }))
        }
      } catch (error) {
        // Fall through to custom implementation if D1 batch fails
      }

      // For SQLite (better-sqlite3), PostgreSQL, and PGlite
      // we'll fall through to sequential execution to avoid complexity
      // TODO: Implement proper batch/transaction support in db0

      // Fallback: execute statements sequentially
      const results: D1AllResult[] = []
      for (const stmt of statements) {
        try {
          const result = await stmt.all()
          results.push(result)
        } catch (error: any) {
          // If all() fails (for INSERT/UPDATE/DELETE), use run()
          if (error?.message?.includes('does not return data')) {
            const runResult = await stmt.run()
            results.push({
              success: runResult.success,
              meta: {},
              results: []
            })
          } else {
            throw error
          }
        }
      }
      return results
    }
  }
}

/**
 * Access the NuxtHub database.
 *
 * @example ```ts
 * const db = hubDatabase()
 * const { rows } = await db.sql`SELECT * FROM users`;
 * ```
 *
 * @see https://hub.nuxt.com/docs/features/database
 * @deprecated since version 1.0.0. Use `useDatabase('db')` instead.
 */
export function hubDatabase(): HubDatabase {
  requireNuxtHubFeature('database')

  if (_db) {
    return _db
  }
  const db = useDatabase('db') as Database

  _db = createD1CompatibleDatabase(db)
  return _db
}
