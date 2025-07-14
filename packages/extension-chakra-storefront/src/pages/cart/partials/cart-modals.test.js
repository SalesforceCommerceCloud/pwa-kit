/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '../../../utils/test-utils'
import CartModals from './cart-modals'

// Mock Chakra UI components
jest.mock('@chakra-ui/react', () => {
    const actual = jest.requireActual('@chakra-ui/react')
    return {
        ...actual,
        useDisclosure: () => ({
            isOpen: false,
            onOpen: jest.fn(),
            onClose: jest.fn()
        })
    }
})

// Mock the component dependencies
jest.mock('../../../components/confirmation-modal', () => {
    const PropTypes = jest.requireActual('prop-types')
    const MockConfirmationModal = (props) => {
        return (
            <div data-testid="confirmation-modal">
                <button
                    data-testid="confirmation-modal-primary-action"
                    onClick={() => props.onPrimaryAction()}
                >
                    Primary Action
                </button>
            </div>
        )
    }
    MockConfirmationModal.propTypes = {
        onPrimaryAction: PropTypes.func.isRequired
    }
    return MockConfirmationModal
})

jest.mock('../../../components/product-view-modal', () => {
    const PropTypes = jest.requireActual('prop-types')
    const MockProductViewModal = (props) => {
        return (
            <div data-testid="product-view-modal" role="dialog">
                <button data-testid="update-cart-button" onClick={() => props.updateCart()}>
                    Update Cart
                </button>
            </div>
        )
    }
    MockProductViewModal.propTypes = {
        updateCart: PropTypes.func.isRequired
    }
    return MockProductViewModal
})

jest.mock('../../../components/product-view-modal/bundle', () => {
    return function MockBundleProductViewModal() {
        return <div data-testid="bundle-product-view-modal" role="dialog" />
    }
})

jest.mock('../../../components/unavailable-product-confirmation-modal', () => {
    return function MockUnavailableProductConfirmationModal() {
        return <div data-testid="unavailable-product-confirmation-modal" />
    }
})

jest.mock('./cart-secondary-button-group', () => ({
    REMOVE_CART_ITEM_CONFIRMATION_DIALOG_CONFIG: {
        heading: 'Remove Item',
        message: 'Are you sure you want to remove this item?'
    }
}))

describe('CartModals', () => {
    const defaultProps = {
        isOpen: true,
        onOpen: jest.fn(),
        onClose: jest.fn(),
        selectedItem: {
            itemId: 'item-1',
            bundledProductItems: undefined
        },
        handleUpdateCart: jest.fn(),
        handleUpdateBundle: jest.fn(),
        handleRemoveItem: jest.fn(),
        basket: {
            productItems: [{itemId: 'item-1'}]
        },
        handleUnavailableProducts: jest.fn()
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders ProductViewModal when isOpen and selectedItem without bundledProductItems', () => {
        renderWithProviders(<CartModals {...defaultProps} />)

        // ProductViewModal should be rendered
        expect(screen.getByTestId('product-view-modal')).toBeInTheDocument()
        expect(screen.queryByTestId('bundle-product-view-modal')).not.toBeInTheDocument()
        screen.getByTestId('update-cart-button').click()
        expect(defaultProps.handleUpdateCart).toHaveBeenCalled()
    })

    it('opens ConfirmationModal and handles remove item', () => {
        renderWithProviders(<CartModals {...defaultProps} />)

        // These should always be present
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument()
        // Simulate clicking the primary action button in the ConfirmationModal
        screen.getByTestId('confirmation-modal-primary-action').click()
        expect(defaultProps.handleRemoveItem).toHaveBeenCalled()
    })
})
