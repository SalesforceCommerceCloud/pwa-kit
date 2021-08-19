/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/**
 * Filter out an image group from image groups based on size and selected variation attribute
 *
 * @param imageGroups - image groups to be filtered
 * @param options - contains size and selected variation attributes as filter criteria
 * @returns object
 
export const filterImageGroups = (imageGroups, options) => {
    const {size, selectedVariationAttributes = {}} = options
    if (!imageGroups) return []
    const imageGroup = imageGroups
        .filter(({viewType}) => viewType === size)
        .find(({variationAttributes}) => {
            // if there is no variationAttributes in the imageGroups, no need to execute any further filter logic on it
            console.log(`va ${JSON.stringify(variationAttributes)}`)
            console.log(`sva ${JSON.stringify(selectedVariationAttributes)}`)
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
*/

import {filterImageGroups} from './image-groups-utils'
it.each([null, undefined, []])('returns undefined', (groups) => {
    expect(filterImageGroups(groups, {})).toBeUndefined()
})

test('returns undefined for image groups with no size match', () => {
    expect(filterImageGroups([{viewType: 'small'}], {size: 'large'})).toBeUndefined()
})

test('returns first match for image groups with no variationAttributes', () => {
    const groups = [{viewType: 'small'}]
    expect(filterImageGroups(groups, {size: 'small'})).toBe(groups[0])
})

test('returns first match for image groups with empty variationAttributes', () => {
    const groups = [{viewType: 'small', variationAttributes: []}]
    expect(filterImageGroups(groups, {size: 'small'})).toBe(groups[0])
})

test('returns first match for image groups with no selectedVariationAttributes', () => {
    const groups = [
        {
            viewType: 'small',
            variationAttributes: [
                {
                    id: 'color',
                    values: [
                        {
                            value: 'JJ825XX'
                        }
                    ]
                }
            ]
        }
    ]
    expect(filterImageGroups(groups, {size: 'small'})).toBe(groups[0])
})

test('returns first match for image groups with matching selectedVariationAttributes', () => {
    const variation = {
        id: 'color',
        values: [
            {
                value: 'JJ825XX'
            }
        ]
    }
    const groups = [
        {
            viewType: 'small',
            variationAttributes: [variation]
        }
    ]
    expect(filterImageGroups(groups, {size: 'small', selectedVariationValues: variation})).toBe(
        groups[0]
    )
})
