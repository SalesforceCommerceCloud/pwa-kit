/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Immutable from 'immutable'
import * as reducerUtils from './reducer-utils'

test('mergeSkipLists results in removed items when payload list is smaller than state list', () => {
    const payload = Immutable.fromJS({
        list: [1, 2]
    })
    const state = Immutable.fromJS({
        list: [1, 2, 3]
    })

    expect(reducerUtils.skipListsMerger(state, payload).get('list').size).toBe(2)
})

test('mergePayload performs a deep merge', () => {
    const payload = Immutable.fromJS({
        a: 'b',
        c: {
            d: 'e',
            f: 'g'
        }
    })
    const state = Immutable.fromJS({
        a: 'a',
        b: 'b',
        c: {
            d: 'd',
            h: 'h'
        }
    })

    const expectedResult = Immutable.fromJS({
        a: 'b',
        b: 'b',
        c: {
            d: 'e',
            f: 'g',
            h: 'h'
        }
    })
    expect(reducerUtils.mergePayload(state, {payload}).equals(expectedResult)).toBe(true)
})

test('setCustomContent sets the payload to a custom key at the given path', () => {
    const payload = Immutable.fromJS({
        test: 'test'
    })
    const state = Immutable.fromJS({
        test: {
            path: {}
        }
    })

    const expectedResult = Immutable.fromJS({
        test: {
            path: {
                custom: {
                    test: 'test'
                }
            }
        }
    })
    expect(
        reducerUtils
            .setCustomContent('test', 'path')(state, {payload})
            .equals(expectedResult)
    ).toBe(true)
})
