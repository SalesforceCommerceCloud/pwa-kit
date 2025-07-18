/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import {useProducts} from '@salesforce/commerce-sdk-react'
import {findImageGroupBy} from '@salesforce/retail-react-app/app/utils/image-groups-utils'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import ItemVariantProvider from '@salesforce/retail-react-app/app/components/item-variant'
import {
    Text,
    Button,
    Container,
    Box,
    Flex,
    VStack,
    HStack,
    Image,
    VisuallyHidden,
    Select,
    List,
    ListItem
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useIntl} from 'react-intl'
import PropTypes from 'prop-types'

const MultiShippingItemAttributes = ({variant, includeQuantity = true}) => {
    const {formatMessage} = useIntl()
    // Get display values for attributes
    const variationAttributes = variant?.variationAttributes || []
    const variationValues = variant?.variationValues || {}
    return (
        <List spacing={1.5} flex={1} aria-label="Product attributes">
            {variationAttributes &&
                variationAttributes.length > 0 &&
                variationAttributes.map((attr) => {
                    const value = attr.values?.find((v) => v.value === variationValues[attr.id])
                    return (
                        <ListItem key={attr.id}>
                            <Text lineHeight={1} color="gray.700" fontSize="sm">
                                {attr.name || attr.id}: {value?.name || value?.value || ''}
                            </Text>
                        </ListItem>
                    )
                })}
            {includeQuantity && (
                <ListItem>
                    <Text lineHeight={1} color="gray.700" fontSize="sm">
                        {formatMessage({
                            id: 'shipping_multi_address.quantity.label',
                            defaultMessage: 'Quantity'
                        })}
                        : {variant.quantity}
                    </Text>
                </ListItem>
            )}
        </List>
    )
}

MultiShippingItemAttributes.propTypes = {
    variant: PropTypes.object.isRequired,
    includeQuantity: PropTypes.bool
}

