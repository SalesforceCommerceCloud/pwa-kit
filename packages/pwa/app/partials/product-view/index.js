/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import {useHistory} from 'react-router-dom'
import {useIntl} from 'react-intl'

import {Flex, Heading, Button, Skeleton, Box, Text, VStack, Select, Fade} from '@chakra-ui/react'

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
        const cartButtonContent = addToCart ? 'Add to cart' : 'Update'
        const wishlistButtonContent = addToWishlist ? 'Add to wishlist' : 'Update'
        if (addToCart || updateCart) {
            buttons.push(
                <Button
                    onClick={() =>
                        addToCart?.(variant, quantity) || updateCart?.(variant, quantity)
                    }
                    disabled={!canOrder}
                    key="cart-button"
                    width="100%"
                    marginTop={4}
                    marginBottom={4}
                    variant="solid"
                >
                    {intl.formatMessage(
                        {defaultMessage: '{content}'},
                        {content: cartButtonContent}
                    )}
                </Button>
            )
        }
        if (addToWishlist || updateWishlist) {
            buttons.push(
                <ButtonWithRegistration
                    width={'100%'}
                    variant="outline"
                    my={4}
                    onClick={() =>
                        addToWishlist?.(variant, quantity) || updateWishlist?.(variant, quantity)
                    }
                    key="wishlist-button"
                    disabled={isCustomerProductListLoading || !canAddToWishlist}
                    isLoading={isCustomerProductListLoading}
                >
                    {intl.formatMessage(
                        {defaultMessage: '{content}'},
                        {content: wishlistButtonContent}
                    )}
                </ButtonWithRegistration>
            )
        }

        return buttons
    }

    return (
        <Flex direction={'column'}>
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
