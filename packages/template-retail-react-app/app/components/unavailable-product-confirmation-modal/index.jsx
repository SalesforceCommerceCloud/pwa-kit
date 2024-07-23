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
 * This Component will responsible to determine of a given product ids has become unavailable
 * and will prompt the users to remove them before proceeding any further
 *
 * @param productIds -  list of product ids to check for availability
 * @param handleUnavailableProducts - callback function to handle what to do with unavailable products
 * @returns {JSX.Element} -  Conformation Modal Component
 *
 */
const UnavailableProductConfirmationModal = ({
    productIds = [],
    handleUnavailableProducts = noop
}) => {
    const unavailableProductIdsRef = useRef(null)
    useProducts(
        {parameters: {ids: productIds?.join(','), allImages: true}},
        {
            enabled: productIds?.length > 0,
            onSuccess: (result) => {
                // when a product is unavailable, the getProducts will not return its product detail.
                // we compare the response ids with the ones in basket to figure which product has become unavailable
                const resProductIds = result.data?.map((i) => i.id) || []
                const unavailableProductIds = productIds.filter((id) => !resProductIds.includes(id))
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
    productIds: PropTypes.array,
    handleUnavailableProducts: PropTypes.func
}

export default UnavailableProductConfirmationModal
