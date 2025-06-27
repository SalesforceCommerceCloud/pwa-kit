/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import {Box} from '@chakra-ui/react'
import ProductView from '../../../components/product-view'
import InformationAccordion from './information-accordion'

const ProductDetails = ({
    product,
    primaryCategory,
    isProductASet,
    isProductABundle,
    isProductLoading,
    isBasketLoading,
    isWishlistLoading,
    handleAddToWishlist,
    handleAddToCart,
    handleProductSetAddToCart,
    handleProductBundleAddToCart,
    handleChildProductValidation,
    childProductOrderability,
    setSelectedBundleQuantity,
    comboProduct,
    childProductRefs,
    selectedBundleQuantity,
    setChildProductSelection,
    childProductSelection,
    setChildProductOrderability
}) => {
    return (
        <Fragment>
            {isProductASet || isProductABundle ? (
                <Fragment>
                    <ProductView
                        product={product}
                        category={primaryCategory?.parentCategoryTree || []}
                        addToCart={
                            isProductASet ? handleProductSetAddToCart : handleProductBundleAddToCart
                        }
                        addToWishlist={handleAddToWishlist}
                        isProductLoading={isProductLoading}
                        isBasketLoading={isBasketLoading}
                        isWishlistLoading={isWishlistLoading}
                        validateOrderability={handleChildProductValidation}
                        childProductOrderability={childProductOrderability}
                        setSelectedBundleQuantity={setSelectedBundleQuantity}
                    />

                    <hr />

                    {/* TODO: consider `childProduct.belongsToSet` */}
                    {
                        // Render the child products
                        comboProduct.childProducts.map(
                            ({product: childProduct, quantity: childQuantity}) => (
                                <Box key={childProduct.id} data-testid="child-product">
                                    <ProductView
                                        // Do not use an arrow function as we are manipulating the functions scope.
                                        ref={function (productViewRef) {
                                            // The ref callback will be called with `null` when the component unmounts.
                                            // We need to guard against that to prevent a runtime error.
                                            if (productViewRef) {
                                                // Assign the "set" scope of the ref, this is how we access the internal
                                                // validation.
                                                childProductRefs.current[childProduct.id] = {
                                                    ref: productViewRef,
                                                    validateOrderability:
                                                        productViewRef.validateOrderability
                                                }
                                            }
                                        }}
                                        product={childProduct}
                                        isProductPartOfSet={isProductASet}
                                        isProductPartOfBundle={isProductABundle}
                                        childOfBundleQuantity={childQuantity}
                                        selectedBundleParentQuantity={selectedBundleQuantity}
                                        addToCart={
                                            isProductASet
                                                ? (variant, quantity) =>
                                                      handleAddToCart([
                                                          {
                                                              product: childProduct,
                                                              variant,
                                                              quantity
                                                          }
                                                      ])
                                                : null
                                        }
                                        addToWishlist={isProductASet ? handleAddToWishlist : null}
                                        onVariantSelected={(product, variant, quantity) => {
                                            if (quantity) {
                                                setChildProductSelection((previousState) => ({
                                                    ...previousState,
                                                    [product.id]: {
                                                        product,
                                                        variant,
                                                        quantity: isProductABundle
                                                            ? childQuantity
                                                            : quantity
                                                    }
                                                }))
                                            } else {
                                                const selections = {...childProductSelection}
                                                delete selections[product.id]
                                                setChildProductSelection(selections)
                                            }
                                        }}
                                        isProductLoading={isProductLoading}
                                        isBasketLoading={isBasketLoading}
                                        isWishlistLoading={isWishlistLoading}
                                        setChildProductOrderability={setChildProductOrderability}
                                    />
                                    <InformationAccordion product={childProduct} />

                                    <Box display={['none', 'none', 'none', 'block']}>
                                        <hr />
                                    </Box>
                                </Box>
                            )
                        )
                    }
                </Fragment>
            ) : (
                <Fragment>
                    <ProductView
                        product={product}
                        category={primaryCategory?.parentCategoryTree || []}
                        addToCart={(variant, quantity) =>
                            handleAddToCart([{product, variant, quantity}])
                        }
                        addToWishlist={handleAddToWishlist}
                        isProductLoading={isProductLoading}
                        isBasketLoading={isBasketLoading}
                        isWishlistLoading={isWishlistLoading}
                    />
                    <InformationAccordion product={product} />
                </Fragment>
            )}
        </Fragment>
    )
}

ProductDetails.propTypes = {
    product: PropTypes.object,
    primaryCategory: PropTypes.object,
    isProductASet: PropTypes.bool,
    isProductABundle: PropTypes.bool,
    isProductLoading: PropTypes.bool,
    isBasketLoading: PropTypes.bool,
    isWishlistLoading: PropTypes.bool,
    handleAddToWishlist: PropTypes.func,
    handleAddToCart: PropTypes.func,
    handleProductSetAddToCart: PropTypes.func,
    handleProductBundleAddToCart: PropTypes.func,
    handleChildProductValidation: PropTypes.func,
    childProductOrderability: PropTypes.object,
    setSelectedBundleQuantity: PropTypes.func,
    comboProduct: PropTypes.object,
    childProductRefs: PropTypes.object,
    selectedBundleQuantity: PropTypes.number,
    setChildProductSelection: PropTypes.func,
    childProductSelection: PropTypes.object,
    setChildProductOrderability: PropTypes.func
}

export default ProductDetails 