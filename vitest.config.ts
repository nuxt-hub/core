import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 60000,
    hookTimeout: 180000,
    fileParallelism: false,
    env: {
      // Several test files start a dev server for the same fixture; on Windows the previous one may still be alive
      NUXT_IGNORE_LOCK: '1'
    }
  }
})
