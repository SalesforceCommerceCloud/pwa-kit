/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {defineMessage} from 'react-intl'
import {renderWithChakraProvider, renderWithProviders} from '../../utils/test-utils'
import * as Icons from '../../components/icons/index'
import {icon} from './index'
beforeEach(() => {
    jest.clearAllMocks()
})

test('renders svg icons with Chakra Icon component', () => {
    renderWithProviders(<Icons.CheckIcon />)
    const svg = document.querySelector('.chakra-icon')

    expect(svg).toBeInTheDocument()
    const use = svg.querySelector('use')
    expect(use).toBeInTheDocument()
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    expect(use).toHaveAttribute('xlink:href', '#check')
})

test('renders icon with correct aria attributes (with localed message)', () => {
    renderWithProviders(<Icons.LockIcon />)
    const svg = document.querySelector('.chakra-icon')

    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    expect(svg).toHaveAttribute('aria-hidden', 'false')
    expect(svg).toHaveAttribute('aria-label', 'Secure')
})

// the icon component can exist outside the provider tree via the error component
// therefore we cannot use the useIntl hook because the <IntlProvider> component
// will not exist in the component tree, so we pass the intl object as a prop
test('uses intl from props when rendered outside provider tree', () => {
    const mockIntl = {
        formatMessage: jest.fn()
    }

    const Icons = icon(
        'lock',
        {
            'aria-hidden': false,
            focusable: true
        },
        {
            'aria-label': defineMessage({
                id: 'icons.assistive_msg.lock',
                defaultMessage: 'Secure'
            })
        }
    )

    // render without providers
    renderWithChakraProvider(<Icons intl={mockIntl} viewBox="0 0 40 40" />)
    const svg = document.querySelector('.chakra-icon')
    // confirm that the other prop are being render properly
    expect(mockIntl.formatMessage).toHaveBeenCalled()
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('viewBox', '0 0 40 40')
})

test('throws error when rendered outside provider tree and no intl prop is passed', async () => {
    const errorMsg =
        'To localize messages, you must either have <IntlProvider> in the component ancestry or provide `intl` as a prop'
    // render without providers
    expect(() => renderWithChakraProvider(<Icons.LockIcon />)).toThrow(errorMsg)
})
