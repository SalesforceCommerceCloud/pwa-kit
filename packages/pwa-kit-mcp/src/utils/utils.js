/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import os from 'os'
import {spawn} from 'cross-spawn'
import {z} from 'zod'
import {execSync} from 'child_process'

// CONSTANTS
const CREATE_APP_VERSION = 'latest'

// Private schema used to generate the JSON schema
export const EmptyJsonSchema = z.object({}).strict().toJSONSchema()

/**
 * Converts a string to PascalCase (e.g., product-card -> ProductCard)
 */
export const toPascalCase = (str) =>
    str.replace(/(^\w|[-_\s]\w)/g, (match) => match.replace(/[-_\s]/, '').toUpperCase())

/**
 * Runs a shell command and captures its stdout/stderr as a string.
 *
 * @param {string} command - The executable to run (e.g. "node", "npx", "ls").
 * @param {string[]} args - Arguments to pass to the command.
 * @param {Object} [options] - Optional spawn options (e.g. cwd).
 * @returns {Promise<string>} - Resolves with combined stdout and stderr.
 */
export const runCommand = async (command, args = [], options = {}) => {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            ...options,
            stdio: ['ignore', 'pipe', 'pipe'], // ignore stdin, pipe out/err
            shell: false // be explicit — set to true if you want shell features
        })

        let output = ''

        child.stdout.on('data', (chunk) => {
            output += chunk.toString()
        })

        child.stderr.on('data', (chunk) => {
            output += chunk.toString() // combine stderr into output
        })

        child.on('error', (err) => {
            reject(err)
        })

        child.on('close', (code) => {
            if (code === 0) {
                resolve(output)
            } else {
                const error = new Error(`Command failed with exit code ${code}`)
                error.output = output
                error.code = code
                reject(error)
            }
        })
    })
}

/**
 * Checks if the project is a monorepo by verifying the existence of lerna.json in the root directory.
 *
 * @returns {boolean} True if lerna.json exists in the current workspace, false otherwise.
 */
export function isMonoRepo() {
    const lernaPath = path.resolve(
        ...(process.env.WORKSPACE_FOLDER_PATHS ? [process.env.WORKSPACE_FOLDER_PATHS] : []),
        'lerna.json'
    )
    return fs.existsSync(lernaPath)
}

/**
 * Check if the component is the base component under node_modules/@salesforce/retail-react-app/app/components
 *
 * @param {string} componentName - The name of the component to check.
 * @param {string} nodeModulesPath - The absolute path to the node_modules directory.
 * @returns {boolean} True if the component is the base component, false otherwise.
 */
export const isBaseComponent = (componentName, nodeModulesPath) => {
    const baseComponentPath = path.join(
        nodeModulesPath,
        '@salesforce/retail-react-app/app/components',
        componentName
    )
    return fs.existsSync(baseComponentPath)
}

/**
 * Check if the component is the shared UI base component under node_modules/@salesforce/retail-react-app/app/components/shared/ui
 *
 * @param {string} componentName - The name of the component to check.
 * @param {string} nodeModulesPath - The absolute path to the node_modules directory.
 * @returns {boolean} True if the component is the shared UI base component, false otherwise.
 */
export const isSharedUIBaseComponent = (componentName, nodeModulesPath) => {
    const baseComponentPath = path.join(
        nodeModulesPath,
        '@salesforce/retail-react-app/app/components/shared/ui',
        componentName
    )
    return fs.existsSync(baseComponentPath)
}

/**
 * Check if the component is the local component under components folder
 *
 * @param {string} componentName - The name of the component to check.
 * @param {string} componentsPath - The absolute path to the components directory.
 * @returns {boolean} True if the component is the local component, false otherwise.
 */
export const isLocalComponent = (componentName, componentsPath) => {
    const localComponentPath = path.join(componentsPath, componentName)
    return fs.existsSync(localComponentPath)
}

/**
 * Check if the component is a local shared UI component under components/shared/ui folder
 *
 * @param {string} componentName - The name of the component to check.
 * @param {string} componentsPath - The absolute path to the components directory.
 * @returns {boolean} True if the component is a local shared UI component, false otherwise.
 */
export const isLocalSharedUIComponent = (componentName, componentsPath) => {
    const localSharedUIComponentPath = path.join(componentsPath, 'shared', 'ui', componentName)
    return fs.existsSync(localSharedUIComponentPath)
}

