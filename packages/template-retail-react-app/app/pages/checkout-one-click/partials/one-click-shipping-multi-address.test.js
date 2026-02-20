/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable react/prop-types */
jest.mock('react-intl', () => ({
    ...jest.requireActual('react-intl'),
    useIntl: () => ({
        formatMessage: (d) => d?.defaultMessage || d?.id || ''
    })
}))

jest.mock('@salesforce/retail-react-app/app/components/shared/ui', () => {
    const actual = jest.requireActual('@salesforce/retail-react-app/app/components/shared/ui')
    const Simple = ({children, ...rest}) => <div {...rest}>{children}</div>
    return {
        ...actual,
        Alert: ({children}) => <div role="alert">{children}</div>,
        AlertTitle: Simple,
        AlertDescription: Simple,
        AlertIcon: () => null
    }
})

import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import OneClickShippingMultiAddress from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-multi-address'

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: jest.fn()
}))
jest.mock('@salesforce/commerce-sdk-react', () => {
    const actual = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...actual,
        useProducts: jest.fn(() => ({data: {}, isLoading: false}))
    }
})
jest.mock('@salesforce/retail-react-app/app/hooks/use-product-address-assignment', () => ({
    useProductAddressAssignment: jest.fn()
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-address-form', () => ({
    useAddressForm: jest.fn()
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-multiship', () => ({
    useMultiship: jest.fn(() => ({orchestrateShipmentOperations: jest.fn()}))
}))
jest.mock(
    '@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context',
    () => ({
        useCheckout: jest.fn(() => ({STEPS: {SHIPPING_OPTIONS: 3}, goToStep: jest.fn()}))
    })
)
jest.mock('@salesforce/retail-react-app/app/hooks/use-toast', () => ({
    useToast: jest.fn(() => jest.fn())
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-add-to-cart-modal', () => ({
    AddToCartModalProvider: ({children}) => children
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-bonus-product-selection-modal', () => ({
    BonusProductSelectionModalProvider: ({children}) => children
}))
jest.mock(
    '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-product-shipping-address-card.jsx',
    () => {
        return function CardMock(props) {
            return (
                <div data-testid={`card-${props.addressKey}`}>
                    <button onClick={() => props.onAddNewAddress(props.item.itemId)}>Add</button>
                </div>
            )
        }
    }
)

const makeBasket = ({hasPickup}) => ({
    shipments: hasPickup ? [{shippingMethod: {c_storePickupEnabled: true}}] : [],
    productItems: []
})

const mockAddressAssignment = ({
    items = [{itemId: 'i1', productId: 'p1'}],
    allHave = false,
    selected = {}
} = {}) => ({
    deliveryItems: items,
    availableAddresses: [{addressId: 'a1', address1: '123 St'}],
    selectedAddresses: selected,
    allItemsHaveAddresses: allHave,
    setAddressesForItems: jest.fn(),
    addGuestAddress: jest.fn()
})

const mockAddressForm = ({isOpen = false, isSubmitting = false} = {}) => ({
    form: {handleSubmit: (cb) => cb, formState: {isSubmitting: false}},
    formStateByItemId: {},
    isSubmitting,
    openForm: jest.fn(),
    closeForm: jest.fn(),
    handleCreateAddress: jest.fn(),
    isAddressFormOpen: isOpen
})

