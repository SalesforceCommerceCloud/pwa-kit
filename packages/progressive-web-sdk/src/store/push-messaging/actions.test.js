/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Immutable from 'immutable'
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import * as constants from './constants'

const mockStore = configureMockStore([thunk])

jest.mock('../../routing/is-react-route')
const isReactRoute = require('../../routing/is-react-route').isReactRoute

jest.mock('../../routing')
const routing = require('../../routing')
const browserHistory = routing.browserHistory

import Logger from '../../utils/logger'
Logger.setDebug(true)

const _log = console.log

beforeEach(() => {
    console.log = jest.fn()

    global.jsdom.reconfigure({
        url: 'https://www.bar.com'
    })

    window.Progressive = {}
    const initPromise = jest.fn().mockReturnValue(Promise.resolve())
    window.Progressive.MessagingClientInitPromise = initPromise()
    window.Progressive.MessagingClient = {
        subscribe: jest.fn((channels) => {
            return {
                channels
            }
        }),
        channelOfferShown: jest.fn(),
        setLocale: jest.fn()
    }
})

afterEach(() => {
    localStorage.clear()
    window.Progressive = undefined
})

afterAll(() => {
    console.log = _log
})

// CommonJS style so it's required here and not moved to top of file after transpilation
const actions = require('./actions')

test('startVisitCountdown dispatches onVisitCountdownStarted with `default` channel name if none provided', () => {
    const store = mockStore({
        pushMessaging: Immutable.fromJS({
            [constants.VISIT_COUNTDOWNS]: {}
        })
    })

    const expectedActions = [actions.onVisitCountdownStarted(3, constants.DEFAULT_CHANNEL)]

    store.dispatch(actions.startVisitCountdown(3))

    expect(store.getActions()).toEqual(expectedActions)
})

test('startVisitCountdown dispatches onVisitCountdownStarted with provided channel name', () => {
    const store = mockStore({
        pushMessaging: Immutable.fromJS({
            [constants.VISIT_COUNTDOWNS]: {}
        })
    })

    const expectedActions = [actions.onVisitCountdownStarted(3, 'foo')]

    store.dispatch(actions.startVisitCountdown(3, 'foo'))

    expect(store.getActions()).toEqual(expectedActions)
})

test('setVisitCountdownsInStorage updates local storage with provided visitCountdowns from store', () => {
    const countdowns = {
        default: 3,
        'new-deals': 4
    }
    const store = mockStore({
        pushMessaging: Immutable.fromJS({
            [constants.VISIT_COUNTDOWNS]: countdowns
        })
    })

    store.dispatch(actions.setVisitCountdownsInStorage())

    // The Store.js wrapper we have auto-stringifies and parses objects - but
    // since we're interacting with a mock localStorage directly, we need to do it
    // ourself for the purposes of the test
    expect(localStorage.getItem('pw-visitCountdowns')).toBe(JSON.stringify(countdowns))
})

test('decreaseVisitCountdowns dispatches onDecreaseVisitCountdowns', () => {
    const store = mockStore({
        pushMessaging: Immutable.fromJS({
            [constants.VISIT_COUNTDOWNS]: {
                default: 3,
                'new-deals': 4
            }
        })
    })

    const expectedActions = [actions.onDecreaseVisitCountdowns()]

    store.dispatch(actions.decreaseVisitCountdowns())

    expect(store.getActions()).toEqual(expectedActions)
})

test('subscribe returns a Promise resolving to `undefined` if InitPromise is undefined', () => {
    window.Progressive.MessagingClientInitPromise = undefined
    const store = mockStore({})

    return store.dispatch(actions.subscribe()).then((returnValue) => {
        expect(returnValue).toBeUndefined()
        expect(window.Progressive.MessagingClient.subscribe.mock.calls.length).toBe(0)
        expect(store.getActions()).toEqual([])
    })
})

test('subscribe calls subscribe on MessagingClient', () => {
    const store = mockStore({
        pushMessaging: Immutable.fromJS({
            subscribed: true
        })
    })

    return store.dispatch(actions.subscribe()).then(() => {
        expect(window.Progressive.MessagingClient.subscribe.mock.calls.length).toBe(1)
        expect(window.Progressive.MessagingClient.subscribe.mock.calls[0][0]).toBeUndefined()
    })
})

