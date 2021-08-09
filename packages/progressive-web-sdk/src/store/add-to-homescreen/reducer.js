/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {handleActions} from 'redux-actions'
import {fromJS} from 'immutable'

import {isChrome68OrHigher, runningServerSide} from '../../utils/utils'
import {mergePayload} from '../../utils/reducer-utils'
import {setStatus} from '../add-to-homescreen/actions'
import {HIDDEN, UNSUPPORTED} from '../add-to-homescreen/constants'

const isSupportedBrowser = isChrome68OrHigher(navigator.userAgent)

/* istanbul ignore next */
if (!isSupportedBrowser && !runningServerSide()) {
    console.warn(
        `Warning in initializing addToHomescreenReducer\n\n` +
            `Your browser does not support the \`beforeinstallprompt\` ` +
            `browser event. The addToHomescreen Higher Order Component requires ` +
            `this event in order to work.`
    )
}

export const initialState = fromJS({
    status: isSupportedBrowser ? HIDDEN : UNSUPPORTED
})

const addToHomescreenReducer = handleActions(
    {
        [setStatus]: mergePayload
    },
    initialState
)

export default addToHomescreenReducer
