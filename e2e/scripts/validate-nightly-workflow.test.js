/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const path = require('path')
const {loadWorkflow, validateNightlyWorkflow} = require('../../scripts/validate-nightly-workflow')

const WORKFLOW_PATH = path.resolve(__dirname, '../../.github/workflows/e2e.yml')
const MATRIX_JOBS = [
    'run-generator-retail-app-no-ext',
    'run-generator-retail-app-ext',
    'run-generator-private-client'
]

const loadNightlyWorkflow = () => loadWorkflow(WORKFLOW_PATH)
const cloneWorkflow = (workflow) => JSON.parse(JSON.stringify(workflow))
const findStep = (workflow, jobId, predicate) => workflow.jobs[jobId].steps.find(predicate)
const moveUploadBefore = (workflow, jobId, stepName) => {
    const steps = workflow.jobs[jobId].steps
    const artifactIndex = steps.findIndex((step) => step.uses === 'actions/upload-artifact@v4')
    const [artifactStep] = steps.splice(artifactIndex, 1)
    const prerequisiteIndex = steps.findIndex((step) => step.name === stepName)
    steps.splice(prerequisiteIndex, 0, artifactStep)
}

describe('nightly E2E workflow', () => {
    test('targets private-client and preserves uniquely named failure artifacts', () => {
        const workflow = loadNightlyWorkflow()

        expect(() => validateNightlyWorkflow(workflow)).not.toThrow()
    })

    test('rejects a private target comparison against the wrong host', () => {
        const workflow = cloneWorkflow(loadNightlyWorkflow())
        const playwrightStep = findStep(
            workflow,
            'run-generator-private-client',
            (step) => step.name === 'Run Playwright tests'
        )
        playwrightStep.run = playwrightStep.run.replace(
            'test "$RETAIL_APP_HOME" = "https://scaffold-pwa-e2e-pwa-kit-private.mobify-storefront.com"',
            'test "$RETAIL_APP_HOME" = "https://wrong-private-target.example.com"'
        )

        expect(() => validateNightlyWorkflow(workflow)).toThrow(
            'Private-client Playwright step must contain the exact private target comparison'
        )
    })

    test.each(MATRIX_JOBS)('%s uploads results after its Playwright step', (jobId) => {
        const workflow = cloneWorkflow(loadNightlyWorkflow())
        moveUploadBefore(workflow, jobId, 'Run Playwright tests')

        expect(() => validateNightlyWorkflow(workflow)).toThrow(
            `${jobId} must upload Playwright results after Run Playwright tests`
        )
    })

    test('private-client uploads results after the conditional a11y step', () => {
        const workflow = cloneWorkflow(loadNightlyWorkflow())
        moveUploadBefore(
            workflow,
            'run-generator-private-client',
            'Run a11y test for Node 24 with npm 11'
        )

        expect(() => validateNightlyWorkflow(workflow)).toThrow(
            'run-generator-private-client must upload Playwright results after the a11y step'
        )
    })

    test.each(MATRIX_JOBS)('%s ignores a missing artifact directory', (jobId) => {
        const workflow = cloneWorkflow(loadNightlyWorkflow())
        const artifactStep = findStep(
            workflow,
            jobId,
            (step) => step.uses === 'actions/upload-artifact@v4'
        )
        artifactStep.with['if-no-files-found'] = 'error'

        expect(() => validateNightlyWorkflow(workflow)).toThrow(
            `${jobId} must ignore missing Playwright results`
        )
    })

    test.each(MATRIX_JOBS)('%s retains failure artifacts for exactly seven days', (jobId) => {
        const workflow = cloneWorkflow(loadNightlyWorkflow())
        const artifactStep = findStep(
            workflow,
            jobId,
            (step) => step.uses === 'actions/upload-artifact@v4'
        )
        artifactStep.with['retention-days'] = 14

        expect(() => validateNightlyWorkflow(workflow)).toThrow(
            `${jobId} must retain Playwright results for 7 days`
        )
    })
})
