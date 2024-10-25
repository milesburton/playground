#!/usr/bin/env fish

function add_shared_config
    # Ensure we're in a monorepo root (check for turbo.json or package.json with workspaces)
    if not test -f "turbo.json"; and not test -f "package.json"
        echo "Error: Please run this script from your monorepo root directory"
        return 1
    end

    # Create config package directory
    mkdir -p packages/config
    cd packages/config

    # Initialize config package.json
    set -l config_pkg '{
  "name": "@internal/config",
  "version": "0.0.1",
  "private": true,
  "main": "index.js",
  "files": [
    "eslint-preset.js",
    "prettier-preset.js",
    "tsconfig.base.json"
  ],
  "scripts": {
    "lint": "eslint .",
    "format": "prettier --write ."
  },
  "dependencies": {
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.57.0",
    "eslint-config-airbnb-base": "^15.0.0",
    "eslint-config-airbnb-typescript": "^17.1.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-import": "^2.29.1",
    "eslint-plugin-prettier": "^5.1.3",
    "prettier": "^3.2.5",
    "prettier-plugin-organize-imports": "^3.2.4",
    "prettier-plugin-sort-json": "^3.1.0"
  }
}'
    echo $config_pkg > package.json

    # Create base tsconfig
    set -l tsconfig '{
  "compilerOptions": {
    "target": "es2019",
    "module": "commonjs",
    "lib": ["es2019", "dom"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}'
    echo $tsconfig > tsconfig.base.json

    # Create ESLint preset
    set -l eslint_preset 'module.exports = {
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
}'
    echo $eslint_preset > eslint-preset.js

    # Create Prettier preset
    set -l prettier_preset 'module.exports = {
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
}'
    echo $prettier_preset > prettier-preset.js

    # Create index.js to export all presets
    set -l index_content 'module.exports = {
  eslint: require("./eslint-preset"),
  prettier: require("./prettier-preset")
}'
    echo $index_content > index.js

    # Go back to root
    cd ../..

    # Update root package.json to include new dependencies
    pnpm add -D -w @internal/config@workspace:*

    # Create root prettier config
    echo 'module.exports = require("@internal/config").prettier;' > .prettierrc.js

    # Create root eslint config
    echo 'module.exports = require("@internal/config").eslint;' > .eslintrc.js

    # Update all package.json files in packages/* to use shared config
    for pkg in packages/*/package.json
        if test $pkg != "packages/config/package.json"
            set dir (dirname $pkg)
            cd $dir
            
            # Add script to package.json
            set -l scripts '"scripts": { "format": "prettier --write .\\"**/*.{ts,tsx,js,jsx,json,md}\\"", "lint": "eslint . --ext .ts,.tsx,.js,.jsx" }'
            jq '. + {scripts: {"format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"", "lint": "eslint . --ext .ts,.tsx,.js,.jsx"}}' package.json > package.json.tmp
            mv package.json.tmp package.json
            
            # Add dependencies
            pnpm add -D @internal/config@workspace:*
            
            # Create package-specific eslint config that extends shared one
            echo 'module.exports = require("@internal/config").eslint;' > .eslintrc.js
            
            cd ../..
        end
    end

    # Update turbo.json to include format task
    if test -f "turbo.json"
        set -l updated_turbo (cat turbo.json | jq '.tasks += {"format": {"cache": false}}')
        echo $updated_turbo > turbo.json
    end

    # Install all dependencies
    pnpm install

    echo "✨ Shared config package has been added!"
    echo "You can now use the following commands:"
    echo "- pnpm format : Format all files"
    echo "- pnpm lint   : Lint all files"
    echo ""
    echo "The shared config includes:"
    echo "- ESLint with Airbnb config"
    echo "- Prettier with import sorting"
    echo "- TypeScript strict configuration"
    echo "- Automated import sorting"
    echo "- JSON sorting"
    echo "- Consistent code style across all packages"
end

# Run the setup function
add_shared_config
