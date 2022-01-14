/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {useHistory, useLocation} from 'react-router-dom'
import {useIntl} from 'react-intl'

import {Flex, Heading, Button, Skeleton, Box, Text, VStack, Fade, useTheme} from '@chakra-ui/react'
import {useProduct} from '../../hooks'
import {useAddToCartModalContext} from '../../hooks/use-add-to-cart-modal'

// project components
import SwatchGroup from '../../components/swatch-group'
import Swatch from '../../components/swatch-group/swatch'
import ImageGallery from '../../components/image-gallery'
import Breadcrumb from '../../components/breadcrumb'
import Link from '../../components/link'
import withRegistration from '../../hoc/with-registration'
import {useCurrency} from '../../hooks'
import {Skeleton as ImageGallerySkeleton} from '../../components/image-gallery'
import {HideOnDesktop, HideOnMobile} from '../../components/responsive'
import QuantityPicker from '../../components/quantity-picker'

const ProductViewHeader = ({name, price, currency, category}) => {
    const intl = useIntl()
    const {currency: activeCurrency} = useCurrency()
    return (
        <VStack mr={4} spacing={2} align="flex-start" marginBottom={[4, 4, 4, 0, 0]}>
            {category && (
                <Skeleton isLoaded={category} width={64}>
                    <Breadcrumb categories={category} />
                </Skeleton>
            )}

            {/* Title */}
            <Skeleton isLoaded={name}>
                <Heading fontSize="2xl">{`${name}`}</Heading>
            </Skeleton>

            {/* Price */}
            <Skeleton isLoaded={price} width={32}>
                <Text fontWeight="bold" fontSize="md" aria-label="price">
                    {intl.formatNumber(price, {
                        style: 'currency',
                        currency: currency || activeCurrency
                    })}
                </Text>
            </Skeleton>
        </VStack>
    )
}

ProductViewHeader.propTypes = {
    name: PropTypes.string,
    price: PropTypes.number,
    currency: PropTypes.string,
    category: PropTypes.array
}

const ButtonWithRegistration = withRegistration(Button)

/**
 * Render a product detail view that includes name, image gallery, price,
 * variant selections, action buttons
 */
