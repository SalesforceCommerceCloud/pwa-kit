/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useUsid from './useUsid'
import useAuthContext from './useAuthContext'

jest.mock('./useAuthContext')

const mockedUseAuthContext = useAuthContext as jest.MockedFunction<typeof useAuthContext>

describe('useUsid', () => {
    const mockUsid = 'test-usid-12345'

    beforeEach(() => {
        jest.resetAllMocks()

        // Mock the auth context to properly handle calls to ready() and get()
        mockedUseAuthContext.mockReturnValue({
            ready: jest.fn().mockImplementation(() => {
                return Promise.resolve({usid: mockUsid})
            }),
            get: jest.fn().mockImplementation((key) => {
                if (key === 'usid') return mockUsid
                return null
            })
        } as any)
    })

    describe('usid', () => {
        it('returns usid from auth.get()', () => {
            const {usid} = useUsid()

            // eslint-disable-next-line @typescript-eslint/unbound-method
            const mockGet = mockedUseAuthContext().get
            expect(mockGet).toHaveBeenCalledWith('usid')
            expect(usid).toBe(mockUsid)
        })

        it('returns null when auth.get returns null', () => {
            mockedUseAuthContext.mockReturnValue({
                ready: jest.fn().mockResolvedValue({usid: mockUsid}),
                get: jest.fn().mockReturnValue(null)
            } as any)

            const {usid} = useUsid()

            expect(usid).toBeNull()
        })
    })

    describe('getUsidWhenReady', () => {
        it('calls auth.ready() and returns the usid', async () => {
            const {getUsidWhenReady} = useUsid()

            const result = await getUsidWhenReady()

            // eslint-disable-next-line @typescript-eslint/unbound-method
            const mockReady = mockedUseAuthContext().ready
            expect(mockReady).toHaveBeenCalled()
            expect(result).toBe(mockUsid)
        })

        it('does not call auth.ready() immediately upon hook initialization', () => {
            useUsid()

            // eslint-disable-next-line @typescript-eslint/unbound-method
            const mockReady = mockedUseAuthContext().ready
            expect(mockReady).not.toHaveBeenCalled()
        })
    })
})
