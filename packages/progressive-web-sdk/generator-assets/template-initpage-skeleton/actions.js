/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2017 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {createAction} from 'progressive-web-sdk/dist/utils/action-creation'

// This is an example action which is used to trigger change in UI state
export const toggleUIState = createAction('Toggle <%= context.Name %> UI state')

export const initialize = (url, routeName) => (dispatch) => {
    // Fetch information you need for the template here
    // For example, this can dispatch the relevant commands in Integration Manager
    console.log('[<%= context.Name %>] initializing.  You can safely remove this log message.')
    // Ensure that your action return a Promise
    return Promise.resolve()
}
