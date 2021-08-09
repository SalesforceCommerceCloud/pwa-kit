/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import * as polyfills from './polyfills'

test('getNeededPolyfills should return a filtered array of required polyfills', () => {
    const required = polyfills.getNeededPolyfills()
    expect(required).toBeInstanceOf(Array)
    expect(required.length).toBeGreaterThan(0)
})

describe('check the polyfill functions are called when needed', () => {
    let event = null

    beforeAll(() => {
        event = window.Event
        window.Event = {}

        // window.Event is assigned an object and hence, should
        // not be an instance of a function
        expect(typeof window.Event).not.toEqual('function')

        // Load polyfills
        const neededPolyfills = polyfills.getNeededPolyfills()
        neededPolyfills.forEach((polyfill) => {
            polyfill.load(() => {})
        })
    })

    afterAll(() => {
        window.Event = event
    })

    test('Event gets turned into a function by polyfill', () => {
        expect(typeof window.Event).toEqual('function')
    })

    test('new Event create by the polyfill should have the same type as the one passed in', () => {
        expect(new Event('Event').type).toEqual('Event')
    })

    test('Instantiating a new Event without parameters throws an error', () => {
        expect(() => new Event()).toThrow()
    })
})
