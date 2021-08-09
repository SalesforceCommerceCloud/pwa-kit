/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/**
 * Builds a list of modified Urls with the provided params key and values,
 * preserving any search params provided in the original url.Optionally
 * you can pass and object used to set static params values.
 * @param {string} url - The base url of the output url set.
 * @param {string} key - The search params for the associated values
 * @param {Array} values - The search param values
 * @param {object} extraParams - A key values pairing used to add static search param values.
 * @returns {string[]} A list of URLs
 * @example
 * import {buildUrlSet} from '/path/to/utils/url'
 *
 * buildUrlSet(
 *     '/womens/clothing',
 *     'sort',
 *     ['price-high-to-low', 'price-low-to-high'],
 *     {offset: 0}
 * )
 *
 * // Returns
 * // ['/womens/clothing?sort=price-high-to-low', '/womens/clothing?sort=price-low-to-high']
 */
export const buildUrlSet = (url = '', key = '', values = [], extraParams = {}) => {
    const [pathname, search] = url.split('?')
    const params = new URLSearchParams(search)

    const urls = values.map((value) => {
        // Update the parameter value.
        params.set(key, value)

        // Apply any extra params.
        Object.keys(extraParams).forEach((key) => params.set(key, extraParams[key]))

        // Clean up any trailing `=` for params without values.
        const paramStr = params
            .toString()
            .replace(/=&/g, '&')
            .replace(/=$/, '')

        // Generate the newly updated url.
        return `${pathname}?${paramStr}`
    })

    return urls
}

/**
 * Given a category and the current locale refutn an href to the product list page.
 *
 * @param {Object} category
 * @param {string} local
 * @returns {string}
 */
export const categoryUrlBuilder = (category, local = 'en') =>
    encodeURI(`/${local}/category/${category.id}`)

/**
 * Given a product and the current locale refutn an href to the product detail page.
 *
 * @param {Object} product
 * @param {string} local
 * @returns {string}
 */
export const productUrlBuilder = (product, local = 'en') =>
    encodeURI(`/${local}/product/${product.id}`)
