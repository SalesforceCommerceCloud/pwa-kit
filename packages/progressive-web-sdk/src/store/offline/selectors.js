/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {createGetSelector, createHasSelector} from 'reselect-immutable-helpers'
import {getCurrentPathKey} from '../app/selectors'

export const getOffline = ({offline}) => offline

// This will need to become more complicated when we handle more types
// of errors, but will do for now
export const getPageFetchError = createGetSelector(getOffline, 'fetchError')
export const getFetchedPages = createGetSelector(getOffline, 'fetchedPages')

export const hasFetchedCurrentPath = createHasSelector(getFetchedPages, getCurrentPathKey)

export const getOfflineModeStartTime = createGetSelector(getOffline, 'startTime')

export const getOfflinePageViews = createGetSelector(getOffline, 'offlinePageViews')
