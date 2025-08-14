/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useContext, useState, useEffect, useMemo} from 'react'
import {useLocation} from 'react-router-dom'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {
    AspectRatio,
    Box,
    Button,
    CloseButton,
    Dialog,
    Flex,
    Heading,
    Text,
    Stack,
    useBreakpointValue
} from '@chakra-ui/react'
import {useCurrentBasket} from './use-current-basket'
import {usePromotions} from '@salesforce/commerce-sdk-react'
import Link from '../components/link'
import RecommendedProducts from '../components/recommended-products'
import {LockIcon} from '../components/icons'
import {findImageGroupBy} from '../utils/image-groups-utils'
import {getPriceData, getDisplayVariationValues} from '../utils/product-utils'
import {EINSTEIN_RECOMMENDERS} from '../../config/constants'
import DisplayPrice from '../components/display-price'
import SafePortal from '../components/safe-portal'
import {useBonusProductSelectionModalContext} from './use-bonus-product-selection-modal'
import {addToCartModalTheme} from '../theme/components/project/add-to-cart-modal'
import SelectBonusProductsButton from '../components/select-bonus-products-button'

/**
 * Local configuration for component-specific styling
 * These styles are kept local as they are specific to this component's layout
 */
const localStyles = {
    recommendations: {
        padding: '8',
        marginX: {base: -4, md: -8, lg: 0}
    },
    productItem: {
        borderBottomWidth: {base: '1px', lg: '0px'},
        borderColor: 'gray.200',
        borderStyle: 'solid'
    }
}

/**
 * This is the context for managing the AddToCartModal.
 * Used in top level App component.
 */
export const AddToCartModalContext = React.createContext()
export const useAddToCartModalContext = () => useContext(AddToCartModalContext)
export const AddToCartModalProvider = ({children}) => {
    const addToCartModal = useAddToCartModal()
    return (
        <AddToCartModalContext.Provider value={addToCartModal}>
            {children}
            <AddToCartModal />
        </AddToCartModalContext.Provider>
    )
}
AddToCartModalProvider.propTypes = {
    children: PropTypes.node.isRequired
}

/**
 * Visual feedback (a modal) for adding item to the cart.
 */
