/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen} from '@testing-library/react'
import PropTypes from 'prop-types'
import {usePDPSearchParams} from '@salesforce/retail-react-app/app/hooks/use-pdp-search-params'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

const MockComponent = ({productId} = {}) => {
    const [allParams, productParams] = usePDPSearchParams(productId)

    return (
        <>
            <div data-testid="all-params">{allParams.toString()}</div>
            <div data-testid="product-params">{productParams.toString()}</div>{' '}
        </>
    )
}
MockComponent.propTypes = {
    productId: PropTypes.string
}

test('product set', () => {
    const url =
        // The parent's id is `winter-lookM`, while the children's are `25518447M` and `25518704M`
        '/global/en-GB/product/winter-lookM?25518447M=color%3DJJ5FUXX%26size%3D9XL&25518704M=color%3DJJ2XNXX%26size%3D9MD'
    window.history.pushState({}, '', url)

    renderWithProviders(<MockComponent productId="25518704M" />)

    expect(screen.getByTestId('all-params')).toHaveTextContent(
        /^25518447M=color%3DJJ5FUXX%26size%3D9XL&25518704M=color%3DJJ2XNXX%26size%3D9MD$/
    )
    expect(screen.getByTestId('product-params')).toHaveTextContent(/^color=JJ2XNXX&size=9MD$/)
})

test('regular product with variant', () => {
    const url = '/global/en-GB/product/25502228M?color=JJ0NLD0&size=9MD&pid=701642889830M'
    window.history.pushState({}, '', url)

    renderWithProviders(<MockComponent />)

    expect(screen.getByTestId('all-params')).toHaveTextContent(
        /^color=JJ0NLD0&size=9MD&pid=701642889830M$/
    )
    expect(screen.getByTestId('product-params')).toHaveTextContent(/^$/)
})
