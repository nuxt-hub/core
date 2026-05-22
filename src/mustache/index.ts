import { join } from 'node:path'
import Mustache from 'mustache'
import { readFileSync } from 'node:fs'

function getMustacheFileContent(fileDir: string, file: string) {
  return readFileSync(`${join(fileDir, file)}.mustache`).toString()
}

function mustacheFile<T extends object>(fileDir: string, file: string) {
  fileDir = join(__dirname, fileDir)
  return {
    render: (view: T) => Mustache.render(
      getMustacheFileContent(fileDir, file),
      view,
      partial => getMustacheFileContent(fileDir, partial))
  }
}

export type MustacheViews = {
  db: {
    drizzle: {
      d1?: boolean
      d1http?: boolean
      libsql?: boolean
      mysql2?: boolean
      neonhttp?: boolean
      pglite?: boolean
      postgresjs?: boolean

      bindingName: string
      casing: string | undefined
      connection: { url?: string, dataDir?: string, uri?: string }
      connectionStringified: string
      driver: string
      hyperdrive: boolean
      isDev: boolean
      lazy: boolean
      mode: string
      postgresOpts: string
      replicaDriver: string | undefined
      replicaUrls: string
      withReplicas: boolean
    }
    types: {
      driver: string
      driverForTypes: string
    }
  }
}

export const mustacheFiles = {
  db: {
    drizzle: mustacheFile<MustacheViews['db']['drizzle']>('db', 'drizzle'),
    types: mustacheFile<MustacheViews['db']['types']>('db', 'types')
  }
}
