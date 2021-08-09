/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Immutable from 'immutable'
import reducer, {initialState} from './reducer'
import * as actions from './actions'
import * as selectors from './selectors'

test('unknown action type leaves state unchanged', () => {
    const action = {
        type: 'qwertyuiop'
    }
    expect(reducer(initialState, action)).toBe(initialState)
})

test('setPageFetchError sets the error', () => {
    expect(selectors.getPageFetchError({offline: initialState})).toBeNull()

    const finalState = reducer(initialState, actions.setPageFetchError({error: true}))

    expect(
        selectors.getPageFetchError({offline: finalState}).equals(Immutable.Map({error: true}))
    ).toBe(true)
})

test('clearPageFetchError clears the page fetch error', () => {
    const stateWithError = reducer(initialState, actions.setPageFetchError({error: true}))

    const finalState = reducer(stateWithError, actions.clearPageFetchError())

    expect(selectors.getPageFetchError({offline: finalState})).toBeNull()
})

test('getFetchedPages adds to the set of fetched pages', () => {
    expect(selectors.getFetchedPages({offline: initialState}).equals(Immutable.Set())).toBe(true)

    const stateWithOnePage = reducer(initialState, actions.setFetchedPage('/'))

    expect(selectors.getFetchedPages({offline: stateWithOnePage}).has('/')).toBe(true)

    const stateWithTwoPages = reducer(stateWithOnePage, actions.setFetchedPage('/test'))

    expect(selectors.getFetchedPages({offline: stateWithTwoPages}).has('/')).toBe(true)
    expect(selectors.getFetchedPages({offline: stateWithTwoPages}).has('/test')).toBe(true)

    const stateWithDuplicatePages = reducer(stateWithTwoPages, actions.setFetchedPage('/'))

    expect(stateWithDuplicatePages.equals(stateWithTwoPages)).toBe(true)
})

test('clearOfflineModeStartTime removes the offline mode start time', () => {
    const stateWithStartTime = initialState.set('startTime', '1504050704103')

    const finalState = reducer(stateWithStartTime, actions.clearOfflineModeStartTime())

    expect(selectors.getOfflineModeStartTime({offline: finalState})).toBe(undefined)
})

test('clearOfflinePages removes the offline page data', () => {
    const offlinePages = [
        {
            url: 'https://www.merlinspotions.com',
            routeName: 'home',
            title: 'home',
            inCache: true
        },
        {
            url: 'https://www.merlinspotions.com/potions.html',
            routeName: 'productListPage',
            title: 'Potions',
            inCache: false
        }
    ]
    const stateWithPageViews = initialState.set('offlinePageViews', Immutable.fromJS(offlinePages))

    const finalState = reducer(stateWithPageViews, actions.clearOfflinePages())

    expect(selectors.getOfflinePageViews({offline: finalState})).toEqual(Immutable.List())
})

test('setOfflineModeStartTime sets the offline mode start time', () => {
    const startTime = '1504050704103'
    const finalState = reducer(initialState, actions.setOfflineModeStartTime(startTime))
    expect(selectors.getOfflineModeStartTime({offline: finalState})).toEqual(startTime)
})

test('trackOfflinePage sets inCache to true if page has been fetched already', () => {
    const pageData = {
        url: 'https://www.merlinspotions.com/potions.html',
        routeName: 'productListPage',
        title: 'Potions'
    }
    const stateWithFetchedPages = reducer(initialState, actions.setFetchedPage(pageData.url))

    const finalState = reducer(stateWithFetchedPages, actions.trackOfflinePage(pageData))
    const trackedPage = selectors.getOfflinePageViews({offline: finalState}).get('0')
    expect(trackedPage.inCache).toBe(true)
})

test('trackOfflinePage sets inCache to false if page has not been fetched already', () => {
    const pageData = {
        url: 'https://www.merlinspotions.com/potions.html',
        routeName: 'productListPage',
        title: 'Potions'
    }

    const finalState = reducer(initialState, actions.trackOfflinePage(pageData))
    const trackedPage = selectors.getOfflinePageViews({offline: finalState}).get('0')
    expect(trackedPage.inCache).toBe(false)
})
