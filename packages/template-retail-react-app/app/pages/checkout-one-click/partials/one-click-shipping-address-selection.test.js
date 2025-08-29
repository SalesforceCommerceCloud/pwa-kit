/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen} from '@testing-library/react'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useShopperCustomersMutation} from '@salesforce/commerce-sdk-react'
import ShippingAddressSelection from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-address-selection'

// Mock react-intl
jest.mock('react-intl', () => ({
    ...jest.requireActual('react-intl'),
    useIntl: () => ({
        formatMessage: jest.fn((descriptor, values) => {
            if (typeof descriptor === 'string') return descriptor
            if (descriptor && typeof descriptor.defaultMessage === 'string') {
                let message = descriptor.defaultMessage
                if (values) {
                    Object.keys(values).forEach((key) => {
                        message = message.replace(`{${key}}`, values[key])
                    })
                }
                return message
            }
            if (descriptor && typeof descriptor.id === 'string') return descriptor.id
            return 'Formatted Message'
        })
    }),
    FormattedMessage: ({defaultMessage, children, id}) => {
        if (typeof defaultMessage === 'string') return defaultMessage
        if (typeof children === 'string') return children
        if (typeof id === 'string') return id
        return 'Formatted Message'
    },
    defineMessage: (descriptor) => descriptor
}))

// Mock dependencies
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer')
jest.mock('@salesforce/commerce-sdk-react')

const mockCustomer = {
    addresses: []
}

describe('ShippingAddressSelection Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        useCurrentCustomer.mockReturnValue({
            data: mockCustomer,
            isLoading: false,
            isFetching: false
        })
        useShopperCustomersMutation.mockReturnValue({
            mutateAsync: jest.fn().mockResolvedValue({})
        })
    })

    describe('Billing Address Mode', () => {
        test('hides submit button when requested', () => {
            render(<ShippingAddressSelection hideSubmitButton={true} />)

            expect(screen.queryByText('Submit')).not.toBeInTheDocument()
        })
    })

    describe('Edge Cases', () => {
        test('handles customer with null addresses', () => {
            useCurrentCustomer.mockReturnValue({
                data: {addresses: null},
                isLoading: false,
                isFetching: false
            })

            render(<ShippingAddressSelection />)

            // Component should render without errors
            expect(screen.queryByTestId('error')).not.toBeInTheDocument()
        })
    })
})
