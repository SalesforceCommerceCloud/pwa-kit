/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import ComponentPreview from '@salesforce/retail-react-app/app/pages/component-preview/index'
import {useComponent} from '@salesforce/commerce-sdk-react'

jest.mock('@salesforce/commerce-sdk-react', () => ({
    ...jest.requireActual('@salesforce/commerce-sdk-react'),
    useComponent: jest.fn()
}))

jest.mock('@salesforce/commerce-sdk-react/page-designer', () => ({
    ...jest.requireActual('@salesforce/commerce-sdk-react/page-designer'),
    // Render a marker so we can assert the pipeline was reached without pulling in
    // the full runtime design machinery.
    Page: ({page}) => <div data-testid="pd-page">{page?.regions?.[0]?.components?.[0]?.id}</div>
}))

// Mode + componentId are derived directly from the URL search (via useLocation().search
// and URLSearchParams), NOT the no-arg window fallback. The test harness uses
// BrowserRouter, which reads window.location — so set the jsdom URL per test with
// history.pushState (initialEntries does NOT apply to BrowserRouter).
const setUrl = (path) => window.history.pushState({}, '', path)

describe('ComponentPreview route', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        useComponent.mockReturnValue({data: undefined, isLoading: false, error: null})
    })
    afterEach(() => setUrl('/'))

    test('renders nothing when not in EDIT/PREVIEW mode', () => {
        setUrl('/preview/component?componentId=comp1')
        renderWithProviders(<ComponentPreview />)
        expect(screen.queryByTestId('pd-page')).not.toBeInTheDocument()
    })

    test('renders nothing in EDIT mode when componentId is missing', () => {
        setUrl('/preview/component?mode=EDIT')
        renderWithProviders(<ComponentPreview />)
        expect(screen.queryByTestId('pd-page')).not.toBeInTheDocument()
    })

    test('renders the component through <Page> when in EDIT mode with componentId', () => {
        setUrl('/preview/component?mode=EDIT&componentId=comp1')
        useComponent.mockReturnValue({
            data: {id: 'comp1', typeId: 'commerce_assets.imageTile'},
            isLoading: false,
            error: null
        })
        renderWithProviders(<ComponentPreview />)
        expect(screen.getByTestId('pd-page')).toHaveTextContent('comp1')
    })

    test('exposes getTemplateName', () => {
        expect(ComponentPreview.getTemplateName()).toBe('component-preview')
    })
})
