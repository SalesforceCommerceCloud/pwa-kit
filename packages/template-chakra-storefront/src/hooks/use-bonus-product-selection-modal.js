/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useContext, useState, useEffect, useMemo} from 'react'
import {useLocation} from 'react-router-dom'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    Text,
    Box,
    VStack,
    AspectRatio,
    Skeleton,
    SimpleGrid,
    Button,
    CloseButton,
    Heading,
    useBreakpointValue
} from '@chakra-ui/react'
import {useProducts} from '@salesforce/commerce-sdk-react'
import DynamicImage from '../components/dynamic-image'
import {findImageGroupBy} from '../utils/image-groups-utils'
import {filterImageGroups} from '../utils/product-utils'
import {addToCartModalTheme} from '../theme/components/project/add-to-cart-modal'
import {useModalState} from './use-modal-state'

/**
 * Context for managing the BonusProductSelectionModal.
 * Used in top level App component.
 */
export const BonusProductSelectionModalContext = React.createContext()
export const useBonusProductSelectionModalContext = () =>
    useContext(BonusProductSelectionModalContext)

export const BonusProductSelectionModalProvider = ({children}) => {
    const bonusProductSelectionModal = useBonusProductSelectionModal()
    return (
        <BonusProductSelectionModalContext.Provider value={bonusProductSelectionModal}>
            {children}
            <BonusProductSelectionModal />
        </BonusProductSelectionModalContext.Provider>
    )
}

BonusProductSelectionModalProvider.propTypes = {
    children: PropTypes.node.isRequired
}

// Component to display individual bonus product with checkbox for selection
const BonusProductItem = ({product, productData, foundProductData, onToggle, isLoading}) => {
    const intl = useIntl()
    const productName = product?.productName || product?.title

    // Get the appropriate image group from the passed product data
    const imageGroup = useMemo(() => {
        if (!productData?.imageGroups) {
            return null
        }

        const variantImages = filterImageGroups(productData.imageGroups, product)

        if (variantImages?.length > 0) {
            const largeImage = findImageGroupBy(variantImages, {
                viewType: 'large'
            })
            return largeImage
        }

        // Fall back to default small images
        const defaultSmallImage = findImageGroupBy(productData.imageGroups, {
            viewType: 'small'
        })
        return defaultSmallImage
    }, [productData, product])

    if (isLoading) {
        return (
            <Box borderWidth="1px" borderRadius="lg" p="4">
                <VStack spacing="3" align="stretch">
                    <Skeleton height="200px" />
                    <Skeleton height="20px" />
                    <Skeleton height="16px" width="60%" />
                </VStack>
            </Box>
        )
    }

    return (
        <Box p="4" bg="white">
            <VStack spacing="3" align="center" justify="flex-start">
                <AspectRatio ratio={1} width="162px" maxWidth="162px">
                    {imageGroup && imageGroup.images && imageGroup.images[0] ? (
                        <DynamicImage
                            src={imageGroup.images[0].disBaseLink || imageGroup.images[0].link}
                            alt={productName}
                            fallbackSrc={
                                imageGroup.images[0].disBaseLink || imageGroup.images[0].link
                            }
                        />
                    ) : (
                        <Box
                            bg="gray.100"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Text color="gray.500" fontSize="sm">
                                {intl.formatMessage({
                                    id: 'bonus_product_modal.no_image',
                                    defaultMessage: 'No Image'
                                })}
                            </Text>
                        </Box>
                    )}
                </AspectRatio>
                <Text fontSize="md" fontWeight="semibold" noOfLines={2} textAlign="center">
                    {productName}
                </Text>
                <Box display="flex" alignItems="center" justifyContent="center" gap="2">
                    <Text fontSize="sm" color="gray.400" textDecoration="line-through">
                        {foundProductData?.price ? `$${foundProductData.price}` : ''}
                    </Text>
                    <Text fontSize="sm" fontWeight="normal">
                        Free
                    </Text>
                </Box>
                <Button size="sm" variant="outline" width="162px" onClick={() => onToggle(product)}>
                    {intl.formatMessage({
                        id: 'bonus_product_modal.button_select',
                        defaultMessage: 'Select'
                    })}
                </Button>
            </VStack>
        </Box>
    )
}

