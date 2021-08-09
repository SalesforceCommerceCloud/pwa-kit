/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Immutable from 'immutable'
import {convertStateObjectToStateImmutable} from './store-utils'

test('convertStateObjectToStateImmutable creates object with Immutable map key values', () => {
    const inputObject = {
        test: {
            key1: 'value1',
            key2: 'value2'
        }
    }
    const expectedObject = {
        test: Immutable.Map({
            key1: 'value1',
            key2: 'value2'
        })
    }

    expect(convertStateObjectToStateImmutable(inputObject)).toMatchObject(expectedObject)
})

test('convertStateObjectToStateImmutable converts fetchedPages value to a set', () => {
    const inputObject = {
        offline: {
            fetchedPages: ['1', '2', '3'],
            key2: 'value2'
        }
    }
    const expectedObject = {
        offline: Immutable.Map({
            fetchedPages: Immutable.Set(['1', '2', '3']),
            key2: 'value2'
        })
    }

    expect(convertStateObjectToStateImmutable(inputObject)).toMatchObject(expectedObject)
})

test('convertStateObjectToStateImmutable leaves UI branch an object and converts children to Immutable map', () => {
    const inputObject = {
        ui: {
            page1: {
                key1: 'value1',
                key2: 'value2'
            },
            page2: {
                key3: 'value3',
                key4: 'value4'
            }
        }
    }
    const expectedObject = {
        ui: {
            page1: Immutable.Map({
                key1: 'value1',
                key2: 'value2'
            }),
            page2: Immutable.Map({
                key3: 'value3',
                key4: 'value4'
            })
        }
    }

    expect(convertStateObjectToStateImmutable(inputObject)).toMatchObject(expectedObject)
})
