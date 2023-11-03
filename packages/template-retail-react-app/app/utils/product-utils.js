/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Get the human-friendly version of the variation values that users have selected.
 * Useful for displaying these values in the UI.
 *
 * @param {Object} variationAttributes - The products variation attributes.
 * @param {Object} values - The variations selected attribute values.
 * @returns {Object} - A key value map of the display name and display value.
 *
 * @example
 * const displayValues = getDisplayVariationValues(
 *     [ { "id": "color", "name": "Colour", "values": [ { "name": "royal", "orderable": true, "value": "JJ5FUXX" } ] } ],
 *     { "color": "JJ5FUXX" }
 * )
 * // returns { "Colour": "royal" }
 */
export const getDisplayVariationValues = (variationAttributes, values = {}) => {
    const returnVal = Object.entries(values).reduce((acc, [id, value]) => {
        const attribute = variationAttributes.find(({id: attributeId}) => attributeId === id)
        const attributeValue = attribute.values.find(
            ({value: attributeValue}) => attributeValue === value
        )
        return {
            ...acc,
            [attribute.name]: attributeValue.name
        }
    }, {})
    return returnVal
}

/**
 * Normalizes data for product sets and product bundles into the same format
 * Useful for operations that apply to both product sets and product bundles
 *
 * @param {Object} product - A product set or product bundle
 * @returns {Object} - returns normalized product if product is a set/bundle, otherwise returns original product
 */
export const normalizeSetBundleProduct = (product) => {
    if (!product?.type.set && !product?.type.bundle) return product
    return {
        ...product,
        childProducts: product?.type.set
            ? product.setProducts.map((child) => {
                  return {product: child, quantity: null}
              })
            : product.bundledProducts
    }
}

/**
 * This function extract the promotional price from a product. If there are more than one price, the smallest price will be picked
 * @param {object} product - product detail object
 * @returns {{discountPrice: number, basePrice: number | string}}
 */
export const getDisplayPrice = (product) => {
    const basePrice = product?.pricePerUnit || product?.price
    const promotionalPriceList = product?.productPromotions
        ?.map((promo) => promo.promotionalPrice)
        .filter((i) => i !== null && i !== undefined)
    // choose the smallest price among the promotionalPrice
    const discountPrice = promotionalPriceList?.length ? Math.min(...promotionalPriceList) : null
    return {
        basePrice,
        discountPrice
    }
}
