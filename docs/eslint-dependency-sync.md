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
- **Automatic Sync**: ESLint dependencies are automatically synced from `pwa-kit-dev` to root before install

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

1. Add to `packages/pwa-kit-dev/package.json` devDependencies (source of truth)
2. Run `npm run sync-eslint-to-root` (or happens automatically before `npm install`)
3. Plugin is automatically available to all packages

### Updating ESLint Plugin Versions

1. Update version in `packages/pwa-kit-dev/package.json`  
2. Run `npm run sync-eslint-to-root` to sync to root
3. Run `npm install` to update node_modules

### Verification

```bash
# Sync ESLint dependencies from pwa-kit-dev to root (runs automatically before npm install)
npm run sync-eslint-to-root

# Check for version mismatches across packages  
npm run check-dep-version
```

## Benefits

- ✅ **Simple maintenance** - `pwa-kit-dev` is the single source of truth
- ✅ **No duplication** - dependencies installed once at root
- ✅ **Automatic IDE support** - plugins discoverable from root
- ✅ **Version consistency** - impossible to have version conflicts
- ✅ **Clean package.json** files in individual packages
- ✅ **Faster installs** - no duplicate dependency downloads
- ✅ **Automatic sync** - dependencies synced before install for perfect timing 