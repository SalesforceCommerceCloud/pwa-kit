/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useRef} from 'react'
import PropTypes from 'prop-types'
import {Modal, ModalBody, ModalCloseButton, ModalContent, ModalOverlay} from '@chakra-ui/react'
import ProductView from '@salesforce/retail-react-app/app/components/product-view'
import {useProductViewModal} from '@salesforce/retail-react-app/app/hooks/use-product-view-modal'
import {useProducts} from '@salesforce/commerce-sdk-react'

/**
 * A Modal that contains Product View for product bundle
 */
const BundleProductViewModal = ({product: bundle, isOpen, onClose, updateCart, ...props}) => {
    const productViewModalData = useProductViewModal(bundle)
    console.log('--- BundleProductViewModal receives this product', bundle)
    console.log('--- and convert it into', productViewModalData)

    const childProductIds = productViewModalData.product?.bundledProductItems
        ?.map(({productId}) => productId)
        .join(',')
    const {data: childProducts, isLoading} = useProducts(
        {
            parameters: {
                ids: childProductIds,
                allImages: true
            }
        },
        {
            enabled: Boolean(childProductIds)
            /*
            select: (result) => {
                // Convert array into key/value object with key is the product id
                return result?.data?.reduce((result, item) => {
                    const key = item.id
                    result[key] = item
                    return result
                }, {})
            }
            */
        }
    )

    const childProductRefs = useRef({})
    const [childProductOrderability, setChildProductOrderability] = useState({})
    const [selectedChildProducts, setSelectedChildProducts] = useState([])

    return (
        <Modal size="4xl" isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent containerProps={{'data-testid': 'product-view-modal'}}>
                <ModalCloseButton />
                <ModalBody pb={8} bg="white" paddingBottom={6} marginTop={6}>
                    {/* TODO: do not use ProductView for the parent.. use its inner components instead */}
                    <ProductView
                        showFullLink={true}
                        imageSize="sm"
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
                        {...props}
                    />

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
                                        childProductRefs.current[product.id] = {
                                            ref,
                                            validateOrderability: this.validateOrderability
                                        }
                                    }}
                                    showImageGallery={false}
                                    isProductPartOfBundle={true}
                                    showFullLink={true}
                                    imageSize="sm"
                                    product={product}
                                    isLoading={isLoading}
                                    childProductOrderability={childProductOrderability}
                                    setChildProductOrderability={setChildProductOrderability}
                                    childOfBundleQuantity={quantityPerBundle}
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
    actionButtons: PropTypes.node,
    onModalClose: PropTypes.func,
    updateCart: PropTypes.func
}

export default BundleProductViewModal
