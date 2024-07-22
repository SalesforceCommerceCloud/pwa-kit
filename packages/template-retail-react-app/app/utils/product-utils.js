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

/**
 * Filters the provided product `ImageGroups` array with the optional filters.
 *
 * @param {ImageGroup[]} imageGroups
 * @param {object} filters
 * @param {string} filters.viewType
 * @param {object} filters.variationValues
 *
 * @returns {ImageGroup[]} filteredImageGroups
 */
export const filterImageGroups = (imageGroups = [], filters) => {
    if (!filters) {
        throw new Error(`Missing required "filters" argument`)
    }

    const {viewType, variationValues = {}} = filters
    // NOTE: For future feature enhancement compatibility we use an object for the `variationValues` as
    // we might want to filter on more than the one attribute id/value pair.
    const [selectedAttributeId, selectedAttributeValue] = Object.entries(variationValues)[0] || []

    // Filters
    const typeFilter = viewType ? (group) => group.viewType === viewType : () => true
    const attributeFilter =
        !!selectedAttributeId && !!selectedAttributeValue
            ? ({variationAttributes = []}) =>
                  variationAttributes.some(
                      ({id, values}) =>
                          id === selectedAttributeId &&
                          !!values.find(({value}) => value === selectedAttributeValue)
                  )
            : () => true

    return imageGroups?.filter(typeFilter)?.filter(attributeFilter)
}

/**
 * Provided a product this function will return the variation attibutes decorated with
 * `href` and `swatch` image for the given attribute values. This allows easier access
 * when creating components that commonly use this information.
 *
 * @param {Product} product
 * @param {object} opts
 * @param {string} opts.swatchViewType - The `viewTypeId` for the swatch image. Defaults to `swatch`.
 *
 * @returns {VariationAttributes[]} decoratedVariationAttributes
 */
export const getDecoratedVariationAttributes = (product, opts = {}) => {
    const swatchViewType = opts.swatchViewType || 'swatch'

    return product?.variationAttributes?.map((variationAttribute) => ({
        ...variationAttribute,
        values: variationAttribute.values.map((value) => {
            const variationValues = {[variationAttribute.id]: value.value}

            return {
                ...value,
                swatch: filterImageGroups(product.imageGroups, {
                    viewType: swatchViewType,
                    variationValues
                })?.[0]?.images[0],
                href: rebuildPathWithParams(
                    productUrlBuilder({id: product.productId}),
                    variationValues
                )
            }
        })
    }))
}

/**
 * Find the lowest price of a product, across all of its price books and promotions
 * @param {Object} product - product data from the API
 * @returns {Object|undefined} the lowest price for the given product. If it's a promotional price, the promotion will also be returned.
 */
export const findLowestPrice = (product) => {
    if (!product) return

    // Look at all of the variants, only if it's a master product.
    // i.e. when a shopper has narrowed down to a variant, do not look into other variants
    const isMaster = product.hitType === 'master' || !!product.type?.master
    if (isMaster && !product.variants) {
        console.warn(
            'Expecting `product.variants` to exist. For more accuracy, please tweak your API request to ask for the variants details.'
        )
    }
    const array = isMaster && product.variants ? product.variants : [product]

    const res = array.reduce(
        (prev, data) => {
            const promotions = data.productPromotions || []
            const [smallestPromotionalPrice, promo] = getSmallestValByProperty(
                promotions,
                'promotionalPrice'
            )

            let salePrice = data.price
            let promotion = null
            if (smallestPromotionalPrice && smallestPromotionalPrice < data.price) {
                salePrice = smallestPromotionalPrice
                promotion = promo
            }

            return salePrice < prev.minPrice ? {minPrice: salePrice, promotion, data} : prev
        },
        {minPrice: Infinity, promotion: null, data: null}
    )
    return {
        ...res,
        // when minPrice is infinity, meaning there is no variant with lowest price found, we rest the value to 0 as minPrice to be able to use this value on UI
        minPrice: res.minPrice === Infinity ? 0 : res.minPrice
    }
}

/**
 * @private
 * Find the smallest value by key from a given array
 * @returns {Array} an array of such smallest value and the item containing this value
 * @example
 * const [value, itemContainingValue] = getSmallestValByProperty(array, key)
 */
const getSmallestValByProperty = (arr, key) => {
    if (!arr || !arr.length) return []
    if (!key) {
        throw new Error('Please specify a key.')
    }
    const filtered = arr.filter((item) => {
        const value = item[key]
        return value === 0 || value === '0' ? true : Number(value)
    })
    if (filtered.length === 0) return []

    return filtered.reduce(
        (prev, item) => {
            const value = item[key]
            const [prevValue] = prev
            return value < prevValue ? [value, item] : prev
        },
        [Infinity, null]
    )
}
