/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalOverlay
} from '@salesforce/retail-react-app/app/components/shared/ui'
import ProductView from '@salesforce/retail-react-app/app/components/product-view'
import {useProductViewModal} from '@salesforce/retail-react-app/app/hooks/use-product-view-modal'

/**
 * A Modal that contains Product View
 */
const ProductViewModal = ({product, isOpen, onClose, ...props}) => {
    const productViewModalData = useProductViewModal(product)
    return (
        <Modal size="4xl" isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent containerProps={{'data-testid': 'product-view-modal'}}>
                <ModalCloseButton />
                <ModalBody pb={8} bg="white" paddingBottom={6} marginTop={6}>
                    <ProductView
                        showFullLink={true}
                        imageSize="sm"
                        product={productViewModalData.product}
                        isLoading={productViewModalData.isFetching}
                        {...props}
                    />
                </ModalBody>
            </ModalContent>
        </Modal>
    )
}

ProductViewModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onOpen: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    product: PropTypes.object,
    isLoading: PropTypes.bool,
    actionButtons: PropTypes.node,
    onModalClose: PropTypes.func
}

export default ProductViewModal
