import React from 'react'
import {act} from 'react-dom/test-utils'
import {screen} from '@testing-library/react'
import {pages as pageEvents} from 'pwa-kit-react-sdk/dist/ssr/universal/events'
import {PAGEVIEW, ERROR, OFFLINE} from 'pwa-kit-react-sdk/dist/analytics-integrations/types'

import App from './index.jsx'
import {getAnalyticsManager} from '../../analytics'
import {renderWithProviders} from '../../utils/test-utils'

const analyticsManager = getAnalyticsManager()

let windowSpy

beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(jest.fn())
    jest.spyOn(console, 'groupCollapsed').mockImplementation(jest.fn())
})

afterAll(() => {
    console.log.mockRestore()
    console.groupCollapsed.mockRestore()
})
beforeEach(() => {
    windowSpy = jest.spyOn(window, 'window', 'get')
})

afterEach(() => {
    console.log.mockClear()
    console.groupCollapsed.mockClear()
    windowSpy.mockRestore()
})

describe('App', () => {
    test('When the browser goes offline it should send an offline analytics event', () => {
        const analyticsManagerTrack = jest.spyOn(analyticsManager, 'track')
        renderWithProviders(<App>Testing</App>)
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

    test('App component is rendered appropriately', () => {
        renderWithProviders(
            <App>
                <p>Any children here</p>
            </App>
        )
        expect(screen.getByRole('main')).toBeInTheDocument()
        expect(screen.getByText('Any children here')).toBeInTheDocument()
    })

    test('Listen for page events and send to analytics', () => {
        getAnalyticsManager().track = jest.fn()
        getAnalyticsManager().trackPageLoad = jest.fn()
        renderWithProviders(
            <App>
                <p>Any children here</p>
            </App>
        )
        pageEvents.pageLoad('test-page', 1, 2)
        expect(getAnalyticsManager().track).toHaveBeenCalledWith(PAGEVIEW, {
            end: 2,
            start: 1,
            templateName: 'test-page'
        })
        pageEvents.error('test-page', 'err')
        expect(getAnalyticsManager().track).toHaveBeenCalledWith(ERROR, {
            content: 'err',
            name: 'test-page'
        })
    })

    test('shouldGetProps returns true only server-side', () => {
        windowSpy.mockImplementation(() => undefined)

        expect(App.shouldGetProps()).toBe(true)

        windowSpy.mockImplementation(() => ({
            location: {
                origin: 'http://localhost:3000/'
            }
        }))
        expect(App.shouldGetProps()).toBe(false)
    })
})
