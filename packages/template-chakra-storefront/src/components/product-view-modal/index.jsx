/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useMemo} from 'react'
import PropTypes from 'prop-types'
import {Dialog, CloseButton} from '@chakra-ui/react'
import ProductView from '../../components/product-view'
import {useProductViewModal} from '../../hooks/use-product-view-modal'
import SafePortal from '../safe-portal'
import {useIntl} from 'react-intl'

/**
 * A Dialog that contains Product View
 */
const ProductViewModal = ({product, isOpen, onClose, ...props}) => {
    const productViewModalData = useProductViewModal(product)

    const intl = useIntl()
    const {formatMessage} = intl

    const messages = useMemo(() => ({
        modalLabel: intl.formatMessage(
            {
                id: 'cart.product_edit_modal.modal_label',
                defaultMessage: 'Edit modal for {productName}'
            },
            {productName: productViewModalData?.product?.name}
        )
    }), [intl])
    return (
        <Dialog.Root
            lazyMount
            open={isOpen}
            onOpenChange={() => onClose()}
            size="xl"
            closeOnInteractOutside={false}
        >
            <SafePortal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content
                        data-testid="product-view-modal"
                        aria-label={messages.modalLabel}
                    >
                        <Dialog.Body pb={8} bg="white" paddingBottom={6} marginTop={6}>
                            <ProductView
                                showFullLink={true}
                                imageSize="sm"
                                product={productViewModalData.product}
                                isLoading={productViewModalData.isFetching}
                                {...props}
                            />
                        </Dialog.Body>
                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </SafePortal>
        </Dialog.Root>
    )
}

ProductViewModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onOpen: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    product: PropTypes.object,
    isLoading: PropTypes.bool
}

export default ProductViewModal
