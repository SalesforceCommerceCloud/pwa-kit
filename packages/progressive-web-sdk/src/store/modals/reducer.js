/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {handleActions} from 'redux-actions'
import Immutable from 'immutable'

import * as modalActions from './actions'
import {onRouteChanged} from '../app/actions'

const initialState = Immutable.Map()

const modalReducer = handleActions(
    {
        [modalActions.openModal]: (state, {payload: {modalName}}) =>
            state.setIn([modalName, 'open'], true),
        [modalActions.closeModal]: (state, {payload: {modalName}}) => {
            // closeModal should also set a modal's `persistent` to false
            // otherwise if modal is closed by user before route change
            // Route change will cause the close modal to open again
            return state.setIn([modalName, 'open'], false).setIn([modalName, 'persistent'], false)
        },
        [modalActions.openPersistentModal]: (state, {payload: {modalName}}) => {
            return state.setIn([modalName, 'open'], true).setIn([modalName, 'persistent'], true)
        },
        [modalActions.closeAllModals]: (state) =>
            state.map((modal) => {
                return modal.set('open', false).set('persistent', false)
            }),
        [onRouteChanged]: (state) =>
            state.map((modal) => {
                return modal.get('persistent')
                    ? // If a modal is persistent, keep it open
                      modal.set('open', !!modal.get('open'))
                    : // Otherwise, close the modal
                      modal.set('open', false)
            }),
        [modalActions.persistModal]: (state, {payload: {modalName}}) =>
            state.setIn([modalName, 'persistent'], true),
        [modalActions.preRenderModal]: (state, {payload: {modalName}}) =>
            state.setIn([modalName, 'prerender'], true)
    },
    initialState
)

export default modalReducer
