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
 * @param {string} options.viewType - Typically this refers to image sizes like small, medium, large. But can vary based on your back-end configuration.
 * @param {Object} options.selectedVariationAttributes - A key/value object consisting of attibute id's and their values.
 * @returns {Object} - The ImageGroup matching the search criteria
 */
export const findImageGroupBy = (imageGroups = [], options) => {
    let {viewType, selectedVariationAttributes = {}} = options

    // Start by filtering out any imageGroup that isn't the correct viewType.
    imageGroups = imageGroups.filter(
        ({viewType: imageGroupViewType}) => imageGroupViewType === viewType
    )

    // Not all variation attributes are reflected in images. For example, you probably
    // won't have a separate image group for various sizes, but you might for colors. For that
    // reason we need to know what are valid attribute values to filter on.
    const refinableAttributeIds = [
        ...new Set(
            imageGroups
                .reduce((acc, {variationAttributes = []}) => [...acc, ...variationAttributes], [])
                .map(({id}) => id)
        )
    ]

    // Update the `selectedVariationAttributes` by filtering out the attributes that have no
    // representation in this imageGroup.
    selectedVariationAttributes = Object.keys(selectedVariationAttributes).reduce((acc, curr) => {
        return refinableAttributeIds.includes(curr)
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
