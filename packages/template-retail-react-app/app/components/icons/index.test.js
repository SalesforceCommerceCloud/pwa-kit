/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useIntl} from 'react-intl'
import {within} from '@testing-library/dom'
import {render} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import * as Icons from '@salesforce/retail-react-app/app/components/icons/index'

jest.mock('react-intl', () => ({
    ...jest.requireActual('react-intl'),
    useIntl: jest.fn()
}))

beforeEach(() => {
    jest.clearAllMocks()
})

test('renders svg icons with Chakra Icon component', () => {
    renderWithProviders(<Icons.CheckIcon />)
    const svg = document.querySelector('.chakra-icon')
    const use = within(svg).getByRole('presentation')
    expect(svg).toBeInTheDocument()
    expect(use).toBeInTheDocument()
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    expect(use).toHaveAttribute('xlink:href', '#check')
})

// the icon component can exist outside the provider tree via the error component
// therefore we cannot use the useIntl hook because the <IntlProvider> component
// will not exist in the component tree, so we pass the intl object as a prop
test('uses intl object from props and not from useIntl hook', () => {
    const mockIntl = {
        formatMessage: jest.fn()
    }

    // render without providers
    render(<Icons.LockIcon intl={mockIntl} />)

    expect(mockIntl.formatMessage).toHaveBeenCalled()
    expect(useIntl).not.toHaveBeenCalled()
})
