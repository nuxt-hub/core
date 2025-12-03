import { setupDotenv } from 'c12'
import { resolve, relative } from 'pathe'
import { consola } from 'consola'

/**
 * Load environment variables from a .env file
 * @param {Object} options
 * @param {string} options.cwd - The current working directory
 * @param {string} options.dotenv - The path to the .env file (relative to cwd)
 */
export async function loadDotenv({ cwd, dotenv }) {
  const cmdCwd = process.cwd()
  const resolvedCwd = resolve(cmdCwd, cwd || '.')

  if (dotenv) {
    consola.info(`Loading env from \`${dotenv}\``)
    await setupDotenv({
      cwd: resolvedCwd,
      fileName: dotenv
    })
  } else if (resolvedCwd !== cmdCwd) {
    consola.info(`Loading env from \`${relative(cmdCwd, resolvedCwd)}/.env\``)
    await setupDotenv({
      cwd: resolvedCwd,
      fileName: '.env'
    })
  }
}

/**
 * Common dotenv argument definition for CLI commands
 */
export const dotenvArg = {
  type: 'string',
  description: 'Point to another .env file to load, relative to the root directory.',
  required: false
}
