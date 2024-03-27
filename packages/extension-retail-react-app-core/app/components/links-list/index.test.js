/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {
    StylesProvider,
    useMultiStyleConfig
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {screen} from '@testing-library/react'

import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import LinksList from '@salesforce/retail-react-app/app/components/links-list/index'

const links = [
    {
        href: '/',
        text: 'Privacy Policy'
    }
]
const horizontalVariantSelector = 'ul > .chakra-stack > li'

const FooterStylesProvider = ({children}) => {
    const styles = useMultiStyleConfig('Footer')
    return <StylesProvider value={styles}>{children}</StylesProvider>
}
FooterStylesProvider.propTypes = {
    children: PropTypes.node
}

test('renders LinksList with default arguments', () => {
    renderWithProviders(
        <FooterStylesProvider>
            <LinksList links={links} />
        </FooterStylesProvider>
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByRole('link', {name: links[0].text})).toBeInTheDocument()
    expect(screen.queryByRole('heading')).toBeNull()
    expect(document.querySelector(horizontalVariantSelector)).toBeNull()
})

test('renders LinksList with heading', () => {
    renderWithProviders(
        <FooterStylesProvider>
            <LinksList links={links} heading="Customer Support" />
        </FooterStylesProvider>
    )

    expect(screen.getByRole('heading')).toBeInTheDocument()
})

test('renders LinksList with horizontal variant', () => {
    renderWithProviders(
        <FooterStylesProvider>
            <LinksList links={links} variant="horizontal" />
        </FooterStylesProvider>
    )

    expect(document.querySelector(horizontalVariantSelector)).toBeInTheDocument()
})
