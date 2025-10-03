import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  vue: true,
  jsonc: true,
  typescript: true,
}, {
  files: ['**'],
  rules: {
    'no-console': 'off',
  },
})
