/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {forwardRef, useEffect, useMemo, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import {useLocation} from 'react-router-dom'
import {useIntl, FormattedMessage} from 'react-intl'

import {
    Flex,
    Heading,
    Button,
    Skeleton,
    Box,
    Text,
    VStack,
    Fade,
    useTheme
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useCurrency, useDerivedProduct} from '@salesforce/retail-react-app/app/hooks'
import {useAddToCartModalContext} from '@salesforce/retail-react-app/app/hooks/use-add-to-cart-modal'

// project components
import ImageGallery from '@salesforce/retail-react-app/app/components/image-gallery'
import Breadcrumb from '@salesforce/retail-react-app/app/components/breadcrumb'
import Link from '@salesforce/retail-react-app/app/components/link'
import withRegistration from '@salesforce/retail-react-app/app/components/with-registration'
import {Skeleton as ImageGallerySkeleton} from '@salesforce/retail-react-app/app/components/image-gallery'
import {HideOnDesktop, HideOnMobile} from '@salesforce/retail-react-app/app/components/responsive'
import QuantityPicker from '@salesforce/retail-react-app/app/components/quantity-picker'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {API_ERROR_MESSAGE} from '@salesforce/retail-react-app/app/constants'
import DisplayPrice from '@salesforce/retail-react-app/app/components/display-price'
import Swatch from '@salesforce/retail-react-app/app/components/swatch-group/swatch'
import SwatchGroup from '@salesforce/retail-react-app/app/components/swatch-group'
import {getPriceData} from '@salesforce/retail-react-app/app/utils/product-utils'
import PromoCallout from '@salesforce/retail-react-app/app/components/product-tile/promo-callout'

const ProductViewHeader = ({
    name,
    currency,
    priceData,
    category,
    product,
    isProductPartOfBundle
}) => {
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

            {!isProductPartOfBundle && (
                <>
                    <Skeleton isLoaded={priceData?.currentPrice}>
                        {priceData?.currentPrice && (
                            <DisplayPrice priceData={priceData} currency={currency} />
                        )}
                    </Skeleton>

                    <Skeleton isLoaded={product}>
                        {product?.productPromotions && <PromoCallout product={product} />}
                    </Skeleton>
                </>
            )}
        </VStack>
    )
}

