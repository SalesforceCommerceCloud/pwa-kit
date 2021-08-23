/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Filter out an image group from image groups based on size and selected variation attribute
 *
 * @param imageGroups - image groups to be filtered
 * @param options - contains size and selected variation attributes as filter criteria
 * @returns object
 */
export const filterImageGroups = (imageGroups, options) => {
    const {size, selectedVariationAttributes = {}} = options

    if (!imageGroups || imageGroups.length === 0) return

    const sizeMatchedGroups = imageGroups.filter(({viewType}) => viewType === size)
    if (sizeMatchedGroups.length === 0) return

    // if there is no variationAttributes in the imageGroups, no need to execute any further filter logic on it
    if (
        sizeMatchedGroups[0].variationAttributes === 0 ||
        Object.keys(selectedVariationAttributes).length === 0
    ) {
        return sizeMatchedGroups[0]
    }

    return sizeMatchedGroups.find(({variationAttributes}) => {
        return (
            variationAttributes &&
            variationAttributes.every(({id, values}) => {
                const valueValues = values.map(({value}) => value)
                return valueValues.includes(selectedVariationAttributes[id])
            })
        )
    })
}
