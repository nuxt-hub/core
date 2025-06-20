import { readdirSync, statSync } from 'node:fs'
import { addServerHandler } from '@nuxt/kit'
import { join, relative } from 'pathe'
import { withoutTrailingSlash } from 'ufo'

type HttpMethod = 'get' | 'head' | 'patch' | 'post' | 'put' | 'delete' | 'connect' | 'options' | 'trace'
/**
 * Extract HTTP method from file path if it exists in format file.method.ts
 * @param filePath - The file path to extract method from
 * @returns The HTTP method or undefined if not found
 */
function extractMethod(filePath: string): HttpMethod | undefined {
  const match = filePath.match(/\.([a-z]+)\.ts$/)
  return match ? match[1] as HttpMethod : undefined
}

/**
 * Convert a file path to a Nuxt route pattern.
 * @param filePath - The file path relative to the API root.
 */
function filePathToRoute(filePath: string): string {
  let route = filePath
    .replace(/\.ts$/, '') // remove extension
    .replace(/\.(get|post|put|delete|patch|head|options)$/, '') // remove HTTP method
    .replace(/index$/, '') // remove trailing index
    .replace(/\[\.{3}([^\]]+)\]/g, '/**:$1') // catch-all [...foo] -> /**:foo
    .replace(/\[([^\]]+)\]/g, '/:$1') // dynamic [foo] -> /:foo
    .replace(/\/+/g, '/') // collapse slashes
  if (!route.startsWith('/')) route = '/' + route
  return route
}

/**
 * Recursively list all .ts files in a directory and generate addServerHandler objects.
 * @param dir - The directory to scan.
 * @param apiRoot - The route root
 * @returns Array of { route, handler, method } objects.
 */
export function getServerHandlers(apiRoot: string, dir: string): { route: string, handler: string, method?: HttpMethod }[] {
  const results: { route: string, handler: string, method?: HttpMethod }[] = []
  function walk(currentDir: string) {
    for (const entry of readdirSync(currentDir)) {
      const fullPath = join(currentDir, entry)
      if (statSync(fullPath).isDirectory()) {
        walk(fullPath)
      } else if (entry.endsWith('.ts') || entry.endsWith('.js')) {
        const relPath = relative(dir, fullPath).replace(/\\/g, '/')
        const method = extractMethod(relPath)
        const route = withoutTrailingSlash(apiRoot + filePathToRoute(relPath))
        results.push({
          route,
          handler: fullPath,
          method
        })
      }
    }
  }
  walk(dir)
  return results
}

/**
 * Add server handlers to the Nuxt server.
 * @param apiRoot - The route root
 * @param dir - The directory to scan
 */
export function addServerHandlers(apiRoot: string, dir: string) {
  const handlers = getServerHandlers(apiRoot, dir)

  for (const handler of handlers) {
    addServerHandler(handler)
  }
}