const ProductView = ({
    product,
    category,
    showFullLink = false,
    imageSize = 'md',
    isWishlistLoading = false,
    addToCart,
    updateCart,
    addToWishlist,
    updateWishlist,
    isProductLoading
}) => {
    const intl = useIntl()
    const history = useHistory()
    const location = useLocation()
    const {
        isOpen: isAddToCartModalOpen,
        onOpen: onAddToCartModalOpen,
        onClose: onAddToCartModalClose
    } = useAddToCartModalContext()
    const theme = useTheme()
    const [showOptionsMessage, toggleShowOptionsMessage] = useState(false)
    const {
        showLoading,
        showInventoryMessage,
        inventoryMessage,
        quantity,
        minOrderQuantity,
        setQuantity,
        variant,
        variationParams,
        variationAttributes,
        stockLevel,
        stepQuantity
    } = useProduct(product)
    const canAddToWishlist = !isProductLoading
    const canOrder =
        !isProductLoading &&
        variant?.orderable &&
        parseInt(quantity) > 0 &&
        parseInt(quantity) <= stockLevel

    const renderActionButtons = () => {
        const buttons = []

        const handleCartItem = async () => {
            if (!canOrder) {
                toggleShowOptionsMessage(true)
                return null
            }
            if (!addToCart && !updateCart) return null
            if (updateCart) {
                await updateCart(variant, quantity)
                return
            }
            await addToCart(variant, quantity)
            onAddToCartModalOpen({product, quantity})
        }

        const handleWishlistItem = async () => {
            if (!updateWishlist && !addToWishlist) return null
            if (updateWishlist) {
                updateWishlist(variant, quantity)
                return
            }
            addToWishlist(variant, quantity)
        }

        if (addToCart || updateCart) {
            buttons.push(
                <Button
                    key="cart-button"
                    onClick={handleCartItem}
                    disabled={showInventoryMessage}
                    width="100%"
                    variant="solid"
                    marginBottom={4}
                >
                    {updateCart
                        ? intl.formatMessage({
                              defaultMessage: 'Update',
                              id: 'product_view.button.update'
                          })
                        : intl.formatMessage({
                              defaultMessage: 'Add to Cart',
                              id: 'product_view.button.add_to_cart'
                          })}
                </Button>
            )
        }

        if (addToWishlist || updateWishlist) {
            buttons.push(
                <ButtonWithRegistration
                    key="wishlist-button"
                    onClick={handleWishlistItem}
                    disabled={isWishlistLoading || !canAddToWishlist}
                    isLoading={isWishlistLoading}
                    width="100%"
                    variant="outline"
                    marginBottom={4}
                >
                    {updateWishlist
                        ? intl.formatMessage({
                              defaultMessage: 'Update',
                              id: 'product_view.button.update'
                          })
                        : intl.formatMessage({
                              defaultMessage: 'Add to Wishlist',
                              id: 'product_view.button.add_to_wishlist'
                          })}
                </ButtonWithRegistration>
            )
        }

        return buttons
    }

    useEffect(() => {
        if (isAddToCartModalOpen) {
            onAddToCartModalClose()
        }
    }, [location.pathname])

    useEffect(() => {
        if (canOrder) {
            toggleShowOptionsMessage(false)
        }
    }, [variant?.productId])

    return (
        <Flex direction={'column'} data-testid="product-view">
            {/* Basic information etc. title, price, breadcrumb*/}
            <Box display={['block', 'block', 'block', 'none']}>
                <ProductViewHeader
                    name={product?.name}
                    price={product?.price}
                    currency={product?.currency}
                    category={category}
                />
            </Box>
            <Flex direction={['column', 'column', 'column', 'row']}>
                <Box flex={1} mr={[0, 0, 0, 6, 6]}>
                    {product ? (
                        <>
                            <ImageGallery
                                size={imageSize}
                                imageGroups={product.imageGroups}
                                selectedVariationAttributes={variationParams}
                            />
                            <HideOnMobile>
                                {showFullLink && product && (
                                    <Link to={`/product/${product.master.masterId}`}>
                                        <Text color="blue.600">
                                            {intl.formatMessage({
                                                defaultMessage: 'See full details',
                                                id: 'product_view.link.full_details'
                                            })}
                                        </Text>
                                    </Link>
                                )}
                            </HideOnMobile>
                        </>
                    ) : (
                        <ImageGallerySkeleton />
                    )}
                </Box>

                {/* Variations & Quantity Selector */}
                <VStack align="stretch" spacing={8} flex={1} marginBottom={[16, 16, 16, 0, 0]}>
                    <Box display={['none', 'none', 'none', 'block']}>
                        <ProductViewHeader
                            name={product?.name}
                            price={product?.price}
                            currency={product?.currency}
                            category={category}
                        />
                    </Box>
                    <VStack align="stretch" spacing={4}>
                        {/*
                            Customize the skeletons shown for attributes to suit your needs. At the point
                            that we show the skeleton we do not know how many variations are selectable. So choose
                            a a skeleton that will meet most of your needs.
                        */}
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
                            <>
                                {/* Attribute Swatches */}
                                {variationAttributes.map((variationAttribute) => {
                                    const {
                                        id,
                                        name,
                                        selectedValue,
                                        values = []
                                    } = variationAttribute
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
                                                                image
                                                                    ? `url(${image.disBaseLink ||
                                                                          image.link})`
                                                                    : ''
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
                        )}

                        {/* Quantity Selector */}
                        <VStack align="stretch" maxWidth={'200px'}>
                            <Box fontWeight="bold">
                                <label htmlFor="quantity">
                                    {intl.formatMessage({
                                        defaultMessage: 'Quantity',
                                        id: 'product_view.label.quantity'
                                    })}
                                    :
                                </label>
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
                        </VStack>
                        <Box>
                            {!showLoading && showOptionsMessage && (
                                <Fade in={true}>
                                    <Text color="orange.600" fontWeight={600} marginBottom={8}>
                                        {intl.formatMessage({
                                            defaultMessage: 'Please select all your options above'
                                        })}
                                    </Text>
                                </Fade>
                            )}
                        </Box>
                        <HideOnDesktop>
                            {showFullLink && product && (
                                <Link to={`/product/${product.master.masterId}`}>
                                    <Text color="blue.600">
                                        {intl.formatMessage({
                                            defaultMessage: 'See full details',
                                            id: 'product_view.link.full_details'
                                        })}
                                    </Text>
                                </Link>
                            )}
                        </HideOnDesktop>
                    </VStack>

                    <Box>
                        {!showLoading && showInventoryMessage && (
                            <Fade in={true}>
                                <Text color="orange.600" fontWeight={600} marginBottom={8}>
                                    {inventoryMessage}
                                </Text>
                            </Fade>
                        )}
                        <Box display={['none', 'none', 'none', 'block']}>
                            {renderActionButtons()}
                        </Box>
                    </Box>
                </VStack>
            </Flex>
            {/*Add to Cart Button for mobile versions*/}
            <Box
                position="fixed"
                bg="white"
                width="100%"
                display={['block', 'block', 'block', 'none']}
                p={[4, 4, 6]}
                left={0}
                bottom={0}
                zIndex={2}
                boxShadow={theme.shadows.top}
            >
                {renderActionButtons()}
            </Box>
        </Flex>
    )
}

ProductView.propTypes = {
    product: PropTypes.object,
    category: PropTypes.array,
    isProductLoading: PropTypes.bool,
    isWishlistLoading: PropTypes.bool,
    addToCart: PropTypes.func,
    addToWishlist: PropTypes.func,
    updateCart: PropTypes.func,
    updateWishlist: PropTypes.func,
    showFullLink: PropTypes.bool,
    imageSize: PropTypes.oneOf(['sm', 'md'])
}

export default ProductView
