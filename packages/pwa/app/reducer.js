import {combineReducers} from 'redux'
import {reducer as formReducer} from 'redux-form'
import Immutable from 'immutable'

import app from 'progressive-web-sdk/dist/store/app/reducer'

import {
    // UI Action Types
    GLOBAL_UI_RECEIVED,
    // Data Action Types
    PAGE_METADATA_RECEIVED,
    CATEGORIES_RECEIVED,
    PRODUCTS_RECEIVED,
    PRODUCT_SEARCH_RECEIVED,
    ONLINE_STATUS_CHANGED
} from './actions'

// Page Reducers
import homeReducer from './pages/home/reducer'
import productDetailsReducer from './pages/product-details/reducer'
import productListReducer from './pages/product-list/reducer'

// Reducers
export const categories = (state = Immutable.Map(), action) => {
    switch (action.type) {
        case CATEGORIES_RECEIVED:
            return state.mergeDeep(action.payload)
        default:
            return state
    }
}

export const products = (state = Immutable.Map(), action) => {
    switch (action.type) {
        case PRODUCTS_RECEIVED:
            return state.mergeDeep(action.payload)
        default:
            return state
    }
}

export const productSearches = (state = Immutable.Map(), action) => {
    switch (action.type) {
        case PRODUCT_SEARCH_RECEIVED:
            return state.mergeDeep(action.payload)
        default:
            return state
    }
}

export const globals = (state = Immutable.Map(), action) => {
    switch (action.type) {
        case GLOBAL_UI_RECEIVED:
            return state.mergeDeep(action.payload)
        case PAGE_METADATA_RECEIVED:
            return state.mergeDeep(action.payload)
        default:
            return state
    }
}

export const offline = (state = Immutable.Map(), action) => {
    switch (action.type) {
        case ONLINE_STATUS_CHANGED:
            return state.mergeDeep(action.payload)
        default:
            return state
    }
}

export default combineReducers({
    app,
    offline,
    ui: combineReducers({
        globals,
        pages: combineReducers({
            home: homeReducer,
            productDetails: productDetailsReducer,
            productList: productListReducer
        })
    }),
    data: combineReducers({
        categories,
        products,
        productSearches
    }),
    form: formReducer
})
