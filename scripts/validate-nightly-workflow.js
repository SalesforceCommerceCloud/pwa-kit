/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const fs = require('fs')
const yaml = require('js-yaml')

const PRIVATE_CLIENT_HOME = 'https://scaffold-pwa-e2e-pwa-kit-private.mobify-storefront.com'
const PRIVATE_TARGET_COMPARISON = `test "$RETAIL_APP_HOME" = "${PRIVATE_CLIENT_HOME}"`
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
    const privatePlaywrightCommands = privatePlaywrightStep?.run
        ?.split('\n')
        .map((command) => command.trim())
    requireCondition(
        privatePlaywrightCommands?.includes(PRIVATE_TARGET_COMPARISON),
        'Private-client Playwright step must contain the exact private target comparison'
    )

    for (const [jobId, flavor] of MATRIX_JOBS) {
        const job = jobs[jobId]
        const steps = job?.steps || []
        const playwrightIndex = steps.findIndex((step) => step.name === 'Run Playwright tests')
        const artifactIndex = steps.findIndex((step) => step.uses === 'actions/upload-artifact@v4')
        const artifactStep = steps[artifactIndex]
        const expectedName = `playwright-results-${flavor}-node-\${{ matrix.node }}-npm-\${{ matrix.npm }}`

        requireCondition(artifactStep, `${jobId} must upload Playwright results`)
        requireCondition(
            artifactIndex > playwrightIndex && playwrightIndex >= 0,
            `${jobId} must upload Playwright results after Run Playwright tests`
        )
        if (jobId === 'run-generator-private-client') {
            const a11yIndex = steps.findIndex(
                (step) => step.name === 'Run a11y test for Node 24 with npm 11'
            )
            requireCondition(
                artifactIndex > a11yIndex && a11yIndex >= 0,
                `${jobId} must upload Playwright results after the a11y step`
            )
        }
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
        requireCondition(
            artifactStep.with?.['if-no-files-found'] === 'ignore',
            `${jobId} must ignore missing Playwright results`
        )
        requireCondition(
            artifactStep.with?.['retention-days'] === 7,
            `${jobId} must retain Playwright results for 7 days`
        )
    }
}

module.exports = {loadWorkflow, validateNightlyWorkflow}
