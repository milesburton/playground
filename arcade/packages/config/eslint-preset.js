module.exports = {
  extends: [
    "airbnb-base",
    "airbnb-typescript/base",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  plugins: ["@typescript-eslint", "import"],
  parserOptions: {
    project: "./tsconfig.json",
    ecmaVersion: 2022,
    sourceType: "module"
  },
  rules: {
    "import/prefer-default-export": "off",
    "import/order": [
      "error",
      {
        "groups": [
          ["builtin", "external"],
          "internal",
          ["parent", "sibling", "index"]
        ],
        "newlines-between": "always",
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        }
      }
    ],
    "@typescript-eslint/explicit-function-return-type": ["error", {
      "allowExpressions": true,
      "allowTypedFunctionExpressions": true
    }],
    "sort-imports": [
      "error",
      {
        "ignoreCase": true,
        "ignoreDeclarationSort": true,
        "ignoreMemberSort": false,
        "allowSeparatedGroups": true
      }
    ]
  }
}
