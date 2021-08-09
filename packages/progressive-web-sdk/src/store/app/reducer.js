/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {handleActions} from 'redux-actions'
import {fromJS} from 'immutable'
import {mergePayload} from '../../utils/reducer-utils'
import {runningServerSide} from '../../utils/utils'

import * as appActions from './actions'

import {
    setCurrentURL,
    receiveCurrentProductId,
    receiveSelectedCurrency,
    receiveAvailableCurrencies
} from '../../integration-manager/results'
import {CURRENT_URL, IS_SERVER_SIDE, IS_SERVER_SIDE_OR_HYDRATING, VIEWPORT_SIZE} from './constants'

const windowProgressive = window.Progressive || {}

export const initialState = fromJS({
    [CURRENT_URL]: window.location.href,
    selectedCurrency: {
        label: 'Dollar',
        code: 'USD',
        symbol: '$'
    },
    // this will be undefined (falsy) for tag loaded PWAs
    // Tag loaded PWAs are never running server-side or hydrating

    isServerSideOrHydrating:
        /* istanbul ignore next: difficult to test for condition */ windowProgressive.isServerSideOrHydrating ||
        false,
    isServerSide:
        /* istanbul ignore next: difficult to test for condition */ runningServerSide() || false,
    viewportSize:
        /* istanbul ignore next: difficult to test for condition */ windowProgressive.viewportSize ||
        undefined
})

/**
 * Set the isServerSideOrHydrating flag in the state and copy the value
 * to window.Progressive so that the two values stay in sync.
 */
const setIsServerSideOrHydratingFlag = (state, {payload}) => {
    const newValue = payload.isServerSideOrHydrating
    /* istanbul ignore else */
    if (window.Progressive) {
        window.Progressive.isServerSideOrHydrating = newValue
    }
    return state.set(IS_SERVER_SIDE_OR_HYDRATING, newValue)
}

/**
 * Set the isServerSide flag in the state and copy the value
 * to window.Progressive so that the two values stay in sync.
 * If the value changes, issue a console warning, since there's
 * no reason to set the value other than in testing.
 */
const setIsServerSide = (state, {payload}) => {
    const newValue = payload.isServerSide
    /* istanbul ignore else */
    if (newValue !== state.isServerSide) {
        console.warn('Changing the value of isServerSide should only be done during testing')
    }
    /* istanbul ignore else */
    if (window.Progressive) {
        window.Progressive.isServerSide = newValue
    }

    return state.set(IS_SERVER_SIDE, newValue)
}

/**
 * Set the viewportSize value. If the app is hydrating, throw an
 * error and don't change the value, as it's potentially hazardous.
 */
const setViewportSizeValue = (state, {payload}) => {
    const newValue = payload.viewportSize

    if (state.get(IS_SERVER_SIDE_OR_HYDRATING)) {
        throw new Error(
            'Setting viewport size should only be done when running client-side and not hydrating'
        )
    }
    /* istanbul ignore else */
    if (window.Progressive) {
        window.Progressive.viewportSize = newValue
    }
    return state.set(VIEWPORT_SIZE, newValue)
}

export default handleActions(
    {
        [setCurrentURL]: mergePayload,
        [receiveCurrentProductId]: mergePayload,
        [appActions.onRouteChanged]: mergePayload,
        [appActions.setStandAloneAppFlag]: mergePayload,
        [receiveSelectedCurrency]: mergePayload,
        [receiveAvailableCurrencies]: mergePayload,
        [appActions.setIsServerSideOrHydratingFlag]: setIsServerSideOrHydratingFlag,
        [appActions.setIsServerSideFlag]: setIsServerSide,
        [appActions.setViewportSizeValue]: setViewportSizeValue
    },
    initialState
)