export const AddToCartModal = ({onSelectBonusProductsClick}) => {
    const {isOpen, onClose, data} = useAddToCartModalContext()
    const bonusProductContext = useBonusProductSelectionModalContext()
    const {onOpen: onOpenBonusModal} = bonusProductContext || {}
    const {product, itemsAdded = [], selectedQuantity, bonusDiscountLineItems = []} = data || {}
    const isProductABundle = !!product?.type.bundle

    // Extract unique promotion IDs
    const promotionIds = [
        ...new Set(bonusDiscountLineItems.map((item) => item.promotionId).filter(Boolean))
    ]
    // Fetch promotion details
    const {data: promotions, isLoading: isPromotionsLoading} = usePromotions(
        {parameters: {ids: promotionIds.join(',')}},
        {enabled: promotionIds.length > 0}
    )
    // Get the first promotion's details
    const promotionText = promotions?.data?.[0]?.details || ''

    const intl = useIntl()
    const {formatMessage} = intl
    const {
        data: basket = {},
        derivedData: {totalItems}
    } = useCurrentBasket()
    const size = useBreakpointValue(addToCartModalTheme.modal.size)
    const {currency, productSubTotal} = basket
    const numberOfItemsAdded = isProductABundle
        ? selectedQuantity
        : itemsAdded.reduce((acc, {quantity}) => acc + quantity, 0)

    const messages = useMemo(
        () => ({
            addedToCart: formatMessage(
                {
                    id: 'add_to_cart_modal.info.added_to_cart',
                    defaultMessage:
                        '{quantity} {quantity, plural, one {item} other {items}} added to cart'
                },
                {quantity: numberOfItemsAdded}
            ),
            quantity: formatMessage({
                id: 'add_to_cart_modal.label.quantity',
                defaultMessage: 'Qty'
            }),
            cartSubtotal: formatMessage(
                {
                    id: 'add_to_cart_modal.label.cart_subtotal',
                    defaultMessage: 'Cart Subtotal ({itemAccumulatedCount} item)'
                },
                {itemAccumulatedCount: totalItems}
            ),
            viewCart: formatMessage({
                id: 'add_to_cart_modal.link.view_cart',
                defaultMessage: 'View Cart'
            }),
            checkout: formatMessage({
                id: 'add_to_cart_modal.link.checkout',
                defaultMessage: 'Proceed to Checkout'
            }),
            mightAlsoLike: formatMessage({
                id: 'add_to_cart_modal.recommended_products.title.might_also_like',
                defaultMessage: 'You Might Also Like'
            })
        }),
        [intl, numberOfItemsAdded, totalItems]
    )

    if (!isOpen) {
        return null
    }

    const bundleImage = findImageGroupBy(product.imageGroups, {
        viewType: 'small'
    })?.images?.[0]

    const dialogTitleId = 'add-to-cart-modal-title'

    return (
        <Dialog.Root
            size={size}
            open={isOpen}
            onOpenChange={onClose}
            scrollBehavior={addToCartModalTheme.modal.scrollBehavior}
            placement={addToCartModalTheme.modal.placement}
        >
            <SafePortal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content
                        margin={addToCartModalTheme.layout.content.margin}
                        borderRadius={addToCartModalTheme.layout.content.borderRadius}
                        bgColor={addToCartModalTheme.colors.background}
                        data-testid="add-to-cart-modal"
                        aria-labelledby={dialogTitleId}
                    >
                        <Dialog.Header
                            paddingY={addToCartModalTheme.layout.header.paddingY}
                            bgColor={addToCartModalTheme.colors.contentBackground}
                        >
                            <Heading as="h1" fontSize="2xl" id={dialogTitleId}>
                                {messages.addedToCart}
                            </Heading>
                        </Dialog.Header>
                        <Dialog.Body
                            bgColor={addToCartModalTheme.colors.contentBackground}
                            padding={addToCartModalTheme.layout.body.padding}
                            marginBottom={addToCartModalTheme.layout.body.marginBottom}
                        >
                            <Flex
                                flexDirection={
                                    addToCartModalTheme.layout.mainContainer.flexDirection
                                }
                                justifyContent="space-between"
                                paddingBottom={
                                    addToCartModalTheme.layout.mainContainer.paddingBottom
                                }
                                paddingX={addToCartModalTheme.layout.mainContainer.paddingX}
                            >
                                <Box
                                    flex="1"
                                    paddingX={addToCartModalTheme.layout.section.paddingX}
                                    // divider style
                                    borderRightWidth={
                                        addToCartModalTheme.layout.divider.borderRightWidth
                                    }
                                    borderColor={addToCartModalTheme.layout.divider.borderColor}
                                    borderStyle={addToCartModalTheme.layout.divider.borderStyle}
                                >
                                    {isProductABundle && (
                                        <Flex
                                            key={product.id}
                                            justifyContent="space-between"
                                            paddingBottom={4}
                                            borderBottomWidth={
                                                localStyles.productItem.borderBottomWidth
                                            }
                                            borderColor={localStyles.productItem.borderColor}
                                            borderStyle={localStyles.productItem.borderStyle}
                                            data-testid="product-added"
                                        >
                                            <Flex gridGap="4">
                                                <Box w="24" flex="none">
                                                    <AspectRatio ratio="1">
                                                        <img
                                                            src={bundleImage.link}
                                                            alt={bundleImage.alt}
                                                        />
                                                    </AspectRatio>
                                                </Box>

                                                <Box>
                                                    <Text fontWeight="700">{product.name}</Text>
                                                    <Box
                                                        color="gray.600"
                                                        fontSize="sm"
                                                        fontWeight="400"
                                                    >
                                                        <Text>
                                                            {messages.quantity}:{' '}
                                                            {numberOfItemsAdded}
                                                        </Text>
                                                    </Box>
                                                    <Flex
                                                        flexDirection="column"
                                                        justifyContent="space-between"
                                                        marginTop={4}
                                                        gridGap={4}
                                                    >
                                                        {itemsAdded.map(
                                                            ({product, variant, quantity}) => {
                                                                const variationAttributeValues =
                                                                    getDisplayVariationValues(
                                                                        product.variationAttributes,
                                                                        variant.variationValues
                                                                    )
                                                                return (
                                                                    <Box key={variant.productId}>
                                                                        <Text
                                                                            color="gray.700"
                                                                            fontWeight="700"
                                                                            fontSize="sm"
                                                                        >
                                                                            {product.name}{' '}
                                                                            {quantity > 1
                                                                                ? `(${quantity})`
                                                                                : ''}
                                                                        </Text>
                                                                        <Box
                                                                            color="gray.600"
                                                                            fontSize="sm"
                                                                            fontWeight="500"
                                                                        >
                                                                            {Object.entries(
                                                                                variationAttributeValues
                                                                            ).map(
                                                                                ([name, value]) => {
                                                                                    return (
                                                                                        <Text
                                                                                            key={
                                                                                                value
                                                                                            }
                                                                                        >
                                                                                            {name}:{' '}
                                                                                            {value}
                                                                                        </Text>
                                                                                    )
                                                                                }
                                                                            )}
                                                                        </Box>
                                                                    </Box>
                                                                )
                                                            }
                                                        )}
                                                    </Flex>
                                                </Box>
                                            </Flex>

                                            <Box flex="none" alignSelf="flex-end" fontWeight="600">
                                                <Text>
                                                    {intl.formatNumber(
                                                        product.price * numberOfItemsAdded,
                                                        {
                                                            style: 'currency',
                                                            currency: currency
                                                        }
                                                    )}
                                                </Text>
                                            </Box>
                                        </Flex>
                                    )}
                                    {!isProductABundle &&
                                        itemsAdded.map(({product, variant, quantity}, index) => {
                                            const image = findImageGroupBy(product.imageGroups, {
                                                viewType: 'small',
                                                selectedVariationAttributes: variant.variationValues
                                            })?.images?.[0]
                                            const priceData = getPriceData(product, {quantity})
                                            const variationAttributeValues =
                                                getDisplayVariationValues(
                                                    product.variationAttributes,
                                                    variant.variationValues
                                                )

                                            return (
                                                <Flex
                                                    key={variant.productId}
                                                    justifyContent="space-between"
                                                    marginBottom={index < itemsAdded - 1 ? 0 : 4}
                                                    paddingBottom={4}
                                                    borderBottomWidth={
                                                        localStyles.productItem.borderBottomWidth
                                                    }
                                                    borderColor={
                                                        localStyles.productItem.borderColor
                                                    }
                                                    borderStyle={
                                                        localStyles.productItem.borderStyle
                                                    }
                                                    data-testid="product-added"
                                                >
                                                    <Flex gridGap="4">
                                                        <Box w="24" flex="none">
                                                            <AspectRatio ratio="1">
                                                                <img
                                                                    src={image.link}
                                                                    alt={image.alt}
                                                                />
                                                            </AspectRatio>
                                                        </Box>

                                                        <Box>
                                                            <Heading
                                                                as="h2"
                                                                fontSize="md"
                                                                fontFamily="body"
                                                                fontWeight="700"
                                                            >
                                                                {product.name}
                                                            </Heading>
                                                            <Box
                                                                color="gray.600"
                                                                fontSize="sm"
                                                                fontWeight="400"
                                                            >
                                                                {Object.entries(
                                                                    variationAttributeValues
                                                                ).map(([name, value]) => {
                                                                    return (
                                                                        <Text key={value}>
                                                                            {name}: {value}
                                                                        </Text>
                                                                    )
                                                                })}
                                                                <Text>
                                                                    {messages.quantity}: {quantity}
                                                                </Text>
                                                            </Box>
                                                        </Box>
                                                    </Flex>

                                                    <Box
                                                        flex="none"
                                                        alignSelf="flex-end"
                                                        fontWeight="600"
                                                    >
                                                        <DisplayPrice
                                                            priceData={priceData}
                                                            quantity={quantity}
                                                            currency={currency || 'GBP'}
                                                        />
                                                    </Box>
                                                </Flex>
                                            )
                                        })}
                                    {bonusDiscountLineItems &&
                                        bonusDiscountLineItems.length > 0 && (
                                            <>
                                                <Text
                                                    mb={2}
                                                    fontSize="md"
                                                    fontWeight="normal"
                                                    textAlign="left"
                                                >
                                                    {promotionText}
                                                </Text>
                                                <SelectBonusProductsButton
                                                    bonusDiscountLineItems={bonusDiscountLineItems}
                                                    product={product}
                                                    itemsAdded={itemsAdded}
                                                    onOpenBonusModal={onOpenBonusModal}
                                                    onClose={onClose}
                                                />
                                            </>
                                        )}
                                </Box>
                                <Box
                                    display={['none', 'none', 'none', 'block']}
                                    flex="1"
                                    paddingX={addToCartModalTheme.layout.section.paddingX}
                                    paddingY={addToCartModalTheme.layout.section.paddingY}
                                >
                                    <Flex justifyContent="space-between" marginBottom="8">
                                        <Text fontWeight="700">{messages.cartSubtotal}</Text>
                                        <Text alignSelf="flex-end" fontWeight="600">
                                            {productSubTotal &&
                                                intl.formatNumber(productSubTotal, {
                                                    style: 'currency',
                                                    currency: currency
                                                })}
                                        </Text>
                                    </Flex>
                                    <Stack gap="4">
                                        <Button asChild variant="solid">
                                            <Link to="/cart" width="100%">
                                                {messages.viewCart}
                                            </Link>
                                        </Button>

                                        <Button asChild variant="outline">
                                            <Link to="/checkout" width="100%">
                                                {messages.checkout}
                                                <LockIcon />
                                            </Link>
                                        </Button>
                                    </Stack>
                                </Box>
                            </Flex>
                            <Box
                                padding={localStyles.recommendations.padding}
                                bgColor={addToCartModalTheme.colors.background}
                            >
                                <RecommendedProducts
                                    title={messages.mightAlsoLike}
                                    recommender={EINSTEIN_RECOMMENDERS.ADD_TO_CART_MODAL}
                                    products={[product]}
                                    mx={localStyles.recommendations.marginX}
                                    shouldFetch={() => product?.id}
                                />
                            </Box>
                        </Dialog.Body>
                        <Dialog.Footer
                            position={addToCartModalTheme.layout.footer.position}
                            bg={addToCartModalTheme.colors.contentBackground}
                            width={addToCartModalTheme.layout.footer.width}
                            display={addToCartModalTheme.layout.footer.display}
                            p={addToCartModalTheme.layout.footer.padding}
                            left={addToCartModalTheme.layout.footer.left}
                            bottom={addToCartModalTheme.layout.footer.bottom}
                        >
                            <Flex justifyContent="space-between" marginBottom="4">
                                <Text fontWeight="700">{messages.cartSubtotal}</Text>
                                <Text alignSelf="flex-end" fontWeight="600">
                                    {productSubTotal &&
                                        intl.formatNumber(productSubTotal, {
                                            style: 'currency',
                                            currency: currency
                                        })}
                                </Text>
                            </Flex>
                            <Stack gap="4">
                                <Button asChild variant="solid">
                                    <Link to="/cart" width="100%">
                                        {messages.viewCart}
                                    </Link>
                                </Button>

                                <Button asChild variant="outline">
                                    <Link to="/checkout" width="100%">
                                        {messages.checkout}
                                        <LockIcon />
                                    </Link>
                                </Button>
                            </Stack>
                        </Dialog.Footer>
                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="md" />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </SafePortal>
        </Dialog.Root>
    )
}

AddToCartModal.propTypes = {
    product: PropTypes.shape({
        name: PropTypes.string,
        imageGroups: PropTypes.array
    }),
    variant: PropTypes.shape({
        productId: PropTypes.string,
        variationValues: PropTypes.object
    }),
    quantity: PropTypes.number,
    isOpen: PropTypes.bool,
    onClose: PropTypes.func,
    onSelectBonusProductsClick: PropTypes.func,
    children: PropTypes.any
}

export const useAddToCartModal = () => {
    const [state, setState] = useState({
        isOpen: false,
        data: null
    })

    const {pathname} = useLocation()
    useEffect(() => {
        if (state.isOpen) {
            setState({
                ...state,
                isOpen: false
            })
        }
    }, [pathname])

    return {
        isOpen: state.isOpen,
        data: state.data,
        onOpen: (data) => {
            setState({
                isOpen: true,
                data
            })
        },
        onClose: () => {
            setState({
                isOpen: false,
                data: null
            })
        }
    }
}
