/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import Logger from './logger'
import {defer, PWADeferredProcessingStateEvent} from './task-utils'
import {advanceBy, clear} from 'jest-date-mock'

// Run with debug on to maximize coverage
beforeEach(() => {
    console.log = jest.fn()
    Logger.setDebug(true)
})
afterEach(() => {
    Logger.setDebug(false)
})

test('defer executes a task later', (done) => {
    let testFlag = false
    let seenStartEvent = false

    const listener = (event) => {
        if (!seenStartEvent) {
            expect(event.processing).toBe(true)
            seenStartEvent = true
        } else {
            expect(event.processing).toBe(false)
            removeEventListener(PWADeferredProcessingStateEvent, listener)
            expect(testFlag).toBe(true)
            done()
        }
    }

    // Add the event listener
    addEventListener(PWADeferredProcessingStateEvent, listener)

    // Defer a task that will set testFlag. When this executes, a
    // start-processing event should be sent.
    defer(() => {
        testFlag = true
    })
})

test('defer executes tasks in the order they were deferred', (done) => {
    let testFlag = 0
    let seenStartEvent = false

    const taskOne = () => {
        expect(testFlag).toBe(0)
        testFlag = 1
    }

    const taskTwo = () => {
        expect(testFlag).toBe(1)
        testFlag = 2
    }

    const listener = (event) => {
        if (!seenStartEvent) {
            expect(event.processing).toBe(true)
            seenStartEvent = true
        } else {
            expect(event.processing).toBe(false)
            removeEventListener(PWADeferredProcessingStateEvent, listener)
            expect(testFlag).toBe(2)
            done()
        }
    }

    // Add the event listener
    addEventListener(PWADeferredProcessingStateEvent, listener)
    // Defer the two tasks that check and set testFlag
    defer(taskOne)
    defer(taskTwo)
})

test('defer survives a task throwing an error', (done) => {
    let testFlag = 0
    let seenStartEvent = false

    const taskOne = () => {
        expect(testFlag).toBe(0)
        testFlag = 1
        throw new Error('fake error')
    }

    const taskTwo = () => {
        expect(testFlag).toBe(1)
        testFlag = 2
    }

    // Add the event listener
    const listener = (event) => {
        if (!seenStartEvent) {
            expect(event.processing).toBe(true)
            seenStartEvent = true
        } else {
            expect(event.processing).toBe(false)
            removeEventListener(PWADeferredProcessingStateEvent, listener)
            expect(testFlag).toBe(2)
            done()
        }
    }

    // Add the event listener
    addEventListener(PWADeferredProcessingStateEvent, listener)

    defer(taskOne)
    defer(taskTwo)
})

describe('time-sensitive tests', () => {
    let seenStartEvent = false

    afterEach(() => {
        clear()
    })

    test('defer warns about a slow task', (done) => {
        console.warn = jest.fn()

        // Add the event listener
        const listener = (event) => {
            if (!seenStartEvent) {
                expect(event.processing).toBe(true)
                seenStartEvent = true
            } else {
                expect(event.processing).toBe(false)
                removeEventListener(PWADeferredProcessingStateEvent, listener)
                expect(console.warn).toHaveBeenCalled()
                done()
            }
        }

        // Add the event listener
        addEventListener(PWADeferredProcessingStateEvent, listener)

        // Run a "slow" task
        defer(() => {
            advanceBy(60)
        })
    })
})
