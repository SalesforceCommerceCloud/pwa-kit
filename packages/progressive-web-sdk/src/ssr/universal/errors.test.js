/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import * as errors from './errors'

describe('Errors', () => {
    test('HTTP Errors should have a working toString()', () => {
        const status = 400
        const msg = 'This is a bad request'
        const err = new errors.HTTPError(status, msg)
        expect(err.toString()).toEqual(`HTTPError ${status}: ${msg}`)
    })
})
