import Immutable from 'immutable'
import {createSelector} from 'reselect'
import {createGetSelector} from 'reselect-immutable-helpers'
import {getRootCategoryId} from './connector'

const MAX_TOPLEVEL_CATEGORIES = 5

// Base UI Selectors
export const getUI = ({ui}) => ui
export const getGlobals = createSelector(getUI, ({globals}) => globals)
export const getPageMetaData = createGetSelector(getGlobals, 'pageMetaData')
export const getPages = createSelector(getUI, ({pages}) => pages)
export const getHome = createSelector(getPages, ({home}) => home)
export const getProductDetails = createSelector(getPages, ({productDetails}) => productDetails)
export const getProductList = createSelector(getPages, ({productList}) => productList)

// Base Data Selectors
export const getData = ({data}) => data
export const getCategories = createSelector(getData, ({categories}) => categories)
export const getProducts = createSelector(getData, ({products}) => products)
export const getProductSearches = createSelector(getData, ({productSearches}) => productSearches)

// Offline Selectors
export const getOffline = ({offline}) => offline
export const getOfflineModeStartTime = createGetSelector(getOffline, 'startTime')

/**
 * Utility function will convert a category into an object the navigation component
 * understands.
 *
 */
export const convertCategoryToNode = (category) =>
    Immutable.fromJS({
        title: category.get('name'),
        path: category.get('id') === getRootCategoryId() ? '/' : `/category/${category.get('id')}`,
        children: (category.get('categories') || Immutable.List()).map(convertCategoryToNode)
    })

// Navigation Selectors
export const getNavigationRoot = createSelector(getCategories, (categories) => {
    const rootCategory = categories.get(getRootCategoryId())

    return rootCategory
        ? convertCategoryToNode(rootCategory)
        : Immutable.fromJS({
              title: 'root',
              path: '/'
          })
})

export const getNavigationRootDesktop = createSelector(getNavigationRoot, (navRoot) => {
    const navRootJs = navRoot.toJS()

    if (navRootJs.children && navRootJs.children.length > MAX_TOPLEVEL_CATEGORIES) {
        navRootJs.children = [
            ...navRootJs.children.slice(0, MAX_TOPLEVEL_CATEGORIES),
            {
                title: 'More',
                path: '/more', // This is set only to ensure the sub menu is expandable.
                children: navRootJs.children.slice(MAX_TOPLEVEL_CATEGORIES)
            }
        ]
    }

    return Immutable.fromJS(navRootJs)
})
