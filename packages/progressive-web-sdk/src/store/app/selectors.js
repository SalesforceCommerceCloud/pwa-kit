/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Immutable from 'immutable'
import {createSelector} from 'reselect'
import {createGetSelector} from 'reselect-immutable-helpers'
import {urlToPathKey, urlToBasicPathKey} from '../../utils/utils'
import {CURRENT_URL, IS_SERVER_SIDE_OR_HYDRATING} from './constants'

export const getApp = ({app}) => app
export const getCurrentUrl = createGetSelector(getApp, CURRENT_URL)
export const getCurrentPathKey = createSelector(
    getCurrentUrl,
    urlToPathKey
)
export const getCurrentPathKeyWithoutQuery = createSelector(
    getCurrentPathKey,
    urlToBasicPathKey
)
export const isStandaloneApp = createGetSelector(getApp, 'standaloneApp')
export const getSelectedCurrency = createGetSelector(getApp, 'selectedCurrency', {})
export const getAvailableCurrencies = createGetSelector(
    getApp,
    'availableCurrencies',
    Immutable.List()
)
export const isServerSideOrHydrating = createGetSelector(getApp, IS_SERVER_SIDE_OR_HYDRATING)
export const isServerSide = createGetSelector(getApp, 'isServerSide')
export const getviewportSize = createGetSelector(getApp, 'viewportSize')