/**
 * Returns the command or path to use for creating a new PWA Kit app.
 *
 * If the project is a monorepo (detected by the presence of lerna.json),
 * it returns the absolute path to the local create-mobify-app.js script.
 * Otherwise, it returns the npm package name with a specific version.
 *
 * @returns {string} The command or path to use for app creation.
 */
export const getCreateAppCommand = () => {
    return isMonoRepo()
        ? path.resolve(
              `${process.env.WORKSPACE_FOLDER_PATHS}/packages/pwa-kit-create-app/scripts/create-mobify-app.js`
          )
        : `@salesforce/pwa-kit-create-app@${CREATE_APP_VERSION}`
}

/**
 * Converts a string to kebab-case (e.g., ProductCard -> product-card)
 */
export function toKebabCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/\s+/g, '-')
        .toLowerCase()
}

/**
 * Logs a message to the mcp-debug.log file in the current directory.
 * @param {string} message - The message to log.
 */
export async function logMCPMessage(message) {
    if (process.env.DEBUG) {
        // Check if DEBUG mode is enabled
        const logFilePath = path.join(__dirname, 'mcp-debug.log')
        const timestamp = new Date().toLocaleString('en-US', {timeZone: 'GMT'})
        const logMessage = `[${timestamp}] ${message}\n`
        try {
            // Ensure the log file exists, create it if it doesn't
            await fsPromises.access(logFilePath).catch(async () => {
                await fsPromises.writeFile(logFilePath, '', 'utf8')
            })
            await fsPromises.appendFile(logFilePath, logMessage, 'utf8')
        } catch (error) {
            console.error(`Failed to write to log file: ${error.message}`)
        }
    }
}

export async function detectWorkspacePaths() {
    let appPath = process.env.PWA_STOREFRONT_APP_PATH

    if (appPath) {
        try {
            await fsPromises.access(appPath)
        } catch (error) {
            // no env path variable
            appPath = null
        }
    }

    // Prompt user if detection failed
    if (!appPath) {
        throw new Error(
            "Could not detect PWA Kit project directory. Please either:\n1. Navigate to your PWA Kit project directory, or\n2. Set PWA_STOREFRONT_APP_PATH environment variable to your project's app directory path."
        )
    }

    // Build paths relative to the detected app directory
    const pagesPath = path.join(appPath, 'pages')
    const componentsPath = path.join(appPath, 'components')
    const routesPath = path.join(appPath, 'routes.jsx')
    const nodeModulesPath = path.join(appPath, '../../', 'node_modules')
    const hasOverridesDir = fs.existsSync(path.join(appPath, '../../', 'overrides'))

    // Verify essential directories exist
    if (!fs.existsSync(pagesPath)) {
        throw new Error(`Pages directory not found at: ${pagesPath}`)
    }
    if (!fs.existsSync(componentsPath)) {
        throw new Error(`Components directory not found at: ${componentsPath}`)
    }
    if (!fs.existsSync(routesPath)) {
        throw new Error(`Routes file not found at: ${routesPath}`)
    }

    return {
        pagesPath,
        componentsPath,
        routesPath,
        nodeModulesPath,
        hasOverridesDir
    }
}

/**
 * Returns the import statement for a component
 * @param {string} componentName - The name of the component to import.
 * @param {string} componentDir - The directory of the component to import.
 * @param {boolean} isLocal - Whether the component is a local component.
 * @param {boolean} isBase - Whether the component is a base component.
 * @param {Object} absolutePaths - Object containing absolute paths for components and pages.
 * @param {string} absolutePaths.componentsPath - The absolute path to the components directory.
 * @param {string} absolutePaths.pagesPath - The absolute path to the pages directory.
 * @param {boolean} hasOverridesDir - Whether ccExtensibility.overridesDir is set in package.json.
 * @returns {string} The import statement for the component.
 */
