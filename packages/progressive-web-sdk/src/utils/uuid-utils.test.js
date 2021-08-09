/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import uuid from './uuid-utils'

describe('The `uuid()` function', () => {
    test('returns a string 36 characters long', () => {
        const string = uuid()
        expect(string.length).toBe(36)
    })

    test('should output different values each time it is run', () => {
        const test1 = uuid()
        const test2 = uuid()
        expect(test1).not.toBe(test2)
    })
})
