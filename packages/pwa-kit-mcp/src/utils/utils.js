/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {zodToJsonSchema} from 'zod-to-json-schema'
import {z} from 'zod'
import os from 'os'
import {exec} from 'child_process'

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
        .toLowerCase();
}

/**
 * Converts a string to PascalCase (e.g., product-card -> ProductCard)
 */
export function toPascalCase(str) {
    return str
        .replace(/(^\w|[-_\s]\w)/g, match => match.replace(/[-_\s]/, '').toUpperCase());
}

/**
 * Runs an NPX command and captures its output.
 *
 * @returns {Promise<string>} - Resolves with the command output.
 */
export async function runNpxCommand(NPX_COMMAND, CREATE_APP_COMMAND, DISPLAY_PROGRAM_COMMAND) {
    return new Promise((resolve, reject) => {
        const tempDir = os.tmpdir()
        const outputFilePath = path.join(tempDir, 'npx-output.json')
        const errorFilePath = path.join(tempDir, 'npx-error.log')
        const command = `${NPX_COMMAND} ${CREATE_APP_COMMAND} ${DISPLAY_PROGRAM_COMMAND} > ${outputFilePath} 2> ${errorFilePath}`

        exec(command, (error) => {
            if (error) {
                reject(error)
                return
            }

            fs.promises
                .readFile(outputFilePath, 'utf-8')
                .then((data) => resolve(data))
                .catch((err) => reject(err))
        })
    })
}
