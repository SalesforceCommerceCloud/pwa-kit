/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useCustomerType from './useCustomerType'
import useAuthContext from './useAuthContext'
import useLocalStorage from './useLocalStorage'
import useConfig from './useConfig'
import * as utils from '../utils'

jest.mock('./useAuthContext')
jest.mock('./useLocalStorage')
jest.mock('./useConfig')
jest.mock('../utils', () => ({
    ...jest.requireActual('../utils'),
    onClient: jest.fn()
}))

const mockedUseAuthContext = useAuthContext as jest.MockedFunction<typeof useAuthContext>
const mockedUseLocalStorage = useLocalStorage as jest.MockedFunction<typeof useLocalStorage>
const mockedUseConfig = useConfig as jest.MockedFunction<typeof useConfig>
const mockedOnClient = utils.onClient as jest.MockedFunction<typeof utils.onClient>

describe('useCustomerType', () => {
    const mockSiteId = 'test-site-id'

    beforeEach(() => {
        jest.resetAllMocks()

        mockedUseConfig.mockReturnValue({
            siteId: mockSiteId
        } as any)

        // Default mocks for auth context
        mockedUseAuthContext.mockReturnValue({
            get: jest.fn().mockImplementation((key) => {
                if (key === 'customer_type') return 'registered'
                if (key === 'uido') return 'slas'
                return null
            })
        } as any)

        // Default mocks for localStorage
        mockedUseLocalStorage.mockImplementation((key) => {
            if (key === `customer_type_${mockSiteId}`) return 'registered'
            if (key === `uido_${mockSiteId}`) return 'slas'
            return null
        })
    })

    describe('client-side', () => {
        beforeEach(() => {
            // Mock onClient to return true (client environment)
            mockedOnClient.mockReturnValue(true)
        })

        it('returns registered customer type from localStorage', () => {
            const result = useCustomerType()

            expect(mockedOnClient).toHaveBeenCalled()
            expect(mockedUseLocalStorage).toHaveBeenNthCalledWith(1, `customer_type_${mockSiteId}`)
            expect(mockedUseLocalStorage).toHaveBeenNthCalledWith(2, `uido_${mockSiteId}`)

            expect(result.customerType).toBe('registered')
            expect(result.isGuest).toBe(false)
            expect(result.isRegistered).toBe(true)
            expect(result.isExternal).toBe(false)
        })

        it('returns guest customer type from localStorage', () => {
            mockedUseLocalStorage.mockImplementation((key) => {
                if (key === `customer_type_${mockSiteId}`) return 'guest'
                return null
            })

            const result = useCustomerType()

            expect(result.customerType).toBe('guest')
            expect(result.isGuest).toBe(true)
            expect(result.isRegistered).toBe(false)
            expect(result.isExternal).toBe(false)
        })

        it('returns null customer type when invalid value in localStorage', () => {
            mockedUseLocalStorage.mockImplementation((key) => {
                if (key === `customer_type_${mockSiteId}`) return 'invalid-type'
                return null
            })

            const result = useCustomerType()

            expect(result.customerType).toBeNull()
            expect(result.isGuest).toBe(false)
            expect(result.isRegistered).toBe(false)
            expect(result.isExternal).toBe(false)
        })

        it('identifies external users correctly', () => {
            mockedUseLocalStorage.mockImplementation((key) => {
                if (key === `customer_type_${mockSiteId}`) return 'registered'
                if (key === `uido_${mockSiteId}`) return 'external-idp'
                return null
            })

            const result = useCustomerType()

            expect(result.customerType).toBe('registered')
            expect(result.isRegistered).toBe(true)
            expect(result.isExternal).toBe(true)
        })

        it('identifies ecom users as non-external', () => {
            mockedUseLocalStorage.mockImplementation((key) => {
                if (key === `customer_type_${mockSiteId}`) return 'registered'
                if (key === `uido_${mockSiteId}`) return 'ecom'
                return null
            })

            const result = useCustomerType()

            expect(result.customerType).toBe('registered')
            expect(result.isRegistered).toBe(true)
            expect(result.isExternal).toBe(false)
        })
    })

    describe('server-side', () => {
        beforeEach(() => {
            // Mock onClient to return false (server environment)
            mockedOnClient.mockReturnValue(false)
        })

        it('returns registered customer type from auth context', () => {
            const result = useCustomerType()

            expect(mockedOnClient).toHaveBeenCalled()
            // eslint-disable-next-line @typescript-eslint/unbound-method
            const mockGet = mockedUseAuthContext().get
            expect(mockGet).toHaveBeenCalledWith('customer_type')
            expect(mockGet).toHaveBeenCalledWith('uido')

            expect(result.customerType).toBe('registered')
            expect(result.isGuest).toBe(false)
            expect(result.isRegistered).toBe(true)
            expect(result.isExternal).toBe(false)
        })

        it('returns guest customer type from auth context', () => {
            mockedUseAuthContext.mockReturnValue({
                get: jest.fn().mockImplementation((key) => {
                    if (key === 'customer_type') return 'guest'
                    return null
                })
            } as any)

            const result = useCustomerType()

            expect(result.customerType).toBe('guest')
            expect(result.isGuest).toBe(true)
            expect(result.isRegistered).toBe(false)
            expect(result.isExternal).toBe(false)
        })

        it('returns null customer type when invalid value in auth context', () => {
            mockedUseAuthContext.mockReturnValue({
                get: jest.fn().mockImplementation((key) => {
                    if (key === 'customer_type') return 'invalid-type'
                    return null
                })
            } as any)

            const result = useCustomerType()

            expect(result.customerType).toBeNull()
            expect(result.isGuest).toBe(false)
            expect(result.isRegistered).toBe(false)
            expect(result.isExternal).toBe(false)
        })

        it('identifies external users correctly', () => {
            mockedUseAuthContext.mockReturnValue({
                get: jest.fn().mockImplementation((key) => {
                    if (key === 'customer_type') return 'registered'
                    if (key === 'uido') return 'external-idp'
                    return null
                })
            } as any)

            const result = useCustomerType()

            expect(result.customerType).toBe('registered')
            expect(result.isRegistered).toBe(true)
            expect(result.isExternal).toBe(true)
        })
    })
})
