/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen} from '@testing-library/react'
import {Router} from 'react-router-dom'
import {createMemoryHistory} from 'history'

import {CorrelationIdProvider, MrtDataStoreProvider} from './index'
import {useCorrelationId, useCustomSitePreferences, useCustomGlobalPreferences} from '../hooks'
import crypto from 'crypto'
import PropTypes from 'prop-types'
import userEvent from '@testing-library/user-event'
const SampleProvider = (props) => {
    const {correlationId, resetOnPageChange} = props
    return (
        <CorrelationIdProvider correlationId={correlationId} resetOnPageChange={resetOnPageChange}>
            {props.children}
        </CorrelationIdProvider>
    )
}

SampleProvider.propTypes = {
    children: PropTypes.element.isRequired,
    resetOnPageChange: PropTypes.bool,
    correlationId: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired
}

const Component = () => {
    const {correlationId} = useCorrelationId()
    return <div className={'correlation-id'}>{correlationId}</div>
}
describe('CorrelationIdProvider', function () {
    test('Renders without errors', () => {
        const history = createMemoryHistory()
        const id = crypto.randomUUID()

        render(
            <Router history={history}>
                <SampleProvider correlationId={() => id}>
                    <Component />
                </SampleProvider>
            </Router>
        )
        expect(screen.getByText(id)).toBeInTheDocument()
    })

    test('renders when correlationId is passed as a function', () => {
        const id = crypto.randomUUID()
        const history = createMemoryHistory()
        render(
            <Router history={history}>
                <SampleProvider correlationId={() => id}>
                    <Component />
                </SampleProvider>
            </Router>
        )
        expect(screen.getByText(id)).toBeInTheDocument()
    })

    test('renders when correlationId is passed as a string', () => {
        const id = crypto.randomUUID()
        const history = createMemoryHistory()

        render(
            <Router history={history}>
                <SampleProvider correlationId={id} resetOnPageChange={false}>
                    <Component />
                </SampleProvider>
            </Router>
        )
        expect(screen.getByText(id)).toBeInTheDocument()
    })

    test('generates a new id when changing page', async () => {
        const user = userEvent.setup()
        const history = createMemoryHistory()
        const Component = () => {
            const {correlationId} = useCorrelationId()
            return (
                <div>
                    <div data-testid="correlation-id">{correlationId}</div>
                    <button className="button" onClick={() => history.push('/page-1')}>
                        Go to another page
                    </button>
                </div>
            )
        }

        render(
            <Router history={history}>
                <SampleProvider correlationId={() => crypto.randomUUID()}>
                    <Component />
                </SampleProvider>
            </Router>
        )

        const firstRenderedId = screen.getByTestId('correlation-id').innerHTML
        const button = screen.getByText(/go to another page/i)
        await user.click(button)
        const secondRenderedId = screen.getByTestId('correlation-id').innerHTML
        // expecting the provider to have a different correlation id when a page navigation happens
        expect(firstRenderedId).not.toEqual(secondRenderedId)
    })
})

