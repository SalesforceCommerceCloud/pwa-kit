/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-disable max-nested-callbacks */

jest.mock('../../utils/logger')
const Logger = require('../../utils/logger').default

jest.mock('../../utils/messaging-state')
const startVisitCountdown = require('../../utils/messaging-state').startVisitCountdown

import AskFrame, {_showFrame, _hideFrame, _clickHandler} from './ask-frame'
import Const from './constants'

const getExpectedHTMLWithCacheBreaker = (cacheBreaker) => {
    return (
        '<html>' +
        '<head>' +
        `<link rel="stylesheet" type="text/css" href="//0.0.0.0:8443/non-pwa-ask.css?${cacheBreaker}">` +
        '</head>' +
        '<body>' +
        `<div class="${Const.BUTTON_CONTAINER_CLASS}">` +
        '<button id="js-deny"></button>' +
        '<button id="js-allow"></button>' +
        '</div>' +
        `<script type="text/javascript" src="//0.0.0.0:8443/non-pwa-ask.js?${cacheBreaker}"></script>` +
        '</body>' +
        '</html>'
    )
}

const defaultConfiguration = {
    html:
        `<html><head></head><body><div class="${Const.BUTTON_CONTAINER_CLASS}">` +
        `<button id="${Const.BUTTON_DENY_ID}"></button>` +
        `<button id="${Const.BUTTON_ALLOW_ID}"></button></div></body></html>`,
    deferOnDismissal: 4,
    showOnPageCount: 4,
    channelName: 'foo-bar'
}

beforeEach(() => {
    window.Mobify = {
        WebPush: {
            PWAClient: {
                channelOfferShown: jest.fn(),
                subscribe: jest.fn()
            }
        }
    }
})

afterAll(() => {
    window.Mobify = undefined
})

const askFrame = new AskFrame(defaultConfiguration)

test('is created correctly using its constructor', () => {
    expect(askFrame).toBeDefined()
    expect(typeof askFrame.show).toBe('function')
    expect(typeof askFrame.setupListeners).toBe('function')
    expect(typeof askFrame.create).toBe('function')
    expect(askFrame.config).toEqual(defaultConfiguration)
    expect(askFrame.doc).toEqual(document)
})

test('returns the same instance when constructed again', () => {
    const frame2 = new AskFrame()
    expect(frame2).toBe(askFrame)
})

test("_showFrame method sets the transform property to ''", () => {
    const frame = {style: {}}
    _showFrame(frame)
    expect(frame.style.transform).toEqual('')
})

test('_hideFrame method sets the transform property to translateY(100%)', () => {
    const frame = {style: {}}
    _hideFrame(frame)
    expect(frame.style.transform).toEqual('translateY(100%)')
})

describe('create', () => {
    askFrame.create()
    let cacheBreaker

    test('constructs an iframe with the right properties', () => {
        const expectedStyles = {
            position: 'fixed',
            left: '0px',
            bottom: '0px',
            'z-index': Number.MAX_SAFE_INTEGER,
            width: '100%',
            height: '59px',
            'border-top': undefined,
            'border-left': undefined,
            'border-right': undefined,
            'border-bottom': undefined
        }

        for (const style in expectedStyles) {
            // eslint-disable-line guard-for-in
            expect(askFrame.frame.style._values[style]).toEqual(expectedStyles[style])
        }

        expect(askFrame.frame.style.transition).toEqual('transform 0.3s ease-in-out')
        expect(askFrame.frame.style.transform).toEqual('translateY(100%)')
        expect(askFrame.frame.src).toEqual('about:blank')
        expect(askFrame.frame.id).toEqual(Const.ASK_IFRAME_ID)
    })

    test('constructs an iframe containing the configured HTML', () => {
        const outerHTML = askFrame.frameDoc.getElementsByTagName('html')[0].outerHTML
        cacheBreaker = outerHTML.match(/\?(\d+)/)[1]

        expect(outerHTML).toEqual(getExpectedHTMLWithCacheBreaker(cacheBreaker))
    })

    test('does not recreate the iframe if create was previously called', () => {
        askFrame.create()
        const outerHTML = askFrame.frameDoc.getElementsByTagName('html')[0].outerHTML

        // We expect the HTML to be identical to the previous test above -
        // i.e. no additional appended <link> or <script> tags
        expect(outerHTML).toEqual(getExpectedHTMLWithCacheBreaker(cacheBreaker))
    })
})

