/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useMemo, useCallback} from 'react'
import PropTypes from 'prop-types'
import {Dialog, CloseButton, Button} from '@chakra-ui/react'
import Link from '../link'
import ProductView from '../../components/product-view'
import {useProductViewModal} from '../../hooks/use-product-view-modal'
import SafePortal from '../safe-portal'
import {useIntl} from 'react-intl'
import {productViewModalTheme} from '../../theme/components/project/product-view-modal'
import {useShopperBasketsMutationHelper} from '@salesforce/commerce-sdk-react'
import {useCurrentBasket} from '../../hooks/use-current-basket'
import {findAvailableBonusDiscountLineItemId} from '../../utils/bonus-product-utils'

/**
 * A Dialog that contains Bonus Product View using product-view-modal theme
 */
const BonusProductViewModal = ({
    product,
    isOpen,
    onClose,
    bonusDiscountLineItemId,
    promotionId,
    ...props
}) => {
    const productViewModalData = useProductViewModal(product)
    const {addItemToNewOrExistingBasket} = useShopperBasketsMutationHelper()
    const {data: basket} = useCurrentBasket()

    const intl = useIntl()
    const {formatMessage} = intl

    const messages = useMemo(
        () => ({
            modalLabel: formatMessage(
                {
                    id: 'bonus_product_view_modal.modal_label',
                    defaultMessage: 'Bonus product selection modal for {productName}'
                },
                {productName: productViewModalData?.product?.name}
            ),
            viewCart: formatMessage({
                id: 'bonus_product_view_modal.button.view_cart',
                defaultMessage: 'View Cart'
            })
        }),
        [intl]
    )

    // Custom addToCart handler for bonus products that includes bonusDiscountLineItemId
    const handleAddToCart = useCallback(
        async (variant, quantity) => {
            // Find the first available bonus discount line item with capacity
            const availableBonusDiscountLineItemId = findAvailableBonusDiscountLineItemId(
                basket, 
                promotionId, 
                quantity, 
                bonusDiscountLineItemId // fallback to originally passed id
            )

            console.log('🎁 BonusProductViewModal addToCart:', {
                productId: variant?.productId || product?.id,
                promotionId,
                originalBonusDiscountLineItemId: bonusDiscountLineItemId,
                selectedBonusDiscountLineItemId: availableBonusDiscountLineItemId,
                quantity
            })

            const productItems = [
                {
                    productId: variant?.productId || product?.id,
                    price: variant?.price || product?.price,
                    quantity: quantity,
                    bonusDiscountLineItemId: availableBonusDiscountLineItemId
                }
            ]

            const result = await addItemToNewOrExistingBasket(productItems)
            return result
        },
        [addItemToNewOrExistingBasket, product, bonusDiscountLineItemId, promotionId, basket]
    )

    // Custom buttons for the ProductView
    const customButtons = useMemo(
        () => [
            <Button key="view-cart" asChild variant="outline" onClick={onClose}>
                <Link to="/cart">{messages.viewCart}</Link>
            </Button>
        ],
        [messages.viewCart, onClose]
    )

    return (
        <Dialog.Root
            lazyMount
            open={isOpen}
            onOpenChange={() => onClose()}
            size={productViewModalTheme.modal.size}
            scrollBehavior={productViewModalTheme.modal.scrollBehavior}
            placement={productViewModalTheme.modal.placement}
            closeOnInteractOutside={productViewModalTheme.modal.closeOnInteractOutside}
        >
            <SafePortal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content
                        data-testid="bonus-product-view-modal"
                        aria-label={messages.modalLabel}
                        margin={productViewModalTheme.layout.content.margin}
                        borderRadius={productViewModalTheme.layout.content.borderRadius}
                        bgColor={productViewModalTheme.colors.background}
                        maxHeight={productViewModalTheme.layout.content.maxHeight}
                        overflowY={productViewModalTheme.layout.content.overflowY}
                    >
                        <Dialog.Body
                            bg={productViewModalTheme.layout.body.background}
                            padding={productViewModalTheme.layout.body.padding}
                            paddingBottom={productViewModalTheme.layout.body.paddingBottom}
                            marginTop={productViewModalTheme.layout.body.marginTop}
                        >
                            <ProductView
                                showFullLink={false}
                                imageSize={productViewModalTheme.productView.imageSize}
                                showImageGallery={
                                    productViewModalTheme.productView.showImageGallery
                                }
                                product={productViewModalData.product}
                                isLoading={productViewModalData.isFetching}
                                addToCart={handleAddToCart}
                                isProductLoading={productViewModalData.isFetching}
                                customButtons={customButtons}
                                promotionId={promotionId}
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

BonusProductViewModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onOpen: PropTypes.func,
    onClose: PropTypes.func.isRequired,
    product: PropTypes.object,
    isLoading: PropTypes.bool,
    bonusDiscountLineItemId: PropTypes.string, // The 'id' from bonusDiscountLineItems
    promotionId: PropTypes.string // The promotion ID to filter promotions in PromoCallout
}

export default BonusProductViewModal