ProductViewHeader.propTypes = {
    name: PropTypes.string,
    currency: PropTypes.string,
    category: PropTypes.array,
    priceData: PropTypes.object,
    product: PropTypes.object,
    isProductPartOfBundle: PropTypes.bool
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
            isProductPartOfBundle = false,
            childOfBundleQuantity = 0,
            childProductOrderability,
            setChildProductOrderability,
            isBasketLoading = false,
            onVariantSelected = () => {},
            validateOrderability = (variant, quantity, stockLevel) =>
                !isProductLoading && variant?.orderable && quantity > 0 && quantity <= stockLevel,
            showImageGallery = true,
            setSelectedBundleQuantity = () => {},
            selectedBundleParentQuantity = 1
        },
        ref
    ) => {
        const {currency: activeCurrency} = useCurrency()
        const showToast = useToast()
        const intl = useIntl()
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
            stepQuantity,
            isOutOfStock,
            unfulfillable
        } = useDerivedProduct(product, isProductPartOfSet, isProductPartOfBundle)
        const priceData = useMemo(() => {
            return getPriceData(product, {quantity})
        }, [product, quantity])
        const canAddToWishlist = !isProductLoading
        const isProductASet = product?.type.set
        const isProductABundle = product?.type.bundle
        const errorContainerRef = useRef(null)

        const {disableButton, customInventoryMessage} = useMemo(() => {
            let shouldDisableButton = showInventoryMessage
            let currentInventoryMsg = ''
            if (
                !shouldDisableButton &&
                (isProductASet || isProductABundle) &&
                childProductOrderability
            ) {
                // if any of the children are not orderable, it will disable the add to cart button
                const unavailableChildProductKey = Object.keys(childProductOrderability).find(
                    (key) => {
                        return childProductOrderability[key].showInventoryMessage
                    }
                )
                shouldDisableButton = !!unavailableChildProductKey
                if (unavailableChildProductKey) {
                    const unavailableChildProduct =
                        childProductOrderability[unavailableChildProductKey]
                    if (unavailableChildProduct.unfulfillable) {
                        currentInventoryMsg = intl.formatMessage(
                            {
                                defaultMessage: 'Only {stockLevel} left for {productName}!',
                                id: 'use_product.message.inventory_remaining_for_product'
                            },
                            {
                                stockLevel: unavailableChildProduct.stockLevel,
                                productName: unavailableChildProduct.productName
                            }
                        )
                    }
                    if (unavailableChildProduct.isOutOfStock) {
                        currentInventoryMsg = intl.formatMessage(
                            {
                                defaultMessage: 'Out of stock for {productName}',
                                id: 'use_product.message.out_of_stock_for_product'
                            },
                            {productName: unavailableChildProduct.productName}
                        )
                    }
                }
            }
            return {disableButton: shouldDisableButton, customInventoryMessage: currentInventoryMsg}
        }, [showInventoryMessage, childProductOrderability])

        const validateAndShowError = (opts = {}) => {
            const {scrollErrorIntoView = true} = opts
            // Validate that all attributes are selected before proceeding.
            const hasValidSelection = validateOrderability(variant, quantity, stockLevel)
            const showError = !isProductASet && !isProductABundle && !hasValidSelection
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
                addBundleToCart: intl.formatMessage({
                    defaultMessage: 'Add Bundle to Cart',
                    id: 'product_view.button.add_bundle_to_cart'
                }),
                addToWishlist: intl.formatMessage({
                    defaultMessage: 'Add to Wishlist',
                    id: 'product_view.button.add_to_wishlist'
                }),
                addSetToWishlist: intl.formatMessage({
                    defaultMessage: 'Add Set to Wishlist',
                    id: 'product_view.button.add_set_to_wishlist'
                }),
                addBundleToWishlist: intl.formatMessage({
                    defaultMessage: 'Add Bundle to Wishlist',
                    id: 'product_view.button.add_bundle_to_wishlist'
                })
            }

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
                    await updateCart(variant || product, quantity)
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
                            itemsAdded,
                            selectedQuantity: quantity
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

            // child product of bundles do not have add to cart button
            if ((addToCart || updateCart) && !isProductPartOfBundle) {
                buttons.push(
                    <Button
                        key="cart-button"
                        onClick={handleCartItem}
                        isDisabled={disableButton}
                        isLoading={isBasketLoading}
                        width="100%"
                        variant="solid"
                        marginBottom={4}
                    >
                        {updateCart
                            ? buttonText.update
                            : isProductASet
                            ? buttonText.addSetToCart
                            : isProductABundle
                            ? buttonText.addBundleToCart
                            : buttonText.addToCart}
                    </Button>
                )
            }

            // child product of bundles do not have add to wishlist button
            if ((addToWishlist || updateWishlist) && !isProductPartOfBundle) {
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
                            : isProductABundle
                            ? buttonText.addBundleToWishlist
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

        // Set the quantity of bundle child in a product bundle to ensure availability messages appear
        if (
            isProductPartOfBundle &&
            quantity != selectedBundleParentQuantity * childOfBundleQuantity
        ) {
            setQuantity(selectedBundleParentQuantity * childOfBundleQuantity)
        }

        useEffect(() => {
            if (isAddToCartModalOpen) {
                onAddToCartModalClose()
            }
        }, [location.pathname])

        useEffect(() => {
            if (
                !isProductASet &&
                !isProductABundle &&
                validateOrderability(variant, quantity, stockLevel)
            ) {
                toggleShowOptionsMessage(false)
            }
        }, [variationParams])

        useEffect(() => {
            if (variant) {
                onVariantSelected(product, variant, quantity)
            }
        }, [variant?.productId, quantity])

        useEffect(() => {
            if (isProductPartOfBundle || isProductPartOfSet) {
                const key = product.itemId ?? product.id
                // when showInventoryMessage is true, it means child product is not orderable
                setChildProductOrderability((previousState) => ({
                    ...previousState,
                    [key]: {
                        showInventoryMessage,
                        isOutOfStock,
                        unfulfillable,
                        stockLevel,
                        productName: product?.name
                    }
                }))
            }
        }, [showInventoryMessage, inventoryMessage])

        return (
            <Flex direction={'column'} data-testid="product-view" ref={ref}>
                {/* Basic information etc. title, price, breadcrumb*/}
                <Box display={['block', 'block', 'block', 'none']}>
                    <ProductViewHeader
                        name={product?.name}
                        product={product}
                        priceData={priceData}
                        currency={product?.currency || activeCurrency}
                        category={category}
                        isProductPartOfBundle={isProductPartOfBundle}
                    />
                </Box>
                <Flex direction={['column', 'column', 'column', 'row']}>
                    {showImageGallery && (
                        <Box flex={1} mr={[0, 0, 0, 6, 6]}>
                            {product ? (
                                <>
                                    <ImageGallery
                                        size={imageSize}
                                        imageGroups={product.imageGroups}
                                        selectedVariationAttributes={variationParams}
                                        lazy={isProductPartOfSet || isProductPartOfBundle}
                                    />
                                    <HideOnMobile>
                                        {showFullLink && product && (
                                            <Link
                                                to={`/product/${product.master.masterId}`}
                                                color="blue.600"
                                            >
                                                <FormattedMessage
                                                    id="product_view.link.full_details"
                                                    defaultMessage="See full details"
                                                />
                                            </Link>
                                        )}
                                    </HideOnMobile>
                                </>
                            ) : (
                                <ImageGallerySkeleton />
                            )}
                        </Box>
                    )}

                    {/* Variations & Quantity Selector & CTA buttons */}
                    <VStack align="stretch" spacing={8} flex={1}>
                        <Box display={['none', 'none', 'none', 'block']}>
                            <ProductViewHeader
                                name={product?.name}
                                product={product}
                                priceData={priceData}
                                currency={product?.currency || activeCurrency}
                                category={category}
                                isProductPartOfBundle={isProductPartOfBundle}
                            />
                        </Box>
                        <VStack align="stretch" spacing={4}>
                            {isProductPartOfBundle && (
                                <Box>
                                    <Text fontWeight="medium" fontSize="md" aria-label="price">
                                        <label>
                                            {intl.formatMessage({
                                                defaultMessage: 'Quantity',
                                                id: 'product_view.label.quantity'
                                            })}
                                            : {childOfBundleQuantity}
                                        </label>
                                    </Text>
                                </Box>
                            )}
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
                                variationAttributes.map(({id, name, selectedValue, values}) => {
                                    const swatches = values.map(
                                        ({href, name, image, value, orderable}, index) => {
                                            const content = image ? (
                                                <Box
                                                    height="100%"
                                                    width="100%"
                                                    minWidth="32px"
                                                    backgroundRepeat="no-repeat"
                                                    backgroundSize="cover"
                                                    backgroundColor={name.toLowerCase()}
                                                    backgroundImage={`url(${
                                                        image.disBaseLink || image.link
                                                    })`}
                                                />
                                            ) : (
                                                name
                                            )
                                            const hasSelection = Boolean(selectedValue?.value)
                                            const isSelected = selectedValue?.value === value
                                            const isFirst = index === 0
                                            // To mimic the behavior of a native radio input, only
                                            // one swatch should receive tab focus; the rest can be
                                            // selected using arrow keys when the swatch group has
                                            // focus. The focused element is the selected option or
                                            // the first in the group, if no option is selected.
                                            // This is a slight difference, for simplicity, from the
                                            // native element, where the first element is focused on
                                            // `Tab` and the _last_ element is focused on `Shift+Tab`
                                            const isFocusable =
                                                isSelected || (!hasSelection && isFirst)
                                            return (
                                                <Swatch
                                                    key={value}
                                                    href={href}
                                                    disabled={!orderable}
                                                    value={value}
                                                    name={name}
                                                    variant={id === 'color' ? 'circle' : 'square'}
                                                    selected={isSelected}
                                                    isFocusable={isFocusable}
                                                >
                                                    {content}
                                                </Swatch>
                                            )
                                        }
                                    )
                                    return (
                                        <SwatchGroup
                                            key={id}
                                            value={selectedValue?.value}
                                            displayName={selectedValue?.name || ''}
                                            label={intl.formatMessage(
                                                {
                                                    defaultMessage: '{variantType}',
                                                    id: 'product_view.label.variant_type'
                                                },
                                                {variantType: name}
                                            )}
                                        >
                                            {swatches}
                                        </SwatchGroup>
                                    )
                                })
                            )}

                            {!isProductASet && !isProductPartOfBundle && (
                                <VStack align="stretch" maxWidth={'200px'}>
                                    <Box fontWeight="bold">
                                        <label htmlFor="quantity">
                                            {intl.formatMessage({
                                                defaultMessage: 'Quantity:',
                                                id: 'product_view.label.quantity'
                                            })}
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
                                                if (isProductABundle)
                                                    setSelectedBundleQuantity(numberValue)
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
                                                if (isProductABundle)
                                                    setSelectedBundleQuantity(minOrderQuantity)
                                            }
                                        }}
                                        onFocus={(e) => {
                                            // This is useful for mobile devices, this allows the user to pop open the keyboard and set the
                                            // new quantity with one click. NOTE: This is something that can be refactored into the parent
                                            // component, potentially as a prop called `selectInputOnFocus`.
                                            e.target.select()
                                        }}
                                        productName={product?.name}
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
                                    <Link
                                        to={`/product/${product.master.masterId}`}
                                        color="blue.600"
                                    >
                                        <FormattedMessage
                                            id="product_view.link.full_details"
                                            defaultMessage="See full details"
                                        />
                                    </Link>
                                )}
                            </HideOnDesktop>
                            {isProductASet && <p>{product?.shortDescription}</p>}
                        </VStack>

                        <Box>
                            {!showLoading && showInventoryMessage && !customInventoryMessage && (
                                <Fade in={true}>
                                    <Text color="orange.600" fontWeight={600} marginBottom={8}>
                                        {inventoryMessage}
                                    </Text>
                                </Fade>
                            )}
                            {!showLoading && customInventoryMessage && (
                                <Fade in={true}>
                                    <Text color="orange.600" fontWeight={600} marginBottom={8}>
                                        {customInventoryMessage}
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
                    display={
                        isProductPartOfSet || isProductPartOfBundle
                            ? 'none'
                            : ['block', 'block', 'block', 'none']
                    }
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
    isProductPartOfBundle: PropTypes.bool,
    childOfBundleQuantity: PropTypes.number,
    category: PropTypes.array,
    isProductLoading: PropTypes.bool,
    isBasketLoading: PropTypes.bool,
    isWishlistLoading: PropTypes.bool,
    addToCart: PropTypes.func,
    addToWishlist: PropTypes.func,
    updateCart: PropTypes.func,
    updateWishlist: PropTypes.func,
    showFullLink: PropTypes.bool,
    imageSize: PropTypes.oneOf(['sm', 'md']),
    childProductOrderability: PropTypes.object,
    setChildProductOrderability: PropTypes.func,
    onVariantSelected: PropTypes.func,
    validateOrderability: PropTypes.func,
    showImageGallery: PropTypes.bool,
    setSelectedBundleQuantity: PropTypes.func,
    selectedBundleParentQuantity: PropTypes.number
}

export default ProductView
