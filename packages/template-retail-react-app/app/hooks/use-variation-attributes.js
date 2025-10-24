/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useMemo} from 'react'
import {useLocation} from 'react-router-dom'

// Other Hooks
import {useVariationParams} from '@salesforce/retail-react-app/app/hooks/use-variation-params'

// Utils
import {updateSearchParams} from '@salesforce/retail-react-app/app/utils/url'
import {usePDPSearchParams} from '@salesforce/retail-react-app/app/hooks/use-pdp-search-params'
import {filterImageGroups} from '@salesforce/retail-react-app/app/utils/product-utils'
/**
 * Return the first image in the `swatch` type image group for a given
 * variation value of a product.
 *
 * @param {Object} product
 * @param {Object} variationValue
 * @returns {Object} image
 */
export const getVariantValueSwatch = (product, variationValue) => {
    const {imageGroups = []} = product

    return filterImageGroups(imageGroups, {
        viewType: 'swatch',
        variationValues: {
            ['color']: variationValue.value
        }
    })?.[0]?.images?.[0]
}

/**
 * Build a product href
 *
 * @param {Object} product
 * @param {Object} params
 * @param {Object} location
 * @param {string} urlParamPrefix - Optional prefix for URL parameters
 * @returns {String} a product url for the current variation value.
 */
export const buildVariantValueHref = ({
    pathname,
    existingParams,
    newParams,
    productId,
    isProductPartOfSet,
    isProductPartOfBundle,
    urlParamPrefix = ''
}) => {
    const [allParams, productParams] = existingParams

    // Prefix the params if needed
    const prefixedParams = urlParamPrefix
        ? Object.entries(newParams).reduce((acc, [key, value]) => {
            acc[`${urlParamPrefix}${key}`] = value
            return acc
        }, {})
        : newParams

    if (isProductPartOfSet || isProductPartOfBundle) {
        updateSearchParams(productParams, prefixedParams)
        allParams.set(productId, productParams.toString())
    } else {
        updateSearchParams(allParams, prefixedParams)
    }

    return `${pathname}?${allParams.toString()}`
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
export const isVariantValueOrderable = (product, variationParams) => {
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
 * @param {boolean} isProductPartOfSet
 * @param {boolean} isProductPartOfBundle
 * @param {string} urlParamPrefix - Optional prefix for URL parameters
 * @returns {Array} a decorated variation attributes list.
 *
 */
export const useVariationAttributes = (
    product = {},
    isProductPartOfSet = false,
    isProductPartOfBundle = false,
    urlParamPrefix = ''
) => {
    const {variationAttributes = []} = product
    const location = useLocation()
    const variationParams = useVariationParams(product, isProductPartOfSet, isProductPartOfBundle, urlParamPrefix)
    const existingParams = usePDPSearchParams(product.id)
    const isBundleChildVariant = isProductPartOfBundle && product?.type?.variant

    // In the product bundle edit modal on the cart page, the variant ID of each bundle child is used as a key
    // for query parameters, so when a new variant is selected, a new query parameter is added since variants
    // have different IDs. The old one is not overwritten with existing logic so we remove it here
    if (isBundleChildVariant) {
        const [allParams] = existingParams
        product?.variants?.forEach(({productId: variantId}) => {
            if (variantId !== product.id && allParams.get(variantId)) {
                allParams.delete(variantId)
            }
        })
    }
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
                        href: buildVariantValueHref({
                            pathname: location.pathname,
                            existingParams,
                            newParams: params,
                            productId: product.id,
                            isProductPartOfSet,
                            isProductPartOfBundle,
                            urlParamPrefix
                        }),
                        orderable: isVariantValueOrderable(product, params)
                    }
                })
            })),
        [location.search, product, urlParamPrefix]
    )
}
