/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Immutable from 'immutable'
import * as actions from './actions'

const initialState = Immutable.Map({
    example: null
})

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case actions.RECEIVE_<%= context.NAME %>:
            return state.mergeDeep(Immutable.fromJS(action.payload))
        default:
            return state
    }
}

export default reducer
