/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'

import {renderWithProviders} from '../../utils/test-utils'
import LinksList from '../../components/links-list/index'

const links = [
    {
        href: '/',
        text: 'Privacy Policy'
    }
]
const horizontalVariantSelector = 'ul > li'

test('renders LinksList with default arguments', () => {
    renderWithProviders(<LinksList links={links} />)

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByRole('link', {name: links[0].text})).toBeInTheDocument()
    expect(screen.queryByRole('heading')).toBeNull()
    expect(screen.queryByTestId('horizontal-list')).toBeNull()
})

test('renders LinksList with heading', () => {
    renderWithProviders(<LinksList links={links} heading="Customer Support" />)

    expect(screen.getByRole('heading')).toBeInTheDocument()
})

test('renders LinksList with horizontal variant', () => {
    const {container} = renderWithProviders(<LinksList links={links} variant="horizontal" />)
    expect(container.querySelector(horizontalVariantSelector)).toBeInTheDocument()
})
