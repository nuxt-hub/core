// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
  features: {
    tooling: true,
    stylistic: {
      quoteProps: 'as-needed',
      commaDangle: 'never',
      braceStyle: '1tbs'
    }
  },
  dirs: {
    src: [
      './playground',
      './docs'
    ]
  }
}, { ignores: ['**/.wrangler/**'] }).overrideRules({
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-unused-vars': ['error', {
    caughtErrors: 'none',
    argsIgnorePattern: '^_',
    varsIgnorePattern: '^_'
  }],
  '@typescript-eslint/no-unused-expressions': 'off',
  'vue/max-attributes-per-line': 'off',
  'vue/no-v-html': 'off',
  'vue/multi-word-component-names': 'off'
})
