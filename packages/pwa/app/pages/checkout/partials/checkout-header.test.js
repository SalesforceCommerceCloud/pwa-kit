import React from 'react'
import {screen} from '@testing-library/react'

import CheckoutHeader from './checkout-header'
import {renderWithProviders} from '../../../utils/test-utils'

test('renders component', () => {
    renderWithProviders(<CheckoutHeader />)
    expect(screen.getByTitle(/back to homepage/i)).toBeInTheDocument()
})
