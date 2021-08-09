/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/**
 * Filter out an image group from image groups based on size and selected variation attribute
 *
 * @param imageGroups - image groups to be filtered
 * @param options - contains size and selected variation attributes as filter criteria
 * @returns object
 */
export const filterImageGroups = (imageGroups, options) => {
    const {size, selectedVariationAttributes = {}} = options
    if (!imageGroups) return []
    const imageGroup = imageGroups
        .filter(({viewType}) => viewType === size)
        .find(({variationAttributes}) => {
            // if there is no variationAttributes in the imageGroups, no need to execute any further filter logic on it
            if (!variationAttributes && Object.keys(selectedVariationAttributes).length === 0) {
                return true
            }
            return (
                variationAttributes &&
                variationAttributes.every(({id, values}) => {
                    const valueValues = values.map(({value}) => value)
                    return valueValues.includes(selectedVariationAttributes[id])
                })
            )
        })
    return imageGroup
}
