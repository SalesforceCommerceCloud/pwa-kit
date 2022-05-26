/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useMemo} from 'react'
import {useLocation} from 'react-router-dom'

// Other Hooks
import {useVariationParams} from './use-variation-params'

/**
 * Modifies a given url by adding/updating query parameters.
 *
 * @param {string} url - The base url of the output url set.
 * @param {object} extraParams - A key values pairing used to add static search param values.
 * @returns {string} A URL with additional params
 * @example
 * import {rebuildPathWithParams} from '/path/to/utils/url'
 *
 * rebuildPathWithParams(
 *     '/en-GB/product/25501032M',
 *     {color: 'JJ2SKXX', size: 'MD'}
 * )
 *
 * // Returns
 * // '/en-GB/product/25501032M?color=JJ2SKXX&size=9MD'
 */
export const rebuildPathWithParams = (url, extraParams) => {
    const [pathname, search] = url.split('?')
    const params = new URLSearchParams(search)

    // Apply any extra params.
    Object.keys(extraParams).forEach((key) => {
        const value = extraParams[key]

        // 0 is a valid value as for a param
        if (!value && value !== 0) {
            params.delete(key)
        } else {
            params.set(key, value)
        }
    })

    // Clean up any trailing `=` for params without values.
    const paramStr = params
        .toString()
        .replace(/=&/g, '&')
        .replace(/=$/, '')

    // Generate the newly updated url.
    return `${pathname}${Array.from(paramStr).length > 0 ? `?${paramStr}` : ''}`
}

/**
 * Return the first image in the `swatch` type image group for a given
 * variation value of a product.
 *
 * @param {Object} product
 * @param {Object} variationValue
 * @returns {Object} image
 */
const getVariantValueSwatch = (product, variationValue) => {
    const {imageGroups = []} = product

    const imageGroup = imageGroups
        .filter(({viewType}) => viewType === 'swatch')
        .find(({variationAttributes = []}) => {
            const colorAttribute = variationAttributes.find(({id}) => id === 'color')
            const colorValues = colorAttribute?.values || []

            // A single image can represent multiple variation values, so we only need
            // ensure the variation values appears in once of the images represented values.
            return colorValues.some(({value}) => value === variationValue.value)
        })

    return imageGroup?.images?.[0]
}

/**
 * Build a product href
 *
 * @param {Object} product
 * @param {Object} params
 * @param {Object} location
 * @returns {String} a product url for the current variation value.
 */
const buildVariantValueHref = (product, params, location) => {
    return rebuildPathWithParams(`${location.pathname}${location.search}`, params)
}

/**
 * Determine if a products variant attribute value is orderable without having to
 * load the variant in question, but filtering the list of variants with the
 * passed in attribute values.
 *
 * @param {Object} product
 * @param {Object} variationParams
 * @returns
 */
const isVariantValueOrderable = (product, variationParams) => {
    return product.variants
        .filter(({variationValues}) =>
            Object.keys(variationParams).every(
                (key) => variationValues[key] === variationParams[key]
            )
        )
        .some(({orderable}) => orderable)
}

/**
 * Use a decorated version of a product variation attributes. This version
 * will have the following additions: which variation attribute is selected,
 * each value will have a product url, the swatch image if there is one, and
 * an updated orderable flag.
 *
 * @param {Object} product
 * @returns {Array} a decorated variation attributes list.
 *
 */
export const useVariationAttributes = (product = {}) => {
    const {variationAttributes = []} = product
    const location = useLocation()
    const variationParams = useVariationParams(product)

    return useMemo(
        () =>
            variationAttributes.map((variationAttribute) => ({
                ...variationAttribute,
                selectedValue: {
                    name: variationAttribute.values.find(
                        ({value}) => value === variationParams?.[variationAttribute.id]
                    )?.name,
                    value: variationParams?.[variationAttribute.id]
                },
                values: variationAttribute.values.map((value) => {
                    const params = {
                        ...variationParams,
                        [variationAttribute.id]: value.value
                    }

                    return {
                        ...value,
                        image: getVariantValueSwatch(product, value),
                        href: buildVariantValueHref(product, params, location),
                        orderable: isVariantValueOrderable(product, params)
                    }
                })
            })),
        [location.search, product]
    )
}
