import antfu from '@antfu/eslint-config'

export default antfu({
  stylistic: {
    indent: 2,
    quotes: 'single',
  },
  typescript: true,
  ignores: [
    'output',
    'dist',
    'node_modules',
  ],
}, {
  rules: {
    'no-console': 'off',
    'node/prefer-global/process': 'off',
  },
})
