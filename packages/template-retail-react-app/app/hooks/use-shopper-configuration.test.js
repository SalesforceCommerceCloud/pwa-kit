/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook} from '@testing-library/react'
import {useShopperConfiguration} from '@salesforce/retail-react-app/app/hooks/use-shopper-configuration'
import {useConfigurations} from '@salesforce/commerce-sdk-react'

// Mock the commerce-sdk-react hook
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useConfigurations: jest.fn()
}))

describe('useShopperConfiguration', () => {
    afterEach(() => {
        jest.clearAllMocks()
    })

    test('returns the configuration value when configuration exists with boolean true', () => {
        useConfigurations.mockReturnValue({
            data: {
                configurations: [
                    {id: 'SalesforcePaymentsAllowed', value: true},
                    {id: 'AnotherConfig', value: false}
                ]
            }
        })

        const {result} = renderHook(() => useShopperConfiguration('SalesforcePaymentsAllowed'))

        expect(result.current).toBe(true)
    })

    test('returns the configuration value when configuration exists with boolean false', () => {
        useConfigurations.mockReturnValue({
            data: {
                configurations: [{id: 'SomeConfig', value: false}]
            }
        })

        const {result} = renderHook(() => useShopperConfiguration('SomeConfig'))

        expect(result.current).toBe(false)
    })

    test('returns the configuration value when configuration exists with string value', () => {
        useConfigurations.mockReturnValue({
            data: {
                configurations: [{id: 'StringConfig', value: 'some-string-value'}]
            }
        })

        const {result} = renderHook(() => useShopperConfiguration('StringConfig'))

        expect(result.current).toBe('some-string-value')
    })

    test('returns the configuration value when configuration exists with numeric value', () => {
        useConfigurations.mockReturnValue({
            data: {
                configurations: [{id: 'NumericConfig', value: 42}]
            }
        })

        const {result} = renderHook(() => useShopperConfiguration('NumericConfig'))

        expect(result.current).toBe(42)
    })

    test('returns the configuration value when configuration exists with object value', () => {
        const objectValue = {key: 'value', nested: {prop: 'test'}}
        useConfigurations.mockReturnValue({
            data: {
                configurations: [{id: 'ObjectConfig', value: objectValue}]
            }
        })

        const {result} = renderHook(() => useShopperConfiguration('ObjectConfig'))

        expect(result.current).toEqual(objectValue)
    })

    test('returns undefined when configuration does not exist', () => {
        useConfigurations.mockReturnValue({
            data: {
                configurations: [
                    {id: 'Config1', value: true},
                    {id: 'Config2', value: false}
                ]
            }
        })

        const {result} = renderHook(() => useShopperConfiguration('NonExistentConfig'))

        expect(result.current).toBeUndefined()
    })

    test('returns undefined when configurations data is undefined', () => {
        useConfigurations.mockReturnValue({
            data: undefined
        })

        const {result} = renderHook(() => useShopperConfiguration('SomeConfig'))

        expect(result.current).toBeUndefined()
    })

    test('returns undefined when configurations data is null', () => {
        useConfigurations.mockReturnValue({
            data: null
        })

        const {result} = renderHook(() => useShopperConfiguration('SomeConfig'))

        expect(result.current).toBeUndefined()
    })

    test('returns undefined when configurations array is undefined', () => {
        useConfigurations.mockReturnValue({
            data: {
                configurations: undefined
            }
        })

        const {result} = renderHook(() => useShopperConfiguration('SomeConfig'))

        expect(result.current).toBeUndefined()
    })

    test('returns undefined when configurations array is empty', () => {
        useConfigurations.mockReturnValue({
            data: {
                configurations: []
            }
        })

        const {result} = renderHook(() => useShopperConfiguration('SomeConfig'))

        expect(result.current).toBeUndefined()
    })

    test('returns the correct configuration when multiple configurations exist', () => {
        useConfigurations.mockReturnValue({
            data: {
                configurations: [
                    {id: 'Config1', value: 'value1'},
                    {id: 'Config2', value: 'value2'},
                    {id: 'Config3', value: 'value3'}
                ]
            }
        })

        const {result} = renderHook(() => useShopperConfiguration('Config2'))

        expect(result.current).toBe('value2')
    })

    test('returns undefined when configuration exists but has no value property', () => {
        useConfigurations.mockReturnValue({
            data: {
                configurations: [{id: 'ConfigWithoutValue'}]
            }
        })

        const {result} = renderHook(() => useShopperConfiguration('ConfigWithoutValue'))

        expect(result.current).toBeUndefined()
    })

    test('returns null when configuration value is explicitly null', () => {
        useConfigurations.mockReturnValue({
            data: {
                configurations: [{id: 'NullConfig', value: null}]
            }
        })

        const {result} = renderHook(() => useShopperConfiguration('NullConfig'))

        expect(result.current).toBeNull()
    })

    test('returns 0 when configuration value is 0', () => {
        useConfigurations.mockReturnValue({
            data: {
                configurations: [{id: 'ZeroConfig', value: 0}]
            }
        })

        const {result} = renderHook(() => useShopperConfiguration('ZeroConfig'))

        expect(result.current).toBe(0)
    })

    test('returns empty string when configuration value is empty string', () => {
        useConfigurations.mockReturnValue({
            data: {
                configurations: [{id: 'EmptyStringConfig', value: ''}]
            }
        })

        const {result} = renderHook(() => useShopperConfiguration('EmptyStringConfig'))

        expect(result.current).toBe('')
    })

    test('is case-sensitive when matching configuration IDs', () => {
        useConfigurations.mockReturnValue({
            data: {
                configurations: [
                    {id: 'SalesforcePaymentsAllowed', value: true},
                    {id: 'salesforcepaymentsallowed', value: false}
                ]
            }
        })

        const {result: result1} = renderHook(() =>
            useShopperConfiguration('SalesforcePaymentsAllowed')
        )
        const {result: result2} = renderHook(() =>
            useShopperConfiguration('salesforcepaymentsallowed')
        )

        expect(result1.current).toBe(true)
        expect(result2.current).toBe(false)
    })
})
