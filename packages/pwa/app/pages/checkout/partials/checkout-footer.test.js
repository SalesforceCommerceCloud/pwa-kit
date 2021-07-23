import React from 'react'
import {screen} from '@testing-library/react'

import CheckoutFooter from './checkout-footer'
import {renderWithProviders} from '../../../utils/test-utils'

test('renders component', () => {
    renderWithProviders(<CheckoutFooter />)
    expect(screen.getByRole('link', {name: 'Shipping'})).toBeInTheDocument()
})
