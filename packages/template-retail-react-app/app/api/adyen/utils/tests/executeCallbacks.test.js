/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {executeCallbacks} from '@salesforce/retail-react-app/app/api/adyen/utils/executeCallbacks'

describe('executeCallbacks', () => {
    it('should execute all callbacks successfully and return aggregated data', async () => {
        const callback1 = jest.fn().mockResolvedValue({data1: 'result1'})
        const callback2 = jest.fn().mockResolvedValue({data2: 'result2'})
        const callbacks = [callback1, callback2]
        const props = {prop1: 'value1'}
        const onError = jest.fn()

        const execute = executeCallbacks(callbacks, props, onError)
        await execute('param1', 'param2')

        expect(callback1).toHaveBeenCalledWith('param1', 'param2', props, {})
        expect(onError).not.toHaveBeenCalled()
    })

    it('should stop executing callbacks on error and call onError callback', async () => {
        const callback1 = jest.fn().mockResolvedValue({data1: 'result1'})
        const callback2 = jest.fn().mockRejectedValue(new Error('Some error'))
        const callback3 = jest.fn()
        const callbacks = [callback1, callback2, callback3]
        const props = {prop1: 'value1'}
        const onError = jest.fn()

        const execute = executeCallbacks(callbacks, props, onError)
        await execute('param1', 'param2')

        expect(callback1).toHaveBeenCalledWith('param1', 'param2', props, {})
        expect(callback3).not.toHaveBeenCalled()
    })
})
