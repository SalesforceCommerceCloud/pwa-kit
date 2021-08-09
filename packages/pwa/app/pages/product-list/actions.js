import {pageMetaDataReceived, searchProducts, initializeApp} from '../../actions'

export const CATEGORY_LIST_UI_STATE_RECEIVED = 'CATEGORY_LIST_UI_STATE_RECEIVED'

export const updateCategoryUIState = (payload) => ({type: CATEGORY_LIST_UI_STATE_RECEIVED, payload})

const setPageMetaData = (productSearch) => (dispatch) => {
    return dispatch(
        pageMetaDataReceived({
            pageMetaData: {
                title: `${productSearch.results.length} results for "${productSearch.selectedFilters.categoryId}"`,
                keywords: productSearch.query,
                description: productSearch.query
            }
        })
    )
}

export const initialize = (query) => (dispatch) => {
    dispatch(
        updateCategoryUIState({
            searchRequest: query,
            error: null
        })
    )

    return Promise.all([dispatch(searchProducts(query)), dispatch(initializeApp())])
        .then(([productSearch]) => dispatch(setPageMetaData(productSearch)))
        .then(() => ({statusCode: 200}))
        .catch((err) => {
            dispatch(updateCategoryUIState({error: err.message}))
            return {statusCode: err.statusCode || 500}
        })
}
