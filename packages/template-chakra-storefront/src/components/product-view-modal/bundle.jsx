/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useRef, useMemo} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {Box, CloseButton, Dialog, Flex, VStack, useBreakpointValue} from '@chakra-ui/react'
import {keepPreviousData} from '@tanstack/react-query'
import {useProducts} from '@salesforce/commerce-sdk-react'

// Project Components
import ProductView from '../../components/product-view'
import SafePortal from '../safe-portal'
import ImageGallery, {Skeleton as ImageGallerySkeleton} from '../../components/image-gallery'

// Project hooks
import {useProductViewModal} from '../../hooks/use-product-view-modal'
import {useDerivedProduct} from '../../hooks'

/**
 * A Dialog that contains Product View for product bundle
 */
const BundleProductViewModal = ({product: bundle, isOpen, onClose, updateCart, ...props}) => {
    const productViewModalData = useProductViewModal(bundle)
    const {variationParams} = useDerivedProduct(bundle)
    const childProductRefs = useRef({})
    const [childProductOrderability, setChildProductOrderability] = useState({})
    const [selectedChildProducts, setSelectedChildProducts] = useState([])
    const [selectedBundleQuantity, setSelectedBundleQuantity] = useState(
        productViewModalData?.product?.quantity
    )
    const trueIfMobile = useBreakpointValue({base: true, lg: false})

    let childProductIds = productViewModalData.product?.bundledProductItems
        ?.map(({productId}) => productId)
        .join(',')
    const productIds = selectedChildProducts
        .map(({variant, product}) => variant?.productId || product?.id)
        .join(',')
    if (productIds?.length > 0 && productIds !== childProductIds) {
        childProductIds = productIds
    }

    const {data: childProducts, isLoading} = useProducts(
        {parameters: {ids: childProductIds, allImages: true}},
        {
            enabled: Boolean(childProductIds),
            placeholderData: keepPreviousData
        }
    )

    const intl = useIntl()
    const {formatMessage} = intl

    const messages = useMemo(
        () => ({
            modalLabel: formatMessage(
                {
                    id: 'cart.product_edit_modal.modal_label',
                    defaultMessage: 'Edit modal for {productName}'
                },
                {productName: productViewModalData?.product?.name}
            )
        }),
        [intl]
    )

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
                            <Flex direction={['column', 'column', 'column', 'row']}>
                                {/* Due to desktop layout, we'll need to render the image gallery separately, from outside the ProductView */}
                                <Box
                                    flex={1}
                                    mr={[0, 0, 0, 6, 6]}
                                    display={['none', 'none', 'none', 'block']}
                                >
                                    {bundle ? (
                                        <>
                                            <ImageGallery
                                                size="sm"
                                                imageGroups={bundle.imageGroups}
                                                selectedVariationAttributes={variationParams}
                                            />
                                        </>
                                    ) : (
                                        <ImageGallerySkeleton />
                                    )}
                                </Box>

                                <VStack align="stretch" flex={1}>
                                    {/* Parent product */}
                                    <Box marginBottom={6}>
                                        <ProductView
                                            showFullLink={false}
                                            showImageGallery={trueIfMobile}
                                            product={productViewModalData.product}
                                            isLoading={productViewModalData.isFetching}
                                            updateCart={(product, quantity) =>
                                                updateCart(product, quantity, selectedChildProducts)
                                            }
                                            validateOrderability={() => {
                                                return Object.values(
                                                    childProductRefs.current
                                                ).every(({validateOrderability}) =>
                                                    validateOrderability()
                                                )
                                            }}
                                            childProductOrderability={childProductOrderability}
                                            setSelectedBundleQuantity={setSelectedBundleQuantity}
                                            {...props}
                                        />
                                    </Box>

                                    {childProducts &&
                                        childProducts.data.map((_product, i) => {
                                            const product = {
                                                ..._product,
                                                ...productViewModalData.product.bundledProductItems[
                                                    i
                                                ]
                                            }
                                            const quantityPerBundle =
                                                product.quantity / bundle.quantity

                                            return (
                                                <ProductView
                                                    key={i}
                                                    // Do not use an arrow function as we are manipulating the functions scope.
                                                    ref={function (ref) {
                                                        // Assign the "set" scope of the ref, this is how we access the internal validation.
                                                        childProductRefs.current[product.itemId] = {
                                                            ref,
                                                            validateOrderability:
                                                                this.validateOrderability
                                                        }
                                                    }}
                                                    showImageGallery={false}
                                                    isProductPartOfBundle={true}
                                                    showFullLink={false}
                                                    product={product}
                                                    isLoading={isLoading}
                                                    setChildProductOrderability={
                                                        setChildProductOrderability
                                                    }
                                                    childOfBundleQuantity={quantityPerBundle}
                                                    selectedBundleParentQuantity={
                                                        selectedBundleQuantity
                                                    }
                                                    onVariantSelected={(
                                                        product,
                                                        variant,
                                                        quantity
                                                    ) => {
                                                        setSelectedChildProducts((prev) => {
                                                            const newArray = prev.slice(0)
                                                            newArray[i] = {
                                                                product,
                                                                variant,
                                                                quantity
                                                            }
                                                            return newArray
                                                        })
                                                    }}
                                                />
                                            )
                                        })}
                                </VStack>
                            </Flex>
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

BundleProductViewModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onOpen: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    product: PropTypes.object,
    isLoading: PropTypes.bool,
    updateCart: PropTypes.func
}

export default BundleProductViewModal
