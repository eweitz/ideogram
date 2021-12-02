module.exports = {
  'env': {
    'browser': true,
    'es6': true
  },
  'extends': [
    'google'
  ],
  'parser': '@babel/eslint-parser',
  'parserOptions': {
    'ecmaVersion': 2020,
    'sourceType': 'module'
  },
  'rules': {
    'arrow-parens': 'off',
    'brace-style': ['error', '1tbs', {'allowSingleLine': true}],
    'comma-dangle': ['error', 'never'],
    'curly': ['error', 'multi-line'],
    'indent': [
      'warn', 2, {'SwitchCase': 1, 'CallExpression': {'arguments': 1}}
    ],
    'no-invalid-this': 'off',
    'no-undef': 'off',
    'require-jsdoc': 'off',
    'valid-jsdoc': 'off',
    'one-var': 'off',
    'guard-for-in': 'off',
    'no-alert': 'off',
    'no-loop-func': 'off',
    'no-negated-condition': 'off',
    'no-inner-declaration': 'off',
    'no-warning-comments': 'off',
    'no-eval': 'off',
    'no-inner-declarations': 'off',
    'no-else-return': 'off',
    'no-var': 'off',
    'padded-blocks': 'off',
    'prefer-rest-params': 'off',
    'radix': 'off'
  }
}
