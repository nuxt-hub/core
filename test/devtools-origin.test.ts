import { describe, expect, it } from 'vitest'
import { resolveDevtoolsAppOrigin } from '../src/devtools/origin'

describe('resolveDevtoolsAppOrigin', () => {
  it('uses argv --port when devServer.port is missing', () => {
    const origin = resolveDevtoolsAppOrigin({
      https: false,
      devServerPort: undefined,
      argv: ['node', 'nuxt', 'dev', '--port', '3010']
    })
    expect(origin).toBe('http://localhost:3010')
  })

  it('supports argv --port=4020', () => {
    const origin = resolveDevtoolsAppOrigin({
      https: false,
      argv: ['node', 'nuxt', 'dev', '--port=4020']
    })
    expect(origin).toBe('http://localhost:4020')
  })

  it('supports argv -p 1234', () => {
    const origin = resolveDevtoolsAppOrigin({
      https: false,
      argv: ['node', 'nuxt', 'dev', '-p', '1234']
    })
    expect(origin).toBe('http://localhost:1234')
  })

  it('prefers devServer.port when it is non-default', () => {
    const origin = resolveDevtoolsAppOrigin({
      https: false,
      devServerPort: 5555,
      argv: ['node', 'nuxt', 'dev', '--port', '3010']
    })
    expect(origin).toBe('http://localhost:5555')
  })

  it('prefers argv over devServer.port when devServer.port is default (3000)', () => {
    const origin = resolveDevtoolsAppOrigin({
      https: false,
      devServerPort: 3000,
      argv: ['node', 'nuxt', 'dev', '--port', '3010']
    })
    expect(origin).toBe('http://localhost:3010')
  })

  it('prefers appOrigin override over everything', () => {
    const origin = resolveDevtoolsAppOrigin({
      appOrigin: 'http://localhost:7777',
      https: false,
      devServerPort: 5555,
      argv: ['node', 'nuxt', 'dev', '--port', '3010'],
      env: { PORT: '9999' }
    })
    expect(origin).toBe('http://localhost:7777')
  })

  it('defaults to port 3000', () => {
    const origin = resolveDevtoolsAppOrigin({ https: false, argv: [] })
    expect(origin).toBe('http://localhost:3000')
  })

  it('uses https when enabled', () => {
    const origin = resolveDevtoolsAppOrigin({
      https: true,
      argv: ['node', 'nuxt', 'dev', '--port', '3010']
    })
    expect(origin).toBe('https://localhost:3010')
  })
})
