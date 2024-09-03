import React, {useEffect} from 'react';
import Cookies from 'js-cookie';
import useDNT from './useDNT'
import useAuthContext from './useAuthContext';
import {getDefaultCookieAttributes} from '../utils'
import {
    renderHookWithProviders
} from '../test-utils'

jest.mock('js-cookie');
jest.mock('./useAuthContext')
jest.mock('../auth')
const mockedUseAuthContext = useAuthContext as jest.MockedFunction<typeof Object>;
const mockedCookiesGet = Cookies.get as jest.MockedFunction<typeof Object>;
mockedUseAuthContext.mockReturnValue({
    refreshAccessToken: jest.fn(),
    get: (something: string) => {
        if (something === "customer_type")
            return "registered"
        if (something === "refresh_token_expires_in") 
            return 7776000
    }
})
mockedCookiesGet.mockReturnValue("1")

describe('useDNT tests', () => {
    it('updateDNT should create dw_dnt cookie', async () => {
        renderHookWithProviders(() => {
            const {dntNotSet, updateDNT} = useDNT()

            useEffect( () => {
                updateDNT(true)
            }, [])
        })
        expect(Cookies.set).toHaveBeenCalledWith("dw_dnt", "1", { 
            ...getDefaultCookieAttributes()
        });
    });
    
    it('updateDNT should create dw_dnt cookie with expiry time based on refresh token', async () => {
        renderHookWithProviders(() => {
            const {dntNotSet, updateDNT} = useDNT()

            useEffect( () => {
                updateDNT(true)
            }, [])
        })
        expect(Cookies.set).toHaveBeenCalledWith("dw_dnt", "1", { 
            ...getDefaultCookieAttributes(),
            expires: 90
        });
    });

    it('dntNotSet should be false if dw_dnt cookie is defined', async () => {
        renderHookWithProviders(() => {
            const {dntNotSet, updateDNT} = useDNT()
            expect(dntNotSet).toEqual(false)
        })
    });

    it('dntNotSet should be true if dw_dnt cookie is not defined', async () => {
        mockedCookiesGet.mockReturnValue(undefined)
        renderHookWithProviders(() => {
            const {dntNotSet, updateDNT} = useDNT()
            expect(dntNotSet).toEqual(true)
        })
    });
});