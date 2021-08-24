/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import {useHistory, useLocation} from 'react-router-dom'
import {FormattedMessage, useIntl} from 'react-intl'

import {
    Flex,
    Heading,
    Button,
    Skeleton,
    Box,
    Text,
    VStack,
    Select,
    Fade,
    useDisclosure
} from '@chakra-ui/react'

import {useProduct} from '../../hooks'

// project components
import SwatchGroup from '../../components/swatch-group'
import Swatch from '../../components/swatch-group/swatch'
import ImageGallery from '../../components/image-gallery'
import Breadcrumb from '../../components/breadcrumb'
import Link from '../../components/link'
import withRegistration from '../../hoc/with-registration'
import {DEFAULT_CURRENCY} from '../../constants'
import {Skeleton as ImageGallerySkeleton} from '../../components/image-gallery'
import AddToCartModal from '../../components/add-to-cart-modal'
import RecommendedProducts from '../../components/recommended-products'

const MAX_ORDER_QUANTITY = 10

const ProductViewHeader = ({name, price, currency, category}) => {
    const intl = useIntl()
    return (
        <VStack mr={4} spacing={2} align="flex-start">
            {category && (
                <Skeleton isLoaded={category} width={64}>
                    <Breadcrumb categories={category} />
                </Skeleton>
            )}

            {/* Title */}
            <Skeleton isLoaded={name}>
                <Heading as="h2" size="lg">
                    {`${name}`}
                </Heading>
            </Skeleton>

            {/* Price */}
            <Skeleton isLoaded={price} width={32}>
                <Text fontWeight="bold" fontSize="md" aria-label="price">
                    {intl.formatNumber(price, {
                        style: 'currency',
                        currency: currency || DEFAULT_CURRENCY
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
    isCustomerProductListLoading = false,
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
    } = useDisclosure()

    const {
        showLoading,
        showInventoryMessage,
        inventoryMessage,
        quantity,
        setQuantity,
        variant,
        variationParams,
        variationAttributes,
        stepQuantity,
        stockLevel
    } = useProduct(product)
    const canAddToWishlist = !isProductLoading
    const canOrder = !isProductLoading && variant?.orderable && quantity <= stockLevel

    const renderActionButtons = () => {
        const buttons = []

        const handleCartItem = () => {
            if (!addToCart && !updateCart) return null
            if (updateCart) {
                updateCart(variant, quantity)
                return
            }
            addToCart(variant, quantity)
            onAddToCartModalOpen()
        }

        const handleWishlistItem = () => {
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
                    disabled={!canOrder}
                    width="100%"
                    variant="solid"
                    marginTop={4}
                    marginBottom={4}
                >
                    {updateCart
                        ? intl.formatMessage({defaultMessage: 'Update'})
                        : intl.formatMessage({defaultMessage: 'Add to cart'})}
                </Button>
            )
        }

        if (addToWishlist || updateWishlist) {
            buttons.push(
                <ButtonWithRegistration
                    key="wishlist-button"
                    onClick={handleWishlistItem}
                    disabled={isCustomerProductListLoading || !canAddToWishlist}
                    isLoading={isCustomerProductListLoading}
                    width="100%"
                    variant="outline"
                    marginTop={4}
                    marginBottom={4}
                >
                    {updateWishlist
                        ? intl.formatMessage({defaultMessage: 'Update'})
                        : intl.formatMessage({defaultMessage: 'Add to wishlist'})}
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
                <Box flex={2} mr={[0, 0, 4, 4]}>
                    {product ? (
                        <>
                            <ImageGallery
                                size={imageSize}
                                imageGroups={product.imageGroups}
                                selectedVariationAttributes={variationParams}
                            />
                            {showFullLink && product && (
                                <Link to={`/product/${product.master.masterId}`}>
                                    <Text color="blue.600">
                                        {intl.formatMessage({defaultMessage: 'See full details'})}
                                    </Text>
                                </Link>
                            )}
                        </>
                    ) : (
                        <ImageGallerySkeleton />
                    )}
                </Box>

                {/* Variations & Quantity Selector */}
                <VStack align="stretch" spacing={8} flex={1}>
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
                                                                    ? `url(${image.disBaseLink})`
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
                        <VStack align="stretch" maxWidth={'125px'}>
                            <Box fontWeight="bold">
                                {intl.formatMessage({
                                    defaultMessage: 'Quantity'
                                })}
                                :
                            </Box>
                            <Select
                                value={quantity}
                                onChange={({target}) => {
                                    setQuantity(parseInt(target.value))
                                }}
                            >
                                {new Array(MAX_ORDER_QUANTITY).fill(0).map((_, index) => (
                                    <option key={index} value={index + stepQuantity}>
                                        {index + stepQuantity}
                                    </option>
                                ))}
                            </Select>
                        </VStack>
                    </VStack>

                    <Box display={['none', 'none', 'none', 'block']}>
                        {!showLoading && showInventoryMessage && (
                            <Fade in={true}>
                                <Text color="orange.600" fontWeight={600} marginBottom={8}>
                                    {inventoryMessage}
                                </Text>
                            </Fade>
                        )}
                        {renderActionButtons()}
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
                paddingBottom={11}
                left={0}
                bottom={0}
                zIndex={2}
            >
                {renderActionButtons()}
            </Box>

            {isAddToCartModalOpen && (
                <AddToCartModal
                    product={product}
                    variant={variant}
                    quantity={quantity}
                    isOpen={isAddToCartModalOpen}
                    onClose={onAddToCartModalClose}
                >
                    <RecommendedProducts
                        title={<FormattedMessage defaultMessage="You Might Also Like" />}
                        recommender={'pdp-similar-items'}
                        products={product && [product.id]}
                        mx={{base: -4, md: -8, lg: 0}}
                        shouldFetch={() => product?.id}
                    />
                </AddToCartModal>
            )}
        </Flex>
    )
}

ProductView.propTypes = {
    product: PropTypes.object,
    category: PropTypes.array,
    isProductLoading: PropTypes.bool,
    isCustomerProductListLoading: PropTypes.bool,
    addToCart: PropTypes.func,
    addToWishlist: PropTypes.func,
    updateCart: PropTypes.func,
    updateWishlist: PropTypes.func,
    showFullLink: PropTypes.bool,
    imageSize: PropTypes.oneOf(['sm', 'md'])
}

export default ProductView
