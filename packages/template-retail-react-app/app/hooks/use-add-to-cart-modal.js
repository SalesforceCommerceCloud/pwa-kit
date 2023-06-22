/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useContext, useState, useEffect} from 'react'
import {useLocation} from 'react-router-dom'
import PropTypes from 'prop-types'
import {useIntl, FormattedMessage} from 'react-intl'
import {
    AspectRatio,
    Box,
    Button,
    Flex,
    Text,
    Modal,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalOverlay,
    Stack,
    useBreakpointValue
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import Link from '@salesforce/retail-react-app/app/components/link'
import RecommendedProducts from '@salesforce/retail-react-app/app/components/recommended-products'
import {LockIcon} from '@salesforce/retail-react-app/app/components/icons'
import {findImageGroupBy} from '@salesforce/retail-react-app/app/utils/image-groups-utils'
import {getDisplayVariationValues} from '@salesforce/retail-react-app/app/utils/product-utils'
import {EINSTEIN_RECOMMENDERS} from '@salesforce/retail-react-app/app/constants'

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
export const AddToCartModal = () => {
    const {isOpen, onClose, data} = useAddToCartModalContext()
    const {product, itemsAdded = []} = data || {}
    const intl = useIntl()
    const {
        data: basket = {},
        derivedData: {totalItems}
    } = useCurrentBasket()
    const size = useBreakpointValue({base: 'full', lg: '2xl', xl: '4xl'})
    const {currency, productItems, productSubTotal} = basket
    const numerOfItemsAdded = itemsAdded.reduce((acc, {quantity}) => acc + quantity, 0)

    if (!isOpen) {
        return null
    }

    return (
        <Modal size={size} isOpen={isOpen} onClose={onClose} scrollBehavior="inside" isCentered>
            <ModalOverlay />
            <ModalContent
                margin="0"
                borderRadius={{base: 'none', md: 'base'}}
                bgColor="gray.50"
                containerProps={{'data-testid': 'add-to-cart-modal'}}
            >
                <ModalHeader paddingY="8" bgColor="white" fontSize="2xl" fontWeight="700">
                    {intl.formatMessage(
                        {
                            defaultMessage:
                                '{quantity} {quantity, plural, one {item} other {items}} added to cart',
                            id: 'add_to_cart_modal.info.added_to_cart'
                        },
                        {quantity: numerOfItemsAdded}
                    )}
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody bgColor="white" padding="0" marginBottom={{base: 40, lg: 0}}>
                    <Flex
                        flexDirection={{base: 'column', lg: 'row'}}
                        justifyContent="space-between"
                        paddingBottom={{base: '0', lg: '8'}}
                        paddingX="4"
                    >
                        <Box
                            flex="1"
                            paddingX={{lg: '4', xl: '8'}}
                            // divider style
                            borderRightWidth={{lg: '1px'}}
                            borderColor="gray.200"
                            borderStyle="solid"
                        >
                            {itemsAdded.map(({product, variant, quantity}, index) => {
                                const image = findImageGroupBy(product.imageGroups, {
                                    viewType: 'small',
                                    selectedVariationAttributes: variant.variationValues
                                })?.images?.[0]
                                const lineItemPrice =
                                    productItems?.find(
                                        (item) => item.productId === variant.productId
                                    )?.basePrice * quantity
                                const variationAttributeValues = getDisplayVariationValues(
                                    product.variationAttributes,
                                    variant.variationValues
                                )

                                return (
                                    <Flex
                                        key={variant.productId}
                                        justifyContent="space-between"
                                        marginBottom={index < itemsAdded - 1 ? 0 : 4}
                                        paddingBottom={4}
                                        borderBottomWidth={{base: '1px', lg: '0px'}}
                                        borderColor="gray.200"
                                        borderStyle="solid"
                                        data-testid="product-added"
                                    >
                                        <Flex gridGap="4">
                                            <Box w="24" flex="none">
                                                <AspectRatio ratio="1">
                                                    <img src={image.link} alt={image.alt} />
                                                </AspectRatio>
                                            </Box>

                                            <Box>
                                                <Text fontWeight="700">{product.name}</Text>
                                                <Box
                                                    color="gray.600"
                                                    fontSize="sm"
                                                    fontWeight="400"
                                                >
                                                    {Object.entries(variationAttributeValues).map(
                                                        ([name, value]) => {
                                                            return (
                                                                <Text key={value}>
                                                                    {name}: {value}
                                                                </Text>
                                                            )
                                                        }
                                                    )}
                                                    <Text>
                                                        {intl.formatMessage({
                                                            defaultMessage: 'Qty',
                                                            id: 'add_to_cart_modal.label.quantity'
                                                        })}
                                                        : {quantity}
                                                    </Text>
                                                </Box>
                                            </Box>
                                        </Flex>

                                        <Box flex="none" alignSelf="flex-end" fontWeight="600">
                                            <Text>
                                                {!!lineItemPrice &&
                                                    intl.formatNumber(lineItemPrice, {
                                                        style: 'currency',
                                                        currency: currency
                                                    })}
                                            </Text>
                                        </Box>
                                    </Flex>
                                )
                            })}
                        </Box>
                        <Box
                            display={['none', 'none', 'none', 'block']}
                            flex="1"
                            paddingX={{lg: '4', xl: '8'}}
                            paddingY={{base: '4', lg: '0'}}
                        >
                            <Flex justifyContent="space-between" marginBottom="8">
                                <Text fontWeight="700">
                                    {intl.formatMessage(
                                        {
                                            defaultMessage:
                                                'Cart Subtotal ({itemAccumulatedCount} item)',
                                            id: 'add_to_cart_modal.label.cart_subtotal'
                                        },
                                        {itemAccumulatedCount: totalItems}
                                    )}
                                </Text>
                                <Text alignSelf="flex-end" fontWeight="600">
                                    {productSubTotal &&
                                        intl.formatNumber(productSubTotal, {
                                            style: 'currency',
                                            currency: currency
                                        })}
                                </Text>
                            </Flex>
                            <Stack spacing="4">
                                <Button as={Link} to="/cart" width="100%" variant="solid">
                                    {intl.formatMessage({
                                        defaultMessage: 'View Cart',
                                        id: 'add_to_cart_modal.link.view_cart'
                                    })}
                                </Button>

                                <Button
                                    as={Link}
                                    to="/checkout"
                                    width="100%"
                                    variant="outline"
                                    rightIcon={<LockIcon />}
                                >
                                    {intl.formatMessage({
                                        defaultMessage: 'Proceed to Checkout',
                                        id: 'add_to_cart_modal.link.checkout'
                                    })}
                                </Button>
                            </Stack>
                        </Box>
                    </Flex>
                    <Box padding="8" bgColor="gray.50">
                        <RecommendedProducts
                            title={
                                <FormattedMessage
                                    defaultMessage="You Might Also Like"
                                    id="add_to_cart_modal.recommended_products.title.might_also_like"
                                />
                            }
                            recommender={EINSTEIN_RECOMMENDERS.ADD_TO_CART_MODAL}
                            products={[product]}
                            mx={{base: -4, md: -8, lg: 0}}
                            shouldFetch={() => product?.id}
                        />
                    </Box>
                </ModalBody>
                <ModalFooter
                    position="fixed"
                    bg="white"
                    width="100%"
                    display={['block', 'block', 'block', 'none']}
                    p={[4, 4, 6]}
                    left={0}
                    bottom={0}
                >
                    <Flex justifyContent="space-between" marginBottom="4">
                        <Text fontWeight="700">
                            {intl.formatMessage(
                                {
                                    defaultMessage: 'Cart Subtotal ({itemAccumulatedCount} item)',
                                    id: 'add_to_cart_modal.label.cart_subtotal'
                                },
                                {itemAccumulatedCount: totalItems}
                            )}
                        </Text>
                        <Text alignSelf="flex-end" fontWeight="600">
                            {productSubTotal &&
                                intl.formatNumber(productSubTotal, {
                                    style: 'currency',
                                    currency: currency
                                })}
                        </Text>
                    </Flex>
                    <Stack spacing="4">
                        <Button as={Link} to="/cart" width="100%" variant="solid">
                            {intl.formatMessage({
                                defaultMessage: 'View Cart',
                                id: 'add_to_cart_modal.link.view_cart'
                            })}
                        </Button>

                        <Button
                            as={Link}
                            to="/checkout"
                            width="100%"
                            variant="outline"
                            rightIcon={<LockIcon />}
                        >
                            {intl.formatMessage({
                                defaultMessage: 'Proceed to Checkout',
                                id: 'add_to_cart_modal.link.checkout'
                            })}
                        </Button>
                    </Stack>
                </ModalFooter>
            </ModalContent>
        </Modal>
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
