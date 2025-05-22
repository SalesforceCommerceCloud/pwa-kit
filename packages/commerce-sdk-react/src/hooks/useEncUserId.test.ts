/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useEncUserId from './useEncUserId'
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

describe('useEncUserId', () => {
    const mockEncUserId = 'test-enc-user-id'
    const mockSiteId = 'test-site-id'

    beforeEach(() => {
        jest.resetAllMocks()

        mockedUseConfig.mockReturnValue({
            siteId: mockSiteId
        } as any)

        // Mock the auth context to properly handle calls to ready() and get()
        mockedUseAuthContext.mockReturnValue({
            ready: jest.fn().mockImplementation(() => {
                return Promise.resolve({enc_user_id: mockEncUserId})
            }),
            get: jest.fn().mockImplementation((key) => {
                if (key === 'enc_user_id') return mockEncUserId
                return null
            })
        } as any)

        mockedUseLocalStorage.mockReturnValue(mockEncUserId)
    })

    describe('client-side', () => {
        beforeEach(() => {
            // Mock onClient to return true (client environment)
            mockedOnClient.mockReturnValue(true)
        })

        it('uses localStorage for encUserId on client-side', () => {
            const {encUserId} = useEncUserId()

            expect(mockedOnClient).toHaveBeenCalled()
            expect(mockedUseLocalStorage).toHaveBeenCalledWith(`enc_user_id_${mockSiteId}`)
            expect(encUserId).toBe(mockEncUserId)
        })

        it('returns null when localStorage returns null', () => {
            mockedUseLocalStorage.mockReturnValueOnce(null)

            const {encUserId} = useEncUserId()

            expect(encUserId).toBeNull()
        })
    })

    describe('server-side', () => {
        beforeEach(() => {
            // Mock onClient to return false (server environment)
            mockedOnClient.mockReturnValue(false)
        })

        it('uses auth.get for encUserId on server-side', () => {
            const {encUserId} = useEncUserId()

            expect(mockedOnClient).toHaveBeenCalled()
            // eslint-disable-next-line @typescript-eslint/unbound-method
            const mockGet = mockedUseAuthContext().get
            expect(mockGet).toHaveBeenCalledWith('enc_user_id')
            expect(encUserId).toBe(mockEncUserId)
        })

        it('returns null when auth.get returns null', () => {
            mockedUseAuthContext.mockReturnValue({
                ready: jest.fn().mockResolvedValue({enc_user_id: mockEncUserId}),
                get: jest.fn().mockReturnValue(null)
            } as any)

            const {encUserId} = useEncUserId()

            expect(encUserId).toBeNull()
        })
    })

    describe('getEncUserIdWhenReady', () => {
        it('calls auth.ready() and returns the enc_user_id', async () => {
            const {getEncUserIdWhenReady} = useEncUserId()

            const result = await getEncUserIdWhenReady()

            // eslint-disable-next-line @typescript-eslint/unbound-method
            const mockReady = mockedUseAuthContext().ready
            expect(mockReady).toHaveBeenCalled()
            expect(result).toBe(mockEncUserId)
        })

        it('does not call auth.ready() immediately upon hook initialization', () => {
            useEncUserId()

            // eslint-disable-next-line @typescript-eslint/unbound-method
            const mockReady = mockedUseAuthContext().ready
            expect(mockReady).not.toHaveBeenCalled()
        })
    })
})
