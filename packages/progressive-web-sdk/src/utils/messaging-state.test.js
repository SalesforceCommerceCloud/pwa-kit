/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import * as messagingState from './messaging-state'
import * as Const from '../store/push-messaging/constants'

afterEach(() => {
    localStorage.clear()
})

describe('MessagingState', () => {
    messagingState.initStorage()

    const assertCountdowns = (countdowns) => {
        expect(localStorage.getItem(`pw-${Const.VISIT_COUNTDOWNS}`)).toEqual(
            JSON.stringify(countdowns)
        )
    }

    test('setVisitCountdownsInStorage sets given countdowns object in storage', () => {
        const countdowns = {
            foo: 'bar',
            baz: 'quux'
        }

        messagingState.setVisitCountdownsInStorage(countdowns)

        assertCountdowns(countdowns)
    })

    test('getVisitCountdowns gets countdowns from storage', () => {
        expect(messagingState.getVisitCountdowns()).toEqual({})

        // Now try it with an existing set of countdowns
        const countdowns = {[Const.DEFAULT_CHANNEL]: 3}
        localStorage.setItem(`pw-${Const.VISIT_COUNTDOWNS}`, JSON.stringify(countdowns))

        expect(messagingState.getVisitCountdowns()).toEqual(countdowns)
        assertCountdowns(countdowns)
    })

    test('startVisitCountdown adds given visit count to countdowns object', () => {
        // Populate the store with an existing countdowns object
        const countdowns = {test: 3}
        localStorage.setItem(`pw-${Const.VISIT_COUNTDOWNS}`, JSON.stringify(countdowns))
        const returnValue = messagingState.startVisitCountdown(3)

        expect(returnValue).toEqual({test: 3, [Const.DEFAULT_CHANNEL]: 3})
        assertCountdowns(returnValue)
    })

    test('startVisitCountdown adds given visit count to countdowns object with given channel name', () => {
        const returnValue = messagingState.startVisitCountdown(4, 'foo')

        expect(returnValue).toEqual({foo: 4})
        assertCountdowns(returnValue)
    })

    test('decreaseVisitCountdowns decreases stored countdowns by 1', () => {
        // Populate the store with an existing countdowns object
        const countdowns = {foo: 3, bar: 4, baz: 5}
        localStorage.setItem(`pw-${Const.VISIT_COUNTDOWNS}`, JSON.stringify(countdowns))

        const returnValue = messagingState.decreaseVisitCountdowns()

        expect(returnValue).toEqual({
            foo: 2,
            bar: 3,
            baz: 4
        })

        assertCountdowns(returnValue)
    })

    test('decreaseVisitCountdowns does not decrease counts past 0', () => {
        // Populate the store with an existing countdowns object
        localStorage.setItem(`pw-${Const.VISIT_COUNTDOWNS}`, JSON.stringify({foo: 0}))

        const returnValue = messagingState.decreaseVisitCountdowns()

        expect(returnValue).toEqual({foo: 0})
        assertCountdowns(returnValue)
    })

    test('getPageCount returns the page count from storage', () => {
        const returnValue = messagingState.getPageCount()
        expect(returnValue).toBe(0)

        localStorage.setItem(`pw-${Const.PAGE_COUNT}`, JSON.stringify(1))
        expect(messagingState.getPageCount()).toBe(1)
    })

    test('setPageCount sets given page count in storage', () => {
        const pageCount = 3

        const returnValue = messagingState.setPageCount(pageCount)

        expect(returnValue).toBe(pageCount)
        expect(localStorage.getItem(`pw-${Const.PAGE_COUNT}`)).toBe(JSON.stringify(pageCount))
    })

    test('updateState gets the page count and countdowns, and increases page count by 1', () => {
        // Set existing state in storage
        localStorage.setItem(`pw-${Const.VISIT_COUNTDOWNS}`, JSON.stringify({foo: 3}))
        localStorage.setItem(`pw-${Const.PAGE_COUNT}`, JSON.stringify(5))

        const {pageCount, visitCountdowns} = messagingState.updateState()

        expect(pageCount).toBe(6)
        expect(visitCountdowns).toEqual({foo: 3})
    })

    test('updateState decreases visit countdowns if pageCount was not in storage', () => {
        localStorage.setItem(`pw-${Const.VISIT_COUNTDOWNS}`, JSON.stringify({foo: 3}))
        const {visitCountdowns} = messagingState.updateState()

        expect(visitCountdowns).toEqual({foo: 2})
    })
})
