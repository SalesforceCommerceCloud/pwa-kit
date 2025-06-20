/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {spawn} from 'child_process'
import path from 'path'

export function generatePwaKitProject(config) {
    console.log('generatePwaKitProject', config)
    return new Promise((resolve, reject) => {
        const cliPath = path.resolve('node_modules', '.bin', 'pwa-kit-create-app')
        console.log('cliPath', cliPath)
        const child = spawn('node', [cliPath], {stdio: ['pipe', 'pipe', 'pipe']})

        let output = ''
        let errorOutput = ''

        child.stdout.on('data', (data) => {
            output += data.toString()
        })

        child.stderr.on('data', (data) => {
            errorOutput += data.toString()
        })

        child.on('close', (code) => {
            if (code === 0) {
                resolve(output)
            } else {
                reject(new Error(`Process exited with code ${code}: ${errorOutput}`))
            }
        })

        child.stdin.write(JSON.stringify(config))
        child.stdin.end()
    })
}
