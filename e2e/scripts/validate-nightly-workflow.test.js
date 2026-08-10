/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const path = require('path')
const {loadWorkflow, validateNightlyWorkflow} = require('./validate-nightly-workflow')

describe('nightly E2E workflow', () => {
    test('targets private-client and preserves uniquely named failure artifacts', () => {
        const workflow = loadWorkflow(path.resolve(__dirname, '../../.github/workflows/e2e.yml'))

        expect(() => validateNightlyWorkflow(workflow)).not.toThrow()
    })
})
