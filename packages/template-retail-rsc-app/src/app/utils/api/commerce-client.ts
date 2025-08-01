import {ShopperBaskets, ShopperLogin, ShopperProducts, ShopperSearch} from 'commerce-sdk-isomorphic'
import {type SessionData} from '@/app/utils/api/commerce-api'

type CommerceClientConfig = {
    clientId: string
    organizationId: string
    siteId: string
    shortCode: string
    locale: string
    currency: string
    proxy: string
    redirectURI: string
}

/**
 * Salesforce Commerce API client configuration.
 * This sets up the connection to the Salesforce B2C Commerce API.
 */
export const getClientConfig = (): CommerceClientConfig => {
    return {
        clientId: import.meta.env.VITE_COMMERCE_API_CLIENT_ID || '',
        organizationId: import.meta.env.VITE_COMMERCE_API_ORG_ID || '',
        shortCode: import.meta.env.VITE_COMMERCE_API_SHORT_CODE || '',
        siteId: import.meta.env.VITE_COMMERCE_API_SITE_ID || '',
        locale: import.meta.env.VITE_SITE_LOCALE || 'en-US',
        currency: import.meta.env.VITE_SITE_CURRENCY || 'USD',
        proxy: `${import.meta.env.VITE_COMMERCE_API_URL || ''}${
            import.meta.env.VITE_COMMERCE_API_PROXY || ''
        }`,
        redirectURI: `${import.meta.env.VITE_COMMERCE_API_URL || ''}${
            import.meta.env.VITE_COMMERCE_API_CALLBACK || ''
        }`
    }
}

// Base client factory with authentication
function createClient<T>(ClientClass: new (config: any) => T, session: SessionData): T {
    const {clientId, organizationId, shortCode, siteId, currency, locale, proxy} = getClientConfig()
    return new ClientClass({
        parameters: {
            clientId,
            organizationId,
            shortCode,
            siteId,
            currency,
            locale
        },
        headers: {
            authorization: `Bearer ${session.accessToken}`
        },
        throwOnBadResponse: true,
        proxy
    })
}

export const getSlasClient = (): ShopperLogin<CommerceClientConfig> => {
    const parameters = getClientConfig()
    return new ShopperLogin({
        parameters,
        throwOnBadResponse: true,
        proxy: parameters.proxy
    })
}

export const createShopperProductsClient = (session: SessionData) =>
    createClient(ShopperProducts, session)

export const createShopperBasketClient = (session: SessionData) =>
    createClient(ShopperBaskets, session)

export const createShopperSearchClient = (session: SessionData) =>
    createClient(ShopperSearch, session)
