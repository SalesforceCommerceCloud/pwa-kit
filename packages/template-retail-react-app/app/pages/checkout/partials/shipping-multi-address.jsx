/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import {useIntl} from 'react-intl'
import PropTypes from 'prop-types'

import {useProducts} from '@salesforce/commerce-sdk-react'
import {findImageGroupBy} from '@salesforce/retail-react-app/app/utils/image-groups-utils'
import {getPriceData} from '@salesforce/retail-react-app/app/utils/product-utils'
import DisplayPrice from '@salesforce/retail-react-app/app/components/display-price'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks'
import ItemVariantProvider from '@salesforce/retail-react-app/app/components/item-variant'
import {
    Text,
    Button,
    Box,
    Flex,
    VStack,
    HStack,
    Image,
    Select,
    List,
    ListItem,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Center,
    Spinner
} from '@salesforce/retail-react-app/app/components/shared/ui'

const MultiShippingItemAttributes = ({variant, includeQuantity = true}) => {
    const {formatMessage} = useIntl()
    // Get display values for attributes
    const variationAttributes = variant?.variationAttributes || []
    const variationValues = variant?.variationValues || {}
    return (
        <List
            spacing={1.5}
            flex={1}
            aria-label={formatMessage({
                id: 'shipping_multi_address.product_attributes.label',
                defaultMessage: 'Product attributes'
            })}
        >
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
    const {currency} = useCurrency()
    const productIds = basket?.productItems?.map((item) => item.productId).join(',')
    const {
        data: productsMap,
        isLoading: productsLoading,
        error: productsError
    } = useProducts(
        {parameters: {ids: productIds, allImages: true}},
        {
            enabled: Boolean(productIds),
            select: (data) => {
                return (
                    data?.data?.reduce((acc, p) => {
                        acc[p.id] = p
                        return acc
                    }, {}) || {}
                )
            }
        }
    )
    const {data: customer} = useCurrentCustomer()
    const addresses = customer?.addresses || []
    const [selectedAddresses, setSelectedAddresses] = useState({})

    if (!basket?.productItems?.length) {
        return (
            <Center
                p={8}
                textAlign="center"
                color="gray.500"
                role="status"
                aria-live="polite"
                aria-label={formatMessage(noItemsInBasketMessage)}
            >
                <VStack spacing={4}>
                    <Text fontSize="lg" fontWeight="medium">
                        {formatMessage(noItemsInBasketMessage)}
                    </Text>
                </VStack>
            </Center>
        )
    }

    // Loading state
    if (productsLoading) {
        return (
            <Center p={8} textAlign="center" color="gray.500">
                <VStack spacing={4}>
                    <Spinner size="lg" />
                    <Text>
                        {formatMessage({
                            id: 'shipping_multi_address.loading.message',
                            defaultMessage: 'Loading products...'
                        })}
                    </Text>
                </VStack>
            </Center>
        )
    }

    // Error state
    if (productsError) {
        return (
            <Alert
                status="error"
                variant="subtle"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                textAlign="center"
                height="200px"
                aria-live="assertive"
            >
                <AlertIcon boxSize={5} mr={0} />
                <AlertTitle mr={2}>
                    {formatMessage({
                        id: 'shipping_multi_address.error.label',
                        defaultMessage: 'Error loading products'
                    })}
                </AlertTitle>
                <AlertDescription>
                    {formatMessage({
                        id: 'shipping_multi_address.error.message',
                        defaultMessage: 'Error loading products. Please try again.'
                    })}
                </AlertDescription>
            </Alert>
        )
    }

    const onAddNewAddress = () => {
        console.log('Add New Address clicked!')
    }

    return (
        <Box>
            <VStack spacing={0}>
                <Box
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    bg="white"
                    p={2}
                    w="100%"
                >
                    <VStack spacing={2} w="100%" h="100%">
                        {basket.productItems.map((item) => {
                            const productDetail = productsMap?.[item.productId] || {}
                            const variant = {...item, ...productDetail}
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
                                    data-testid="multi-shipping-card"
                                    w="100%"
                                    flex="1"
                                >
                                    <Flex
                                        direction={{base: 'column', md: 'row'}}
                                        align="flex-start"
                                        w="100%"
                                        h="100%"
                                        gap={{base: 4, md: 6}}
                                    >
                                        <Flex direction="row" align="flex-start" flex={1} minW={0}>
                                            <HStack align="flex-start" spacing={3} w="100%">
                                                <Box
                                                    flexShrink={0}
                                                    borderRadius="md"
                                                    bg="gray.100"
                                                    overflow="hidden"
                                                    position="relative"
                                                    maxW={{base: '60px', md: '80px'}}
                                                    w="100%"
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
                                                            data-testid={`product-title-${addressKey}`}
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
                                                            data-testid={`product-description-${addressKey}`}
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

                                        <VStack
                                            align="flex-start"
                                            w="100%"
                                            flex={{base: 'none', md: '0 0 auto'}}
                                            minW={{base: '100%', md: '280px'}}
                                            maxW={{base: '100%', md: '400px'}}
                                            pt={0}
                                            spacing={3}
                                            mt={{base: 4, md: 0}}
                                        >
                                            <Text
                                                id={`delivery-address-label-${addressKey}`}
                                                data-testid={`delivery-address-label-${addressKey}`}
                                                fontWeight="medium"
                                                fontSize="sm"
                                                mb={2}
                                            >
                                                {formatMessage(deliveryAddressLabel)}
                                            </Text>

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
                                                    <option value="add-new">
                                                        + {formatMessage(addNewAddressLabel)}
                                                    </option>
                                                </Select>
                                            </Box>

                                            <Box
                                                fontWeight="semibold"
                                                fontSize="md"
                                                color="gray.900"
                                                alignSelf="flex-end"
                                                mt="auto"
                                            >
                                                <DisplayPrice
                                                    priceData={getPriceData(variant)}
                                                    currency={currency}
                                                    labelForA11y={variant.productName}
                                                />
                                            </Box>
                                        </VStack>
                                    </Flex>
                                </Box>
                            )
                        })}
                    </VStack>
                </Box>
                <Box pt={2} w="100%">
                    <Button type="button" width="full" onClick={onSubmit}>
                        {formatMessage(submitButtonLabel)}
                    </Button>
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
