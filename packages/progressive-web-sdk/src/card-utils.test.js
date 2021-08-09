/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {cardDataMap, registerCardDataMap, formatValuePattern} from './card-utils'

test('Register custom card data ', () => {
    const customCardData = {
        CustomCard: {
            match: '^(999)',
            format: {
                default: [4, 4, 4, 4]
            },
            cvv: {
                default: [3],
                iconName: 'default-hint'
            }
        }
    }

    registerCardDataMap(customCardData)
    expect(cardDataMap.CustomCard).toBe(customCardData.CustomCard)
})

test('formatValuePattern detects the special card expiry pattern', () => {
    expect(formatValuePattern('1223', [2, 2])).toBe('12/23')
})

test('formatValuePattern formats with a custom format pattern', () => {
    expect(formatValuePattern('12232', [2, 3])).toBe('12 232')
    expect(formatValuePattern('12233', [2, 2, 1])).toBe('12 23 3')
})

test('formatValuePattern outputs a blank string for falsey patterns', () => {
    // No format provided, no output!
    expect(formatValuePattern('12232', undefined)).toBe('')
    expect(formatValuePattern('12232', 0)).toBe('')
})
