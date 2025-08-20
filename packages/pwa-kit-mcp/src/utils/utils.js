/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import {spawn} from 'cross-spawn'
import {zodToJsonSchema} from 'zod-to-json-schema'
import {z} from 'zod'

// CONSTANTS
const CREATE_APP_VERSION = 'latest'

// Private schema used to generate the JSON schema
const emptySchema = z.object({}).strict()

export const EmptyJsonSchema = zodToJsonSchema(emptySchema)

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
