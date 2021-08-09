/* global MOBIFY_CONNECTOR_NAME */
/* istanbul ignore file */

// This file ignored for coverage because it is replaced when a project is generated.

import Connector from 'scaffold-connector/dist'

const isUniversal = window.Progressive && window.Progressive.isUniversal
const connectorName = () => MOBIFY_CONNECTOR_NAME || 'scaffold'

export const getConnector = () => {
    switch (connectorName()) {
        case 'merlins':
            return import('@mobify/commerce-integrations/dist/connectors/merlins').then(
                (module) => {
                    return new module.MerlinsConnector({
                        window,
                        basePath: isUniversal
                            ? `/mobify/proxy/base/`
                            : `https://www.merlinspotions.com/`,
                        dondeGeoBasePath: 'https://donde-geo-tools.herokuapp.com',
                        dondeApiBasePath: 'https://api.donde.io'
                    })
                }
            )

        case 'hybris':
            return import('@mobify/commerce-integrations/dist/connectors/hybris').then((module) => {
                return module.HybrisConnector.fromConfig({
                    clientConfig: {
                        basePath: `https://hybris.merlinspotions.com/rest/v2/apparel-uk/`,
                        defaultHeaders: {},
                        timeout: 60000,
                        cache: true,
                        enableCookies: false,
                        access_token: ''
                    },
                    catalogId: 'apparelProductCatalog',
                    catalogVersionId: 'Online',
                    authentication: {
                        authorizationUrl: `https://hybris.merlinspotions.com/authorizationserver/oauth/token`,
                        clientId: 'mobile_android',
                        clientSecret: 'secret'
                    }
                })
            })

        case 'sfcc':
            return import('@mobify/commerce-integrations/dist/connectors/sfcc').then((module) => {
                return module.SalesforceConnector.fromConfig({
                    basePath: isUniversal
                        ? `/mobify/proxy/base2/s/2017refresh/dw/shop/v17_8`
                        : `https://mobify-tech-prtnr-na03-dw.demandware.net/s/2017refresh/dw/shop/v17_8`,
                    defaultHeaders: {
                        'x-dw-client-id': '5640cc6b-f5e9-466e-9134-9853e9f9db93'
                    }
                })
            })

        default:
            // DO NOT lazy-load this. Keeping it in is a proper representation of the
            // bundle size of a generated project.
            return Promise.resolve(new Connector({window}))
    }
}

export const getRootCategoryId = () => {
    switch (connectorName()) {
        case 'hybris':
            return 'categories'
        default:
            return 'root'
    }
}

export const getCarouselImageSizeType = () => {
    switch (connectorName()) {
        case 'hybris':
            return 'product'
        default:
            return 'large'
    }
}

export const getCarouselImagePropertyVariation = () => {
    switch (connectorName()) {
        case 'hybris':
            return 'style'
        default:
            return 'color'
    }
}
