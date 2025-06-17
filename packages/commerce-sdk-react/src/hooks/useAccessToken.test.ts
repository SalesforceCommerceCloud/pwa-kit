/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useAccessToken from './useAccessToken'
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

describe('useAccessToken', () => {
    const mockToken = 'test-access-token'
    const mockSiteId = 'test-site-id'

    beforeEach(() => {
        jest.resetAllMocks()

        mockedUseConfig.mockReturnValue({
            siteId: mockSiteId
        } as any)

        // Mock the auth context to properly handle calls to ready() and get()
        mockedUseAuthContext.mockReturnValue({
            ready: jest.fn().mockImplementation(() => {
                return Promise.resolve({access_token: mockToken})
            }),
            get: jest.fn().mockImplementation((key) => {
                if (key === 'access_token') return mockToken
                return null
            })
        } as any)

        mockedUseLocalStorage.mockReturnValue(mockToken)
    })

    describe('client-side', () => {
        beforeEach(() => {
            // Mock onClient to return true (client environment)
            mockedOnClient.mockReturnValue(true)
        })

        it('uses localStorage for token on client-side', () => {
            const {token} = useAccessToken()

            expect(mockedOnClient).toHaveBeenCalled()
            expect(mockedUseLocalStorage).toHaveBeenCalledWith(`access_token_${mockSiteId}`)
            expect(token).toBe(mockToken)
        })

        it('returns null when localStorage returns null', () => {
            mockedUseLocalStorage.mockReturnValueOnce(null)

            const {token} = useAccessToken()

            expect(token).toBeNull()
        })
    })

    describe('server-side', () => {
        beforeEach(() => {
            // Mock onClient to return false (server environment)
            mockedOnClient.mockReturnValue(false)
        })

        it('uses auth.get for token on server-side', () => {
            const {token} = useAccessToken()

            expect(mockedOnClient).toHaveBeenCalled()
            // eslint-disable-next-line @typescript-eslint/unbound-method
            const mockGet = mockedUseAuthContext().get
            expect(mockGet).toHaveBeenCalledWith('access_token')
            expect(token).toBe(mockToken)
        })
    })

    describe('getTokenWhenReady', () => {
        it('calls auth.ready() and returns the access token', async () => {
            const {getTokenWhenReady} = useAccessToken()

            const result = await getTokenWhenReady()

            // eslint-disable-next-line @typescript-eslint/unbound-method
            const mockReady = mockedUseAuthContext().ready
            expect(mockReady).toHaveBeenCalled()
            expect(result).toBe(mockToken)
        })

        it('does not call auth.ready() immediately upon hook initialization', () => {
            useAccessToken()

            // eslint-disable-next-line @typescript-eslint/unbound-method
            const mockReady = mockedUseAuthContext().ready
            expect(mockReady).not.toHaveBeenCalled()
        })
    })
})
