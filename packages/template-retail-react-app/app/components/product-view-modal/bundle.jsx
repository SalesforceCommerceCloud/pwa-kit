/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
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

    const [childProductOrderability, setChildProductOrderability] = useState({})
    const [selectedChildProducts, setSelectedChildProducts] = useState([])
    console.log('--- selectedChildProducts', selectedChildProducts)

    // TODO: mimic ProductDetail in how they `validateOrderability`
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
                        validateOrderability={() => true}
                        {...props}
                    />

                    {childProducts &&
                        childProducts.data.map((product, i) => {
                            // TODO: is this necessary?
                            const combinedData = {
                                ...product,
                                ...productViewModalData.product.bundledProductItems[i]
                            }

                            // TODO: pass in the correct quantity
                            return (
                                <ProductView
                                    key={i}
                                    isProductPartOfBundle={true}
                                    showFullLink={true}
                                    imageSize="sm"
                                    product={combinedData}
                                    isLoading={isLoading}
                                    childProductOrderability={childProductOrderability}
                                    setChildProductOrderability={setChildProductOrderability}
                                    childOfBundleQuantity={100}
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
    onModalClose: PropTypes.func
}

export default BundleProductViewModal
