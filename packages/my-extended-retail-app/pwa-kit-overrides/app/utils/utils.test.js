/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as utils from '@salesforce/retail-react-app/app/utils/utils'
import EventEmitter from 'events'
import {flatten, shallowEquals} from '@salesforce/retail-react-app/app/utils/utils'

afterEach(() => {
    jest.clearAllMocks()
})

jest.mock('./site-utils', () => {
    const origin = jest.requireActual('./site-utils')
    return {
        ...origin,
        getSites: jest.fn()
    }
})

describe('requestIdleCallback should be a working shim', () => {
    test('without a working implementation built in', async () => {
        const result = new Promise((resolve) => utils.requestIdleCallback(resolve))
        await expect(result).resolves.toBeUndefined()
    })

    test('with a working implementation built in', async () => {
        window.requestIdleCallback = (fn) => setTimeout(() => fn(), 1)
        const result = new Promise((resolve) => utils.requestIdleCallback(resolve))
        await expect(result).resolves.toBeUndefined()
    })
})

describe('WatchOnlineStatus', () => {
    test('responds to offline/online events', () => {
        const emitter = new EventEmitter()
        const win = {
            addEventListener: emitter.addListener.bind(emitter),
            removeEventListener: emitter.removeListener.bind(emitter)
        }
        const collected = []
        const callback = (isOnline) => collected.push(isOnline)
        const unsubscribe = utils.watchOnlineStatus(callback, win)
        emitter.emit('online')
        emitter.emit('offline')
        emitter.emit('online')
        expect(collected).toEqual([true, false, true])
        unsubscribe()
        expect(emitter.listenerCount('online')).toBe(0)
        expect(emitter.listenerCount('offline')).toBe(0)
    })
})

describe('escapeRegexChars', () => {
    test('escapes special characters', () => {
        const escapedString = utils.escapeRegexChars('{}()*+?.,\\^$|#')
        expect(escapedString).toBe('\\{\\}\\(\\)\\*\\+\\?\\.\\,\\\\\\^\\$\\|\\#')
    })
})

describe('boldString & Capitalize test', () => {
    test('boldString returns provided part of string bolded html', () => {
        const boldedString = utils.boldString('boldedString', 'bolded')
        expect(boldedString).toBe('<b>bolded</b>String')
    })

    test('boldString handles special regex characters', () => {
        const boldedString = utils.boldString('some (*special!) chars', '(*special!)')
        expect(boldedString).toBe('some <b>(*special!)</b> chars')
    })

    test('capitalize capitalizes a string', () => {
        const stringToCapitlize = utils.capitalize('capitalize string test')
        expect(stringToCapitlize).toBe('Capitalize String Test')
    })
})

describe('session storage tests', () => {
    test('sets,gets and removes item in session storage', () => {
        utils.setSessionJSONItem('test', ['text'])
        let testing = utils.getSessionJSONItem('test')
        expect(testing).toHaveLength(1)
        utils.clearSessionJSONItem('test')
        testing = utils.getSessionJSONItem('test')
        expect(testing).toBeUndefined()
    })
})

describe('flatten', () => {
    test('return a an array', () => {
        const result = flatten({
            id: 1,
            item: 1,
            children: [{id: 2, item: 2, children: [{id: 3, item: 3}]}]
        })

        expect(JSON.stringify(result)).toBe(
            '{"1":{"id":1,"item":1,"children":[{"id":2,"item":2,"children":[{"id":3,"item":3}]}]},"2":{"id":2,"item":2,"children":[{"id":3,"item":3}]},"3":{"id":3,"item":3}}'
        )
    })
})

describe('shallow', function () {
    test('should return false', () => {
        const a = {a: '123'}
        const b = {a: '123', b: '456'}
        const result = shallowEquals(a, b)
        expect(result).toBeFalsy()
    })
})

describe('keysToCamel', () => {
    test('converts object keys to camelcase', () => {
        const input = {
            numba_one: true,
            'numba-two': false,
            number3: 'un-changed',
            c_Custom: 'un_changed',
            _custom: 'unchanged'
        }

        const result = utils.keysToCamel(input)

        expect(result).toEqual({
            numbaOne: true,
            numbaTwo: false,
            number3: 'un-changed',
            c_Custom: 'un_changed',
            _custom: 'unchanged'
        })
    })

    test('converts arrays of objects to camelcase', () => {
        const input = [
            {
                numba_one: true,
                number3: 'un-changed',
                c_Custom: 'un_changed',
                _custom: 'unchanged'
            },
            {
                'numba-two': false
            }
        ]

        const result = utils.keysToCamel(input)

        expect(result).toEqual([
            {
                numbaOne: true,
                number3: 'un-changed',
                c_Custom: 'un_changed',
                _custom: 'unchanged'
            },
            {
                numbaTwo: false
            }
        ])
    })

    test('converts nested keys to camelcase', () => {
        const input = {
            numba_one: {
                sub1: 'unchanged',
                sub2: {sub_sub_2: 'changed'},
                sub3: [{sub_sub_3: 'changed', sub3Sub4: 'unchanged'}]
            }
        }

        const result = utils.keysToCamel(input)

        expect(result).toEqual({
            numbaOne: {
                sub1: 'unchanged',
                sub2: {subSub_2: 'changed'},
                sub3: [{subSub_3: 'changed', sub3Sub4: 'unchanged'}]
            }
        })
    })
})
