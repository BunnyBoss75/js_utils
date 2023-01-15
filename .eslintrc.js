module.exports = {
  parserOptions: {
    ecmaVersion: 2019,
  },
  rules: {
    "camelcase": 1,
    "comma-dangle": [
      1,
      "always-multiline",
    ],
    "function-paren-newline": 1,
    "max-len": [
      2,
      {
        "code": 120,
        "tabWidth": 2,
        "ignoreUrls": true,
      },
    ],
    "no-unused-expressions": 1,
    "operator-linebreak": [
      2,
      "after",
    ],
    "quotes": [
      1,
      "single",
    ],
    "prefer-promise-reject-errors": 1,
    "eqeqeq": 1,
    "object-curly-newline": [
      2,
      {
        "ObjectExpression": {
          "multiline": true,
          "consistent": true
        },
        "ObjectPattern": {
          "multiline": true,
          "consistent": true
        },
        "ImportDeclaration": {
          "multiline": true,
          "consistent": true
        },
        "ExportDeclaration": {
          "multiline": true,
          "consistent": true
        }
      }
    ],
    "no-use-before-define": 1,
    "object-curly-spacing": 2
  }
}
