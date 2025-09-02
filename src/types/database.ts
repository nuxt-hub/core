import type { Database, Primitive } from 'db0'

// D1-compatible types that wrap db0 results
export type D1RunResult = {
  success: boolean
}

export type D1AllResult = {
  success: boolean
  meta: object
  results: any[]
}

export type D1PreparedStatement = {
  bind(...params: Primitive[]): D1PreparedStatement
  all(): Promise<D1AllResult>
  run(): Promise<D1RunResult>
  first(): Promise<any>
}

export type D1Statement = {
  bind(...params: Primitive[]): D1PreparedStatement
  all(...params: Primitive[]): Promise<D1AllResult>
  run(...params: Primitive[]): Promise<D1RunResult>
  get(...params: Primitive[]): Promise<any>
  // D1-specific method (alias for get())
  first(...params: Primitive[]): Promise<any>
}

// Extends db0's Database interface with D1-specific additions
type D1CompatibleDatabase = {
  // db0 Database properties and methods
  readonly dialect: Database['dialect']
  getInstance: Database['getInstance']
  exec: Database['exec']
  sql: Database['sql']
  // Override prepare to return D1-compatible statement
  prepare(sql: string): D1Statement
  // D1-specific addition
  batch(statements: D1PreparedStatement[]): Promise<D1AllResult[]>
}

export type HubDatabase = D1CompatibleDatabase