export function generateComponentImportStatement(
    componentName,
    componentDir,
    isLocal,
    isBase,
    absolutePaths,
    hasOverridesDir
) {
    const relativePath = path.relative(
        path.join(absolutePaths.pagesPath, 'dummy'), // dummy file to get parent directory
        path.join(absolutePaths.componentsPath, componentDir)
    )

    if ((!hasOverridesDir && isLocal) || isBase) {
        return `import ${componentName} from '@salesforce/retail-react-app/app/components/${componentDir}'`
    }
    // Use local relative path for other cases
    // Normalize path separators to forward slashes for ES6 imports
    const normalizedPath = relativePath.replace(/\\/g, '/')
    return `import ${componentName} from '${normalizedPath}'`
}

/**
 * Finds the dw.json configuration file in the following priority order:
 * 1. Global DW_JSON_PATH (if set)
 * 2. PWA_STOREFRONT_APP_PATH/dw.json (if PWA_STOREFRONT_APP_PATH exists)
 * 3. PWA_STOREFRONT_APP_PATH/../dw.json (parent directory)
 * 4. PWA_STOREFRONT_APP_PATH/../../dw.json (grandparent directory)
 * 5. Current working directory/dw.json
 *
 * @returns {string|null} The path to the dw.json file, or null if not found
 */
export const findDwJsonPath = () => {
    // Check global path
    const configFromGlobalPath = global.DW_JSON_PATH
    if (configFromGlobalPath && fs.existsSync(configFromGlobalPath)) {
        return configFromGlobalPath
    }

    // Check PWA_STOREFRONT_APP_PATH and its parent directories
    if (process.env.PWA_STOREFRONT_APP_PATH) {
        const storefrontPath = process.env.PWA_STOREFRONT_APP_PATH

        // Check PWA_STOREFRONT_APP_PATH/dw.json
        const configFromStorefrontPath = path.join(storefrontPath, 'dw.json')
        if (fs.existsSync(configFromStorefrontPath)) {
            return configFromStorefrontPath
        }

        // Check PWA_STOREFRONT_APP_PATH/../dw.json
        const configFromStorefrontParentPath = path.join(storefrontPath, '..', 'dw.json')
        if (fs.existsSync(configFromStorefrontParentPath)) {
            return configFromStorefrontParentPath
        }

        // Check PWA_STOREFRONT_APP_PATH/../../dw.json
        const configFromStorefrontGrandparentPath = path.join(storefrontPath, '..', '..', 'dw.json')
        if (fs.existsSync(configFromStorefrontGrandparentPath)) {
            return configFromStorefrontGrandparentPath
        }
    }

    // Check current working directory
    const configFromCwdPath = path.join(process.cwd(), 'dw.json')
    if (fs.existsSync(configFromCwdPath)) {
        return configFromCwdPath
    }

    return null
}

/**
 * Loads configuration from environment variables or dw.json file if it exists
 * Priority: Environment variables > dw.json file
 *
 * @returns {Object} Configuration object with SFCC settings
 */
export function loadConfig() {
    let dwConfig = {}

    // Attempt to load dw.json
    try {
        const configPath = findDwJsonPath()
        if (configPath) {
            const fileContent = fs.readFileSync(configPath, 'utf-8')
            dwConfig = JSON.parse(fileContent)
        }
    } catch (error) {
        logMCPMessage(`Failed to parse dw.json: ${error.message}`)
    }

    // Get hostname first to derive a fallback organizationId
    const hostname = process.env.SFCC_HOSTNAME || dwConfig['hostname']

    // Extract instance ID from hostname pattern: https://zzrf-001.dx.commercecloud.salesforce.com
    const hostnameMatch = hostname?.match(
        /https?:\/\/([a-z0-9-]+)\.dx\.commercecloud\.salesforce\.com/
    )
    const derivedInstanceId = hostnameMatch ? hostnameMatch[1].replace(/-/g, '_') : null
    const derivedOrganizationId = derivedInstanceId ? `f_ecom_${derivedInstanceId}` : null

    // Merge with environment variables (environment variables take precedence if both exist)
    return {
        hostname: hostname,
        instanceId: process.env.SFCC_INSTANCE_ID || dwConfig['instance-id'] || derivedInstanceId,
        organizationId: process.env.SFCC_ORG_ID || dwConfig['org-id'] || derivedOrganizationId,
        clientId: process.env.SFCC_CLIENT_ID || dwConfig['client-id'],
        clientSecret: process.env.SFCC_CLIENT_SECRET || dwConfig['client-secret'],
        shortCode: process.env.SFCC_SHORT_CODE || dwConfig['short-code']
    }
}

