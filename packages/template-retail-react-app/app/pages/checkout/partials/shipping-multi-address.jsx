/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useRef, useEffect} from 'react'
import {useProducts} from '@salesforce/commerce-sdk-react'
import {findImageGroupBy} from '@salesforce/retail-react-app/app/utils/image-groups-utils'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import ItemVariantProvider from '@salesforce/retail-react-app/app/components/item-variant'
import {
    Text,
    Stack,
    Button,
    Container,
    Box,
    Flex,
    VStack,
    HStack,
    Image,
    List,
    ListItem
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useIntl} from 'react-intl'
import PropTypes from 'prop-types'

const MultiShippingItemAttributes = ({variant, includeQuantity = true}) => {
    // Get display values for attributes
    const variationAttributes = variant?.variationAttributes || []
    const variationValues = variant?.variationValues || {}
    return (
        <Stack spacing={1.5} flex={1}>
            {variationAttributes &&
                variationAttributes.length > 0 &&
                variationAttributes.map((attr) => {
                    const value = attr.values?.find((v) => v.value === variationValues[attr.id])
                    return (
                        <Text lineHeight={1} color="gray.700" fontSize="sm" key={attr.id}>
                            {attr.name || attr.id}: {value?.name || value?.value || ''}
                        </Text>
                    )
                })}
            {includeQuantity && (
                <Text lineHeight={1} color="gray.700" fontSize="sm">
                    Quantity: {variant.quantity}
                </Text>
            )}
        </Stack>
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
    // Move all hooks to the top
    const productIds = basket?.productItems?.map((item) => item.productId).join(',')
    const {data: products} = useProducts(
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
    const [openDropdown, setOpenDropdown] = useState(null)
    const dropdownRefs = useRef({})

    useEffect(() => {
        function handleClickOutside(event) {
            if (openDropdown !== null) {
                const ref = dropdownRefs.current[openDropdown]
                if (ref && !ref.contains(event.target)) {
                    setOpenDropdown(null)
                }
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [openDropdown])

    // Early return after hooks
    if (!basket?.productItems?.length) {
        return (
            <Box p={8} textAlign="center" color="gray.500">
                {formatMessage(noItemsInBasketMessage)}
            </Box>
        )
    }

    // Handler for Add New Address (placeholder)
    const onAddNewAddress = () => {
        // TODO: Implement add new address logic/modal
        alert('Add New Address clicked!')
    }

    return (
        <VStack spacing={0}>
            <Box
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                bg="white"
                p={2}
                w="100%"
            >
                <VStack spacing={2}>
                    {basket.productItems.map((item, idx) => {
                        // Merge product details into item
                        const productDetail = productsMap[item.productId] || {}
                        const variant = {...item, ...productDetail}
                        // Use findImageGroupBy to get the image
                        const image = findImageGroupBy(productDetail.imageGroups, {
                            viewType: 'small',
                            selectedVariationAttributes: variant.variationValues
                        })?.images?.[0]
                        const imageUrl = image?.disBaseLink || image?.link || ''
                        const addressKey = item.productId + '-' + idx
                        const selectedAddressId =
                            selectedAddresses[addressKey] || addresses[0]?.addressId
                        const selectedAddress =
                            addresses.find((a) => a.addressId === selectedAddressId) || addresses[0]

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
                            >
                                <Flex
                                    direction={{base: 'column', md: 'row'}}
                                    align="flex-start"
                                    w="100%"
                                    gap={4}
                                >
                                    {/* Left: Image and info */}
                                    <Flex direction="row" align="flex-start" flex={1} minW={0}>
                                        <VStack align="center" minW="90px" mr={0} spacing={2}>
                                            <Image
                                                src={imageUrl}
                                                alt={item.productName}
                                                w="90px"
                                                h="120px"
                                                objectFit="cover"
                                                borderRadius="md"
                                                bg="gray.100"
                                            />
                                        </VStack>
                                        <ItemVariantProvider variant={variant}>
                                            <VStack justify="center" minW={0} ml={4} flex={1}>
                                                <Text
                                                    fontWeight="medium"
                                                    fontSize="md"
                                                    mb={1}
                                                    color="gray.900"
                                                >
                                                    {item.productName}
                                                </Text>
                                                <MultiShippingItemAttributes
                                                    variant={variant}
                                                    includeQuantity
                                                />
                                            </VStack>
                                        </ItemVariantProvider>
                                    </Flex>

                                    {/* Right: Address dropdown and price */}
                                    <VStack
                                        align="flex-start"
                                        minW={{base: '100%', md: '340px'}}
                                        ml={{base: 0, md: 8}}
                                        flexShrink={0}
                                        h="100%"
                                        w={{base: '100%', md: '340px'}}
                                        overflow="visible"
                                    >
                                        <Text fontWeight="medium" fontSize="sm" mb={2}>
                                            {formatMessage(deliveryAddressLabel)}
                                        </Text>

                                        {/* Address Dropdown */}
                                        <Box
                                            ref={(el) => (dropdownRefs.current[addressKey] = el)}
                                            position="relative"
                                            w="100%"
                                            mb={6}
                                            overflow="visible"
                                        >
                                            <Box position="relative">
                                                <Box
                                                    role="button"
                                                    tabIndex={0}
                                                    border="1px solid"
                                                    borderColor="gray.300"
                                                    borderRadius="md"
                                                    p={2}
                                                    fontSize="md"
                                                    bg="gray.50"
                                                    cursor="pointer"
                                                    w="100%"
                                                    display="flex"
                                                    alignItems="center"
                                                    justifyContent="space-between"
                                                    fontWeight="normal"
                                                    _hover={{bg: 'gray.100'}}
                                                    onClick={() =>
                                                        setOpenDropdown(
                                                            openDropdown === addressKey
                                                                ? null
                                                                : addressKey
                                                        )
                                                    }
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            setOpenDropdown(
                                                                openDropdown === addressKey
                                                                    ? null
                                                                    : addressKey
                                                            )
                                                        }
                                                    }}
                                                >
                                                    <HStack
                                                        flex={1}
                                                        minW={0}
                                                        maxW="100%"
                                                        spacing={1}
                                                    >
                                                        <Text fontWeight="bold" whiteSpace="nowrap">
                                                            {selectedAddress?.firstName}{' '}
                                                            {selectedAddress?.lastName}
                                                        </Text>
                                                        <Text>-</Text>
                                                        <Text
                                                            fontWeight="normal"
                                                            overflow="hidden"
                                                            textOverflow="ellipsis"
                                                            whiteSpace="nowrap"
                                                            flex={1}
                                                        >
                                                            {selectedAddress.address1}
                                                        </Text>
                                                        <Text
                                                            fontWeight="normal"
                                                            overflow="hidden"
                                                            textOverflow="ellipsis"
                                                            whiteSpace="nowrap"
                                                            flex={1}
                                                            fontSize="sm"
                                                            color="gray.600"
                                                        >
                                                            {formatMessage(
                                                                {
                                                                    id: 'shipping_multi_address.format.address_line_2',
                                                                    defaultMessage:
                                                                        '{city}, {stateCode} {postalCode}'
                                                                },
                                                                {
                                                                    city: selectedAddress.city,
                                                                    stateCode:
                                                                        selectedAddress.stateCode ||
                                                                        '',
                                                                    postalCode:
                                                                        selectedAddress.postalCode
                                                                }
                                                            )}
                                                        </Text>
                                                    </HStack>
                                                    <Text ml={2} fontSize="lg" color="gray.500">
                                                        ▼
                                                    </Text>
                                                </Box>

                                                {/* Custom Dropdown */}
                                                {openDropdown === addressKey && (
                                                    <Box
                                                        position="absolute"
                                                        top="100%"
                                                        left={0}
                                                        right={0}
                                                        zIndex={1000}
                                                        mt={0}
                                                        bg="white"
                                                        border="1px solid"
                                                        borderColor="gray.200"
                                                        borderRadius="md"
                                                        boxShadow="lg"
                                                        overflow="hidden"
                                                    >
                                                        <List spacing={0}>
                                                            {addresses.map((addr, index) => (
                                                                <ListItem
                                                                    key={addr.addressId}
                                                                    p={3}
                                                                    cursor="pointer"
                                                                    fontSize="md"
                                                                    bg={
                                                                        addr.addressId ===
                                                                        selectedAddressId
                                                                            ? 'blue.50'
                                                                            : 'white'
                                                                    }
                                                                    borderBottom={
                                                                        index < addresses.length - 1
                                                                            ? '1px solid'
                                                                            : 'none'
                                                                    }
                                                                    borderColor="gray.100"
                                                                    _hover={{bg: 'gray.50'}}
                                                                    onClick={() => {
                                                                        setSelectedAddresses(
                                                                            (prev) => ({
                                                                                ...prev,
                                                                                [addressKey]:
                                                                                    addr.addressId
                                                                            })
                                                                        )
                                                                        setOpenDropdown(null)
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (
                                                                            e.key === 'Enter' ||
                                                                            e.key === ' '
                                                                        ) {
                                                                            setSelectedAddresses(
                                                                                (prev) => ({
                                                                                    ...prev,
                                                                                    [addressKey]:
                                                                                        addr.addressId
                                                                                })
                                                                            )
                                                                            setOpenDropdown(null)
                                                                        }
                                                                    }}
                                                                >
                                                                    <VStack
                                                                        align="flex-start"
                                                                        spacing={1}
                                                                    >
                                                                        <Text fontWeight="bold">
                                                                            {addr.firstName}{' '}
                                                                            {addr.lastName}
                                                                        </Text>
                                                                        <Text
                                                                            fontWeight="normal"
                                                                            color="gray.600"
                                                                            fontSize="sm"
                                                                        >
                                                                            {addr.address1}
                                                                        </Text>
                                                                        <Text
                                                                            fontWeight="normal"
                                                                            color="gray.600"
                                                                            fontSize="sm"
                                                                        >
                                                                            {formatMessage(
                                                                                {
                                                                                    id: 'shipping_multi_address.format.address_line_2',
                                                                                    defaultMessage:
                                                                                        '{city}, {stateCode} {postalCode}'
                                                                                },
                                                                                {
                                                                                    city: addr.city,
                                                                                    stateCode:
                                                                                        addr.stateCode ||
                                                                                        '',
                                                                                    postalCode:
                                                                                        addr.postalCode
                                                                                }
                                                                            )}
                                                                        </Text>
                                                                    </VStack>
                                                                </ListItem>
                                                            ))}
                                                            {/* Add New Address option */}
                                                            <ListItem
                                                                p={3}
                                                                cursor="pointer"
                                                                fontSize="md"
                                                                color="blue.600"
                                                                borderTop="1px solid"
                                                                borderColor="gray.200"
                                                                _hover={{bg: 'blue.50'}}
                                                                onClick={() => {
                                                                    setOpenDropdown(null)
                                                                    onAddNewAddress()
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (
                                                                        e.key === 'Enter' ||
                                                                        e.key === ' '
                                                                    ) {
                                                                        setOpenDropdown(null)
                                                                        onAddNewAddress()
                                                                    }
                                                                }}
                                                            >
                                                                <HStack spacing={2}>
                                                                    <Text
                                                                        fontWeight="bold"
                                                                        fontSize="lg"
                                                                    >
                                                                        +
                                                                    </Text>
                                                                    <Text>
                                                                        {formatMessage(
                                                                            addNewAddressLabel
                                                                        )}
                                                                    </Text>
                                                                </HStack>
                                                            </ListItem>
                                                        </List>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>

                                        {/* Price */}
                                        <Box
                                            fontWeight="semibold"
                                            fontSize="md"
                                            color="gray.900"
                                            alignSelf="flex-end"
                                            mt="auto"
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
                                </Flex>
                            </Box>
                        )
                    })}
                </VStack>
            </Box>
            <Box pt={2} w="100%">
                <Container variant="form">
                    <Button type="button" width="full" onClick={onSubmit}>
                        {formatMessage(submitButtonLabel)}
                    </Button>
                </Container>
            </Box>
        </VStack>
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
