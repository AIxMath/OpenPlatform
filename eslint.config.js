import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  vue: true,
  jsonc: true,
  typescript: true,
}, {
  files: ['backend/**'],
  rules: {
    'no-console': 'off',
  },
})