/**
 * Obtains OAuth access token from Salesforce Commerce Cloud
 * @param {string} clientId - The OAuth client ID
 * @param {string} clientSecret - The OAuth client secret
 * @param {string} oauthScope - The OAuth scope for the token
 * @returns {Promise<Response>} The fetch response containing the OAuth token
 */
export async function getOAuthToken(clientId, clientSecret, oauthScope) {
    const accountManagerHost = process.env.SFCC_LOGIN_URL || 'account.demandware.com'
    const oauthTokenUrl = `https://${accountManagerHost}/dwsso/oauth2/access_token`

    const response = await fetch(oauthTokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        },
        body: `grant_type=client_credentials&scope=${encodeURIComponent(oauthScope)}`
    })
    return response
}

/**
 * Calls the custom API DX endpoint
 * @param {string} accessToken - The OAuth access token for authentication
 * @param {string} customApiHost - The hostname for the custom API DX endpoint
 * @param {string} organizationId - The organization ID for the API request
 * @returns {Promise<Response>} The fetch response containing custom API data
 */
export async function callCustomApiDxEndpoint(accessToken, customApiHost, organizationId) {
    const customApiBase = `https://${customApiHost}/dx/custom-apis/v1/organizations/${organizationId}/endpoints`

    const response = await fetch(customApiBase, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    })
    return response
}

/**
 * Auto-detects the node_modules directory path
 * @param {string} [startPath] - Optional starting path for detection
 * @returns {string|null} The absolute path to node_modules or null if not found
 */
export function autoDetectNodeModulesPath(startPath = process.cwd()) {
    // Check for explicit environment variable (and its parents)
    const storefrontAppPath = process.env.PWA_STOREFRONT_APP_PATH
    if (storefrontAppPath) {
        let envPath = path.resolve(storefrontAppPath)
        while (envPath !== path.dirname(envPath)) {
            const nodeModulesPath = path.join(envPath, 'node_modules')
            if (fs.existsSync(nodeModulesPath)) {
                return nodeModulesPath
            }
            envPath = path.dirname(envPath)
        }
    }

    // Check for node_modules in cwd and its parents
    let currentPath = path.resolve(startPath)
    while (currentPath !== path.dirname(currentPath)) {
        const nodeModulesPath = path.join(currentPath, 'node_modules')
        if (fs.existsSync(nodeModulesPath)) {
            return nodeModulesPath
        }
        currentPath = path.dirname(currentPath)
    }
    // Check for node_modules in common PWA Kit app subfolders (fallback)
    const resolvedStartPath = path.resolve(startPath)
    const appSpecificPaths = [
        path.join(resolvedStartPath, 'retail-react-app/node_modules'),
        path.join(resolvedStartPath, 'app/node_modules'),
        path.join(resolvedStartPath, 'node_modules')
    ]
    for (const appPath of appSpecificPaths) {
        if (fs.existsSync(appPath)) {
            return appPath
        }
    }
    return null
}

/**
 * Auto-detects the commerce-sdk-isomorphic type definitions path
 * @param {string} [nodeModulesPath] - Optional node_modules path
 * @returns {string|null} The absolute path to index.cjs.d.ts or null if not found
 */
export function autoDetectCommerceSDKTypesPath(nodeModulesPath = null) {
    // Try the provided node_modules path first
    if (nodeModulesPath) {
        const result = checkCommerceSDKInNodeModules(nodeModulesPath)
        if (result) return result
    }

    // Try auto-detected node_modules
    const nmPath = autoDetectNodeModulesPath()
    if (nmPath) {
        const result = checkCommerceSDKInNodeModules(nmPath)
        if (result) return result
    }
    return null
}

/**
 * Helper function to check for commerce-sdk-isomorphic in a specific node_modules directory
 * @param {string} nodeModulesPath - Path to node_modules directory
 * @returns {string|null} Path to type definitions or null if not found
 */
