import {createSelector} from 'reselect'

// This is where all the selectors will live for any data model in the
// API.
export const getAPI = ({data}) => data
export const getCart = createSelector(
    getAPI,
    ({cart}) => cart
)
export const getCategories = createSelector(
    getAPI,
    ({categories}) => categories
)
export const getCustomer = createSelector(
    getAPI,
    ({customer}) => customer
)
export const getOrders = createSelector(
    getAPI,
    ({orders}) => orders
)
export const getProducts = createSelector(
    getAPI,
    ({products}) => products
)
export const getProductSearches = createSelector(
    getAPI,
    ({productSearches}) => productSearches
)
export const getStores = createSelector(
    getAPI,
    ({stores}) => stores
)
export const getStoreSearches = createSelector(
    getAPI,
    ({storeSearches}) => storeSearches
)
