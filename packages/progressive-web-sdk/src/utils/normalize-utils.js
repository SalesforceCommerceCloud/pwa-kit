/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/**
 * @module progressive-web-sdk/dist/utils/normalize-utils
 */
/**
 * Output the phone number format eg. "(123) 456-7890".
 * Based on the example here in "normalizePhone.js" section in
 * {@link http://redux-form.com/6.0.1/examples/normalizing/|Redux Form}.
 * @function
 * @param value {string} Expects a phone number numberic string
 * @param previousValue {string} The value of the field on which you have placed
 * the normalizer before the most recent change
 * @returns {String}
 * @example
 * import {normalizePhone} from 'progressive-web-sdk/dist/utils/normalize-utils'
 *
 * normalizePhone(6044315987)
 * // (604) 431-5987
 */

export const normalizePhone = (value, previousValue) => {
    if (!value) {
        return value
    }

    const onlyNums = value.replace(/^1|\D/g, '')

    const areaCode = onlyNums.slice(0, 3)
    const exchange = onlyNums.slice(3, 6)
    const lineNumber = onlyNums.slice(6, 10)

    console.log('onlyNums', onlyNums)
    console.log('previousValue', !previousValue)

    if (!previousValue || value.length > previousValue.length) {
        // typing forward
        if (onlyNums.length === 3) {
            return `(${areaCode}) `
        }

        if (onlyNums.length === 6) {
            return `(${areaCode}) ${exchange}-`
        }
    }

    if (onlyNums.length <= 3) {
        return `(${areaCode}`
    }

    if (onlyNums.length <= 6) {
        return `(${areaCode}) ${exchange}`
    }

    return `(${areaCode}) ${exchange}-${lineNumber}`
}
