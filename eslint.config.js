import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  vue: true,
  jsonc: true,
  typescript: true,
}, {
  rules: {
    'no-console': 'off',
    'node/prefer-global/buffer': 'off',
    'no-alert': 'off',
    'unused-imports/no-unused-vars': 'off',
  },
})