function checkCommerceSDKInNodeModules(nodeModulesPath) {
    const possiblePaths = [
        path.join(nodeModulesPath, 'commerce-sdk-isomorphic/lib/index.cjs.d.ts'),
        path.join(nodeModulesPath, '@salesforce/commerce-sdk-isomorphic/lib/index.cjs.d.ts'),
        path.join(nodeModulesPath, 'commerce-sdk-isomorphic/dist/index.cjs.d.ts'),
        path.join(nodeModulesPath, '@salesforce/commerce-sdk-isomorphic/dist/index.cjs.d.ts'),
        path.join(nodeModulesPath, 'commerce-sdk-isomorphic/index.cjs.d.ts'),
        path.join(nodeModulesPath, '@salesforce/commerce-sdk-isomorphic/index.cjs.d.ts')
    ]

    for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
            return possiblePath
        }
    }

    return null
}

/**
 * Recursively searches for a file in a directory using native OS commands for better performance
 * Falls back to JS implementation if OS commands fail
 * @param {string} dir - Directory to search in
 * @param {string} filename - Filename to search for
 * @param {number} maxDepth - Maximum depth to search (default: 10)
 * @returns {string|null} Full path to the file if found, null otherwise
 */
function findFileRecursively(dir, filename, maxDepth = 10) {
    try {
        // Try using native OS commands for better performance
        const isWindows = process.platform === 'win32'

        let result
        if (isWindows) {
            // Windows: Use Get-ChildItem (PowerShell) or dir with recursion
            try {
                // PowerShell command for recursive search
                const psCommand = `Get-ChildItem -Path "${dir}" -Filter "${filename}" -Recurse -Depth ${maxDepth} -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName`
                result = execSync(`powershell -Command "${psCommand}"`, {
                    encoding: 'utf8',
                    stdio: ['pipe', 'pipe', 'pipe'],
                    timeout: 5000
                }).trim()
            } catch (psError) {
                logMCPMessage(`PowerShell search failed: ${psError.message}`)
                return findFileRecursivelyFallback(dir, filename, maxDepth, 0)
            }
        } else {
            // Unix/Linux/Mac: Use find command
            const excludeDirs = [
                'node_modules',
                '.git',
                '.next',
                'dist',
                'build',
                'coverage',
                '.cache',
                'tmp',
                'temp'
            ]
            const pruneConditions = excludeDirs.map((d) => `-path "*/${d}/*" -prune`).join(' -o ')
            const findCommand = `find "${dir}" -maxdepth ${maxDepth} \\( ${pruneConditions} \\) -o -type f -name "${filename}" -print -quit`

            result = execSync(findCommand, {
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: 5000
            }).trim()
        }

        return result || null
    } catch (error) {
        logMCPMessage(`Native OS search failed, using fallback: ${error.message}`)
        return findFileRecursivelyFallback(dir, filename, maxDepth, 0)
    }
}

/**
 * Fallback JavaScript implementation for file search
 * @param {string} dir - Directory to search in
 * @param {string} filename - Filename to search for
 * @param {number} maxDepth - Maximum depth to search
 * @param {number} currentDepth - Current recursion depth
 * @returns {string|null} Full path to the file if found, null otherwise
 */
function findFileRecursivelyFallback(dir, filename, maxDepth, currentDepth) {
    if (currentDepth > maxDepth) {
        return null
    }

    try {
        const entries = fs.readdirSync(dir, {withFileTypes: true})

        // Check if file exists in current directory first
        for (const entry of entries) {
            if (entry.isFile() && entry.name === filename) {
                return path.join(dir, entry.name)
            }
        }

        // Skip common directories that are unlikely to contain custom API files
        const skipDirs = new Set([
            'node_modules',
            '.git',
            '.next',
            'dist',
            'build',
            'coverage',
            '.cache',
            'tmp',
            'temp'
        ])

        // Recursively search subdirectories
        for (const entry of entries) {
            if (entry.isDirectory() && !skipDirs.has(entry.name)) {
                const found = findFileRecursivelyFallback(
                    path.join(dir, entry.name),
                    filename,
                    maxDepth,
                    currentDepth + 1
                )
                if (found) {
                    return found
                }
            }
        }
    } catch (error) {
        // Silently skip directories we don't have permission to read
        if (error.code !== 'EACCES' && error.code !== 'EPERM') {
            logMCPMessage(`Error searching directory ${dir}: ${error.message}`)
        }
    }

    return null
}

/**
 * Searches for api.json and schema.yaml in a given directory path
 * @param {string} searchPath - Directory path to search in
 * @param {string} source - Source identifier for logging (e.g., 'SFCC_CUSTOM_API_CARTRIDGE_PATH')
 * @returns {Object|null} Object containing apiJson and schemaYaml content, or null if not found
 */
