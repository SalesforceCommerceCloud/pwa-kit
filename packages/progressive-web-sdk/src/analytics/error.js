/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {UIInteraction, UI_SUBJECT, UI_ACTION, UI_OBJECT} from './data-objects/'

// Custom "subclassed" Error type based on: https://stackoverflow.com/a/32749533/11807
class AppError extends Error {
    constructor(message, errors = []) {
        super(message)
        this.errors = errors

        this.name = this.constructor.name
        // Trying to delete Error.captureStackTrace to test the other case breaks in Jest
        /* istanbul ignore else */
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor)
        } else {
            this.stack = new Error(message).stack
        }

        const errorContent = JSON.stringify(errors)

        window.Progressive.analytics.send({
            [UIInteraction.SUBJECT]: UI_SUBJECT.app,
            [UIInteraction.ACTION]: UI_ACTION.receive,
            [UIInteraction.OBJECT]: UI_OBJECT.error,
            [UIInteraction.NAME]: message,
            [UIInteraction.CONTENT]: errorContent.substr(0, 128)
        })
    }
}

export default AppError
