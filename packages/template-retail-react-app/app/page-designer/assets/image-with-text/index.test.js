/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import ImageWithText from '@salesforce/retail-react-app/app/page-designer/assets/image-with-text/index'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {mockImageWithText} from '@salesforce/retail-react-app/app/mocks/page-designer'

test('Page renders correct component', () => {
    const {getByText, getByRole} = renderWithProviders(<ImageWithText {...mockImageWithText} />)

    expect(getByText(/image with text component/i)).toBeInTheDocument()
    expect(getByRole('link', {name: /Alt Text test Image With Text Component/})).toBeInTheDocument()
})

test('Page does not render link when ITCLink is missing', () => {
    delete mockImageWithText.ITCLink
    const {queryByRole} = renderWithProviders(<ImageWithText {...mockImageWithText} />)

    expect(queryByRole('link', {name: /Alt Text test Image With Text Component/})).toBeNull()
})
