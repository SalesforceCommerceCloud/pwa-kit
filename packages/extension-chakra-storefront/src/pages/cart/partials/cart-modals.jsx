/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Box, useDisclosure} from '@chakra-ui/react'
import ConfirmationModal from '../../../components/confirmation-modal'
import ProductViewModal from '../../../components/product-view-modal'
import BundleProductViewModal from '../../../components/product-view-modal/bundle'
import UnavailableProductConfirmationModal from '../../../components/unavailable-product-confirmation-modal'
import {REMOVE_CART_ITEM_CONFIRMATION_DIALOG_CONFIG} from './cart-secondary-button-group'

/**
 * Cart modals component that handles all modal interactions
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether product view modal is open
 * @param {Function} props.onOpen - Function to open product view modal
 * @param {Function} props.onClose - Function to close product view modal
 * @param {Object} props.selectedItem - Currently selected item
 * @param {Function} props.handleUpdateCart - Function to handle cart updates
 * @param {Function} props.handleUpdateBundle - Function to handle bundle updates
 * @param {Function} props.handleRemoveItem - Function to handle item removal
 * @param {Object} props.basket - Current basket data
 * @param {Function} props.handleUnavailableProducts - Function to handle unavailable products
 * @returns {JSX.Element} The cart modals component
 */
const CartModals = ({
    isOpen,
    onOpen,
    onClose,
    selectedItem,
    handleUpdateCart,
    handleUpdateBundle,
    handleRemoveItem,
    basket,
    handleUnavailableProducts
}) => {
    const modalProps = useDisclosure()

    return (
        <Box>
            {/* Product View Modals */}
            {isOpen && selectedItem && !selectedItem.bundledProductItems && (
                <ProductViewModal
                    isOpen={isOpen}
                    onOpen={onOpen}
                    onClose={onClose}
                    product={selectedItem}
                    updateCart={(variant, quantity) => handleUpdateCart(variant, quantity)}
                />
            )}
            {isOpen && selectedItem && selectedItem.bundledProductItems && (
                <BundleProductViewModal
                    isOpen={isOpen}
                    onOpen={onOpen}
                    onClose={onClose}
                    product={selectedItem}
                    updateCart={(product, quantity, childProducts) =>
                        handleUpdateBundle(product, quantity, childProducts)
                    }
                />
            )}

            {/* Remove Item Confirmation Modal */}
            <ConfirmationModal
                {...REMOVE_CART_ITEM_CONFIRMATION_DIALOG_CONFIG}
                onPrimaryAction={() => {
                    handleRemoveItem(selectedItem)
                }}
                onAlternateAction={() => {}}
                {...modalProps}
            />

            {/* Unavailable Product Confirmation Modal */}
            <UnavailableProductConfirmationModal
                productItems={basket?.productItems}
                handleUnavailableProducts={handleUnavailableProducts}
            />
        </Box>
    )
}

CartModals.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onOpen: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    selectedItem: PropTypes.shape({
        itemId: PropTypes.string,
        bundledProductItems: PropTypes.array
    }),
    handleUpdateCart: PropTypes.func.isRequired,
    handleUpdateBundle: PropTypes.func.isRequired,
    handleRemoveItem: PropTypes.func.isRequired,
    basket: PropTypes.shape({
        productItems: PropTypes.array
    }),
    handleUnavailableProducts: PropTypes.func.isRequired
}

export default CartModals
