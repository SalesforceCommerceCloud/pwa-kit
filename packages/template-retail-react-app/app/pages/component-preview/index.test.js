/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import ComponentPreview from '@salesforce/retail-react-app/app/pages/component-preview/index'
import {useComponent} from '@salesforce/commerce-sdk-react'
import {Page, registry} from '@salesforce/commerce-sdk-react/page-designer'
import {PREVIEW_PAGE_ID} from '@salesforce/retail-react-app/app/page-designer/preview-page'
import {initializeRegistry} from '@salesforce/retail-react-app/app/page-designer/registry'

jest.mock('@salesforce/commerce-sdk-react', () => ({
    ...jest.requireActual('@salesforce/commerce-sdk-react'),
    useComponent: jest.fn()
}))

// Spy the real registry-backed Page so we can assert it is called without a
// `components` map, while still rendering through the V2 Page/Region pipeline.
jest.mock('@salesforce/commerce-sdk-react/page-designer', () => {
    const actual = jest.requireActual('@salesforce/commerce-sdk-react/page-designer')
    return {
        ...actual,
        // eslint-disable-next-line react/prop-types
        Page: jest.fn((props) => actual.Page(props))
    }
})

// Mode + componentId are derived directly from the URL search (via useLocation().search
// and URLSearchParams), NOT the no-arg window fallback. The test harness uses
// BrowserRouter, which reads window.location — so set the jsdom URL per test with
// history.pushState (initialEntries does NOT apply to BrowserRouter).
const setUrl = (path) => window.history.pushState({}, '', path)

const PREVIEW_TYPE_ID = 'commerce_assets.imageTile'

const restoreProductionRegistry = () => {
    registry.clear()
    initializeRegistry()
}

describe('ComponentPreview route', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        useComponent.mockReturnValue({data: undefined, isLoading: false, error: null})
        restoreProductionRegistry()
    })
    afterEach(() => {
        setUrl('/')
        restoreProductionRegistry()
    })

    test('renders nothing when not in EDIT/PREVIEW mode', () => {
        setUrl('/preview/component?componentId=comp1')
        renderWithProviders(<ComponentPreview />)
        expect(screen.queryByTestId('component-preview-page')).not.toBeInTheDocument()
        expect(Page).not.toHaveBeenCalled()
    })

    test('renders nothing in EDIT mode when componentId is missing', () => {
        setUrl('/preview/component?mode=EDIT')
        renderWithProviders(<ComponentPreview />)
        expect(screen.queryByTestId('component-preview-page')).not.toBeInTheDocument()
        expect(Page).not.toHaveBeenCalled()
    })

    test('renders the component through registry-backed <Page> without a components map', async () => {
        setUrl('/preview/component?mode=EDIT&componentId=comp1')
        useComponent.mockReturnValue({
            data: {
                id: 'comp1',
                typeId: PREVIEW_TYPE_ID,
                data: {
                    image: {
                        url: 'https://example.com/tile.png',
                        alt: 'Preview tile'
                    }
                }
            },
            isLoading: false,
            error: null
        })
        renderWithProviders(<ComponentPreview />)

        // Production `initializeRegistry()` registers a lazy importer, so Region/Component
        // suspends until imageTile resolves. Await the eventual tile, not an eager mock.
        await waitFor(() => {
            expect(screen.getByTestId('image-tile-image')).toBeInTheDocument()
        })
        expect(screen.getByTestId('image-tile-image')).toHaveAttribute(
            'src',
            'https://example.com/tile.png'
        )
        expect(Page).toHaveBeenCalled()
        const pageProps = Page.mock.calls[0][0]
        expect(pageProps.page).toEqual(
            expect.objectContaining({
                id: PREVIEW_PAGE_ID,
                regions: [
                    expect.objectContaining({
                        components: [
                            expect.objectContaining({id: 'comp1', typeId: PREVIEW_TYPE_ID})
                        ]
                    })
                ]
            })
        )
        expect(pageProps.components).toBeUndefined()
    })

    test('exposes getTemplateName', () => {
        expect(ComponentPreview.getTemplateName()).toBe('component-preview')
    })
})