describe('MrtDataStoreProvider', () => {
    const siteId = 'RefArch'

    beforeEach(() => {
        delete window.__MRT_DATA_STORE__
    })

    test('provides empty objects when no data is available', () => {
        const Component = () => {
            const sitePreferences = useCustomSitePreferences()
            const globalPreferences = useCustomGlobalPreferences()
            return (
                <div>
                    <div data-testid="site-prefs">{JSON.stringify(sitePreferences)}</div>
                    <div data-testid="global-prefs">{JSON.stringify(globalPreferences)}</div>
                </div>
            )
        }

        render(
            <MrtDataStoreProvider siteId={siteId}>
                <Component />
            </MrtDataStoreProvider>
        )

        expect(screen.getByTestId('site-prefs')).toHaveTextContent('{}')
        expect(screen.getByTestId('global-prefs')).toHaveTextContent('{}')
    })

    test('uses SSR props on server (no window)', () => {
        const sitePrefs = {feature1: true, maxItems: 10}
        const globalPrefs = {theme: 'dark', debug: false}

        const Component = () => {
            const sitePreferences = useCustomSitePreferences()
            const globalPreferences = useCustomGlobalPreferences()
            return (
                <div>
                    <div data-testid="site-prefs">{JSON.stringify(sitePreferences)}</div>
                    <div data-testid="global-prefs">{JSON.stringify(globalPreferences)}</div>
                </div>
            )
        }

        render(
            <MrtDataStoreProvider
                siteId={siteId}
                customSitePreferences={sitePrefs}
                customGlobalPreferences={globalPrefs}
            >
                <Component />
            </MrtDataStoreProvider>
        )

        expect(screen.getByTestId('site-prefs')).toHaveTextContent(JSON.stringify(sitePrefs))
        expect(screen.getByTestId('global-prefs')).toHaveTextContent(JSON.stringify(globalPrefs))
    })

    test('reads from window.__MRT_DATA_STORE__ using DAL keys', () => {
        const sitePrefs = {clientFeature: true}
        const globalPrefs = {clientTheme: 'light'}

        window.__MRT_DATA_STORE__ = {
            __siteId: siteId,
            'RefArch-custom-site-preferences': sitePrefs,
            'custom-global-preferences': globalPrefs
        }

        const Component = () => {
            const sitePreferences = useCustomSitePreferences()
            const globalPreferences = useCustomGlobalPreferences()
            return (
                <div>
                    <div data-testid="site-prefs">{JSON.stringify(sitePreferences)}</div>
                    <div data-testid="global-prefs">{JSON.stringify(globalPreferences)}</div>
                </div>
            )
        }

        render(
            <MrtDataStoreProvider siteId={siteId}>
                <Component />
            </MrtDataStoreProvider>
        )

        expect(screen.getByTestId('site-prefs')).toHaveTextContent(JSON.stringify(sitePrefs))
        expect(screen.getByTestId('global-prefs')).toHaveTextContent(JSON.stringify(globalPrefs))
    })

    test('prefers window.__MRT_DATA_STORE__ over SSR props on client', () => {
        const windowSitePrefs = {fromWindow: true}
        const windowGlobalPrefs = {windowTheme: 'dark'}
        const ssrSitePrefs = {fromSSR: true}
        const ssrGlobalPrefs = {ssrTheme: 'light'}

        window.__MRT_DATA_STORE__ = {
            __siteId: siteId,
            'RefArch-custom-site-preferences': windowSitePrefs,
            'custom-global-preferences': windowGlobalPrefs
        }

        const Component = () => {
            const sitePreferences = useCustomSitePreferences()
            const globalPreferences = useCustomGlobalPreferences()
            return (
                <div>
                    <div data-testid="site-prefs">{JSON.stringify(sitePreferences)}</div>
                    <div data-testid="global-prefs">{JSON.stringify(globalPreferences)}</div>
                </div>
            )
        }

        render(
            <MrtDataStoreProvider
                siteId={siteId}
                customSitePreferences={ssrSitePrefs}
                customGlobalPreferences={ssrGlobalPrefs}
            >
                <Component />
            </MrtDataStoreProvider>
        )

        // Should use window data, not SSR props
        expect(screen.getByTestId('site-prefs')).toHaveTextContent(JSON.stringify(windowSitePrefs))
        expect(screen.getByTestId('global-prefs')).toHaveTextContent(
            JSON.stringify(windowGlobalPrefs)
        )
    })

    test('handles missing nested properties in window.__MRT_DATA_STORE__', () => {
        window.__MRT_DATA_STORE__ = {}

        const Component = () => {
            const sitePreferences = useCustomSitePreferences()
            const globalPreferences = useCustomGlobalPreferences()
            return (
                <div>
                    <div data-testid="site-prefs">{JSON.stringify(sitePreferences)}</div>
                    <div data-testid="global-prefs">{JSON.stringify(globalPreferences)}</div>
                </div>
            )
        }

        render(
            <MrtDataStoreProvider siteId={siteId}>
                <Component />
            </MrtDataStoreProvider>
        )

        expect(screen.getByTestId('site-prefs')).toHaveTextContent('{}')
        expect(screen.getByTestId('global-prefs')).toHaveTextContent('{}')
    })

    test('handles missing siteId gracefully', () => {
        const globalPrefs = {theme: 'dark'}

        window.__MRT_DATA_STORE__ = {
            __siteId: null,
            'custom-global-preferences': globalPrefs
        }

        const Component = () => {
            const sitePreferences = useCustomSitePreferences()
            const globalPreferences = useCustomGlobalPreferences()
            return (
                <div>
                    <div data-testid="site-prefs">{JSON.stringify(sitePreferences)}</div>
                    <div data-testid="global-prefs">{JSON.stringify(globalPreferences)}</div>
                </div>
            )
        }

        render(
            <MrtDataStoreProvider>
                <Component />
            </MrtDataStoreProvider>
        )

        expect(screen.getByTestId('site-prefs')).toHaveTextContent('{}')
        expect(screen.getByTestId('global-prefs')).toHaveTextContent(JSON.stringify(globalPrefs))
    })
})
