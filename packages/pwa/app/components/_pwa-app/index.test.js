import React from 'react'
import {act} from 'react-dom/test-utils'
import {shallow} from 'enzyme'
import {pages as pageEvents} from 'progressive-web-sdk/dist/ssr/universal/events'
import {PAGEVIEW, ERROR, OFFLINE} from 'progressive-web-sdk/dist/analytics-integrations/types'

import PWAApp, {OfflineBanner} from './index.jsx'
import {getAnalyticsManager} from '../../analytics'
import * as Helpers from './helpers.js'
import {mountWithRouter} from '../../utils/test-utils'

const analyticsManager = getAnalyticsManager()

beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(jest.fn())
    jest.spyOn(console, 'groupCollapsed').mockImplementation(jest.fn())
})

afterAll(() => {
    console.log.mockRestore()
    console.groupCollapsed.mockRestore()
})

afterEach(() => {
    console.log.mockClear()
    console.groupCollapsed.mockClear()
})

describe('PWA App', () => {
    test('When the browser goes offline it should send an offline analytics event', () => {
        const analyticsManagerTrack = jest.spyOn(analyticsManager, 'track')
        mountWithRouter(<PWAApp>Testing</PWAApp>)
        analyticsManagerTrack.mockClear()
        act(() => {
            window.dispatchEvent(new Event('offline'))
        })
        expect(analyticsManagerTrack.mock.calls[0][0]).toBe(OFFLINE)
        expect(analyticsManagerTrack.mock.calls[0][1].startTime).not.toBe(OFFLINE)
        analyticsManagerTrack.mockClear()
        act(() => {
            window.dispatchEvent(new Event('online'))
        })
        expect(analyticsManagerTrack.mock.calls[0][0]).toBe(OFFLINE)
        expect(analyticsManagerTrack.mock.calls[0][1].startTime).toBe(null)
    })

    test('OfflineBanner component is rendered appropriately', () => {
        const wrapper = shallow(<OfflineBanner />)
        expect(wrapper.contains(<p>Currently browsing in offline mode</p>)).toBe(true)
    })

    test('App component is rendered appropriately', () => {
        const getNavigationRoot = jest.spyOn(Helpers, 'getNavigationRoot')
        const getNavigationRootDesktop = jest.spyOn(Helpers, 'getNavigationRootDesktop')
        const wrapper = mountWithRouter(
            <PWAApp categories={{root: {name: 'T-Shirt'}, categories: {name: 'T-Shirt'}}}>
                <p>Any children here</p>
            </PWAApp>
        )
        expect(wrapper.length).toBe(1)
        expect(wrapper.find('main').length).toBe(1)
        expect(wrapper.find('Footer').length).toBe(1)
        expect(wrapper.find('SkipLinks').length).toBe(1)
        expect(getNavigationRoot).toHaveBeenCalled()
        expect(getNavigationRootDesktop).toHaveBeenCalled()
    })

    test('Listen for page events and send to analytics', () => {
        getAnalyticsManager().track = jest.fn()
        getAnalyticsManager().trackPageLoad = jest.fn()
        mountWithRouter(
            <PWAApp>
                <p>Any children here</p>
            </PWAApp>
        )
        pageEvents.pageLoad('blah', 1, 2)
        expect(getAnalyticsManager().track).toHaveBeenCalledWith(PAGEVIEW, {
            end: 2,
            start: 1,
            templateName: 'blah'
        })
        pageEvents.error('blah', 'err')
        expect(getAnalyticsManager().track).toHaveBeenCalledWith(ERROR, {
            content: 'err',
            name: 'blah'
        })
    })
})