BonusProductItem.propTypes = {
    product: PropTypes.object.isRequired,
    productData: PropTypes.object,
    foundProductData: PropTypes.object,
    onToggle: PropTypes.func.isRequired,
    isLoading: PropTypes.bool
}

/**
 * Modal for selecting from available bonus products.
 */
export const BonusProductSelectionModal = () => {
    const {isOpen, onClose, data} = useBonusProductSelectionModalContext()
    // const [selectedProducts, setSelectedProducts] = useState([])
    const size = useBreakpointValue(addToCartModalTheme.modal.size)
    const intl = useIntl()

    // Extract bonus products from the data
    const bonusProducts = data?.bonusDiscountLineItems || []
    const maxBonusItems = data?.maxBonusItems || 0

    // Get product IDs for fetching product data, deduplicating by productId
    const uniqueBonusProducts = bonusProducts
        .flatMap((item) => item.bonusProducts || [])
        .filter(
            (product, index, self) =>
                index === self.findIndex((p) => p.productId === product.productId)
        )

    const productIds = uniqueBonusProducts
        .map((product) => product.productId)
        .filter(Boolean)
        .join(',')

    // Fetch product data
    const {data: productData, isLoading} = useProducts(
        {
            parameters: {
                ids: productIds,
                allImages: true
            }
        },
        {
            enabled: Boolean(productIds),
            placeholderData: null
        }
    )

    if (!isOpen) {
        return null
    }

    return (
        <Dialog.Root
            size={size}
            open={isOpen}
            scrollBehavior={addToCartModalTheme.modal.scrollBehavior}
            placement={addToCartModalTheme.modal.placement}
        >
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content
                    margin={addToCartModalTheme.layout.content.margin}
                    borderRadius={addToCartModalTheme.layout.content.borderRadius}
                    bgColor={addToCartModalTheme.colors.background}
                >
                    <Dialog.Header
                        paddingY={addToCartModalTheme.layout.header.paddingY}
                        bgColor={addToCartModalTheme.colors.contentBackground}
                    >
                        <Heading as="h3" fontSize={24} fontWeight="700">
                            {/* todo: update 0 of 2 to non static text */}
                            {intl.formatMessage({
                                id: 'bonus_product_modal.title',
                                defaultMessage: 'Select Bonus Product (0 of 2 selected)'
                            })}
                        </Heading>
                    </Dialog.Header>

                    <Dialog.Body
                        bgColor={addToCartModalTheme.colors.contentBackground}
                        padding={addToCartModalTheme.layout.body.padding}
                        marginBottom={addToCartModalTheme.layout.body.marginBottom}
                    >
                        {bonusProducts.length === 0 ? (
                            <Text textAlign="center" color="gray.500" py="8">
                                {intl.formatMessage({
                                    id: 'bonus_product_modal.no_bonus_products',
                                    defaultMessage: 'No bonus products available'
                                })}
                            </Text>
                        ) : (
                            <VStack spacing="4">
                                <SimpleGrid columns={{base: 1, md: 3}} spacing="4" width="100%">
                                    {uniqueBonusProducts.map((product) => {
                                        const foundProductData = productData?.data?.find(
                                            (p) => p.id === product.productId
                                        )

                                        return (
                                            <BonusProductItem
                                                key={product.productId}
                                                product={product}
                                                productData={foundProductData}
                                                foundProductData={foundProductData}
                                                onToggle={() => {}}
                                                isLoading={isLoading}
                                            />
                                        )
                                    })}
                                </SimpleGrid>
                            </VStack>
                        )}
                    </Dialog.Body>
                    <CloseButton 
                        size="md" 
                        onClick={onClose}
                        position="absolute"
                        top="4"
                        right="4"
                    />
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    )
}

export const useBonusProductSelectionModal = () => {
    const {isOpen, data, onOpen, onClose} = useModalState({
        closeOnRouteChange: true,
        resetDataOnClose: true
    })
    return {isOpen, data, onOpen, onClose}
}
