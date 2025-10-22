// Database migration types
export interface DatabaseMigration {
  name: string
  filename: string
  appliedAt?: Date
}

export interface DatabaseConnection {
  dialect: 'sqlite' | 'postgresql' | 'mysql'
  execute: (sql: string) => Promise<any>
  run: (sql: string) => Promise<any>
  all: (sql: string) => Promise<any[]>
}
