# Template File Synchronization System

This system automatically synchronizes source files from `packages/template-retail-react-app/` with their corresponding Handlebars template files in `packages/pwa-kit-create-app/assets/`.

## Problem Statement

The PWA Kit create-app generator uses Handlebars (`.hbs`) template files to generate new projects. These templates need to stay in sync with the source files in `template-retail-react-app`, but this was previously a manual process prone to drift and human error.

## Solution

An automated synchronization system that:
1. **Detects changes** between source files and template files
2. **Applies transformations** to inject Handlebars placeholders appropriately  
3. **Updates template files** in both template locations (`@salesforce/retail-react-app` and `bootstrap`)
4. **Validates** the synchronization through CI/CD

## Files

- `sync-template-files.js` - Main synchronization script
- `sync-template-config.json` - Configuration defining file mappings and transformations
- `.github/workflows/sync-templates.yml` - GitHub Actions workflow for automation

## Usage

### Command Line

```bash
# Check for drift without making changes
node scripts/sync-template-files.js --check-only --verbose

# Apply synchronization
node scripts/sync-template-files.js --verbose

# Quiet mode (only shows errors and summary)
node scripts/sync-template-files.js
```

### Options

- `--check-only` - Only check for drift, don't write changes
- `--verbose` - Show detailed output including unchanged files

### NPM Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "sync-templates": "node scripts/sync-template-files.js",
    "sync-templates:check": "node scripts/sync-template-files.js --check-only --verbose"
  }
}
```

## How It Works

### 1. File Mapping

The `sync-template-config.json` file defines:
- Which source files map to which template files
- What transformations to apply during synchronization
- Where template files should be written

### 2. Transformations

The system applies transformations to convert source code to Handlebars templates:

```javascript
// Source file
"defaultSite: 'RefArchGlobal'"

// Becomes template
"defaultSite: '{{answers.project.commerce.siteId}}'"
```

### 3. Change Detection

Uses MD5 hashing to detect when transformed source content differs from existing template files.

### 4. CI/CD Integration

The GitHub Actions workflow:
- **On PRs**: Checks for drift and fails if templates are out of sync
- **On pushes to main/develop**: Auto-commits synchronized templates  
- **Posts comments**: Provides helpful feedback on PRs

## Mapped Files

| Source File | Template Locations | Key Transformations |
|-------------|-------------------|-------------------|
| `app/ssr.js` | `ssr.js.hbs` (both locations) | SLAS private client, CSP config |
| `config/default.js` | `default.js.hbs` (both locations) | Commerce API config, feature flags |
| `config/sites.js` | `sites.js.hbs` (both locations) | Site configuration |
| `config/utils.js` | `utils.js.hbs` (both locations) | Utility functions |
| `app/static/manifest.json` | `manifest.json.hbs` (both locations) | App name templating |
| `app/components/_app-config/index.jsx` | `index.jsx.hbs` (both locations) | App configuration component |

## Adding New Files

To add a new file to synchronization:

1. **Add mapping** to `sync-template-config.json`:
```json
{
  "source": "path/to/source/file.js",
  "targets": [
    {
      "templateDir": "retail",
      "destination": "path/to/template/file.js.hbs"
    },
    {
      "templateDir": "bootstrap", 
      "destination": "path/to/bootstrap/file.js.hbs"
    }
  ],
  "transformations": [
    {
      "type": "replace",
      "pattern": "hardcoded-value",
      "replacement": "{{answers.project.configValue}}"
    }
  ]
}
```

2. **Test the mapping**:
```bash
node scripts/sync-template-files.js --check-only --verbose
```

3. **Apply if correct**:
```bash
node scripts/sync-template-files.js
```

## Transformation Types

### `replace`
Simple find-and-replace with Handlebars template:
```json
{
  "type": "replace",
  "pattern": "clientId: 'c9c45bfd-0ed3-4aa2-9971-40f88962b836'",
  "replacement": "clientId: '{{answers.project.commerce.clientId}}'"
}
```

### `conditional_replace`
Replace with Handlebars conditional blocks:
```json
{
  "type": "conditional_replace", 
  "pattern": "useSLASPrivateClient: false",
  "replacement": "useSLASPrivateClient: {{answers.project.commerce.isSlasPrivate}}"
}
```

### `inject_handlebars`
Inject complex Handlebars logic:
```json
{
  "type": "inject_handlebars",
  "pattern": "existing-code-block",
  "replacement": "{{#if condition}}...{{else}}...{{/if}}"
}
```

## Troubleshooting

### "Template file does not exist"
The target template file hasn't been created yet. The script will create it automatically.

### "Content differs from source"
The template file exists but doesn't match the transformed source. This is expected when files are out of sync.

### "Error reading files"
Check that source files exist and are readable. Verify paths in the configuration.

### "Configuration validation failed"
Check `sync-template-config.json` for syntax errors or missing required fields.

## Best Practices

1. **Test first**: Always use `--check-only` to see what will change
2. **Review changes**: Check the diff before committing synchronized templates
3. **Update incrementally**: Add one file mapping at a time when expanding the system
4. **Handle edge cases**: Complex source files may need custom transformation logic
5. **Validate templates**: Test generated projects after synchronization

## Integration with Development Workflow

### During Development
```bash
# After making changes to source files
npm run sync-templates:check  # See what needs updating
npm run sync-templates        # Apply the updates
git add . && git commit -m "sync: update template files"
```

### In CI/CD
The GitHub Actions workflow automatically:
- Prevents merging PRs with unsynchronized templates
- Auto-syncs on pushes to main branches
- Provides helpful feedback to developers

This ensures template files never drift from their source of truth.
