/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const fs = require('fs')
const yaml = require('js-yaml')

const PRIVATE_CLIENT_HOME =
    'https://scaffold-pwa-e2e-pwa-kit-private.mobify-storefront.com'
const MATRIX_JOBS = [
    ['run-generator-retail-app-no-ext', 'no-ext'],
    ['run-generator-retail-app-ext', 'ext'],
    ['run-generator-private-client', 'private-client']
]

const loadWorkflow = (filePath) => yaml.load(fs.readFileSync(filePath, 'utf8'))

const requireCondition = (condition, message) => {
    if (!condition) throw new Error(message)
}

const validateNightlyWorkflow = (workflow) => {
    const jobs = workflow.jobs || {}
    const privateJob = jobs['run-generator-private-client']

    requireCondition(privateJob, 'Missing private-client matrix job')
    requireCondition(
        privateJob.env?.RETAIL_APP_HOME === PRIVATE_CLIENT_HOME,
        `Private-client RETAIL_APP_HOME must be ${PRIVATE_CLIENT_HOME}`
    )

    const privatePlaywrightStep = privateJob.steps?.find(
        (step) => step.name === 'Run Playwright tests'
    )
    requireCondition(
        privatePlaywrightStep?.run?.includes('test "$RETAIL_APP_HOME" ='),
        'Private-client Playwright step must fail fast when RETAIL_APP_HOME is wrong'
    )

    for (const [jobId, flavor] of MATRIX_JOBS) {
        const job = jobs[jobId]
        const artifactStep = job?.steps?.find(
            (step) => step.uses === 'actions/upload-artifact@v4'
        )
        const expectedName = `playwright-results-${flavor}-node-\${{ matrix.node }}-npm-\${{ matrix.npm }}`

        requireCondition(artifactStep, `${jobId} must upload Playwright results`)
        requireCondition(
            artifactStep.if === '${{ failure() }}',
            `${jobId} must upload results only after failure`
        )
        requireCondition(
            artifactStep.with?.name === expectedName,
            `${jobId} artifact name must include flavor, Node, and npm`
        )
        requireCondition(
            artifactStep.with?.path === 'test-results',
            `${jobId} must upload test-results`
        )
    }
}

module.exports = {loadWorkflow, validateNightlyWorkflow}
