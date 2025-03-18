/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/*global dw*/

import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {act, screen, waitFor} from '@testing-library/react'

import {renderWithProviders} from '../utils/test-utils'
import useActiveData from './use-active-data'
import {mockCategory, mockProduct, mockSearchResults} from './einstein-mock-data'
import mockConfig from '../mock-config'
const DEFAULT_SEARCH_PARAMS = mockConfig.search.defaultSearchParams
jest.mock('../mock-config')

const MockComponent = ({action, args}) => {
    const [loading, setLoading] = useState(true)
    const activeDataApi = useActiveData()

    useEffect(() => {
        ;(async () => {
            await activeDataApi?.[action](...args)
            act(() => {
                setLoading(false)
            })
        })()
    }, [])

    return <div data-testid="active-data-loading-state">{JSON.stringify(loading)}</div>
}

MockComponent.propTypes = {
    action: PropTypes.string.isRequired,
    args: PropTypes.arrayOf[PropTypes.any]
}

beforeAll(() => {
    window.dw = {
        ac: {
            applyContext: jest.fn(),
            _capture: jest.fn(),
            _scheduleDataSubmission: jest.fn(),
            _setSiteCurrency: jest.fn(),
            setDWAnalytics: jest.fn()
        },
        __dwAnalytics: {
            getTracker: jest.fn()
        }
    }

    window.matchMedia = (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // Deprecated
        removeListener: jest.fn(), // Deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
    })
})

afterAll(() => {
    delete window.dw
})

describe('useDerivedProduct hook', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('viewProduct captures expected product', async () => {
        mockConfig.activeDataEnabled = true

        // Render the mock component that calls the active data endpoint via a hook
        renderWithProviders(
            <MockComponent action="sendViewProduct" args={[mockCategory, mockProduct, 'detail']} />
        )

        // Wait for the call to finish.
        await waitFor(() => {
            expect(JSON.parse(screen.getByTestId('active-data-loading-state').innerHTML)).toBe(
                false
            )
        })

        // Run checks
        expect(dw.ac.applyContext).toHaveBeenCalledWith({category: mockCategory.id})
        expect(dw.ac._capture).toHaveBeenCalledWith({id: mockProduct.id, type: 'detail'})
        expect(dw.ac._scheduleDataSubmission).toHaveBeenCalledWith()
    })

    test('viewProduct does nothing if active data is disabled', async () => {
        mockConfig.activeDataEnabled = false

        // Render the mock component that calls the active data endpoint via a hook
        renderWithProviders(
            <MockComponent action="sendViewProduct" args={[mockCategory, mockProduct, 'detail']} />
        )

        // Wait for the call to finish.
        await waitFor(() => {
            expect(JSON.parse(screen.getByTestId('active-data-loading-state').innerHTML)).toBe(
                false
            )
        })

        // Run checks
        expect(dw.ac.applyContext).toHaveBeenCalledTimes(0)
        expect(dw.ac._capture).toHaveBeenCalledTimes(0)
        expect(dw.ac._scheduleDataSubmission).toHaveBeenCalledTimes(0)
    })

    test('viewSearch applies search context and captures expected data', async () => {
        mockConfig.activeDataEnabled = true

        // Render the mock component that calls the active data endpoint via a hook
        renderWithProviders(
            <MockComponent
                action="sendViewSearch"
                args={[DEFAULT_SEARCH_PARAMS, mockSearchResults]}
            />
        )

        // Wait for the call to finish.
        await waitFor(() => {
            expect(JSON.parse(screen.getByTestId('active-data-loading-state').innerHTML)).toBe(
                false
            )
        })

        expect(dw.ac.applyContext).toHaveBeenCalledWith({searchData: DEFAULT_SEARCH_PARAMS})
    })

    test('viewSearch does nothing if active data is disabled', async () => {
        mockConfig.activeDataEnabled = false

        // Render the mock component that calls the active data endpoint via a hook
        renderWithProviders(
            <MockComponent
                action="sendViewSearch"
                args={[DEFAULT_SEARCH_PARAMS, mockSearchResults]}
            />
        )

        // Wait for the call to finish.
        await waitFor(() => {
            expect(JSON.parse(screen.getByTestId('active-data-loading-state').innerHTML)).toBe(
                false
            )
        })

        expect(dw.ac.applyContext).toHaveBeenCalledTimes(0)
    })

    test('viewCategory applies category context and captures expected data', async () => {
        mockConfig.activeDataEnabled = true

        // Render the mock component that calls the active data endpoint via a hook
        renderWithProviders(
            <MockComponent
                action="sendViewCategory"
                args={[DEFAULT_SEARCH_PARAMS, mockCategory, mockSearchResults]}
            />
        )

        // Wait for the call to finish.
        await waitFor(() => {
            expect(JSON.parse(screen.getByTestId('active-data-loading-state').innerHTML)).toBe(
                false
            )
        })

        expect(dw.ac.applyContext).toHaveBeenCalledWith({
            category: mockCategory.id,
            searchData: DEFAULT_SEARCH_PARAMS
        })
        expect(dw.ac._scheduleDataSubmission).toHaveBeenCalledWith()
    })

    test('viewCategory does nothing if active data is disabled', async () => {
        mockConfig.activeDataEnabled = false

        // Render the mock component that calls the active data endpoint via a hook
        renderWithProviders(
            <MockComponent
                action="sendViewCategory"
                args={[DEFAULT_SEARCH_PARAMS, mockCategory, mockSearchResults]}
            />
        )

        // Wait for the call to finish.
        await waitFor(() => {
            expect(JSON.parse(screen.getByTestId('active-data-loading-state').innerHTML)).toBe(
                false
            )
        })

        expect(dw.ac.applyContext).toHaveBeenCalledTimes(0)
        expect(dw.ac._scheduleDataSubmission).toHaveBeenCalledTimes(0)
    })

    test('trackPage sets expected DW analytics', async () => {
        mockConfig.activeDataEnabled = true

        // Render the mock component that calls the active data endpoint via a hook
        renderWithProviders(
            <MockComponent action="trackPage" args={['test-site-id', 'en-US', 'USD']} />
        )

        // Wait for the call to finish.
        await waitFor(() => {
            expect(JSON.parse(screen.getByTestId('active-data-loading-state').innerHTML)).toBe(
                false
            )
        })

        expect(dw.__dwAnalytics.getTracker).toHaveBeenCalledWith(
            '/mobify/proxy/ocapi/on/demandware.store/Sites-test-site-id-Site/en-US/__Analytics-Start'
        )
    })

    test('trackPage does nothing if active data is disabled', async () => {
        mockConfig.activeDataEnabled = false

        // Render the mock component that calls the active data endpoint via a hook
        renderWithProviders(
            <MockComponent action="trackPage" args={['test-site-id', 'en-US', 'USD']} />
        )

        // Wait for the call to finish.
        await waitFor(() => {
            expect(JSON.parse(screen.getByTestId('active-data-loading-state').innerHTML)).toBe(
                false
            )
        })

        expect(dw.__dwAnalytics.getTracker).toHaveBeenCalledTimes(0)
    })
})
