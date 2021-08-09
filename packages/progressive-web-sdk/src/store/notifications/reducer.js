/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {handleActions} from 'redux-actions'
import Immutable from 'immutable'
import {addNotification, removeNotification, removeAllNotifications} from './actions'

export const initialState = Immutable.List()

export default handleActions(
    {
        [addNotification]: (state, {payload}) => {
            // Don't allow duplicate notifications to be added
            if (state.find((notification) => notification.get('id') === payload.id)) {
                return state
            }
            return state.push(Immutable.fromJS(payload))
        },
        [removeNotification]: (state, {payload}) =>
            state.filterNot((notification) => notification.get('id') === payload),
        [removeAllNotifications]: () => initialState
    },
    initialState
)
