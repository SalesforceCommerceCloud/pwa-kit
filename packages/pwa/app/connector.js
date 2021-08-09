/* global MOBIFY_CONNECTOR_NAME */
/* istanbul ignore file */

// This file ignored for coverage because it is replaced when a project is generated.

import {DemoConnector} from '@mobify/commerce-integrations/dist/connectors/demo-connector'

const connectorName = () => MOBIFY_CONNECTOR_NAME || 'scaffold'

const getWindow = (url) => {
    if (typeof window === 'undefined') {
        const jsdom = require('jsdom')
        const dom = new jsdom.JSDOM(``, {
            url,
            virtualConsole: new jsdom.VirtualConsole()
        })
        return dom.window
    } else {
        return window
    }
}

// IMPORTANT: "mobify-test-connector" is not a real module - this is a webpack
// trick to avoid compiling all connectors into the bundle when we only use one at a
// time - this is controlled by an environment variable.
//
// This hack doesn't make it into a generated project, because this file is replaced
// by the generator.

export const getConnector = () => {
    const name = connectorName()
    if (name === 'merlins') {
        const merlins = require('mobify-test-connector')
        const basePath = 'http://localhost:3000/mobify/proxy/base'
        return new merlins.MerlinsConnector({
            basePath,
            window: getWindow(basePath),
            dondeGeoBasePath: 'https://donde-geo-tools.herokuapp.com',
            dondeApiBasePath: 'https://api.donde.io'
        })
    } else if (name === 'sfcc') {
        const sfcc = require('mobify-test-connector')
        return sfcc.SalesforceConnector.fromConfig({
            basePath: `${
                typeof window === 'undefined' ? process.env.APP_ORIGIN : ''
            }/mobify/proxy/base2/s/RefArch/dw/shop/v20_4`,
            defaultHeaders: {
                'x-dw-client-id': 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
            }
        })
    } else {
        return new DemoConnector()
    }
}

export const getRootCategoryId = () => {
    return 'root'
}

export const getCarouselImageSizeType = () => {
    switch (connectorName()) {
        case 'merlins':
            return 'full'
        default:
            return 'large'
    }
}

export const getCarouselImagePropertyVariation = () => {
    return 'color'
}
