/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {act} from '@testing-library/react'
import {mockedCustomerProductListsDetails} from '../../../../mocks/mock-data'
import ItemVariantProvider from '../../../components/item-variant'
import {renderWithProviders} from '../../../utils/test-utils'
import CartSecondaryButtonGroup from './cart-secondary-button-group'
import {screen, waitFor} from '@testing-library/react'
import {noop} from '../../../utils/utils'

// Mock the useCurrentCustomer hook to prevent API calls and act warnings
jest.mock('../../../hooks', () => ({
    useCurrentCustomer: () => ({
        data: {
            isRegistered: true,
            customerId: 'test-customer-id'
        }
    })
}))

const MockedComponent = ({
    //@sfdc-extension-line SFDC_EXT_WISHLIST
    onAddToWishlistClick = noop,
    onEditClick = noop,
    onRemoveItemClick = noop,
    onIsAGiftChange = noop,
    isAGift = false
}) => {
    const product = mockedCustomerProductListsDetails.data[0]
    return (
        <ItemVariantProvider variant={{...product, productName: product.name}}>
            <CartSecondaryButtonGroup
                //@sfdc-extension-line SFDC_EXT_WISHLIST
                onAddToWishlistClick={onAddToWishlistClick}
                onEditClick={onEditClick}
                onRemoveItemClick={onRemoveItemClick}
                onIsAGiftChange={onIsAGiftChange}
                isAGift={isAGift}
            />
        </ItemVariantProvider>
    )
}

MockedComponent.propTypes = {
    //@sfdc-extension-line SFDC_EXT_WISHLIST
    onAddToWishlistClick: PropTypes.func,
    onEditClick: PropTypes.func,
    onRemoveItemClick: PropTypes.func,
    onIsAGiftChange: PropTypes.func,
    isAGift: PropTypes.bool
}

const MockComopnentWithoutProps = () => {
    const product = mockedCustomerProductListsDetails.data[0]
    return (
        <ItemVariantProvider variant={{...product, productName: product.name}}>
            <CartSecondaryButtonGroup />
        </ItemVariantProvider>
    )
}

beforeEach(() => {
    jest.resetModules()
})

afterEach(() => {
    jest.restoreAllMocks()
})

test('renders secondary action component without props', async () => {
    renderWithProviders(<MockComopnentWithoutProps />)
    const removeButton = screen.getByRole('button', {
        name: /remove/i
    })
    expect(removeButton).toBeInTheDocument()
})

test('renders secondary action component', async () => {
    const {user} = renderWithProviders(<MockedComponent />)
    const removeButton = screen.getByRole('button', {
        name: /remove/i
    })
    expect(removeButton).toBeInTheDocument()

    // Wrap the modal-opening click in act()
    // to handle DialogRoot state updates in the ConfirmationModal
    await act(async () => {
        await user.click(removeButton)
    })

    const confirmButton = await screen.findByRole('button', {name: /yes, remove item/i})
    expect(confirmButton).toBeInTheDocument()
})

test('renders secondary with event handlers', async () => {
    const onRemoveItemClick = jest.fn()
    const onEditClick = jest.fn()
    //@sfdc-extension-line SFDC_EXT_WISHLIST
    const onAddToWishlistClick = jest.fn()
    const onIsAGiftChange = jest.fn()

    const {user} = renderWithProviders(
        <MockedComponent
            //@sfdc-extension-line SFDC_EXT_WISHLIST
            onAddToWishlistClick={onAddToWishlistClick}
            onEditClick={onEditClick}
            onRemoveItemClick={onRemoveItemClick}
            onIsAGiftChange={onIsAGiftChange}
        />
    )

    const editButton = screen.getByRole('button', {
        name: /Edit/i
    })

    expect(editButton).toBeInTheDocument()
    await act(async () => {
        await user.click(editButton)
    })
    expect(onEditClick).toHaveBeenCalledTimes(1)

    //@sfdc-extension-block-start SFDC_EXT_WISHLIST
    const addToWishlistButton = screen.getByRole('button', {
        name: /Add to wishlist/i
    })
    await user.click(addToWishlistButton)
    expect(onAddToWishlistClick).toHaveBeenCalledTimes(1)
    //@sfdc-extension-block-end SFDC_EXT_WISHLIST
    const removeButton = screen.getByRole('button', {
        name: /remove/i
    })

    expect(removeButton).toBeInTheDocument()

    await act(async () => {
        await user.click(removeButton)
    })

    const confirmButton = await screen.findByRole('button', {name: /yes, remove item/i})
    expect(confirmButton).toBeInTheDocument()

    // Wrap the modal-opening click in act()
    // to handle DialogRoot state updates in the ConfirmationModal
    await act(async () => {
        await user.click(confirmButton)
    })

    await waitFor(() => {
        expect(onRemoveItemClick).toHaveBeenCalledTimes(1)
    })
})

test('handles gift checkbox change', async () => {
    const onIsAGiftChange = jest.fn()

    const {user} = renderWithProviders(
        <MockedComponent onIsAGiftChange={onIsAGiftChange} isAGift={false} />
    )

    const giftCheckbox = screen.getByRole('checkbox', {name: /this is a gift/i})
    expect(giftCheckbox).toBeInTheDocument()
    expect(giftCheckbox).not.toBeChecked()

    // Wrap the modal-opening click in act()
    // to handle DialogRoot state updates in the ConfirmationModal
    await act(async () => {
        await user.click(giftCheckbox)
    })

    await waitFor(() => {
        expect(onIsAGiftChange).toHaveBeenCalledTimes(1)
    })

    expect(giftCheckbox).toBeChecked()
})
