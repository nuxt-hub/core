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
}).overrideRules({
  '@typescript-eslint/no-explicit-any': 'off',
  'vue/max-attributes-per-line': 'off',
  'vue/no-v-html': 'off',
  'vue/multi-word-component-names': 'off'
})