describe('OneClickShippingMultiAddress', () => {
    const {useCurrentCustomer} = jest.requireMock(
        '@salesforce/retail-react-app/app/hooks/use-current-customer'
    )
    const {useProductAddressAssignment} = jest.requireMock(
        '@salesforce/retail-react-app/app/hooks/use-product-address-assignment'
    )
    const {useAddressForm} = jest.requireMock(
        '@salesforce/retail-react-app/app/hooks/use-address-form'
    )
    const {useMultiship} = jest.requireMock('@salesforce/retail-react-app/app/hooks/use-multiship')
    const {useCheckout} = jest.requireMock(
        '@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context'
    )
    const {useToast} = jest.requireMock('@salesforce/retail-react-app/app/hooks/use-toast')

    beforeEach(() => {
        jest.clearAllMocks()
        useCurrentCustomer.mockReturnValue({data: {isGuest: false}, isLoading: false})
        useProductAddressAssignment.mockReturnValue(mockAddressAssignment())
        useAddressForm.mockReturnValue(mockAddressForm())
    })
    // eslint-disable-next-line jest/no-disabled-tests
    test.skip('shows info alert when there are pickup items', () => {
        renderWithProviders(
            <OneClickShippingMultiAddress
                basket={makeBasket({hasPickup: true})}
                submitButtonLabel="Continue"
            />
        )
        expect(
            screen.getByText(
                /Some items are set for pickup and are not shown here. Only delivery items can be assigned/i
            )
        ).toBeInTheDocument()
    })

    test('renders a card for each delivery item', () => {
        useProductAddressAssignment.mockReturnValue(
            mockAddressAssignment({
                items: [
                    {itemId: 'i1', productId: 'p1'},
                    {itemId: 'i2', productId: 'p2'}
                ]
            })
        )
        renderWithProviders(
            <OneClickShippingMultiAddress
                basket={makeBasket({hasPickup: false})}
                submitButtonLabel="Continue"
            />
        )
        expect(screen.getByTestId('card-i1')).toBeInTheDocument()
        expect(screen.getByTestId('card-i2')).toBeInTheDocument()
    })

    test('continue button disabled until all shipments have address', () => {
        useProductAddressAssignment.mockReturnValue(mockAddressAssignment({allHave: false}))
        renderWithProviders(
            <OneClickShippingMultiAddress
                basket={makeBasket({hasPickup: false})}
                submitButtonLabel="Continue"
            />
        )
        const btn = screen.getByRole('button', {name: /continue/i})
        expect(btn).toBeDisabled()
    })

    test('submits and navigates on success', async () => {
        const orchestrateShipmentOperations = jest.fn().mockResolvedValue({})
        useMultiship.mockReturnValue({orchestrateShipmentOperations})
        useProductAddressAssignment.mockReturnValue(mockAddressAssignment({allHave: true}))
        const goToStep = jest.fn()
        useCheckout.mockReturnValue({STEPS: {SHIPPING_OPTIONS: 3}, goToStep})

        const {user} = renderWithProviders(
            <OneClickShippingMultiAddress
                basket={makeBasket({hasPickup: false})}
                submitButtonLabel="Continue"
            />
        )
        const btn = screen.getByRole('button', {name: /continue/i})
        await user.click(btn)
        await waitFor(() => {
            expect(orchestrateShipmentOperations).toHaveBeenCalled()
            expect(goToStep).toHaveBeenCalledWith(3)
        })
    })

    test('shows error toast when submit fails', async () => {
        const orchestrateShipmentOperations = jest.fn().mockRejectedValue(new Error('x'))
        useMultiship.mockReturnValue({orchestrateShipmentOperations})
        useProductAddressAssignment.mockReturnValue(mockAddressAssignment({allHave: true}))
        const showToast = jest.fn()
        useToast.mockReturnValue(showToast)

        const {user} = renderWithProviders(
            <OneClickShippingMultiAddress
                basket={makeBasket({hasPickup: false})}
                submitButtonLabel="Continue"
            />
        )
        await user.click(screen.getByRole('button', {name: /continue/i}))
        await waitFor(() => {
            expect(showToast).toHaveBeenCalled()
        })
    })

    test('shows guest warning when guest with open address form', () => {
        useCurrentCustomer.mockReturnValue({data: {isGuest: true}, isLoading: false})
        useAddressForm.mockReturnValue(mockAddressForm({isOpen: true}))
        renderWithProviders(
            <OneClickShippingMultiAddress
                basket={makeBasket({hasPickup: false})}
                submitButtonLabel="Continue"
                onUnsavedGuestAddressesToggleWarning={<span>Warning</span>}
            />
        )
        expect(screen.getByText('Warning')).toBeInTheDocument()
    })
})
