# ESLint Dependency Synchronization

## Problem

In this monorepo, ESLint plugins are installed in `@salesforce/pwa-kit-dev` but used by other packages like `template-retail-react-app`. This causes IDE integration issues because ESLint plugins cannot be resolved across package boundaries in monorepos.

## Solution

We maintain ESLint plugins in both locations:
- **Source of Truth**: `packages/pwa-kit-dev/package.json` (dependencies and devDependencies)  
- **IDE Compatibility**: `packages/template-retail-react-app/package.json` (devDependencies only)

## Automated Synchronization

### 1. Custom Sync Script

```bash
npm run sync-eslint-deps
```

This script:
- Reads ESLint-related dependencies from `pwa-kit-dev`
- Updates `template-retail-react-app` devDependencies to match
- Reports what was added, updated, or removed
- Runs automatically during `npm install` (postinstall hook)

### 2. Syncpack Configuration

```bash
npm run check-dep-version  # Check for version mismatches
npm run fix-dep-version    # Fix version mismatches automatically
```

The `syncpack.config.js` ensures ESLint dependency versions stay in sync between packages.

## ESLint Dependencies Managed

The following dependency patterns are automatically synchronized:

- `@typescript-eslint/*`
- `eslint`
- `eslint-*` (all eslint plugins)
- `prettier`

## Maintenance Workflow

### When Adding New ESLint Plugins

1. Add the plugin to `packages/pwa-kit-dev/package.json`
2. Run `npm run sync-eslint-deps` (or it will run automatically on next install)
3. Commit both package.json files

### When Updating ESLint Plugin Versions

1. Update versions in `packages/pwa-kit-dev/package.json`
2. Run `npm run sync-eslint-deps`
3. Run `npm install` to update lockfiles
4. Commit changes

### Verification

```bash
# Check that dependencies are in sync
npm run check-dep-version

# If mismatches are found, fix them
npm run fix-dep-version

# Or manually sync ESLint deps
npm run sync-eslint-deps
```

## Files Involved

- `syncpack.config.js` - Syncpack configuration for version management
- `scripts/sync-eslint-deps.js` - Custom script for dependency synchronization  
- `packages/pwa-kit-dev/package.json` - Source of truth for ESLint dependencies
- `packages/template-retail-react-app/package.json` - Contains synced ESLint devDependencies

## Benefits

- ✅ **No manual IDE configuration** required
- ✅ **Automatic synchronization** during install
- ✅ **Version consistency** across packages
- ✅ **Clear source of truth** for ESLint dependencies
- ✅ **Easy maintenance** with automated scripts 