test('subscribe calls messagingSystemAskShown correctly when user is not subscribed', () => {
    const store = mockStore({
        pushMessaging: Immutable.fromJS({
            subscribed: false
        })
    })

    const expectedActions = [
        actions.messagingSystemAskShown(true),
        actions.messagingSystemAskShown(false)
    ]

    return store.dispatch(actions.subscribe()).then(() => {
        expect(store.getActions()).toEqual(expectedActions)
    })
})

test('subscribe only calls messagingSystemAskShown with false when user is already subscribed', () => {
    const store = mockStore({
        pushMessaging: Immutable.fromJS({
            subscribed: true
        })
    })

    const expectedActions = [actions.messagingSystemAskShown(false)]

    return store.dispatch(actions.subscribe()).then(() => {
        expect(store.getActions()).toEqual(expectedActions)
    })
})

test('subscribe calls MessagingClient subscribe with any provided channel states', () => {
    const store = mockStore({
        pushMessaging: Immutable.fromJS({
            subscribed: true
        })
    })

    const args = {foo: true, bar: false}

    return store.dispatch(actions.subscribe(args)).then(() => {
        expect(window.Progressive.MessagingClient.subscribe.mock.calls[0][0]).toEqual(args)
    })
})

test('channelOfferShown returns a Promise resolving to `undefined` if InitPromise is undefined', () => {
    window.Progressive.MessagingClientInitPromise = undefined
    const store = mockStore({})

    return store.dispatch(actions.channelOfferShown()).then((returnValue) => {
        expect(returnValue).toBeUndefined()
        expect(window.Progressive.MessagingClient.channelOfferShown.mock.calls.length).toBe(0)
    })
})

test('channelOfferShown calls MessagingClient channelOfferShown with the shown channel name', () => {
    const store = mockStore({})
    const channelName = 'foo'

    return store.dispatch(actions.channelOfferShown(channelName)).then(() => {
        expect(window.Progressive.MessagingClient.channelOfferShown.mock.calls[0][0]).toEqual(
            channelName
        )
    })
})

test('channelOfferShown sends an undefined channel value if none provided', () => {
    const store = mockStore({})

    return store.dispatch(actions.channelOfferShown()).then(() => {
        expect(
            window.Progressive.MessagingClient.channelOfferShown.mock.calls[0][0]
        ).toBeUndefined()
    })
})

test('incrementPageCount dispatches onPageCountIncrement and stores page count in local storage', () => {
    const store = mockStore({
        pushMessaging: Immutable.fromJS({
            [constants.PAGE_COUNT]: 0
        })
    })

    const expectedActions = [actions.onPageCountIncrement(1)]

    store.dispatch(actions.incrementPageCount())

    expect(store.getActions()).toEqual(expectedActions)
    expect(localStorage.getItem('pw-pageCount')).toBeDefined()
})

test('incrementPageCount dispatches decreaseVisitCountdowns if a visit has elapsed', (done) => {
    const store = mockStore({
        pushMessaging: Immutable.fromJS({
            [constants.PAGE_COUNT]: 0,
            [constants.VISIT_COUNTDOWNS]: {}
        })
    })

    const expectedActions = actions.onDecreaseVisitCountdowns()

    // Set the initial visit timestamp to 1 second in the future
    store.dispatch(actions.setVisitEndTimestamp(1))
    setTimeout(() => {
        store.dispatch(actions.incrementPageCount())
        expect(store.getActions()[1]).toEqual(expectedActions)
        done()
    }, 1000)
})

test('rehydratePageCount dispatches onRehydratedPageCount with value of pageCount from local storage', () => {
    localStorage.setItem('pw-pageCount', 3)
    const store = mockStore({})

    const expectedActions = [actions.onRehydratedPageCount(3)]

    store.dispatch(actions.rehydratePageCount())

    expect(store.getActions()).toEqual(expectedActions)
})

test('rehydratePageCount dispatches onDecreaseVisitCountdowns if pageCount not found in local storage', () => {
    const store = mockStore({
        pushMessaging: Immutable.fromJS({
            [constants.VISIT_COUNTDOWNS]: {}
        })
    })

    const expectedActions = [actions.onDecreaseVisitCountdowns()]

    store.dispatch(actions.rehydratePageCount())

    expect(store.getActions()).toEqual(expectedActions)
})

