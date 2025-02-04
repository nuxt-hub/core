import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('ssr', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('..', import.meta.url)),
    dev: true
  })

  it('Clear todos table', async () => {
    await $fetch('/api/_hub/database/query', {
      method: 'POST',
      body: {
        query: 'DELETE FROM todos'
      }
    })
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
