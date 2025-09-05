/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * @file post.js
 * @description Performs the actual release of the MRT target back to the pool of available targets in the MRT staging org.
 * This step is executed even when a job fails or is manually cancelled, providing best-effort cleanup of leased resources.
 * This step is executed after the main step in the workflow.
 */
const fs = require('fs')
const path = require('path')
const {spawnSync} = require('child_process')
const config = require('../../../../e2e/config.js')

;(async () => {
    try {
        const workspace = process.env.GITHUB_WORKSPACE || process.cwd()
        const detailsFile = config.MRT_TARGET_DETAILS_FILE
        const absDetails = path.resolve(workspace, detailsFile)
        console.log(`Reading MRT target details from ${absDetails}`)
        if (!fs.existsSync(absDetails)) {
            console.log(`No details file at ${absDetails}. Skipping release.`)
            return
        }

        const details = JSON.parse(fs.readFileSync(absDetails, 'utf8'))
        console.log(`Details: ${JSON.stringify(details)}`)
        const slug = details && details.slug
        if (!slug) {
            console.log('No slug found in details file. Skipping release.')
            return
        }

        const cli = path.resolve(workspace, 'e2e/scripts/mrt-target-manager.js')
        console.log(`Releasing MRT target: ${slug}`)
        const res = spawnSync('node', [cli, 'release', slug], {stdio: 'inherit', cwd: workspace})

        if (res.status !== 0) {
            console.log(`Release exited with status ${res.status}.`)
        }
    } catch (e) {
        console.log(`Release step error: ${e.message}`)
    }
})()
