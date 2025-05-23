/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useCustomerId from './useCustomerId'
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

describe('useCustomerId', () => {
    const mockCustomerId = 'test-customer-id'
    const mockSiteId = 'test-site-id'

    beforeEach(() => {
        jest.resetAllMocks()

        mockedUseConfig.mockReturnValue({
            siteId: mockSiteId
        } as any)

        mockedUseAuthContext.mockReturnValue({
            get: jest.fn().mockImplementation((key) => {
                if (key === 'customer_id') return mockCustomerId
                return null
            })
        } as any)

        mockedUseLocalStorage.mockReturnValue(mockCustomerId)
    })

    describe('client-side', () => {
        beforeEach(() => {
            // Mock onClient to return true (client environment)
            mockedOnClient.mockReturnValue(true)
        })

        it('uses localStorage for customer ID on client-side', () => {
            const result = useCustomerId()

            expect(mockedOnClient).toHaveBeenCalled()
            expect(mockedUseConfig).toHaveBeenCalled()
            expect(mockedUseLocalStorage).toHaveBeenCalledWith(`customer_id_${mockSiteId}`)
            expect(result).toBe(mockCustomerId)
        })

        it('returns null when localStorage returns null', () => {
            mockedUseLocalStorage.mockReturnValueOnce(null)

            const result = useCustomerId()

            expect(result).toBeNull()
        })
    })

    describe('server-side', () => {
        beforeEach(() => {
            // Mock onClient to return false (server environment)
            mockedOnClient.mockReturnValue(false)
        })

        it('uses auth.get for customer ID on server-side', () => {
            const result = useCustomerId()

            expect(mockedOnClient).toHaveBeenCalled()
            // eslint-disable-next-line @typescript-eslint/unbound-method
            const mockGet = mockedUseAuthContext().get
            expect(mockGet).toHaveBeenCalledWith('customer_id')
            expect(result).toBe(mockCustomerId)
        })

        it('returns null when auth.get returns null', () => {
            mockedUseAuthContext.mockReturnValueOnce({
                get: jest.fn().mockReturnValue(null)
            } as any)

            const result = useCustomerId()

            expect(result).toBeNull()
        })
    })
})
