/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {findImageGroupBy} from './image-groups-utils'

it.each([undefined, []])('returns undefined', (groups) => {
    expect(findImageGroupBy(groups, {})).toBeUndefined()
})

test('returns undefined for image groups with no size match', () => {
    expect(findImageGroupBy([{viewType: 'small'}], {viewType: 'large'})).toBeUndefined()
})

test('returns first match for image groups with no variationAttributes', () => {
    const groups = [{viewType: 'small'}]
    expect(findImageGroupBy(groups, {viewType: 'small'})).toBe(groups[0])
})

test('returns first match for image groups with empty variationAttributes', () => {
    const groups = [{viewType: 'small', variationAttributes: []}]
    expect(findImageGroupBy(groups, {viewType: 'small'})).toBe(groups[0])
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
    expect(findImageGroupBy(groups, {viewType: 'small'})).toBe(groups[0])
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
    expect(findImageGroupBy(groups, {viewType: 'small', selectedVariationValues: variation})).toBe(
        groups[0]
    )
})
