import Immutable from 'immutable'
import {createSelector} from 'reselect'
import stringify from 'fast-json-stable-stringify'

import {getProductList, getCategories, getProductSearches} from '../../selectors'

export const getCategoryId = createSelector(getProductList, (uiState) =>
    uiState.getIn(['searchRequest', 'filters', 'categoryId'])
)

export const getCategory = createSelector(
    getCategories,
    getCategoryId,
    (categories, categoryId) => {
        return categories.get(categoryId)
    }
)

export const getCategoryBreadcrumb = createSelector(getCategory, (category) => {
    const list = [
        {
            text: 'Home',
            href: '/'
        }
    ]
    if (category) {
        list.push({
            text: category.get('name')
        })
    }
    return Immutable.fromJS(list)
})

export const getProductSearch = createSelector(
    getProductSearches,
    getProductList,
    (productSearches, productListUIState) =>
        productSearches.get(stringify(productListUIState.getIn(['searchRequest'])))
)

export const getErrorMessage = createSelector(getProductList, (productListUIState) =>
    productListUIState.get('error')
)
