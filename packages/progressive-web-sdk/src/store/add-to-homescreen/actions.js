/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {createAction} from '../../utils/action-creation'

// Constants
import {INACTIVE, HIDDEN} from '../../store/add-to-homescreen/constants'

// Analytics
import {sendA2HSUserPromptAnalytics} from '../../analytics/actions'

export const setStatus = createAction('Set Add To Homescreen state', ['status'])

export const promptEvent = (event) => (dispatch) => {
    const promptResolved = new Promise((resolve) => {
        /**
         * User Choice Handler
         *
         * This function responds to the user's input by setting the "Add to
         * homescreen" component's state to either HIDDEN or INACTIVE depending
         * on the user's behavior.
         *
         * In either case, it is up to the developer to define how their
         * WrappedComponent behaves based on the current status.
         */
        event.userChoice.then((choice) => {
            if (choice.outcome === 'accepted') {
                // Normally, I would include a call to `sendAddA2HSAnalytics`
                // here, but that is unnecessary in this case because
                // this analytics call is already prepared in an
                // existing event handler. See the `initApp` command in
                // `/src/integration-manager/app/commands.js`
                //
                // dispatch(sendAddA2HSAnalytics())

                dispatch(setStatus(HIDDEN))
                resolve() // for testing purposes
            } else {
                // Normally, I would include a call to `sendDismissA2HSAnalytics`
                // here, but that is unnecessary in this case because
                // this analytics call is already prepared in an
                // existing event handler. See the `initApp` command in
                // `/src/integration-manager/app/commands.js`
                //
                // dispatch(sendDismissA2HSAnalytics())

                dispatch(setStatus(INACTIVE))
                resolve() // for testing purposes
            }
        })
    })

    dispatch(sendA2HSUserPromptAnalytics())
    event.prompt()

    // Return this promise so we can verify this behaviour in tests
    return promptResolved
}