test('rehydrateVisitCountdowns dispatches onRehydratedVisitCountdowns with value of visitCountdowns from local storage', () => {
    localStorage.setItem(
        'pw-visitCountdowns',
        JSON.stringify({
            default: 3,
            'new-deals': 4
        })
    )
    const store = mockStore({
        pushMessaging: Immutable.fromJS({
            [constants.VISIT_COUNTDOWNS]: {}
        })
    })

    const expectedActions = [
        actions.onRehydratedVisitCountdowns({
            default: 3,
            'new-deals': 4
        })
    ]

    store.dispatch(actions.rehydrateVisitCountdowns())

    expect(store.getActions()).toEqual(expectedActions)
})

test('rehydrateVisitCountdowns does nothing if visitCountdown not found in local storage', () => {
    const store = mockStore({
        pushMessaging: Immutable.fromJS({
            [constants.VISIT_COUNTDOWNS]: {}
        })
    })
    store.dispatch(actions.rehydrateVisitCountdowns())
    expect(store.getActions()).toEqual([])
})

describe('notificationClick', () => {
    const url = 'https://www.merlinspotions.com'

    let store

    beforeEach(() => {
        global.jsdom.reconfigure({
            url: 'http://www.bar.com/'
        })

        isReactRoute.mockClear()
        browserHistory.push.mockClear()

        store = mockStore({})
    })

    afterAll(() => {
        global.jsdom.reconfigure({
            url: 'about:blank'
        })
    })

    test('pushes to browserHistory if url is a valid route', () => {
        isReactRoute.mockReturnValueOnce(true)

        store.dispatch(actions.notificationClick(url))

        expect(browserHistory.push.mock.calls[0][0]).toEqual('/')

        expect(window.location.href).toEqual('http://www.bar.com/')
    })

    test('includes query string and hash, if present', () => {
        const newUrl = `${url}/potions.html?hello=world&foo=bar#anchor-element`

        isReactRoute.mockReturnValueOnce(true)

        store.dispatch(actions.notificationClick(newUrl))

        expect(browserHistory.push.mock.calls[0][0]).toEqual(
            '/potions.html?hello=world&foo=bar#anchor-element'
        )
        expect(window.location.href).toEqual('http://www.bar.com/')
    })

    test('sets window.location.href if url is not a valid route', () => {
        isReactRoute.mockReturnValueOnce(false)

        // The following modification of window.location.href is to
        // allow notificationClick() to modify window.location.href
        const windowLocation = JSON.stringify(window.location)
        delete window.location
        Object.defineProperty(window, 'location', {
            value: JSON.parse(windowLocation)
        })

        store.dispatch(actions.notificationClick(url))
        expect(browserHistory.push.mock.calls.length).toBe(0)
        expect(window.location.href).toEqual(url)
    })

    test('dispatches `onNotificationClick`', () => {
        isReactRoute.mockReturnValueOnce(true)

        const expectedActions = [actions.onNotificationClick(url)]

        store.dispatch(actions.notificationClick(url))

        expect(store.getActions()).toEqual(expectedActions)
    })
})

test('setLocale calls Messaging Client setLocale with provided locale string', () => {
    const locale = 'en-US'

    const store = mockStore({
        pushMessaging: Immutable.fromJS({
            locale: ''
        })
    })

    const expectedActions = [actions.onLocaleSet(locale)]

    return store.dispatch(actions.setLocale(locale)).then(() => {
        expect(window.Progressive.MessagingClient.setLocale.mock.calls[0][0]).toEqual(locale)
        expect(store.getActions()).toEqual(expectedActions)
    })
})

test('setLocale does not accept non- or empty strings, and logs as such', () => {
    const store = mockStore({})

    return store.dispatch(actions.setLocale()).then(() => {
        expect(console.log.mock.calls[0]).toEqual([
            '[Messaging UI]',
            'Locale must be specified as a string.'
        ])
        expect(window.Progressive.MessagingClient.setLocale.mock.calls.length).toBe(0)
        expect(store.getActions()).toEqual([])
    })
})

test('setVisitEndTimestamp updates the value of visitEndTimestamp to 6 hours in the future', () => {
    const store = mockStore({})
    const date = new Date()

    store.dispatch(actions.setVisitEndTimestamp())
    // Allow one second variance to avoid a race condition in the test
    expect(date.getTime() + 6 * 60 * 60 * 1000 - actions.getVisitEndTimestamp() <= 1).toBe(true)
})

test('subscribeOnClick method simply calls subscribe', () => {
    const store = mockStore({
        pushMessaging: Immutable.fromJS({
            subscribed: true
        })
    })

    return store.dispatch(actions.subscribeOnClick()).then(() => {
        expect(window.Progressive.MessagingClient.subscribe.mock.calls.length).toBe(1)
    })
})
