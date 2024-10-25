module.exports = {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: "es5",
  bracketSpacing: true,
  arrowParens: "always",
  endOfLine: "lf",
  plugins: [
    "prettier-plugin-organize-imports",
    "prettier-plugin-sort-json"
  ],
  organizeImportsSkipDestructiveCodeActions: true,
  jsonRecursiveSort: true
}
