/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/**
 * @module progressive-web-sdk/dist/utils/uuid
 */
/**
 * Outputs a UUID. Credit to a user on Stack Overflow for this approach:
 * https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
 * @function
 * @returns {String}
 * @example
 * import uuid from from 'progressive-web-sdk/dist/utils/uuid-utils'
 *
 * uuid()
 * // '5eeba8b4-96a8-458a-bafa-a1765790bad1'
 */
const uuid = () =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0 // eslint-disable-line no-bitwise
        const v = c === 'x' ? r : (r & 0x3) | 0x8 // eslint-disable-line no-bitwise
        return v.toString(16)
    })

export default uuid
