import {getProduct, pageMetaDataReceived, initializeApp} from '../../actions'

export const PRODUCT_DETAILS_UI_STATE_RECEIVED = 'PRODUCT_UI_STATE_RECEIVED'

export const updateProductUIState = (payload) => ({
    type: PRODUCT_DETAILS_UI_STATE_RECEIVED,
    payload
})

const setPageMetaData = (product) => (dispatch) =>
    dispatch(
        pageMetaDataReceived({
            pageMetaData: {
                title: product.name,
                description: product.description
            }
        })
    )

export const initialize = (productId) => (dispatch) => {
    // Grab the information we know about this product that needs to be in the ui
    // state. At the same time, reset any state that needs to be reset.
    const uiState = {
        productId,
        variationValues: undefined,
        error: undefined
    }

    // Update the UI information base on our findings in the url.
    dispatch(updateProductUIState(uiState))

    return Promise.all([
        dispatch(initializeApp()),
        dispatch(getProduct(productId)).then((product) => dispatch(setPageMetaData(product)))
    ])
        .then(() => ({statusCode: 200}))
        .catch((err) => {
            dispatch(updateProductUIState({error: err.message}))
            return {statusCode: err.statusCode || 500}
        })
}