function searchForCustomApiFiles(searchPath, source) {
    if (!searchPath || !fs.existsSync(searchPath)) {
        logMCPMessage(`Search path does not exist: ${searchPath}`)
        return null
    }

    try {
        // Search for api.json recursively
        const apiJsonPath = findFileRecursively(searchPath, 'api.json')

        if (!apiJsonPath) {
            logMCPMessage(`api.json not found in: ${searchPath}`)
            return null
        }

        logMCPMessage(`Found api.json at: ${apiJsonPath} (source: ${source})`)
        const apiJson = JSON.parse(fs.readFileSync(apiJsonPath, 'utf-8'))

        // Search for schema.yaml in the same directory as api.json first, then recursively
        const apiJsonDir = path.dirname(apiJsonPath)
        let schemaYamlPath = path.join(apiJsonDir, 'schema.yaml')

        if (!fs.existsSync(schemaYamlPath)) {
            // If not found in same directory, search recursively from api.json directory
            schemaYamlPath = findFileRecursively(apiJsonDir, 'schema.yaml')
        }

        let schemaYaml = null
        if (schemaYamlPath && fs.existsSync(schemaYamlPath)) {
            logMCPMessage(`Found schema.yaml at: ${schemaYamlPath}`)
            schemaYaml = fs.readFileSync(schemaYamlPath, 'utf-8')
        } else {
            logMCPMessage(`schema.yaml not found, continuing without schema`)
        }

        return {apiJson, schemaYaml, apiJsonPath, schemaYamlPath, source}
    } catch (error) {
        logMCPMessage(`Error reading custom API from ${searchPath}: ${error.message}`)
        return null
    }
}

/**
 * Loads custom API configuration from local filesystem fallback paths
 * Search priority:
 * 1. SFCC_CARTRIDGE_PATH env var
 * 2. PWA_STOREFRONT_APP_PATH (search up parent directories and down subdirectories)
 * @returns {Object|null} Object containing apiJson and schemaYaml content, or null if not found
 */
export function loadCustomApiFromFallbackPath() {
    // Priority 1: Check SFCC_CARTRIDGE_PATH
    const customApiPath = process.env.SFCC_CARTRIDGE_PATH
    if (customApiPath) {
        const result = searchForCustomApiFiles(customApiPath, 'SFCC_CARTRIDGE_PATH')
        if (result) {
            return result
        }
    }

    // Priority 2: Check PWA_STOREFRONT_APP_PATH and traverse up/down
    const storefrontAppPath = process.env.PWA_STOREFRONT_APP_PATH
    if (storefrontAppPath && fs.existsSync(storefrontAppPath)) {
        logMCPMessage(
            `Searching for custom API files from PWA_STOREFRONT_APP_PATH: ${storefrontAppPath}`
        )

        // First search in the app path itself and its subdirectories
        let result = searchForCustomApiFiles(storefrontAppPath, 'PWA_STOREFRONT_APP_PATH')
        if (result) {
            return result
        }

        // Traverse up parent directories until we hit root or home directory
        let currentPath = path.resolve(storefrontAppPath)
        const homeDir = os.homedir()
        const rootDir = path.parse(currentPath).root
        let level = 0

        while (currentPath !== rootDir && currentPath !== homeDir) {
            const parentPath = path.dirname(currentPath)

            // Stop if we've reached the root or same path (safety check)
            if (parentPath === currentPath) {
                break
            }

            level++
            logMCPMessage(`Searching parent directory (level ${level}): ${parentPath}`)
            result = searchForCustomApiFiles(
                parentPath,
                `PWA_STOREFRONT_APP_PATH (parent ${level})`
            )
            if (result) {
                return result
            }

            currentPath = parentPath

            // Safety limit: stop at 10 levels to prevent excessive traversal
            if (level >= 10) {
                logMCPMessage('Reached maximum parent directory traversal depth (10 levels)')
                break
            }
        }

        if (currentPath === homeDir) {
            logMCPMessage('Stopped search at home directory')
        } else if (currentPath === rootDir) {
            logMCPMessage('Stopped search at filesystem root')
        }
    }

    logMCPMessage('No custom API files found in any fallback location')
    return null
}
