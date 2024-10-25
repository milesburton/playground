#!/usr/bin/env fish

function setup_monorepo
    # Check if pnpm is installed
    if not type -q pnpm
        echo "Installing pnpm..."
        npm install -g pnpm
    end

    # Get project name from argument or use default
    set project_name $argv[1]
    if test -z "$project_name"
        set project_name "ts-monorepo"
    end

    # Create project directory
    mkdir $project_name
    cd $project_name

    # Initialize git
    git init
    
    # Create root package.json
    pnpm init
    
    # Add workspaces configuration to package.json
    set -l package_content '{
  "name": "'$project_name'",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "workspaces": [
    "packages/*"
  ]
}'
    echo $package_content > package.json

    # Create packages directory
    mkdir -p packages/{common,server,client}

    # Install core dependencies
    pnpm add -D typescript @types/node turbo prettier eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

    # Create turbo.json
    set -l turbo_content '{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**/*.tsx", "src/**/*.ts", "test/**/*.ts", "test/**/*.tsx"]
    }
  }
}'
    echo $turbo_content > turbo.json

    # Create root tsconfig.json
    set -l tsconfig_content '{
  "compilerOptions": {
    "target": "es2019",
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "references": [
    { "path": "packages/common" },
    { "path": "packages/server" },
    { "path": "packages/client" }
  ],
  "exclude": ["node_modules"]
}'
    echo $tsconfig_content > tsconfig.json

    # Initialize each package
    for package in common server client
        cd packages/$package
        
        # Initialize package.json
        set -l pkg_content '{
  "name": "@'$project_name'/'$package'",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "tsc",
    "dev": "tsc -w",
    "lint": "eslint src/**/*.ts",
    "test": "jest",
    "clean": "rm -rf dist"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts"
}'
        echo $pkg_content > package.json

        # Create package-specific tsconfig.json
        set -l pkg_tsconfig '{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}'
        echo $pkg_tsconfig > tsconfig.json

        # Create source directory and sample file
        mkdir -p src
        echo 'export const hello = () => "Hello from '$package'";' > src/index.ts

        cd ../../
    end

    # Create .gitignore
    echo "node_modules
.turbo
dist
coverage
.env
.env.*
!.env.example" > .gitignore

    # Create .prettierrc
    echo '{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false
}' > .prettierrc

    # Create .eslintrc.js
    echo 'module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "plugin:@typescript-eslint/recommended"
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module"
  },
  rules: {}
};' > .eslintrc.js

    # Install package dependencies
    pnpm install

    echo "Monorepo setup complete! 🎉"
    echo "To get started:"
    echo "cd $project_name"
    echo "pnpm build"
end

# Run the setup function with the provided project name
setup_monorepo $argv[1]

