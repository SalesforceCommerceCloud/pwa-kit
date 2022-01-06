/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as utils from './utils'
import EventEmitter from 'events'
import {flatten, getObjectProperty, shallowEquals} from './utils'

describe('requestIdleCallback should be a working shim', () => {
    test('without a working implementation built in', () => {
        return new Promise((resolve) => {
            utils.requestIdleCallback(resolve)
        })
    })

    test('with a working implementation built in', () => {
        window.requestIdleCallback = (fn) => setTimeout(() => fn(), 1)
        return new Promise((resolve) => {
            utils.requestIdleCallback(resolve)
        })
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

describe('boldString & Capitalize test', () => {
    test('boldString returns provided part of string bolded html', () => {
        const boldedString = utils.boldString('boldedString', 'bolded')
        expect(boldedString).toEqual('<b>bolded</b>String')
    })

    test('capitalize capitalizes a string', () => {
        const stringToCapitlize = utils.capitalize('capitalize string test')
        expect(stringToCapitlize).toEqual('Capitalize String Test')
    })
})

describe('session storage tests', () => {
    test('sets,gets and removes item in session storage', () => {
        utils.setSessionJSONItem('test', ['text'])
        let testing = utils.getSessionJSONItem('test')
        expect(testing.length).toEqual(1)
        utils.clearSessionJSONItem('test')
        testing = utils.getSessionJSONItem('test')
        expect(testing).not.toBeDefined()
    })
})

describe('flatten', () => {
    test('return a an array', () => {
        const result = flatten({
            id: 1,
            item: 1,
            children: [{id: 2, item: 2, children: [{id: 3, item: 3}]}]
        })

        expect(JSON.stringify(result)).toEqual(
            '{"1":{"id":1,"item":1,"children":[{"id":2,"item":2,"children":[{"id":3,"item":3}]}]},"2":{"id":2,"item":2,"children":[{"id":3,"item":3}]},"3":{"id":3,"item":3}}'
        )
    })
})

describe('shallow', function() {
    test('should return false', () => {
        const a = {a: '123'}
        const b = {a: '123', b: '456'}
        const result = shallowEquals(a, b)
        expect(result).toBeFalsy()
    })
})

describe('getObjectProperty', () => {
    const data = {
        a: 'item 1',
        b: [
            {
                id: 'abc',
                name: 'name 1',
                children: ['child 1', 'child 2']
            },
            {
                id: 'def',
                name: 'name 2',
                children: ['child 3', 'child 4']
            }
        ],
        c: {
            name: 'Name c',
            child: {
                id: '1'
            }
        }
    }
    test('should return source object when path is not defined', () => {
        const result = getObjectProperty(data)
        expect(result).toEqual(data)
    })

    test('should return a nested object', () => {
        const result = getObjectProperty(data, 'c.child')
        expect(result).toEqual({
            id: '1'
        })
    })

    test('should return b array', () => {
        const result = getObjectProperty(data, 'b')
        expect(result).toEqual([
            {
                id: 'abc',
                name: 'name 1',
                children: ['child 1', 'child 2']
            },
            {
                id: 'def',
                name: 'name 2',
                children: ['child 3', 'child 4']
            }
        ])
    })

    test('should return first child of b array', () => {
        const result = getObjectProperty(data, 'b[0]')
        expect(result).toEqual({
            id: 'abc',
            name: 'name 1',
            children: ['child 1', 'child 2']
        })
    })

    test('should return output as a string', () => {
        const result = getObjectProperty(data, 'b[0].name')
        expect(result).toEqual('name 1')
    })

    test('should return undefined', () => {
        const result = getObjectProperty(data, 'b[0].name.a')
        expect(result).toEqual(undefined)
    })
})
