/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useCallback} from 'react'
import {useIntl} from 'react-intl'
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Text,
    Box,
    VStack,
    SimpleGrid,
    Heading
} from '@salesforce/retail-react-app/app/components/shared/ui'
import BonusProductViewModal from '@salesforce/retail-react-app/app/components/bonus-product-view-modal'
import {addToCartModalTheme} from '@salesforce/retail-react-app/app/theme/components/project/add-to-cart-modal'
import {useBonusProductSelectionModalContext} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-selection-modal/components/bonus-product-modal-provider'
import {useBonusProductData} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-selection-modal/use-bonus-product-data'
import {useBonusProductWishlist} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-selection-modal/use-bonus-product-wishlist'
import BonusProductItem from '@salesforce/retail-react-app/app/hooks/use-bonus-product-selection-modal/components/bonus-product-item'

export const BonusProductSelectionModal = () => {
    const intl = useIntl()
    const modalState = useBonusProductSelectionModalContext()
    const {
        isOpen,
        data,
        isViewOpen,
        selectedProduct,
        selectedBonusMeta,
        handleClose,
        openProductView,
        returnToSelection
    } = modalState

    const productData = useBonusProductData(data)
    const {
        uniqueBonusProducts,
        maxBonusItems,
        selectedBonusItems,
        isLoading,
        computeBonusMeta,
        normalizeProduct
    } = productData

    const wishlistHook = useBonusProductWishlist()
    const {handleWishlistToggle, isProductInWishlist} = wishlistHook

    const switchToProductView = useCallback(
        (bonusProduct, foundProductData) => {
            const normalizedProduct = normalizeProduct(bonusProduct, foundProductData)
            const bonusMeta = computeBonusMeta(bonusProduct)

            openProductView(
                normalizedProduct,
                bonusMeta.bonusDiscountLineItemId,
                bonusMeta.promotionId
            )

            setTimeout(() => {
                modalState.setProductLoading(false)
            }, 150)
        },
        [normalizeProduct, computeBonusMeta, openProductView, modalState]
    )

    return (
        <>
            {!isViewOpen && isOpen && (
                <Modal
                    size={addToCartModalTheme.modal.size}
                    isOpen={isOpen}
                    onClose={handleClose}
                    scrollBehavior={addToCartModalTheme.modal.scrollBehavior}
                    isCentered
                >
                    <ModalOverlay bg="blackAlpha.300" />
                    <ModalContent
                        margin={addToCartModalTheme.layout.content.margin}
                        borderRadius={addToCartModalTheme.layout.content.borderRadius}
                        maxHeight={addToCartModalTheme.layout.content.maxHeight}
                        overflowY={addToCartModalTheme.layout.content.overflowY}
                        bg={addToCartModalTheme.colors.background}
                    >
                        <ModalHeader
                            paddingY={addToCartModalTheme.layout.header.paddingY}
                            bgColor={addToCartModalTheme.colors.contentBackground}
                            borderTopRadius={addToCartModalTheme.layout.content.borderRadius}
                            borderBottom={addToCartModalTheme.layout.header.borderBottom}
                            borderColor={addToCartModalTheme.layout.header.borderColor}
                        >
                            <Heading as="h3" size="md">
                                {intl.formatMessage(
                                    {
                                        id: 'bonus_product_modal.title',
                                        defaultMessage:
                                            'Select bonus product ({selected} of {max} selected)'
                                    },
                                    {selected: selectedBonusItems, max: maxBonusItems}
                                )}
                            </Heading>
                        </ModalHeader>

                        <ModalBody
                            bgColor={addToCartModalTheme.colors.contentBackground}
                            padding={addToCartModalTheme.layout.body.padding}
                            marginBottom={addToCartModalTheme.layout.body.marginBottom}
                        >
                            {uniqueBonusProducts.length === 0 ? (
                                <Text textAlign="center" color="gray.500" py="8">
                                    {intl.formatMessage({
                                        id: 'bonus_product_modal.no_bonus_products',
                                        defaultMessage: 'No bonus products available'
                                    })}
                                </Text>
                            ) : (
                                <VStack spacing="4">
                                    <Box
                                        maxHeight={{base: '60vh', md: '70vh'}}
                                        overflowY="auto"
                                        width="100%"
                                        px="1"
                                    >
                                        <SimpleGrid
                                            columns={{base: 1, md: 3}}
                                            spacing="4"
                                            width="100%"
                                        >
                                            {uniqueBonusProducts.map((product) => {
                                                // Try to get product data from useProducts first (for list-based)
                                                let foundProductData =
                                                    productData?.productData?.data?.find(
                                                        (p) => p.id === product.productId
                                                    )

                                                // If not found, use the search data from rule-based products
                                                if (!foundProductData && product._searchData) {
                                                    foundProductData = product._searchData
                                                }

                                                const isInWishlist = isProductInWishlist(
                                                    product.productId
                                                )
                                                return (
                                                    <BonusProductItem
                                                        key={product.productId}
                                                        product={product}
                                                        productData={foundProductData}
                                                        foundProductData={foundProductData}
                                                        onSelect={switchToProductView}
                                                        isLoading={isLoading}
                                                        enableFavourite={true}
                                                        isFavourite={isInWishlist}
                                                        onFavouriteToggle={(shouldAdd) =>
                                                            handleWishlistToggle(product, shouldAdd)
                                                        }
                                                    />
                                                )
                                            })}
                                        </SimpleGrid>
                                    </Box>
                                </VStack>
                            )}
                        </ModalBody>
                        <ModalCloseButton
                            size="md"
                            position="absolute"
                            top="4"
                            right="4"
                            bg="white"
                            _hover={{bg: 'gray.100'}}
                        />
                    </ModalContent>
                </Modal>
            )}

            {isViewOpen && selectedProduct && (
                <BonusProductViewModal
                    isOpen={isViewOpen}
                    onClose={handleClose}
                    product={selectedProduct}
                    bonusDiscountLineItemId={selectedBonusMeta?.bonusDiscountLineItemId}
                    promotionId={selectedBonusMeta?.promotionId}
                    onReturnToSelection={returnToSelection}
                    withBackdrop={true}
                />
            )}
        </>
    )
}
