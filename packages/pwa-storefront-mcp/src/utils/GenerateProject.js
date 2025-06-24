/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {spawn} from 'child_process'
import path from 'path'

export function generatePwaKitProject(config) {
    console.error('generatePwaKitProject', config)
    return new Promise((resolve, reject) => {
        // const cliPath = path.resolve(process.cwd(), 'node_modules', '.bin', 'pwa-kit-create-app')
        const child = spawn('node', ['/Users/bchypak/Projects/pwa-kit/packages/pwa-kit-create-app/scripts/create-mobify-app.js', '--stdio', '--outputDir', '/Users/bchypak/Projects/pwa-kit/packages/test-project'], {stdio: ['pipe', 'pipe', 'pipe']})

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
                console.error('errorOutput: ', errorOutput)
                reject(new Error(`Process exited with code ${code}: ${errorOutput}`))
            }
        })
        console.error('config: ', config)
        // child.stdin.write(JSON.stringify(config))
        child.stdin.write(JSON.stringify({
            "project.extend": true,
            "project.hybrid": false,
            "project.name": "demo-storefront",
            "project.commerce.instanceUrl": "https://zzte-053.dx.commercecloud.salesforce.com",
            "project.commerce.clientId": "1d763261-6522-4913-9d52-5d947d3b94c4",
            "project.commerce.siteId": "RefArch",
            "project.commerce.organizationId": "f_ecom_zzte_053",
            "project.commerce.shortCode": "kv7kzm78",
            "project.commerce.isSlasPrivate": false,
            "project.einstein.clientId": "1ea06c6e-c936-4324-bcf0-fada93f83bb1",
            "project.einstein.siteId": "aaij-MobileFirst",
            "project.dataCloud.appSourceId": "f22ae831-ac03-4bf6-afc1-3a0b19f1ea8e",
            "project.dataCloud.tenantId": "mmydmztgh04dczjzmnsw0zd0g8.pc-rnd",
            "project.demo.enableDemoSettings": false,
            "general.presetOrTemplateId": "@salesforce/retail-react-app"
          }
          ))
        child.stdin.end()
    })
}
