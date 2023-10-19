/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {forwardRef, useEffect, useRef, useState} from 'react'
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
import {useToast} from '../../hooks/use-toast'
import {API_ERROR_MESSAGE} from '../../constants'

const ProductViewHeader = ({name, price, currency, category, productType}) => {
    const intl = useIntl()
    const {currency: activeCurrency} = useCurrency()
    const isProductASet = productType?.set

    return (
        <VStack mr={4} spacing={2} align="flex-start" marginBottom={[4, 4, 4, 0, 0]}>
            {category && (
                <Skeleton isLoaded={category} minWidth={64}>
                    <Breadcrumb categories={category} />
                </Skeleton>
            )}

            {/* Title */}
            <Skeleton isLoaded={name}>
                <Heading fontSize="2xl">{`${name}`}</Heading>
            </Skeleton>

            {/* Price */}
            <Skeleton isLoaded={price} minWidth={32}>
                <Text fontWeight="bold" fontSize="md" aria-label="price">
                    {isProductASet &&
                        `${intl.formatMessage({
                            id: 'product_view.label.starting_at_price',
                            defaultMessage: 'Starting at'
                        })} `}
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
    category: PropTypes.array,
    productType: PropTypes.object
}

const ButtonWithRegistration = withRegistration(Button)

/**
 * Render a product detail view that includes name, image gallery, price,
 * variant selections, action buttons
 */
const ProductView = forwardRef(
    (
        {
            product,
            category,
            showFullLink = false,
            imageSize = 'md',
            isWishlistLoading = false,
            addToCart,
            updateCart,
            addToWishlist,
            updateWishlist,
            isProductLoading,
            isProductPartOfSet = false,
            onVariantSelected = () => {},
            validateOrderability = (variant, quantity, stockLevel) =>
                !isProductLoading && variant?.orderable && quantity > 0 && quantity <= stockLevel
        },
        ref
    ) => {
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
        } = useProduct(product, isProductPartOfSet)
        const canAddToWishlist = !isProductLoading
        const isProductASet = product?.type.set
        const errorContainerRef = useRef(null)

        const validateAndShowError = (opts = {}) => {
            const {scrollErrorIntoView = true} = opts
            // Validate that all attributes are selected before proceeding.
            const hasValidSelection = validateOrderability(variant, quantity, stockLevel)
            const showError = !isProductASet && !hasValidSelection
            const scrollToError = showError && scrollErrorIntoView

            toggleShowOptionsMessage(showError)

            if (scrollToError) {
                errorContainerRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                })
            }

            return hasValidSelection
        }

        const renderActionButtons = () => {
            const buttons = []
            const buttonText = {
                update: intl.formatMessage({
                    defaultMessage: 'Update',
                    id: 'product_view.button.update'
                }),
                addToCart: intl.formatMessage({
                    defaultMessage: 'Add to Cart',
                    id: 'product_view.button.add_to_cart'
                }),
                addSetToCart: intl.formatMessage({
                    defaultMessage: 'Add Set to Cart',
                    id: 'product_view.button.add_set_to_cart'
                }),
                addToWishlist: intl.formatMessage({
                    defaultMessage: 'Add to Wishlist',
                    id: 'product_view.button.add_to_wishlist'
                }),
                addSetToWishlist: intl.formatMessage({
                    defaultMessage: 'Add Set to Wishlist',
                    id: 'product_view.button.add_set_to_wishlist'
                })
            }

            const showToast = useToast()
            const showError = () => {
                showToast({
                    title: intl.formatMessage(API_ERROR_MESSAGE),
                    status: 'error'
                })
            }

            const handleCartItem = async () => {
                const hasValidSelection = validateAndShowError()

                if (!hasValidSelection) {
                    return null
                }

                if (!addToCart && !updateCart) return null
                if (updateCart) {
                    await updateCart(variant, quantity)
                    return
                }
                try {
                    const itemsAdded = await addToCart(variant, quantity)
                    // Open modal only when `addToCart` returns some data
                    // It's possible that the item has been added to cart, but we don't want to open the modal.
                    // See wishlist_primary_action for example.
                    if (itemsAdded) {
                        onAddToCartModalOpen({
                            product,
                            itemsAdded
                        })
                    }
                } catch (e) {
                    showError()
                }
            }

            const handleWishlistItem = async () => {
                if (!updateWishlist && !addToWishlist) return null
                if (updateWishlist) {
                    updateWishlist(product, variant, quantity)
                    return
                }
                addToWishlist(product, variant, quantity)
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
                            ? buttonText.update
                            : isProductASet
                            ? buttonText.addSetToCart
                            : buttonText.addToCart}
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
                            ? buttonText.update
                            : isProductASet
                            ? buttonText.addSetToWishlist
                            : buttonText.addToWishlist}
                    </ButtonWithRegistration>
                )
            }

            return buttons
        }

        // Bind the reference with our `scope` that includes the internal validate function for this component.
        // Other values can be added to this scope as required.
        if (typeof ref === 'function') {
            ref = ref.bind({validateOrderability: validateAndShowError})
        }

        useEffect(() => {
            if (isAddToCartModalOpen) {
                onAddToCartModalClose()
            }
        }, [location.pathname])

        useEffect(() => {
            if (!isProductASet && validateOrderability(variant, quantity, stockLevel)) {
                toggleShowOptionsMessage(false)
            }
        }, [variationParams])

        useEffect(() => {
            if (variant) {
                onVariantSelected(product, variant, quantity)
            }
        }, [variant?.productId, quantity])

        return (
            <Flex direction={'column'} data-testid="product-view" ref={ref}>
                {/* Basic information etc. title, price, breadcrumb*/}
                <Box display={['block', 'block', 'block', 'none']}>
                    <ProductViewHeader
                        name={product?.name}
                        price={product?.price}
                        productType={product?.type}
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
                                    lazy={isProductPartOfSet}
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

                    {/* Variations & Quantity Selector & CTA buttons */}
                    <VStack align="stretch" spacing={8} flex={1}>
                        <Box display={['none', 'none', 'none', 'block']}>
                            <ProductViewHeader
                                name={product?.name}
                                price={product?.price}
                                productType={product?.type}
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
                                                {values.map(
                                                    ({href, name, image, value, orderable}) => (
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
                                                                            ? `url(${
                                                                                  image.disBaseLink ||
                                                                                  image.link
                                                                              })`
                                                                            : ''
                                                                    }
                                                                />
                                                            ) : (
                                                                name
                                                            )}
                                                        </Swatch>
                                                    )
                                                )}
                                            </SwatchGroup>
                                        )
                                    })}
                                </>
                            )}

                            {/* Quantity Selector */}
                            {!isProductASet && (
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
                            )}
                            <Box ref={errorContainerRef}>
                                {!showLoading && showOptionsMessage && (
                                    <Fade in={true}>
                                        <Text color="orange.600" fontWeight={600} marginBottom={8}>
                                            {intl.formatMessage({
                                                defaultMessage:
                                                    'Please select all your options above'
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
                            {isProductASet && <p>{product?.shortDescription}</p>}
                        </VStack>

                        <Box>
                            {!showLoading && showInventoryMessage && (
                                <Fade in={true}>
                                    <Text color="orange.600" fontWeight={600} marginBottom={8}>
                                        {inventoryMessage}
                                    </Text>
                                </Fade>
                            )}
                            <Box
                                display={
                                    isProductPartOfSet ? 'block' : ['none', 'none', 'none', 'block']
                                }
                            >
                                {renderActionButtons()}
                            </Box>
                        </Box>
                    </VStack>
                </Flex>

                {/* Sticky call-to-action buttons for mobile and certain product types */}
                <Box
                    position="fixed"
                    bg="white"
                    width="100%"
                    display={isProductPartOfSet ? 'none' : ['block', 'block', 'block', 'none']}
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
)

ProductView.displayName = 'ProductView'

ProductView.propTypes = {
    product: PropTypes.object,
    isProductPartOfSet: PropTypes.bool,
    category: PropTypes.array,
    isProductLoading: PropTypes.bool,
    isWishlistLoading: PropTypes.bool,
    addToCart: PropTypes.func,
    addToWishlist: PropTypes.func,
    updateCart: PropTypes.func,
    updateWishlist: PropTypes.func,
    showFullLink: PropTypes.bool,
    imageSize: PropTypes.oneOf(['sm', 'md']),
    onVariantSelected: PropTypes.func,
    validateOrderability: PropTypes.func
}

export default ProductView
