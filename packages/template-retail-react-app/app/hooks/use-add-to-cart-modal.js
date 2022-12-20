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
    ModalOverlay,
    Stack,
    useBreakpointValue
} from '@chakra-ui/react'
import useBasket from '../commerce-api/hooks/useBasket'
import Link from '../components/link'
import RecommendedProducts from '../components/recommended-products'
import {LockIcon} from '../components/icons'
import {useVariationAttributes} from './'
import {findImageGroupBy} from '../utils/image-groups-utils'

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
    const {product, quantity} = data || {}
    const intl = useIntl()
    const basket = useBasket()
    const size = useBreakpointValue({base: 'full', lg: '2xl', xl: '4xl'})
    const variationAttributes = useVariationAttributes(product)
    if (!isOpen) {
        return null
    }
    const {currency, productItems, productSubTotal, itemAccumulatedCount} = basket
    const {id, variationValues} = product
    const lineItemPrice = productItems?.find((item) => item.productId === id)?.basePrice * quantity
    const image = findImageGroupBy(product.imageGroups, {
        viewType: 'small',
        selectedVariationAttributes: variationValues
    })?.images?.[0]

    return (
        <Modal size={size} isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent
                margin="0"
                marginTop={{md: '8', lg: '200px'}}
                overflow="hidden"
                borderRadius={{base: 'none', md: 'base'}}
                bgColor="gray.50"
            >
                <ModalHeader paddingTop="8" bgColor="white" fontSize="2xl" fontWeight="700">
                    {intl.formatMessage(
                        {
                            defaultMessage:
                                '{quantity} {quantity, plural, one {item} other {items}} added to cart',
                            id: 'add_to_cart_modal.info.added_to_cart'
                        },
                        {quantity}
                    )}
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody bgColor="white" paddingTop="4" paddingBottom="8" flex="none">
                    <Flex
                        flexDirection={{base: 'column', lg: 'row'}}
                        justifyContent="space-between"
                    >
                        <Box
                            flex="1"
                            paddingRight={{lg: '4', xl: '8'}}
                            paddingY={{base: '4', lg: '0'}}
                            // divider style
                            borderRightWidth={{lg: '1px'}}
                            borderBottomWidth={{base: '1px', lg: '0px'}}
                            borderColor="gray.200"
                            borderStyle="solid"
                        >
                            <Flex justifyContent="space-between">
                                <Flex gridGap="4">
                                    <Box w="24" flex="none">
                                        <AspectRatio ratio="1">
                                            <img src={image.link} alt={image.alt} />
                                        </AspectRatio>
                                    </Box>
                                    <Box>
                                        <Text fontWeight="700">{product.name}</Text>
                                        <Box color="gray.600" fontSize="sm" fontWeight="400">
                                            {variationAttributes.map((attr) => {
                                                return (
                                                    <Text key={attr.id}>
                                                        {attr.name}: {attr.selectedValue.name}
                                                    </Text>
                                                )
                                            })}
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
                        </Box>
                        <Box
                            flex="1"
                            paddingLeft={{lg: '4', xl: '8'}}
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
                                        {itemAccumulatedCount}
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
                </ModalBody>
                <Box padding="8">
                    <RecommendedProducts
                        title={
                            <FormattedMessage
                                defaultMessage="You Might Also Like"
                                id="add_to_cart_modal.recommended_products.title.might_also_like"
                            />
                        }
                        recommender={'pdp-similar-items'}
                        products={product}
                        mx={{base: -4, md: -8, lg: 0}}
                        shouldFetch={() => product?.id}
                    />
                </Box>
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
