/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {DEFAULT_EVENTS} from './common'
import ChildFrame from './child'
import {createMockEvent} from './test-utils'

/**
 * We can't change window properties within Jest right now, so this is a
 * workaround (see @url: https://github.com/tmpvar/jsdom/issues/1622)
 * Jest test files are all run in their own environment, so we get a fresh window
 * object (and environment in general) by creating a new test file
 */
describe('ChildFrame', () => {
    // If we mock window.postMessage, we can check that it was called with the
    // ready event we expect without needing to setup an actual bridge
    const _postMessage = global.postMessage
    let mockMessage

    beforeEach(() => {
        mockMessage = jest.fn()
        global.postMessage = mockMessage
    })

    afterEach(() => {
        global.postMessage = _postMessage
    })

    test("can be created with it's constructor and initialized with readyCheck promise", () => {
        const origin = 'test'

        return new Promise((resolve) => {
            const readyCheck = new Promise((resolveCheck) => {
                // It's okay that this resolves immediately - we just want to test that
                // we can successfully pass promises as a readyCheck option
                resolveCheck()

                // Ensure that the `.then` chained off this promise is resolved
                // _before_ the outer promise resolves
                setTimeout(resolve, 100)
            })

            new ChildFrame({
                // eslint-disable-line no-new
                origin,
                readyCheck
            })
        }).then(() => {
            expect(mockMessage).toBeCalledWith(createMockEvent(DEFAULT_EVENTS.CHILD_READY), origin)
        })
    })
})
