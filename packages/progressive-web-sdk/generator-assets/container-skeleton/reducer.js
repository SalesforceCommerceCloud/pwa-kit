/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2017 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {createReducer} from 'redux-act'
import Immutable from 'immutable'
import {isPageType} from '../../utils/router-utils'
import {onPageReceived} from '../app/actions'
// import * as <%= context.name %>Actions from './actions'
import <%= context.name %>Parser from './<%= context.dirname %>-parser'
import <%= context.Name %> from './container'

const initialState = Immutable.fromJS({
    body: '',
    testText: 'Initial test text'
})

export default createReducer({
    [onPageReceived]: (state, action) => {
        const {$, $response, pageComponent} = action
        if (!isPageType(pageComponent, <%= context.Name %>)) {
            return state
        }
        return state.merge(Immutable.fromJS(<%= context.name %>Parser($, $response)))
    },
    // [<%= context.name %>Actions.myActionName]: (state, payload) => {
    //     return state.mergeDeep(payload)
    // }
}, initialState)
