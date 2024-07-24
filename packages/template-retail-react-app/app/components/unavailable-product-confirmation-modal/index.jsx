/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useRef} from 'react'
import PropTypes from 'prop-types'
import {useProducts} from '@salesforce/commerce-sdk-react'
import {REMOVE_UNAVAILABLE_CART_ITEM_DIALOG_CONFIG} from '@salesforce/retail-react-app/app/constants'
import ConfirmationModal from '@salesforce/retail-react-app/app/components/confirmation-modal'
import {useDisclosure} from '@salesforce/retail-react-app/app/components/shared/ui'
import {noop} from '@salesforce/retail-react-app/app/utils/utils'

/**
 * This Component determines if the provided products have become unavailable or out of stock or low stock that
 * can't be fulfilled and will prompt the users to remove them before proceeding any further
 *
 * @param productIds -  list of product ids to check for availability. This prop will be deprecated in the upcoming release.
 * Please use productItems prop
 * @param productItems -  basket product items. This will be ignored if productIds is passed
 * @param handleUnavailableProducts - callback function to handle what to do with unavailable products
 * @returns {JSX.Element} -  Conformation Modal Component
 *
 */
const UnavailableProductConfirmationModal = ({
    productIds = [],
    productItems = [],
    handleUnavailableProducts = noop
}) => {
    const unavailableProductIdsRef = useRef(null)
    const ids = productIds.length ? productIds : productItems.map((i) => i.productId)
    useProducts(
        {parameters: {ids: ids?.join(','), allImages: true}},
        {
            enabled: ids?.length > 0,
            onSuccess: (result) => {
                const resProductIds = []
                const unOrderableIds = []
                result.data?.forEach(({id, inventory}) => {
                    // when a product is unavailable, the getProducts will not return its product detail.
                    // we compare the response ids with the ones in basket to figure which product has become unavailable
                    resProductIds.push(id)

                    // when a product is orderable, but the quantity in the basket is more than the remaining stock
                    // we want to make sure it is removed before go to checkout page to avoid error when placing order
                    // we don't need to remove low stock/ out of stock from wishlist
                    if (productItems.length) {
                        const productItem = productItems.find((item) => item.productId === id)
                        // wishlist item will have the property type
                        const isWishlist = !!productItem?.type
                        if (
                            !isWishlist &&
                            (!inventory?.orderable ||
                                (inventory?.orderable &&
                                    productItem?.quantity > inventory.stockLevel))
                        ) {
                            unOrderableIds.push(id)
                        }
                    }
                })

                const unavailableProductIds = ids.filter(
                    (id) => !resProductIds.includes(id) || unOrderableIds.includes(id)
                )

                unavailableProductIdsRef.current = unavailableProductIds
            }
        }
    )
    const unavailableProductsModalProps = useDisclosure()
    useEffect(() => {
        if (unavailableProductIdsRef.current?.length > 0) {
            unavailableProductsModalProps.onOpen()
        }
    }, [unavailableProductIdsRef.current])

    return (
        <ConfirmationModal
            data-testid="unavailable-product-modal"
            closeOnEsc={false}
            closeOnOverlayClick={false}
            {...REMOVE_UNAVAILABLE_CART_ITEM_DIALOG_CONFIG}
            hideAlternateAction={true}
            onPrimaryAction={async () => {
                await handleUnavailableProducts(unavailableProductIdsRef.current)
                unavailableProductIdsRef.current = null
                unavailableProductsModalProps.onClose()
            }}
            onAlternateAction={() => {}}
            {...unavailableProductsModalProps}
        />
    )
}

UnavailableProductConfirmationModal.propTypes = {
    productItems: PropTypes.array,
    productIds: PropTypes.array,
    handleUnavailableProducts: PropTypes.func
}

export default UnavailableProductConfirmationModal
