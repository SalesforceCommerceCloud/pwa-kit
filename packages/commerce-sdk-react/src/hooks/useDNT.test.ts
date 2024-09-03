/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useEffect} from 'react'
import {waitFor} from '@testing-library/react'
import Cookies from 'js-cookie'
import useDNT from './useDNT'
import useAuthContext from './useAuthContext'
import {getDefaultCookieAttributes} from '../utils'
import {renderHookWithProviders} from '../test-utils'

jest.mock('js-cookie')
jest.mock('./useAuthContext')
jest.mock('../auth')
const mockedUseAuthContext = useAuthContext as jest.MockedFunction<typeof Object>
const mockCookiesSet = jest.spyOn(Cookies, 'set')

describe('useDNT tests', () => {
    beforeEach(() => {
        mockedUseAuthContext.mockReset()
        mockedUseAuthContext.mockReturnValueOnce({
            refreshAccessToken: jest.fn(),
            get: (param: string) => {
                if (param === 'customer_type') return 'registered'
                if (param === 'refresh_token_expires_in') return 7776000
            }
        })
        Cookies.get = jest.fn().mockImplementationOnce(() => '1')
    })

    it('updateDNT should create dw_dnt cookie', () => {
        renderHookWithProviders(() => {
            const {dntNotSet, updateDNT} = useDNT()
            dntNotSet // Just to pass linting

            useEffect(() => {
                void (async () => {
                    await updateDNT(true)
                })()
            }, [])
        })
        expect(mockCookiesSet).toHaveBeenCalledWith('dw_dnt', '1', {
            ...getDefaultCookieAttributes()
        })
    })

    it('dw_dnt cookie with expiry time based on refresh token when expireOnBrowserClose not given', async () => {
        renderHookWithProviders(() => {
            const {dntNotSet, updateDNT} = useDNT()
            dntNotSet // Just to pass linting
            useEffect(() => {
                void (async () => {
                    await updateDNT(true)
                })()
            }, [])
        })
        await waitFor(() => {
            expect(mockCookiesSet).toHaveBeenNthCalledWith(2, 'dw_dnt', '1', {
                ...getDefaultCookieAttributes(),
                expires: 90
            })
        })
    })

    it('dw_dnt cookie is set to 0 when updateDNT(false)', async () => {
        renderHookWithProviders(() => {
            const {dntNotSet, updateDNT} = useDNT()
            dntNotSet // Just to pass linting
            useEffect(() => {
                void (async () => {
                    await updateDNT(false)
                })()
            }, [])
        })
        await waitFor(() => {
            expect(mockCookiesSet).toHaveBeenNthCalledWith(2, 'dw_dnt', '0', {
                ...getDefaultCookieAttributes(),
                expires: 90
            })
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
            defaultDnt: true
        })
        Cookies.get = jest.fn().mockImplementationOnce(() => '1')
        renderHookWithProviders(() => {
            const {dntNotSet, updateDNT} = useDNT()
            dntNotSet // Just to pass linting
            useEffect(() => {
                void (async () => {
                    await updateDNT(null)
                })()
            }, [])
        })
        await waitFor(() => {
            expect(mockCookiesSet).toHaveBeenNthCalledWith(1, 'dw_dnt', '1', {
                ...getDefaultCookieAttributes()
            })
            expect(mockCookiesSet).toHaveBeenCalledTimes(1)
        })
    })

    it('dw_dnt cookie value is SLAS default if preference is null and defaultDnt is not given', async () => {
        mockedUseAuthContext.mockReset()
        mockedUseAuthContext.mockReturnValueOnce({
            refreshAccessToken: jest.fn(),
            get: (something: string) => {
                if (something === 'customer_type') return 'guest'
                if (something === 'refresh_token_expires_in') return 2592000
            },
            defaultDnt: undefined
        })
        Cookies.get = jest.fn().mockImplementationOnce(() => '1')
        renderHookWithProviders(() => {
            const {dntNotSet, updateDNT} = useDNT()
            dntNotSet // Just to pass linting
            useEffect(() => {
                void (async () => {
                    await updateDNT(null)
                })()
            }, [])
        })
        await waitFor(() => {
            expect(mockCookiesSet).toHaveBeenNthCalledWith(1, 'dw_dnt', '0', {
                ...getDefaultCookieAttributes()
            })
            expect(mockCookiesSet).toHaveBeenCalledTimes(1)
        })
    })

    it('dntNotSet should be false if dw_dnt cookie is defined', () => {
        renderHookWithProviders(() => {
            const {dntNotSet, updateDNT} = useDNT()
            updateDNT // Just to pass linting
            expect(dntNotSet).toBe(false)
        })
    })

    it('dntNotSet should be true if dw_dnt cookie is not defined', () => {
        Cookies.get = jest.fn().mockImplementationOnce(() => undefined)
        renderHookWithProviders(() => {
            const {dntNotSet, updateDNT} = useDNT()
            updateDNT // Just to pass linting
            expect(dntNotSet).toBe(true)
        })
    })
})
