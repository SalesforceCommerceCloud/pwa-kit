exports.template = ({proxyPath}) => `
import {SalesforceConnector} from '@mobify/commerce-integrations/dist/connectors/sfcc'

// Replace Mobify's demo config with the correct values for your backend:
export const getConnector = () => {
    return SalesforceConnector.fromConfig({
        basePath: \`\${
            typeof window === 'undefined' ? process.env.APP_ORIGIN : ''
        }/mobify/proxy/${proxyPath}/s/RefArch/dw/shop/v20_4\`,
        defaultHeaders: {
            'x-dw-client-id': 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
        }
    })
}

// Return any connector-specific constants for root category ids, etc.
export const getRootCategoryId = () => {
    return 'root'
}

export const getCarouselImageSizeType = () => {
    return 'large'
}

export const getCarouselImagePropertyVariation = () => {
    return 'color'
}
`
