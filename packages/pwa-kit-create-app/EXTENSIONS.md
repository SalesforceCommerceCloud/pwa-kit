# PWA Kit Extension Management System

This document demonstrates the PWA Kit Extension Management system, which provides automated tools for discovering, installing, and managing extensions in Salesforce Commerce Cloud PWA Kit projects.

## Overview

The PWA Kit Extension Management system consists of two main components:

1. **MCP Server** - A Model Context Protocol server that provides extension management tools
2. **PWA Kit Project** - Your storefront application where extensions are installed

The system enables developers to easily discover and install pre-built extensions for enhanced commerce functionality.

## Quick Start

### 1. Set Up the MCP Server

The MCP server is hosted at [https://github.com/kzheng-sfdc/pwa-mcp](https://github.com/kzheng-sfdc/pwa-mcp/tree/master) and provides the backend tools for extension management.

#### Installation

```bash
git clone git@github.com:kzheng-sfdc/pwa-mcp.git
cd pwa-mcp
npm install
```

#### Configuration

Configure the server in your `~/.cursor/mcp.json`:

```json
{
    "pwa": {
        "command": "node",
        "args": ["/path/to/pwa-mcp/build/index.js"],
        "env": {
            "GIT_REF": "SalesforceCommerceCloud/pwa-kit/heads/develop"
        }
    }
}
```

#### Environment Variables

-   `GIT_REF`: Path to the git reference (required)
    -   Format: `"user/repo/branch"`
    -   Example: `"SalesforceCommerceCloud/pwa-kit/heads/develop"`
-   `PLUGIN_CONFIG_PATH`: Path to plugin configuration file (optional)
    -   Default: `"packages/pwa-kit-create-app/assets/plugin-config.js"`
-   `INSTRUCTIONS_PATH`: Path to installation instructions (optional)
    -   Default: `"packages/pwa-kit-create-app/instructions"`

### 2. Use MCP Tools in Your Project

The MCP server provides three main tools:

#### `get-extension-list`

Returns a list of available PWA Kit extensions.

**Usage:**

```javascript
// Returns an array of available extension names
await getExtensionList()
```

#### `install-extension`

Installs a specified extension by name.

**Usage:**

```javascript
// Installs the specified extension
await installExtension('Extension Name')
```

#### `uninstall-extension`

Uninstalls a specified extension by name.

**Usage:**

```javascript
// Uninstalls the specified extension
await uninstallExtension('Extension Name')
```

## Extension Installation Workflow

### General Extension Installation Process

This section demonstrates the complete workflow for installing any PWA Kit extension through the automated system.

#### Step 1: Discover Available Extensions

```bash
# Use the get-extension-list tool
# Returns: Array of available extension names
```

#### Step 2: Install the Extension

```bash
# Use the install-extension tool with the desired extension name
# This triggers the automated installation process defined in <extension-name>.mdc
```

#### Step 3: Automated Installation Process

The MCP tools automatically perform some or all of the following types of tasks

1. **Validates Project Structure**

    - Confirms required directories exist (e.g., `components`, `pages`)
    - Verifies target integration files are present
    - Checks for necessary dependencies
    - Adds new UI components to page output / default React component return block

2. **Clones Source Repository**

    ```bash
    mkdir /tmp/pwa-kit-tmp
    git clone -b develop https://github.com/SalesforceCommerceCloud/pwa-kit /tmp/pwa-kit-tmp
    ```

3. **Copies Extension Components**

    ```bash
    # Extension-specific components and assets are copied to the project
    cp -r /tmp/pwa-kit-tmp/packages/template-chakra-storefront/components/[extension-name] \
          packages/template-chakra-storefront/components/
    ```

4. **Updates Application Code**
   The system applies automated code changes to integrate the extension:

    **Import Statements:**

    ```javascript
    // Required dependencies are added
    import loadable from '@loadable/component'
    import SomeExtensionDependency from 'package-name'
    ```

    **Component Declarations:**

    ```javascript
    // Extension components are loaded dynamically
    const ExtensionComponent = loadable(() => import('../../components/[extension-name]'))
    ```

    **Integration Points:**

    ```javascript
    // Extensions are integrated at predefined locations
    return (
        <Box data-testid="page" layerStyle="page">
            <Seo {...seoProps} />

            {/* Extension components added at designated integration points */}
            <ExtensionComponent />

            <ExistingComponent>{/* Existing application content */}</ExistingComponent>
        </Box>
    )
    ```

5. **Cleanup**
    ```bash
    rm -rf /tmp/pwa-kit-tmp
    ```

### Installation Result

After installation, extensions typically provide:

-   **New Components** - React components added to designated pages
-   **Enhanced Functionality** - Additional features integrated into the storefront
-   **Configuration Options** - Customizable settings and parameters
-   **Styling Integration** - Components that match the existing design system

## Project Structure

```
packages/template-chakra-storefront/
├── components/
│   ├── [extension-name]/             # ✅ Installed extension components
│   │   ├── index.jsx                 # Main extension component
│   │   └── [additional-files]        # Supporting files and assets
│   ├── hero/
│   ├── seo/
│   └── ...
├── pages/
│   ├── home/
│   │   └── index.jsx                 # ✅ Updated with extension integration
│   └── ...
└── ...
```

## Extension Selection and Tree-Shaking

### Project Generation Process

When creating a new PWA Kit project using `npx @salesforce/pwa-kit-create-app`, developers can select which extensions to include in their storefront. This selection process ensures that only the desired functionality is included in the final project.

#### Extension Selection

During project creation, the generator provides an interactive selection interface:

1. **Presents Available Extensions** - Shows all available extensions from the plugin configuration
2. **Interactive Checkbox Prompt** - Displays a checkbox interface asking "Which extensions would you like to enable?"
3. **User Selection** - Developers can check/uncheck boxes to select desired extensions
4. **Generates Plugin Configuration** - Creates a configuration object with selected extensions enabled

```bash
# Example interactive prompt during project creation
? Which extensions would you like to enable?
❯◉ Store Locator Extension
 ◯ Data Cloud Integration Extension
```

#### Tree-Shaking Process

After extension selection, the system performs automated tree-shaking to remove unused code:

**1. Code Analysis**

-   Scans all source files for extension references
-   Identifies conditional code blocks guarded by extension flags
-   Analyzes import statements and component declarations

**2. Dead Code Removal**

-   Removes unused component declarations:

    ```javascript
    // Before tree-shaking
    const ExtensionComponent = SFDC_EXT_FOO_ENABLED && loadable(() => import('./extension'))

    // After tree-shaking (if SFDC_EXT_FOO_ENABLED = false)
    // Line is completely removed
    ```

-   Eliminates conditional JSX expressions:

    ```javascript
    // Before tree-shaking
    {
        SFDC_EXT_FOO_ENABLED && <ExtensionComponent />
    }

    // After tree-shaking (if SFDC_EXT_FOO_ENABLED = false)
    // Expression is removed from JSX
    ```

-   Cleans up unused imports and files:

    ```javascript
    // Before tree-shaking
    import ExtensionDependency from 'extension-package'

    // After tree-shaking (if extension unused)
    // Import statement is removed
    ```

**3. File System Cleanup**

-   Identifies unused component files and directories
-   Removes extension components that are no longer referenced
-   Deletes associated assets and supporting files

#### Benefits of Tree-Shaking

This automated process provides several advantages:

-   **Reduced Bundle Size** - Only selected extensions are included in the final build
-   **Improved Performance** - Eliminates unused code that would otherwise be loaded
-   **Clean Codebase** - Removes clutter from unused extension references
-   **Maintainability** - Keeps the project focused on selected functionality

#### Extension Flag Pattern

Extensions use a consistent pattern for conditional inclusion:

```javascript
// Component declaration with feature flag
const ExtensionComponent = SFDC_EXT_FOO_ENABLED && loadable(() => import('./extension'))

// JSX integration with feature flag
return (
    <Box>
        {SFDC_EXT_FOO_ENABLED && <ExtensionComponent />}
        <ExistingComponent />
    </Box>
)

// Conditional imports
import { OptionalFeature } from SFDC_EXT_FOO_ENABLED ? 'extension-package' : 'fallback-package'
```

This pattern ensures that the tree-shaking process can reliably identify and remove unused code while preserving the functionality of selected extensions.

## Technical Details

### Extension Architecture

Extensions follow a standardized structure:

1. **Component Files** - React components in `components/[extension-name]/`
2. **Installation Instructions** - Automated setup procedures
3. **Configuration** - Environment variables and feature flags
4. **Integration Points** - Predefined locations in the application

### Code Integration

Extensions integrate with the PWA Kit using:

-   **Loadable Components** - For code splitting and performance
-   **Feature Flags** - For conditional rendering
-   **Standardized Imports** - Consistent import patterns
-   **Component Composition** - Extensions fit into existing layouts

### Security Considerations

-   Extensions are sourced from trusted repositories
-   Installation procedures are predefined and reviewed
-   No arbitrary code execution
-   Temporary files are cleaned up after installation

## Development

### Adding New Extensions

To add a new extension:

1. Create extension components in the source repository
2. Add configuration to `plugin-config.js`
3. Create installation instructions
4. Update the extension list

### Testing Extensions

Extensions should be tested for:

-   Component functionality
-   Integration with existing code
-   Performance impact
-   Accessibility compliance
-   Mobile responsiveness

## Troubleshooting

### Common Issues

1. **Project Structure Validation Failed**

    - Ensure required directories exist in your project
    - Verify target integration files are present
    - Check that your project follows PWA Kit conventions

2. **Installation Errors**

    - Check network connectivity
    - Verify Git repository access
    - Confirm write permissions

3. **Component Not Appearing**
    - Check import paths
    - Verify component export
    - Confirm JSX integration

### Logs

Server logs are available at `/tmp/pwa-mcp.log` for debugging.

## License

MIT License - See LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions:

-   GitHub Issues: [PWA Kit Issues](https://github.com/SalesforceCommerceCloud/pwa-kit/issues)
-   MCP Server Issues: [PWA MCP Issues](https://github.com/kzheng-sfdc/pwa-mcp/issues)
-   Documentation: [PWA Kit Documentation](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/)

---

**Note**: This system is designed for Salesforce Commerce Cloud PWA Kit projects. Ensure your project is compatible before installing extensions.