const ShippingMultiAddress = ({
    basket,
    onSubmit,
    submitButtonLabel,
    addNewAddressLabel,
    noItemsInBasketMessage,
    deliveryAddressLabel
}) => {
    const {formatMessage} = useIntl()
    const productIds = basket?.productItems?.map((item) => item.productId).join(',')
    const {
        data: products,
        isLoading: productsLoading,
        error: productsError
    } = useProducts(
        {parameters: {ids: productIds, allImages: true}},
        {enabled: Boolean(productIds)}
    )
    const productsMap =
        products?.data?.reduce((acc, p) => {
            acc[p.id] = p
            return acc
        }, {}) || {}
    const {data: customer} = useCurrentCustomer()
    const addresses = customer?.addresses || []
    const [selectedAddresses, setSelectedAddresses] = useState({})

    // Early return after hooks
    if (!basket?.productItems?.length) {
        return (
            <Box
                p={8}
                textAlign="center"
                color="gray.500"
                role="status"
                aria-live="polite"
                aria-label={formatMessage(noItemsInBasketMessage)}
            >
                {formatMessage(noItemsInBasketMessage)}
            </Box>
        )
    }

    // Loading state
    if (productsLoading) {
        return (
            <Box
                p={8}
                textAlign="center"
                color="gray.500"
                role="status"
                aria-live="polite"
                aria-label={formatMessage({
                    id: 'shipping_multi_address.loading.label',
                    defaultMessage: 'Loading products'
                })}
            >
                {formatMessage({
                    id: 'shipping_multi_address.loading.message',
                    defaultMessage: 'Loading products...'
                })}
            </Box>
        )
    }

    // Error state
    if (productsError) {
        return (
            <Box
                p={8}
                textAlign="center"
                color="red.500"
                role="alert"
                aria-live="assertive"
                aria-label={formatMessage({
                    id: 'shipping_multi_address.error.label',
                    defaultMessage: 'Error loading products'
                })}
            >
                {formatMessage({
                    id: 'shipping_multi_address.error.message',
                    defaultMessage: 'Error loading products. Please try again.'
                })}
            </Box>
        )
    }

    const onAddNewAddress = () => {
        // TODO: Implement add new address logic/modal
        console.log('Add New Address clicked!')
    }

    return (
        <Box
            as="main"
            role="main"
            aria-label={formatMessage({
                id: 'shipping_multi_address.main.label',
                defaultMessage: 'Multi-shipping address selection'
            })}
        >
            <VStack spacing={0}>
                <Box
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    bg="white"
                    p={2}
                    w="100%"
                    role="region"
                    aria-label={formatMessage({
                        id: 'shipping_multi_address.products.region',
                        defaultMessage: 'Products and delivery addresses'
                    })}
                >
                    <VStack spacing={2}>
                        {basket.productItems.map((item) => {
                            // Merge product details into item
                            const productDetail = productsMap[item.productId] || {}
                            const variant = {...item, ...productDetail}
                            // Use findImageGroupBy to get the image
                            const image = findImageGroupBy(productDetail.imageGroups, {
                                viewType: 'small',
                                selectedVariationAttributes: variant.variationValues
                            })?.images?.[0]
                            const imageUrl = image?.disBaseLink || image?.link || ''
                            const addressKey = item.itemId
                            const selectedAddressId =
                                selectedAddresses[addressKey] || addresses[0]?.addressId

                            return (
                                <Box
                                    key={addressKey}
                                    border="1px solid"
                                    borderColor="gray.200"
                                    borderRadius="md"
                                    p={4}
                                    bg="white"
                                    w="100%"
                                    data-testid="multi-shipping-card"
                                    overflow="visible"
                                    role="article"
                                    aria-labelledby={`product-title-${addressKey}`}
                                    aria-describedby={`product-description-${addressKey}`}
                                >
                                    <Flex
                                        direction={{base: 'column', md: 'row'}}
                                        align="flex-start"
                                        w="100%"
                                        gap={{base: 4, md: 6}}
                                    >
                                        {/* Left: Image and info */}
                                        <Flex direction="row" align="flex-start" flex={1} minW={0}>
                                            <HStack align="flex-start" spacing={3} w="100%">
                                                <Box
                                                    flexShrink={0}
                                                    borderRadius="md"
                                                    bg="gray.100"
                                                    overflow="hidden"
                                                    position="relative"
                                                    w={{base: '60px', md: '80px'}}
                                                    aspectRatio="1"
                                                >
                                                    <Image
                                                        src={imageUrl}
                                                        alt={formatMessage(
                                                            {
                                                                id: 'shipping_multi_address.image.alt',
                                                                defaultMessage:
                                                                    'Product image for {productName}'
                                                            },
                                                            {
                                                                productName: item.productName
                                                            }
                                                        )}
                                                        objectFit="cover"
                                                        w="100%"
                                                        h="100%"
                                                    />
                                                </Box>
                                                <ItemVariantProvider variant={variant}>
                                                    <VStack
                                                        justify="flex-start"
                                                        minW={0}
                                                        flex={1}
                                                        pt={0}
                                                        align="flex-start"
                                                    >
                                                        <Text
                                                            id={`product-title-${addressKey}`}
                                                            fontWeight="medium"
                                                            fontSize={{base: 'sm', md: 'md'}}
                                                            mb={1}
                                                            color="gray.900"
                                                            textAlign="left"
                                                        >
                                                            {item.productName}
                                                        </Text>
                                                        <Box
                                                            id={`product-description-${addressKey}`}
                                                        >
                                                            <MultiShippingItemAttributes
                                                                variant={variant}
                                                                includeQuantity
                                                            />
                                                        </Box>
                                                    </VStack>
                                                </ItemVariantProvider>
                                            </HStack>
                                        </Flex>

                                        {/* Right: Address dropdown and price - only on desktop */}
                                        <VStack
                                            align="flex-start"
                                            w={{base: '100%', md: '340px'}}
                                            flexShrink={0}
                                            display={{base: 'none', md: 'flex'}}
                                            pt={0}
                                            role="group"
                                            aria-labelledby={`delivery-address-label-${addressKey}`}
                                        >
                                            <Text
                                                id={`delivery-address-label-${addressKey}`}
                                                fontWeight="medium"
                                                fontSize="sm"
                                                mb={2}
                                            >
                                                {formatMessage(deliveryAddressLabel)}
                                            </Text>

                                            {/* Address Dropdown */}
                                            <Box w="100%" mb={6}>
                                                <Select
                                                    value={selectedAddressId || ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value
                                                        if (value === 'add-new') {
                                                            onAddNewAddress()
                                                            // Reset to first address after calling onAddNewAddress
                                                            setSelectedAddresses((prev) => ({
                                                                ...prev,
                                                                [addressKey]:
                                                                    addresses[0]?.addressId || ''
                                                            }))
                                                        } else {
                                                            setSelectedAddresses((prev) => ({
                                                                ...prev,
                                                                [addressKey]: value
                                                            }))
                                                        }
                                                    }}
                                                    aria-labelledby={`delivery-address-label-${addressKey}`}
                                                    size="md"
                                                    borderColor="gray.300"
                                                    _hover={{borderColor: 'gray.400'}}
                                                    _focus={{
                                                        borderColor: 'blue.500',
                                                        boxShadow:
                                                            '0 0 0 1px var(--chakra-colors-blue-500)'
                                                    }}
                                                >
                                                    {addresses.map((addr) => (
                                                        <option
                                                            key={addr.addressId}
                                                            value={addr.addressId}
                                                        >
                                                            {addr.firstName} {addr.lastName} -{' '}
                                                            {addr.address1},{' '}
                                                            {formatMessage(
                                                                {
                                                                    id: 'shipping_multi_address.format.address_line_2',
                                                                    defaultMessage:
                                                                        '{city}, {stateCode} {postalCode}'
                                                                },
                                                                {
                                                                    city: addr.city,
                                                                    stateCode: addr.stateCode || '',
                                                                    postalCode: addr.postalCode
                                                                }
                                                            )}
                                                        </option>
                                                    ))}
                                                    <option
                                                        value="add-new"
                                                        style={{
                                                            color: '#3182ce',
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        + {formatMessage(addNewAddressLabel)}
                                                    </option>
                                                </Select>
                                            </Box>

                                            {/* Price */}
                                            <Box
                                                fontWeight="semibold"
                                                fontSize="md"
                                                color="gray.900"
                                                alignSelf="flex-end"
                                                mt="auto"
                                                aria-label={formatMessage({
                                                    id: 'shipping_multi_address.price.label',
                                                    defaultMessage: 'Product price'
                                                })}
                                            >
                                                {typeof variant.priceAfterItemDiscount ===
                                                    'number' && (
                                                    <Text>
                                                        {new Intl.NumberFormat(undefined, {
                                                            style: 'currency',
                                                            currency: basket?.currency || 'USD'
                                                        }).format(variant.priceAfterItemDiscount)}
                                                    </Text>
                                                )}
                                            </Box>
                                        </VStack>
                                    </Flex>

                                    {/* Mobile: Address dropdown and price - only on mobile */}
                                    <VStack
                                        align="flex-start"
                                        w="100%"
                                        spacing={3}
                                        display={{base: 'flex', md: 'none'}}
                                        mt={4}
                                        pt={0}
                                        minW={0}
                                        maxW="100%"
                                        overflowX="hidden"
                                        minH="auto"
                                        role="group"
                                        aria-labelledby={`delivery-address-label-${addressKey}`}
                                    >
                                        <Text
                                            id={`delivery-address-label-${addressKey}`}
                                            fontWeight="medium"
                                            fontSize="sm"
                                            mb={2}
                                        >
                                            {formatMessage(deliveryAddressLabel)}
                                        </Text>

                                        {/* Address Dropdown */}
                                        <Box w="100%" mb={6}>
                                            <Select
                                                value={selectedAddressId || ''}
                                                onChange={(e) => {
                                                    const value = e.target.value
                                                    if (value === 'add-new') {
                                                        onAddNewAddress()
                                                    } else {
                                                        setSelectedAddresses((prev) => ({
                                                            ...prev,
                                                            [addressKey]: value
                                                        }))
                                                    }
                                                }}
                                                aria-labelledby={`delivery-address-label-${addressKey}`}
                                                size="md"
                                                borderColor="gray.300"
                                                _hover={{borderColor: 'gray.400'}}
                                                _focus={{
                                                    borderColor: 'blue.500',
                                                    boxShadow:
                                                        '0 0 0 1px var(--chakra-colors-blue-500)'
                                                }}
                                            >
                                                {addresses.map((addr) => (
                                                    <option
                                                        key={addr.addressId}
                                                        value={addr.addressId}
                                                    >
                                                        {addr.firstName} {addr.lastName} -{' '}
                                                        {addr.address1},{' '}
                                                        {formatMessage(
                                                            {
                                                                id: 'shipping_multi_address.format.address_line_2',
                                                                defaultMessage:
                                                                    '{city}, {stateCode} {postalCode}'
                                                            },
                                                            {
                                                                city: addr.city,
                                                                stateCode: addr.stateCode || '',
                                                                postalCode: addr.postalCode
                                                            }
                                                        )}
                                                    </option>
                                                ))}
                                                <option
                                                    value="add-new"
                                                    style={{color: '#3182ce', fontWeight: 'bold'}}
                                                >
                                                    + {formatMessage(addNewAddressLabel)}
                                                </option>
                                            </Select>
                                        </Box>

                                        {/* Price */}
                                        <Box
                                            fontWeight="semibold"
                                            fontSize="md"
                                            color="gray.900"
                                            alignSelf="flex-end"
                                            mt="auto"
                                            aria-label={formatMessage({
                                                id: 'shipping_multi_address.price.label',
                                                defaultMessage: 'Product price'
                                            })}
                                        >
                                            {typeof variant.priceAfterItemDiscount === 'number' && (
                                                <Text>
                                                    {new Intl.NumberFormat(undefined, {
                                                        style: 'currency',
                                                        currency: basket?.currency || 'USD'
                                                    }).format(variant.priceAfterItemDiscount)}
                                                </Text>
                                            )}
                                        </Box>
                                    </VStack>
                                </Box>
                            )
                        })}
                    </VStack>
                </Box>
                <Box
                    pt={2}
                    w="100%"
                    role="region"
                    aria-label={formatMessage({
                        id: 'shipping_multi_address.actions.region',
                        defaultMessage: 'Checkout actions'
                    })}
                >
                    <Container variant="form">
                        <Button
                            type="button"
                            width="full"
                            onClick={onSubmit}
                            aria-describedby="submit-button-description"
                        >
                            {formatMessage(submitButtonLabel)}
                        </Button>
                        <VisuallyHidden id="submit-button-description">
                            {formatMessage({
                                id: 'shipping_multi_address.submit.description',
                                defaultMessage:
                                    'Continue to next step with selected delivery addresses'
                            })}
                        </VisuallyHidden>
                    </Container>
                </Box>
            </VStack>
        </Box>
    )
}

ShippingMultiAddress.propTypes = {
    basket: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
    submitButtonLabel: PropTypes.object.isRequired,
    addNewAddressLabel: PropTypes.object.isRequired,
    noItemsInBasketMessage: PropTypes.object.isRequired,
    deliveryAddressLabel: PropTypes.object.isRequired
}

export default ShippingMultiAddress
