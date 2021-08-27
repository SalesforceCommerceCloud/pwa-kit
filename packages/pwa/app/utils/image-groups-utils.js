/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Find the ImageGroup that matches the criteria supplied
 *
 * @param {Object} imageGroups - The product/variations image groups you want to search.
 * @param {Object} options - Search criteria to match on the ImageGroup object.
 * @param {string} options.viewType - contains size and selected variation attributes as filter criteria
 * @param {Object} options.selectedVariationAttributes - contains size and selected variation attributes as filter criteria
 * @returns {Object} - The ImageGroup matching the search criteria
 */
export const findImageGroupBy = (imageGroups = [], options) => {
    let {size, selectedVariationAttributes = {}} = options

    // Start by filtering out any imageGroup that isn't the correct viewType.
    imageGroups = imageGroups.filter(({viewType}) => viewType === size)

    // Not all variation attributes are reflected in images. For example, you probably
    // won't have a separate image group for various sizes, but you might for colors. For that
    // reason we need to know what are valid attribute values to filter on.
    const refineableAttributeIds = [
        ...new Set(
            imageGroups
                .reduce((acc, {variationAttributes = []}) => [...acc, ...variationAttributes], [])
                .map(({id}) => id)
        )
    ]

    // Update the `selectedVariationAttributes` by filtering out the attributes that have no
    // representation in this imageGroup.
    selectedVariationAttributes = Object.keys(selectedVariationAttributes).reduce((acc, curr) => {
        return refineableAttributeIds.includes(curr)
            ? {
                  ...acc,
                  [`${curr}`]: selectedVariationAttributes[curr]
              }
            : acc
    }, {})

    // Find the image group that has all the all the selected variation value attributes.
    imageGroups = imageGroups.find(({variationAttributes = []}) => {
        const selectedIds = Object.keys(selectedVariationAttributes)

        return selectedIds.every((selectedId) => {
            const selectedValue = selectedVariationAttributes[selectedId]

            return variationAttributes.find(
                ({id, values}) =>
                    id === selectedId && values.every(({value}) => value === selectedValue)
            )
        })
    })

    return imageGroups
}
