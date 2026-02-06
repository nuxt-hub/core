import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

const fixtureDir = fileURLToPath(new URL('./fixtures/db-prisma', import.meta.url))

const cleanUp = async () => {
  await fs.rm(fileURLToPath(new URL('./fixtures/db-prisma/.data', import.meta.url)), { force: true, recursive: true })
  await fs.rm(fileURLToPath(new URL('./fixtures/db-prisma/.nuxt', import.meta.url)), { force: true, recursive: true })
}

describe('Database E2E - Prisma', async () => {
  await cleanUp()

  await setup({
    rootDir: fixtureDir,
    dev: true,
    setupTimeout: 120000
  })

  it('should have db enabled with prisma', async () => {
    const manifest = await $fetch('/api/manifest')
    expect(manifest.db).toBeTruthy()
  })

  it('should list users (empty)', async () => {
    const users = await $fetch('/api/users')
    expect(users).toEqual([])
  })

  it('should create a user', async () => {
    const user = await $fetch('/api/users', {
      method: 'POST',
      body: { name: 'John Doe', email: 'john@example.com' }
    })
    expect(user).toMatchObject({ id: 1, name: 'John Doe', email: 'john@example.com' })
  })

  it('should get user by id', async () => {
    const user = await $fetch('/api/users/1')
    expect(user).toMatchObject({ id: 1, name: 'John Doe', email: 'john@example.com' })
  })

  it('should update user', async () => {
    const user = await $fetch('/api/users/1', {
      method: 'PUT',
      body: { name: 'Jane Doe' }
    })
    expect(user).toMatchObject({ id: 1, name: 'Jane Doe', email: 'john@example.com' })
  })

  it('should list users (1 user)', async () => {
    const users = await $fetch('/api/users')
    expect(users).toHaveLength(1)
    expect(users[0]).toMatchObject({ name: 'Jane Doe' })
  })

  it('should delete user', async () => {
    const result = await $fetch('/api/users/1', { method: 'DELETE' })
    expect(result).toEqual({ success: true })
  })

  it('should return 404 for deleted user', async () => {
    const error = await $fetch('/api/users/1').catch(e => e)
    expect(error.response?.status).toBe(404)
  })
})
