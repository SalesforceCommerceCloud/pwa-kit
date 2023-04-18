/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {updateGlobalAgentOptions, AGENT_OPTIONS_TO_COPY} from './update-global-agent-options'

describe('update-global-agent-options', () => {
    test('non copy option', () => {
        let from = {options: {random: 'value'}}
        let to = {options: {}}
        AGENT_OPTIONS_TO_COPY.forEach((key) => {
            from.options[key] = key
        })
        updateGlobalAgentOptions(from, to)
        expect(Object.keys(to.options)).toHaveLength(AGENT_OPTIONS_TO_COPY.length)
        expect(to.options).not.toHaveProperty('random')
    })
})
