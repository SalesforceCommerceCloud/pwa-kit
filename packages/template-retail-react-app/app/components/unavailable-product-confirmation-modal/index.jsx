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
 * This Component will be responsible for determining if a given product ids has become unavailable
 * and will prompt the users to remove them before proceeding any further
 *
 * @param productItems -  basket product items
 * @param handleUnavailableProducts - callback function to handle what to do with unavailable products
 * @returns {JSX.Element} -  Conformation Modal Component
 *
 */
const UnavailableProductConfirmationModal = ({
    productItems = [],
    handleUnavailableProducts = noop
}) => {
    const unavailableProductIdsRef = useRef(null)
    const productIds = productItems.map((i) => i.productId)
    useProducts(
        {parameters: {ids: productIds?.join(','), allImages: true}},
        {
            enabled: productIds?.length > 0,
            onSuccess: (result) => {
                const resProductIds = []
                const unOrderableIds = []
                result.data?.forEach(({id, inventory}) => {
                    const productItem = productItems.find((item) => item.productId === id)
                    // when a product is unavailable, the getProducts will not return its product detail.
                    // we compare the response ids with the ones in basket to figure which product has become unavailable
                    resProductIds.push(id)

                    // when a product is orderable, but the quantity in the basket is more than the remaining stock
                    // we want to make sure it is removed before go to checkout page to avoid error when placing order
                    if (
                        !inventory?.orderable ||
                        (inventory?.orderable && productItem?.quantity > inventory.stockLevel)
                    ) {
                        unOrderableIds.push(id)
                    }
                })

                const unavailableProductIds = productIds.filter(
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
    handleUnavailableProducts: PropTypes.func
}

export default UnavailableProductConfirmationModal
