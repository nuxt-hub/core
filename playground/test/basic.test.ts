import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('ssr', async () => {
  await cleanUp()

  await setup({
    rootDir: fileURLToPath(new URL('..', import.meta.url)),
    dev: true
  })

  it('List todos', async () => {
    const todos = await $fetch('/api/todos')
    expect(todos).toMatchObject([])
  })

  it('Create todo', async () => {
    const todo = await $fetch('/api/todos', {
      method: 'POST',
      body: { title: 'Test todo' }
    })
    expect(todo).toMatchObject({ id: expect.any(Number), title: 'Test todo' })
  })
})

async function cleanUp() {
  await fs.rm(fileURLToPath(new URL('./../.data/db', import.meta.url)), { force: true, recursive: true })
}
