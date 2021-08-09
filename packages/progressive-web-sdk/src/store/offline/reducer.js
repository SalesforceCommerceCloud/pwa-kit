/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {handleActions} from 'redux-actions'
import Immutable from 'immutable'
import {mergePayload} from '../../utils/reducer-utils'
import {urlToPathKey} from '../../utils/utils'

import {
    setPageFetchError,
    clearPageFetchError,
    setFetchedPage,
    setOfflineModeStartTime,
    clearOfflineModeStartTime,
    trackOfflinePage,
    clearOfflinePages
} from './actions'

export const initialState = Immutable.fromJS({
    fetchError: null,
    fetchedPages: Immutable.Set(),
    offlinePageViews: Immutable.List()
})

export default handleActions(
    {
        [setPageFetchError]: mergePayload,
        [clearPageFetchError]: (state) => state.set('fetchError', null),
        [setFetchedPage]: (state, {payload: {url}}) =>
            state.update('fetchedPages', (fetchedPages) => fetchedPages.add(urlToPathKey(url))),
        [setOfflineModeStartTime]: mergePayload,
        [clearOfflineModeStartTime]: (state) => state.delete('startTime'),
        [clearOfflinePages]: (state) =>
            state.set('offlinePageViews', initialState.get('offlinePageViews')),
        [trackOfflinePage]: (state, {payload: {url, routeName, title}}) => {
            const inCache =
                state.get('fetchedPages').filter((fetchedURL) => fetchedURL === urlToPathKey(url))
                    .size > 0
            return state.update('offlinePageViews', (offlinePageViews) =>
                offlinePageViews.push({url, routeName, title, inCache})
            )
        }
    },
    initialState
)
