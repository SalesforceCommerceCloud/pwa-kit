# Template Drift Detection System

A simple system to detect when source files in `packages/template-retail-react-app/` have been updated more recently than their corresponding Handlebars template files in `packages/pwa-kit-create-app/assets/`.

## Problem Statement

The PWA Kit create-app generator uses Handlebars (`.hbs`) template files that correspond to source files in `template-retail-react-app`. These template files:
- Contain unique Handlebars placeholders and logic
- May have additional code not present in source files  
- Need manual review when source files change
- Can drift out of sync without developers noticing

## Solution

A **drift detection system** that:
1. **Compares git commit timestamps** between source files and template files
2. **Alerts developers** when source files are newer than templates
3. **Provides clear guidance** on which files need review
4. **Integrates with CI/CD** to catch drift early

## Files

- `detect-template-drift.js` - Main drift detection script
- `template-drift-config.json` - Configuration defining file mappings
- `.github/workflows/detect-template-drift.yml` - GitHub Actions workflow

## Usage

### Command Line

```bash
# Check for drift with detailed output
node scripts/detect-template-drift.js --verbose

# Quiet mode (only shows drift and errors)
node scripts/detect-template-drift.js
```

### NPM Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "check-template-drift": "node scripts/detect-template-drift.js --verbose"
  }
}
```

## How It Works

### 1. Git Commit Time Comparison

The script uses `git log` to find the last commit time for each file:

```bash
# For each source file and template file
git log -1 --format="%ct" -- "path/to/file"
```

### 2. Drift Detection Logic

```
IF source_commit_time > template_commit_time:
    THEN drift detected → needs manual review
ELSE:
    Template is up to date
```

### 3. Clear Reporting

```
⚠️  Template drift detected in 2 file(s):

📄 app/ssr.js
   Server-side rendering configuration with SLAS and security headers
   Last modified: 2023-12-15T10:30:00.000Z
   Templates that need review:
     🔄 retail/app/ssr.js.hbs
        Template last updated: 2023-12-10T14:20:00.000Z
        Template is 5 day(s) behind source
```

## Monitored Files

| Source File | Template Locations | Description |
|-------------|-------------------|-------------|
| `app/ssr.js` | `ssr.js.hbs` (both locations) | Server-side rendering config |
| `config/default.js` | `default.js.hbs` (both locations) | Main app configuration |
| `config/sites.js` | `sites.js.hbs` (both locations) | Site configuration |
| `config/utils.js` | `utils.js.hbs` (both locations) | Configuration utilities |
| `app/static/manifest.json` | `manifest.json.hbs` (both locations) | PWA manifest |
| `app/components/_app-config/index.jsx` | `index.jsx.hbs` (both locations) | App config component |
| `app/constants.js` | `constants.js.hbs` (bootstrap only) | App constants |
| `app/routes.jsx` | `routes.jsx.hbs` (bootstrap only) | Routing config |
| `app/pages/home/index.jsx` | `index.jsx.hbs` (bootstrap only) | Home page |

## CI/CD Integration

### GitHub Actions Workflow

The workflow automatically:

**On Pull Requests:**
- Detects drift and posts informative comments
- Provides clear steps to resolve issues
- **Does NOT fail the PR** - just notifies

**On Push to main/develop:**
- Shows warnings if drift is detected
- Reminds maintainers to review templates

**Manual Trigger:**
- Can be run on-demand via GitHub Actions UI

### Example PR Comment

```
⚠️ Template Drift Detection

Status: Template drift detected - manual review needed

⚠️ Action Required:

Your changes to template-retail-react-app source files may require 
corresponding updates to the .hbs template files in pwa-kit-create-app.

Steps to resolve:
1. Review the source file changes in your PR
2. Check the corresponding .hbs template files
3. Manually update template files if needed (preserve Handlebars placeholders!)
4. Test with pwa-kit-create-app to ensure templates work correctly
```

## Adding New Files

To monitor additional files, update `template-drift-config.json`:

```json
{
  "source": "path/to/new/source/file.js",
  "description": "Brief description of what this file does",
  "templates": [
    {
      "templateDir": "retail",
      "destination": "path/to/template.js.hbs"
    },
    {
      "templateDir": "bootstrap", 
      "destination": "path/to/bootstrap/template.js.hbs"
    }
  ]
}
```

## Manual Review Process

When drift is detected:

1. **Review source changes**: Look at what changed in the source file
2. **Check template files**: Open the corresponding `.hbs` files
3. **Update templates**: Apply similar changes while preserving:
   - Handlebars placeholders (`{{answers.project.name}}`)
   - Conditional blocks (`{{#if condition}}...{{/if}}`)
   - Template-specific code
4. **Test**: Generate a project with `pwa-kit-create-app` to verify

## Example Template Updates

### Source Change
```javascript
// packages/template-retail-react-app/config/default.js
defaultSite: 'RefArchGlobal'
```

### Template Update
```javascript
// packages/pwa-kit-create-app/assets/.../default.js.hbs
defaultSite: '{{answers.project.commerce.siteId}}'
```

## Benefits

✅ **Early Detection**: Catch drift before it becomes a problem  
✅ **Non-Blocking**: Doesn't prevent development, just notifies  
✅ **Clear Guidance**: Tells developers exactly what to do  
✅ **Automated**: Runs automatically on every relevant change  
✅ **Simple**: Easy to understand and maintain  

## Troubleshooting

### "Could not determine commit time"
- File might not be tracked by git
- Check that the file path is correct in the config

### "Source file does not exist"
- Verify the source path in `template-drift-config.json`
- Ensure the file exists in `template-retail-react-app`

### "Template file missing"
- Template file hasn't been created yet
- Create the corresponding `.hbs` file manually

### No drift detected when expected
- Check that both files are committed to git
- Verify the file paths in the configuration
- Use `--verbose` flag for detailed output

## Best Practices

1. **Review promptly**: Address drift notifications quickly
2. **Test thoroughly**: Always test generated projects after template updates
3. **Preserve placeholders**: Don't accidentally remove Handlebars syntax
4. **Document changes**: Update template comments when making significant changes
5. **Coordinate updates**: If multiple people work on templates, communicate changes

This system ensures template files stay synchronized with their source files while respecting the unique nature of Handlebars templates.
