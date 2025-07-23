/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'fs'
import path from 'path'
import {spawn} from 'cross-spawn'
import {zodToJsonSchema} from 'zod-to-json-schema'
import {z} from 'zod'

// CONSTANTS
// const CREATE_APP_VERSION = 'latest'
const CREATE_APP_VERSION = '3.11.0-nightly-20250710080214'

// Private schema used to generate the JSON schema
const emptySchema = z.object({}).strict()

export const EmptyJsonSchema = zodToJsonSchema(emptySchema)

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