test('show method calls channelOfferShown', () => {
    jest.useFakeTimers()
    askFrame.show()
    jest.runAllTimers()
    expect(window.Mobify.WebPush.PWAClient.channelOfferShown.mock.calls.length).toBe(1)
})

test(`deny and accept click handling is added to ${Const.BUTTON_CONTAINER_CLASS} by setupListeners method`, () => {
    const mockClickHandler = jest.fn()

    askFrame.setupListeners(mockClickHandler)

    const container = askFrame.frameDoc.getElementsByClassName(Const.BUTTON_CONTAINER_CLASS)[0]

    container.click()
    container.removeEventListener('click', mockClickHandler)

    expect(mockClickHandler.mock.calls.length).toBe(1)
})

describe('_clickHandler', () => {
    const boundClickHandler = _clickHandler.bind(askFrame)

    beforeEach(() => {
        startVisitCountdown.mockClear()
    })

    test(`handles click event from ${Const.BUTTON_DENY_ID}`, () => {
        const mockEvent = {
            target: {
                id: Const.BUTTON_DENY_ID
            }
        }

        expect(askFrame.frame.style.transform).toEqual('')

        boundClickHandler(mockEvent)

        expect(askFrame.frame.style.transform).toEqual('translateY(100%)')
        expect(startVisitCountdown.mock.calls.length).toBe(1)
        expect(startVisitCountdown.mock.calls[0]).toEqual([
            defaultConfiguration.deferOnDismissal,
            defaultConfiguration.channelName
        ])
    })

    describe(`handles click event from ${Const.BUTTON_ALLOW_ID} when`, () => {
        const mockEvent = {
            target: {
                id: Const.BUTTON_ALLOW_ID
            }
        }

        test('state.subscribed && state.canSubscribe', () => {
            // Set style.transform back to an empty string
            _showFrame(askFrame.frame)

            window.Mobify.WebPush.PWAClient.subscribe.mockReturnValue(
                Promise.resolve({
                    subscribed: true,
                    canSubscribe: true
                })
            )

            expect(askFrame.frame.style.transform).toEqual('')

            boundClickHandler(mockEvent)

            expect(askFrame.frame.style.transform).toEqual('translateY(100%)')

            return window.Mobify.WebPush.PWAClient.subscribe().then(() => {
                // Test that we at least created an instance of Logger
                expect(askFrame.logger instanceof Logger).toBeTruthy()
                expect(askFrame.logger.log.mock.calls).toEqual([
                    ['[Messaging UI]', 'Subscribed to channel foo-bar']
                ])
            })
        })

        test('!state.subscribed && !state.canSubscribe', () => {
            window.Mobify.WebPush.PWAClient.subscribe.mockReturnValue(
                Promise.resolve({
                    subscribed: false,
                    canSubscribe: false
                })
            )

            boundClickHandler(mockEvent)

            return window.Mobify.WebPush.PWAClient.subscribe().then(() => {
                expect(askFrame.logger.log.mock.calls).toEqual([
                    ['[Messaging UI]', 'Permissions blocked by user; can no longer subscribe.']
                ])
            })
        })

        test('!state.subscribed && state.canSubscribe', () => {
            window.Mobify.WebPush.PWAClient.subscribe.mockReturnValue(
                Promise.resolve({
                    subscribed: false,
                    canSubscribe: true
                })
            )

            boundClickHandler(mockEvent)

            return window.Mobify.WebPush.PWAClient.subscribe().then(() => {
                expect(askFrame.logger.log.mock.calls).toEqual([
                    ['[Messaging UI]', 'System ask was dismissed']
                ])
            })
        })
    })
})
