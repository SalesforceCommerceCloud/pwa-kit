/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import ImageGallery from '../image-gallary'
import SwatchGroup from '../swatch-group'
import Swatch from '../swatch-group/swatch'

import ProductTitle from '../product-title'
import QuantityPicker from '../quantity-picker'

import {Box, Skeleton, Button} from '@chakra-ui/react'
import useProduct from '../../context/product-context'

import {useHistory} from 'react-router-dom'
import ProductViewLayout from '../../layout/product-view'

const renderSwatchGroup = (props) => {
    const {swatchGroup, variationAttributes = []} = props
    const history = useHistory()
    return swatchGroup ? (
        swatchGroup
    ) : (
        <>
            {/* Attribute Swatches */}
            {variationAttributes.map((variationAttribute) => {
                const {id, name, selectedValue, values = []} = variationAttribute
                return (
                    <SwatchGroup
                        key={id}
                        onChange={(_, href) => {
                            if (!href) return
                            history.replace(href)
                        }}
                        variant={id === 'color' ? 'circle' : 'square'}
                        value={selectedValue?.value}
                        displayName={selectedValue?.name || ''}
                        label={name}
                    >
                        {values.map(({href, name, image, value, orderable}) => (
                            <Swatch
                                key={value}
                                href={href}
                                disabled={!orderable}
                                value={value}
                                name={name}
                            >
                                {image ? (
                                    <Box
                                        height="100%"
                                        width="100%"
                                        minWidth="32px"
                                        backgroundRepeat="no-repeat"
                                        backgroundSize="cover"
                                        backgroundColor={name.toLowerCase()}
                                        backgroundImage={
                                            image ? `url(${image.disBaseLink || image.link})` : ''
                                        }
                                    />
                                ) : (
                                    name
                                )}
                            </Swatch>
                        ))}
                    </SwatchGroup>
                )
            })}
        </>
    )
}

function ProductView(props) {
    const {imageGallery, productTitle, swatchGroup, actionButtons, addToCartTitle} = props

    const {
        product,
        showLoading,
        quantity,
        minOrderQuantity,
        setQuantity,
        variant,
        variationParams,
        variationAttributes,
        stockLevel,
        stepQuantity,
        addVariantToCart
    } = useProduct()

    return (
        <ProductViewLayout>
            <ProductViewLayout.Header>
                {productTitle ? productTitle : <ProductTitle />}
            </ProductViewLayout.Header>

            <ProductViewLayout.ImageGallery>
                {product ? (
                    <>
                        {imageGallery ? (
                            imageGallery
                        ) : (
                            <ImageGallery
                                size={'md'}
                                imageGroups={product.imageGroups}
                                selectedVariationAttributes={variationParams}
                            />
                        )}
                    </>
                ) : (
                    <div>LOADING...</div>
                )}
            </ProductViewLayout.ImageGallery>
            <ProductViewLayout.SwatchGroup>
                {showLoading ? (
                    <>
                        {/* First Attribute Skeleton */}
                        <Skeleton height={6} width={32} />
                        <Skeleton height={20} width={64} />

                        {/* Second Attribute Skeleton */}
                        <Skeleton height={6} width={32} />
                        <Skeleton height={20} width={64} />
                    </>
                ) : (
                    renderSwatchGroup({swatchGroup, variationAttributes})
                )}
            </ProductViewLayout.SwatchGroup>

            <ProductViewLayout.QuantityPicker>
                <Box fontWeight="bold">
                    <label htmlFor="quantity">Quantity</label>
                </Box>

                <QuantityPicker
                    id="quantity"
                    step={stepQuantity}
                    value={quantity}
                    min={minOrderQuantity}
                    onChange={(stringValue, numberValue) => {
                        // Set the Quantity of product to value of input if value number
                        if (numberValue >= 0) {
                            setQuantity(numberValue)
                        } else if (stringValue === '') {
                            // We want to allow the use to clear the input to start a new input so here we set the quantity to '' so NAN is not displayed
                            // User will not be able to add '' qauntity to the cart due to the add to cart button enablement rules
                            setQuantity(stringValue)
                        }
                    }}
                    onBlur={(e) => {
                        // Default to 1the `minOrderQuantity` if a user leaves the box with an invalid value
                        const value = e.target.value
                        if (parseInt(value) < 0 || value === '') {
                            setQuantity(minOrderQuantity)
                        }
                    }}
                    onFocus={(e) => {
                        // This is useful for mobile devices, this allows the user to pop open the keyboard and set the
                        // new quantity with one click. NOTE: This is something that can be refactored into the parent
                        // component, potentially as a prop called `selectInputOnFocus`.
                        e.target.select()
                    }}
                />
            </ProductViewLayout.QuantityPicker>

            <ProductViewLayout.ActionButtons>
                {actionButtons ? (
                    actionButtons
                ) : (
                    <Button
                        key="cart-button"
                        onClick={() => addVariantToCart(variant, quantity)}
                        // disabled={showInventoryMessage}
                        width="100%"
                        variant="solid"
                        marginBottom={4}
                    >
                        {addToCartTitle}
                    </Button>
                )}
            </ProductViewLayout.ActionButtons>
        </ProductViewLayout>
    )
}

export default ProductView
