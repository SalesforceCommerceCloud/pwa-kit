/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PageNotFound from '@salesforce/retail-react-app/app/pages/page-not-found/index'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {screen} from '@testing-library/react'

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
})

const MockedComponent = () => {
    return <PageNotFound />
}

test('renders product item name, attributes and price', () => {
    renderWithProviders(<MockedComponent />)

    expect(screen.getByText(/The page you're looking for can't be found/i)).toBeInTheDocument()
    expect(
        screen.getByText(
            /Please try retyping the address, going back to the previous page, or going to the home page./i
        )
    ).toBeInTheDocument()
    expect(screen.getByText(/Go to home page/i)).toBeInTheDocument()
})
