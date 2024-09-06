/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useEffect} from 'react'
import {waitFor} from '@testing-library/react'
import useDNT from './useDNT'
import useAuthContext from './useAuthContext'
import useConfig from './useConfig'
import {renderHookWithProviders} from '../test-utils'

jest.mock('js-cookie')
jest.mock('./useAuthContext')
jest.mock('./useConfig')
jest.mock('../auth')
const mockedUseAuthContext = useAuthContext as jest.MockedFunction<typeof Object>
const mockedUseConfig = useConfig as jest.MockedFunction<typeof Object>
const mockSetDnt = jest.fn()
const mockGetDnt = jest.fn()

describe('useDNT tests', () => {
    beforeEach(() => {
        mockedUseConfig.mockReset()
        mockGetDnt.mockReset()
        mockedUseAuthContext.mockReset()
        mockGetDnt.mockReturnValue('1')
        mockedUseAuthContext.mockReturnValue({
            refreshAccessToken: jest.fn(),
            get: (param: string) => {
                if (param === 'customer_type') return 'registered'
                if (param === 'refresh_token_expires_in') return 7776000
            },
            getDnt: mockGetDnt,
            setDnt: mockSetDnt,
            parseSlasJWT: () => {
                return {dnt: '1'}
            }
        })
        mockedUseConfig.mockReturnValueOnce({
            defaultDnt: true
        })
    })

    it('updateDNT should create dw_dnt cookie', () => {
        renderHookWithProviders(() => {
            const {updateDNT} = useDNT()

            useEffect(() => {
                void (async () => {
                    await updateDNT(true)
                })()
            }, [])
        })
        expect(mockSetDnt).toHaveBeenCalledWith('1')
    })

    it('dw_dnt cookie with expiry time based on refresh token when preference given', async () => {
        renderHookWithProviders(() => {
            const {updateDNT} = useDNT()
            useEffect(() => {
                void (async () => {
                    await updateDNT(true)
                })()
            }, [])
        })
        await waitFor(() => {
            expect(mockSetDnt).toHaveBeenNthCalledWith(2, '1', 7776000)
        })
    })

    it('dw_dnt cookie is set to 0 when preference is false', async () => {
        renderHookWithProviders(() => {
            const {updateDNT} = useDNT()
            useEffect(() => {
                void (async () => {
                    await updateDNT(false)
                })()
            }, [])
        })
        await waitFor(() => {
            expect(mockSetDnt).toHaveBeenNthCalledWith(2, '0', 7776000)
        })
    })

    it('dw_dnt cookie value is defaultDnt if preference is null and defaultDnt was given', async () => {
        mockedUseAuthContext.mockReset()
        mockedUseAuthContext.mockReturnValueOnce({
            refreshAccessToken: jest.fn(),
            get: (something: string) => {
                if (something === 'customer_type') return 'guest'
                if (something === 'refresh_token_expires_in') return 2592000
            },
            getDnt: mockGetDnt,
            setDnt: mockSetDnt,
            parseSlasJWT: () => {
                return {dnt: '1'}
            }
        })

        renderHookWithProviders(() => {
            const {updateDNT} = useDNT()
            useEffect(() => {
                void (async () => {
                    await updateDNT(null)
                })()
            }, [])
        })
        await waitFor(() => {
            expect(mockSetDnt).toHaveBeenNthCalledWith(1, '1')
            expect(mockSetDnt).toHaveBeenCalledTimes(1)
        })
    })

    it('dw_dnt cookie value is SLAS default if preference is null and defaultDnt is not given', async () => {
        mockedUseAuthContext.mockReset()
        mockedUseConfig.mockReset()
        mockedUseAuthContext.mockReturnValueOnce({
            refreshAccessToken: jest.fn(),
            get: (something: string) => {
                if (something === 'customer_type') return 'guest'
                if (something === 'refresh_token_expires_in') return 2592000
            },
            getDnt: mockGetDnt,
            setDnt: mockSetDnt,
            parseSlasJWT: () => {
                return {dnt: '1'}
            }
        })
        mockedUseConfig.mockReturnValueOnce({
            defaultDnt: undefined
        })
        renderHookWithProviders(() => {
            const {updateDNT} = useDNT()
            useEffect(() => {
                void (async () => {
                    await updateDNT(null)
                })()
            }, [])
        })
        await waitFor(() => {
            expect(mockSetDnt).toHaveBeenNthCalledWith(1, '0')
            expect(mockSetDnt).toHaveBeenCalledTimes(1)
        })
    })

    it('dntStatus should be false if dw_dnt cookie is "1"', () => {
        renderHookWithProviders(() => {
            const {dntStatus} = useDNT()
            expect(dntStatus).toBe(true)
        })
    })

    it('dntStatus should be false if dw_dnt cookie is "0"', () => {
        mockGetDnt.mockReset()
        mockGetDnt.mockReturnValue('0')
        renderHookWithProviders(() => {
            const {dntStatus} = useDNT()
            expect(dntStatus).toBe(false)
        })
    })

    it('dntStatus should be undefined if dw_dnt cookie is not defined', () => {
        mockGetDnt.mockReset()
        mockGetDnt.mockReturnValueOnce(undefined)
        renderHookWithProviders(() => {
            const {dntStatus} = useDNT()
            expect(dntStatus).toBeUndefined()
        })
    })

    it('dntStatus should be undefined if dw_dnt cookie is invalid', () => {
        mockGetDnt.mockReset()
        mockGetDnt.mockReturnValueOnce('invalidValue')
        renderHookWithProviders(() => {
            const {dntStatus} = useDNT()
            expect(dntStatus).toBeUndefined()
        })
    })
})
