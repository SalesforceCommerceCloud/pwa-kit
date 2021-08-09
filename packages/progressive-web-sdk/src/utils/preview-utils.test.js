/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jest */

import {getCookie, isPreview, isV8Tag, shouldPreview, SHOULD_PREVIEW_QUERY} from './preview-utils'

import sinon from 'sinon'

const sandbox = sinon.sandbox.create()

afterEach(() => {
    sandbox.restore()
    document.cookie = 'mobify-path=true; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'testCookie=; expires=Thu, 01 Jan 1970 00:00:00 GMT'

    global.jsdom.reconfigure({url: 'https://localhost'})
})

describe('getCookie', () => {
    test('returns an empty string for a missing cookie', () => {
        expect(getCookie('testCookie')).toBe('')
    })

    test('returns the cookie value', () => {
        document.cookie = 'testCookie=xyz'
        expect(getCookie('testCookie')).toBe('xyz')
    })
})

describe('isPreview', () => {
    test('spots preview mode via cookie', () => {
        document.cookie = 'mobify-path=true'
        expect(isPreview()).toBeTruthy()
    })

    test('spots preview mode via path', () => {
        global.jsdom.reconfigure({url: 'https://localhost/#mobify-path=true'})

        expect(isPreview()).toBeTruthy()
    })

    test('spots non-preview mode', () => {
        expect(isPreview()).toBeFalsy()
    })
})

describe('isV8Tag', () => {
    test('isV8Tag detects correctly', () => {
        window.Mobify = window.Mobify = {
            tagVersion: [7, 0] // older tag has `tagVersion` rather than `tag`.
        }
        expect(isV8Tag()).toBeFalsy()

        window.Mobify = window.Mobify = {
            tagVersion: [8, 0]
        }
        expect(isV8Tag()).toBeTruthy()
    })
})

describe('shouldPreview', () => {
    beforeEach(() => {
        window.Mobify = {
            tagVersion: [8, 0]
        }
    })

    test('returns false for a nonV8 tag', () => {
        window.Mobify = {
            tagVersion: [7, 0]
        }
        expect(shouldPreview()).toBeFalsy()
    })

    test('returns false when preview has run', () => {
        expect(isV8Tag()).toBeTruthy()

        // We stub out querySelectorAll so that we can fake there being
        // an existing script loaded from the PREVIEW_URL.
        sandbox
            .stub(document, 'querySelectorAll')
            .withArgs(SHOULD_PREVIEW_QUERY)
            .returns(['xyz'])
        expect(shouldPreview()).toBeFalsy()
    })

    test('returns true according to path', () => {
        global.jsdom.reconfigure({url: 'https://localhost/#mobify-path=true'})

        expect(shouldPreview()).toBeTruthy()
    })
})

/* eslint-enable no-global-assign, no-native-reassign */
