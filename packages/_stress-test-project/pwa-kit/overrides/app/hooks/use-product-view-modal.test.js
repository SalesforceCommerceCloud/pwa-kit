/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Router} from 'react-router-dom'
import PropTypes from 'prop-types'
import {screen, fireEvent, waitFor} from '@testing-library/react'
import {createMemoryHistory} from 'history'
import {IntlProvider} from 'react-intl'

import mockProductDetail from '../commerce-api/mocks/variant-750518699578M'
import {useProductViewModal} from './use-product-view-modal'
import {DEFAULT_LOCALE, renderWithProviders} from '../utils/test-utils'
import messages from '../translations/compiled/en-GB.json'
import {rest} from 'msw'

const mockProduct = {
    ...mockProductDetail,
    id: '750518699660M',
    variationValues: {
        color: 'BLACKFB',
        size: '050',
        width: 'V'
    },
    c_color: 'BLACKFB',
    c_isNew: true,
    c_refinementColor: 'black',
    c_size: '050',
    c_width: 'V'
}

const MockComponent = ({product}) => {
    const productViewModalData = useProductViewModal(product)
    const [isShown, setIsShown] = React.useState(false)

    return (
        <div>
            <button onClick={() => setIsShown(!isShown)}>Toggle the content</button>
            {isShown && (
                <>
                    <div>{productViewModalData.product.id}</div>
                    <div data-testid="variant">{JSON.stringify(productViewModalData.variant)}</div>
                    <div>{`isFetching: ${productViewModalData.isFetching}`}</div>
                </>
            )}
        </div>
    )
}

MockComponent.propTypes = {
    product: PropTypes.object
}

beforeEach(() => {
    global.server.use(
        rest.get('*/products/:productId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.json(mockProduct))
        })
    )
})

describe('useProductViewModal hook', () => {
    test('return proper data', () => {
        const history = createMemoryHistory()
        history.push('/test/path')
        renderWithProviders(<MockComponent product={mockProductDetail} />)

        const toggleButton = screen.getByText(/Toggle the content/)
        fireEvent.click(toggleButton)

        expect(screen.getByText('750518699578M')).toBeInTheDocument()
        expect(screen.getByText(/isFetching: false/i)).toBeInTheDocument()
        expect(screen.getByTestId('variant')).toHaveTextContent(
            '{"orderable":true,"price":299.99,"productId":"750518699578M","variationValues":{"color":"BLACKFB","size":"038","width":"V"}}'
        )
    })

    test("update product's related url param when the product content is shown", () => {
        const history = createMemoryHistory()
        history.push('/test/path?color=BLACKFB')

        renderWithProviders(
            <Router history={history}>
                <IntlProvider
                    locale={DEFAULT_LOCALE}
                    defaultLocale={DEFAULT_LOCALE}
                    messages={messages}
                >
                    <MockComponent product={mockProductDetail} />
                </IntlProvider>
            </Router>
        )
        const toggleButton = screen.getByText(/Toggle the content/)
        fireEvent.click(toggleButton)
        expect(history.location.pathname).toBe('/test/path')
        const searchParams = new URLSearchParams(history.location.search)
        expect(searchParams.get('color')).toEqual('BLACKFB')
        expect(searchParams.get('width')).toEqual('V')
        expect(searchParams.get('pid')).toEqual('750518699578M')
    })

    test("clean up product's related url param when unmounting product content", () => {
        const history = createMemoryHistory()
        history.push('/test/path')

        renderWithProviders(
            <Router history={history}>
                <IntlProvider
                    locale={DEFAULT_LOCALE}
                    defaultLocale={DEFAULT_LOCALE}
                    messages={messages}
                >
                    <MockComponent product={mockProductDetail} />
                </IntlProvider>
            </Router>
        )
        const toggleButton = screen.getByText(/Toggle the content/)
        // show the content
        fireEvent.click(toggleButton)
        expect(history.location.pathname).toBe('/test/path')

        // hide the content
        fireEvent.click(toggleButton)
        const searchParams = new URLSearchParams(history.location.search.toString())
        waitFor(() => {
            expect(searchParams.get('color')).toEqual(undefined)
            expect(searchParams.get('width')).toEqual(undefined)
            expect(searchParams.get('pid')).toEqual(undefined)
        })
    })

    test('load new variant on variant selection', () => {
        const history = createMemoryHistory()
        history.push('/test/path')

        renderWithProviders(
            <Router history={history}>
                <IntlProvider locale={DEFAULT_LOCALE} defaultLocale={DEFAULT_LOCALE}>
                    <MockComponent product={mockProductDetail} />
                </IntlProvider>
            </Router>
        )

        const toggleButton = screen.getByText(/Toggle the content/)
        fireEvent.click(toggleButton)
        expect(screen.getByText('750518699578M')).toBeInTheDocument()
        history.push('/test/path?color=BLACKFB&size=050&width=V&pid=750518699660M')
        expect(screen.getByTestId('variant')).toHaveTextContent(
            '{"orderable":true,"price":299.99,"productId":"750518699660M","variationValues":{"color":"BLACKFB","size":"050","width":"V"}}'
        )
    })
})
