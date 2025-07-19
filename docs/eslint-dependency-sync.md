# ESLint Centralized Setup

## Problem

In monorepos, ESLint plugins installed in individual packages can cause IDE integration issues because plugins cannot be resolved across package boundaries.

## Solution

**Centralized ESLint Dependencies**: All ESLint plugins and related dependencies are installed at the **root level** in the main `package.json` devDependencies.

## How It Works

- **Single Installation Point**: All ESLint dependencies in root `package.json`
- **Node.js Resolution**: Individual packages find plugins via Node.js module resolution
- **No Duplication**: No need to install ESLint plugins in individual template packages
- **Automatic Discovery**: IDEs automatically find plugins from the root node_modules

## ESLint Dependencies (Root Level)

All packages use these centrally installed dependencies:

```json
{
  "devDependencies": {
    "eslint": "^8.37.0",
    "@typescript-eslint/eslint-plugin": "^5.57.0",
    "@typescript-eslint/parser": "^5.57.0",
    "eslint-config-prettier": "8.8.0",
    "eslint-plugin-jest": "^27.2.1",
    "eslint-plugin-jsx-a11y": "6.7.1",
    "eslint-plugin-prettier": "4.2.1",
    "eslint-plugin-react": "^7.32.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-use-effect-no-deps": "^1.1.2",
    "prettier": "^2.8.6"
  }
}
```

## Maintenance Workflow

### Adding New ESLint Plugins

1. Add to root `package.json` devDependencies
2. Run `npm install` from root
3. Plugin is automatically available to all packages

### Updating ESLint Plugin Versions

1. Update version in root `package.json`
2. Run `npm install` from root  
3. All packages use the updated version

### Verification

```bash
# Check for version mismatches across packages
npm run check-dep-version
```

## Benefits

- ✅ **Simple maintenance** - single location for all ESLint dependencies
- ✅ **No duplication** - dependencies installed once at root
- ✅ **Automatic IDE support** - plugins discoverable from root
- ✅ **Version consistency** - impossible to have version conflicts
- ✅ **Clean package.json** files in individual packages
- ✅ **Faster installs** - no duplicate dependency downloads 