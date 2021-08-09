exports.template = () => `
import {DemoConnector} from '@mobify/commerce-integrations/dist/connectors/demo-connector'

export const getConnector = () => new DemoConnector()

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
