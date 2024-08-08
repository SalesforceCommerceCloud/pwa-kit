/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useRef} from 'react'
import PropTypes from 'prop-types'
import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalOverlay,
    Flex,
    Box,
    VStack,
    useBreakpointValue
} from '@chakra-ui/react'
import ProductView from '@salesforce/retail-react-app/app/components/product-view'
import {useProductViewModal} from '@salesforce/retail-react-app/app/hooks/use-product-view-modal'
import {useProducts} from '@salesforce/commerce-sdk-react'
import ImageGallery, {
    Skeleton as ImageGallerySkeleton
} from '@salesforce/retail-react-app/app/components/image-gallery'
import {useDerivedProduct} from '@salesforce/retail-react-app/app/hooks'
import {useIntl} from 'react-intl'

/**
 * A Modal that contains Product View for product bundle
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
    const productIds = selectedChildProducts.map(({variant}) => variant.productId).join(',')
    if (productIds?.length > 0 && productIds !== childProductIds) {
        childProductIds = productIds
    }

    const {data: childProducts, isLoading} = useProducts(
        {parameters: {ids: childProductIds, allImages: true}},
        {
            enabled: Boolean(childProductIds),
            keepPreviousData: true
        }
    )

    const intl = useIntl()
    const label = intl.formatMessage(
        {
            defaultMessage: 'Edit modal for {productName}',
            id: 'cart.product_edit_modal.modal_label'
        },
        {productName: productViewModalData?.product?.name}
    )

    return (
        <Modal size="4xl" isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent containerProps={{'data-testid': 'product-view-modal'}} aria-label={label}>
                <ModalCloseButton />
                <ModalBody pb={8} bg="white" paddingBottom={6} marginTop={6}>
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
                                        return Object.values(childProductRefs.current).every(
                                            ({validateOrderability}) => validateOrderability()
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
                                        ...productViewModalData.product.bundledProductItems[i]
                                    }
                                    const quantityPerBundle = product.quantity / bundle.quantity

                                    return (
                                        <ProductView
                                            key={i}
                                            // Do not use an arrow function as we are manipulating the functions scope.
                                            ref={function (ref) {
                                                // Assign the "set" scope of the ref, this is how we access the internal validation.
                                                childProductRefs.current[product.itemId] = {
                                                    ref,
                                                    validateOrderability: this.validateOrderability
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
                                            selectedBundleParentQuantity={selectedBundleQuantity}
                                            onVariantSelected={(product, variant, quantity) => {
                                                setSelectedChildProducts((prev) => {
                                                    const newArray = prev.slice(0)
                                                    newArray[i] = {product, variant, quantity}
                                                    return newArray
                                                })
                                            }}
                                        />
                                    )
                                })}
                        </VStack>
                    </Flex>
                </ModalBody>
            </ModalContent>
        </Modal>
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
