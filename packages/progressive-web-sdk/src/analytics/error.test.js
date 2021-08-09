/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {UIInteraction, UI_SUBJECT, UI_ACTION, UI_OBJECT} from './data-objects/'

import AppError from './error'

describe('AppError', () => {
    window.Progressive = {
        analytics: {}
    }

    const originalCaptureStackTrace = Error.captureStackTrace
    const originalStack = Error.stack

    beforeEach(() => {
        window.Progressive.analytics.send = jest.fn()
    })

    afterAll(() => {
        Error.captureStackTrace = originalCaptureStackTrace
        Error.stack = originalStack
    })

    test('AppError sends analytics event', () => {
        try {
            throw new AppError('Example Error')
        } catch (e) {
            expect(window.Progressive.analytics.send).toBeCalled()
        }
    })

    test('Uses captureStackTrace if available', () => {
        Error.captureStackTrace = jest.fn()

        try {
            throw new AppError('Example Error')
        } catch (e) {
            expect(Error.captureStackTrace).toBeCalled()
        }
    })

    test('Uses the provided errors as the content', () => {
        const errors = ['Error 0', 'Error 1']

        try {
            throw new AppError('Example Error', errors)
        } catch (e) {
            expect(window.Progressive.analytics.send).toBeCalledWith({
                [UIInteraction.SUBJECT]: UI_SUBJECT.app,
                [UIInteraction.ACTION]: UI_ACTION.receive,
                [UIInteraction.OBJECT]: UI_OBJECT.error,
                [UIInteraction.NAME]: 'Example Error',
                [UIInteraction.CONTENT]: JSON.stringify(errors).substr(0, 128)
            })
        }
    })
})
