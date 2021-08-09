/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-disable import/namespace */
/* eslint-disable import/named */
import {createAction} from '../../utils/action-creation'
import {CURRENT_URL} from './constants'

/**
 * Action dispatched when the route changes
 * @param {string} currentURL - what's currently shown in the address bar
 * @param {string} routeName - Template name for analytic
 */
export const onRouteChanged = createAction('On route changed', [CURRENT_URL])

export const setStandAloneAppFlag = createAction('Set Standalone app flag', ['standaloneApp'])

export const setIsServerSideOrHydratingFlag = createAction('Set isServerSideOrHydrating flag', [
    'isServerSideOrHydrating'
])

export const setIsServerSideFlag = createAction('Set isServerSide flag', ['isServerSide'])

export const setViewportSizeValue = createAction('Set viewportSize value', ['viewportSize'])

export const setviewportSizeValue = setViewportSizeValue
