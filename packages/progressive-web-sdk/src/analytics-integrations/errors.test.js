/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* eslint no-unused-vars: 0 */ // Interfaces are empty, disable for whole file

import {ValidationError} from './errors'

describe('Error classes', () => {
    test('ValidationError', () => {
        expect(() => {
            throw new ValidationError('blah')
        }).toThrow(`Missing required field blah.`)
    })
})
