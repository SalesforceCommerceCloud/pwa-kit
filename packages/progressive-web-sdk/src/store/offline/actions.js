/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {createAction} from '../../utils/action-creation'

export const setPageFetchError = createAction('Set page fetch error', ['fetchError'])
export const clearPageFetchError = createAction('Clear page fetch error')

export const setFetchedPage = createAction('Set fetched page', ['url'])

export const setOfflineModeStartTime = createAction('Set start time for offline mode', [
    'startTime'
])

export const clearOfflineModeStartTime = createAction('Clear offline mode start time')

export const trackOfflinePage = createAction('Track Offline Page viewed')

export const clearOfflinePages = createAction('Clear Offline Pages')
