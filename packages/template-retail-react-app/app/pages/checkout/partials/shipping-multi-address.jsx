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
    ListItem,
    VisuallyHidden
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useIntl} from 'react-intl'
import PropTypes from 'prop-types'

const MultiShippingItemAttributes = ({variant, includeQuantity = true}) => {
    // Get display values for attributes
    const variationAttributes = variant?.variationAttributes || []
    const variationValues = variant?.variationValues || {}
    return (
        <Stack spacing={1.5} flex={1} role="list" aria-label="Product attributes">
            {variationAttributes &&
                variationAttributes.length > 0 &&
                variationAttributes.map((attr) => {
                    const value = attr.values?.find((v) => v.value === variationValues[attr.id])
                    return (
                        <Text
                            lineHeight={1}
                            color="gray.700"
                            fontSize="sm"
                            key={attr.id}
                            role="listitem"
                        >
                            {attr.name || attr.id}: {value?.name || value?.value || ''}
                        </Text>
                    )
                })}
            {includeQuantity && (
                <Text lineHeight={1} color="gray.700" fontSize="sm" role="listitem">
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
    const [openDropdown, setOpenDropdown] = useState(null)
    const dropdownRefs = useRef({})
    const [focusedIndex, setFocusedIndex] = useState(-1)

    useEffect(() => {
        function handleClickOutside(event) {
            if (openDropdown !== null) {
                const ref = dropdownRefs.current[openDropdown]
                if (ref && !ref.contains(event.target)) {
                    setOpenDropdown(null)
                    setFocusedIndex(-1)
                }
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [openDropdown])

    // Reset focused index when dropdown closes
    useEffect(() => {
        if (openDropdown === null) {
            setFocusedIndex(-1)
        }
    }, [openDropdown])

    // Early return after hooks
    if (!basket?.productItems?.length) {
        return (
            <Box
                p={8}
                textAlign="center"
                color="gray.500"
                role="status"
                aria-live="polite"
                aria-label={formatMessage({
                    id: 'shipping_multi_address.empty.label',
                    defaultMessage: 'No items in basket'
                })}
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

    // Handler for Add New Address (placeholder)
    const onAddNewAddress = () => {
        // TODO: Implement add new address logic/modal
        alert('Add New Address clicked!')
    }

    // Keyboard navigation handler
    const handleDropdownKeyDown = (e, addressKey, isMobile = false) => {
        const dropdownKey = isMobile ? addressKey + '-mobile' : addressKey
        const isOpen = openDropdown === dropdownKey
        const totalOptions = addresses.length + 1 // +1 for "Add New Address"

        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault()
                setOpenDropdown(dropdownKey)
                setFocusedIndex(0)
            }
        } else {
            switch (e.key) {
                case 'Escape':
                    e.preventDefault()
                    setOpenDropdown(null)
                    setFocusedIndex(-1)
                    break
                case 'ArrowDown':
                    e.preventDefault()
                    setFocusedIndex((prev) => (prev + 1) % totalOptions)
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    setFocusedIndex((prev) => (prev - 1 + totalOptions) % totalOptions)
                    break
                case 'Enter':
                case ' ':
                    e.preventDefault()
                    if (focusedIndex === addresses.length) {
                        // "Add New Address" option
                        setOpenDropdown(null)
                        setFocusedIndex(-1)
                        onAddNewAddress()
                    } else if (focusedIndex >= 0 && focusedIndex < addresses.length) {
                        // Address option
                        setSelectedAddresses((prev) => ({
                            ...prev,
                            [addressKey]: addresses[focusedIndex].addressId
                        }))
                        setOpenDropdown(null)
                        setFocusedIndex(-1)
                    }
                    break
                case 'Tab':
                    setOpenDropdown(null)
                    setFocusedIndex(-1)
                    break
            }
        }
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
                            const mobileAddressKey = addressKey + '-mobile'
                            const selectedAddressId =
                                selectedAddresses[addressKey] || addresses[0]?.addressId
                            const selectedAddress =
                                addresses.find((a) => a.addressId === selectedAddressId) ||
                                addresses[0]

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
                                                    w={{base: '60px', md: '90px'}}
                                                    h={{base: '80px', md: '120px'}}
                                                    objectFit="cover"
                                                    borderRadius="md"
                                                    bg="gray.100"
                                                    flexShrink={0}
                                                />
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
                                            <Box
                                                ref={(el) =>
                                                    (dropdownRefs.current[addressKey] = el)
                                                }
                                                position="relative"
                                                w="100%"
                                                mb={6}
                                                overflow="visible"
                                            >
                                                <Box position="relative">
                                                    <Box
                                                        role="combobox"
                                                        aria-expanded={openDropdown === addressKey}
                                                        aria-haspopup="listbox"
                                                        aria-labelledby={`delivery-address-label-${addressKey}`}
                                                        tabIndex={0}
                                                        border="1px solid"
                                                        borderColor="gray.300"
                                                        borderRadius="md"
                                                        p={2}
                                                        fontSize="md"
                                                        bg="white"
                                                        cursor="pointer"
                                                        w="100%"
                                                        display="flex"
                                                        alignItems="center"
                                                        justifyContent="space-between"
                                                        fontWeight="normal"
                                                        _hover={{bg: 'gray.50'}}
                                                        _focus={{
                                                            outline: '2px solid',
                                                            outlineColor: 'blue.500',
                                                            outlineOffset: '2px'
                                                        }}
                                                        onClick={() =>
                                                            setOpenDropdown(
                                                                openDropdown === addressKey
                                                                    ? null
                                                                    : addressKey
                                                            )
                                                        }
                                                        onKeyDown={(e) =>
                                                            handleDropdownKeyDown(e, addressKey)
                                                        }
                                                    >
                                                        <HStack
                                                            align="center"
                                                            spacing={2}
                                                            flex={1}
                                                            minW={0}
                                                            maxW="100%"
                                                            overflow="hidden"
                                                        >
                                                            <Text
                                                                fontWeight="bold"
                                                                fontSize={{base: 'sm', md: 'md'}}
                                                                whiteSpace="nowrap"
                                                                flexShrink={0}
                                                            >
                                                                {selectedAddress?.firstName}{' '}
                                                                {selectedAddress?.lastName}
                                                            </Text>
                                                            <Text flexShrink={0}>-</Text>
                                                            <Box flex={1} minW={0}>
                                                                <Text
                                                                    fontWeight="normal"
                                                                    fontSize={{
                                                                        base: 'xs',
                                                                        md: 'sm'
                                                                    }}
                                                                    color="gray.600"
                                                                    overflow="hidden"
                                                                    textOverflow="ellipsis"
                                                                    whiteSpace="nowrap"
                                                                    w="100%"
                                                                >
                                                                    {selectedAddress.address1},{' '}
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
                                                            </Box>
                                                        </HStack>
                                                        <Text
                                                            ml={2}
                                                            fontSize="lg"
                                                            color="gray.500"
                                                            aria-hidden="true"
                                                        >
                                                            ▼
                                                        </Text>
                                                    </Box>

                                                    {/* Custom Dropdown */}
                                                    {openDropdown === addressKey && (
                                                        <Box
                                                            role="listbox"
                                                            aria-label={formatMessage({
                                                                id: 'shipping_multi_address.dropdown.label',
                                                                defaultMessage:
                                                                    'Delivery address options'
                                                            })}
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
                                                                        role="option"
                                                                        aria-selected={
                                                                            addr.addressId ===
                                                                            selectedAddressId
                                                                        }
                                                                        aria-describedby={`address-${addr.addressId}-description-mobile`}
                                                                        tabIndex={
                                                                            focusedIndex === index
                                                                                ? 0
                                                                                : -1
                                                                        }
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
                                                                            index <
                                                                            addresses.length - 1
                                                                                ? '1px solid'
                                                                                : 'none'
                                                                        }
                                                                        borderColor="gray.100"
                                                                        _hover={{bg: 'gray.50'}}
                                                                        _focus={{
                                                                            outline: '2px solid',
                                                                            outlineColor:
                                                                                'blue.500',
                                                                            outlineOffset: '2px',
                                                                            bg: 'gray.50'
                                                                        }}
                                                                        onClick={() => {
                                                                            setSelectedAddresses(
                                                                                (prev) => ({
                                                                                    ...prev,
                                                                                    [addressKey]:
                                                                                        addr.addressId
                                                                                })
                                                                            )
                                                                            setOpenDropdown(null)
                                                                            setFocusedIndex(-1)
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
                                                                                setOpenDropdown(
                                                                                    null
                                                                                )
                                                                                setFocusedIndex(-1)
                                                                            }
                                                                        }}
                                                                    >
                                                                        <VStack
                                                                            align="flex-start"
                                                                            spacing={1}
                                                                            w="100%"
                                                                        >
                                                                            <VisuallyHidden
                                                                                id={`address-${addr.addressId}-description-mobile`}
                                                                            >
                                                                                {formatMessage(
                                                                                    {
                                                                                        id: 'shipping_multi_address.address.description',
                                                                                        defaultMessage:
                                                                                            'Address for {firstName} {lastName}'
                                                                                    },
                                                                                    {
                                                                                        firstName:
                                                                                            addr.firstName,
                                                                                        lastName:
                                                                                            addr.lastName
                                                                                    }
                                                                                )}
                                                                            </VisuallyHidden>
                                                                            <VisuallyHidden
                                                                                id={`address-${addr.addressId}-description`}
                                                                            >
                                                                                {formatMessage(
                                                                                    {
                                                                                        id: 'shipping_multi_address.address.description',
                                                                                        defaultMessage:
                                                                                            'Address for {firstName} {lastName}'
                                                                                    },
                                                                                    {
                                                                                        firstName:
                                                                                            addr.firstName,
                                                                                        lastName:
                                                                                            addr.lastName
                                                                                    }
                                                                                )}
                                                                            </VisuallyHidden>
                                                                            <Text
                                                                                fontWeight="bold"
                                                                                fontSize={{
                                                                                    base: 'sm',
                                                                                    md: 'md'
                                                                                }}
                                                                            >
                                                                                {addr.firstName}{' '}
                                                                                {addr.lastName}
                                                                            </Text>
                                                                            <Text
                                                                                fontWeight="normal"
                                                                                color="gray.600"
                                                                                fontSize={{
                                                                                    base: 'xs',
                                                                                    md: 'sm'
                                                                                }}
                                                                                wordBreak="break-word"
                                                                            >
                                                                                {addr.address1},{' '}
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
                                                                    role="option"
                                                                    aria-describedby="add-new-address-description"
                                                                    tabIndex={
                                                                        focusedIndex ===
                                                                        addresses.length
                                                                            ? 0
                                                                            : -1
                                                                    }
                                                                    p={3}
                                                                    cursor="pointer"
                                                                    fontSize="md"
                                                                    color="blue.600"
                                                                    borderTop="1px solid"
                                                                    borderColor="gray.200"
                                                                    _hover={{bg: 'blue.50'}}
                                                                    _focus={{
                                                                        outline: '2px solid',
                                                                        outlineColor: 'blue.500',
                                                                        outlineOffset: '2px',
                                                                        bg: 'blue.50'
                                                                    }}
                                                                    onClick={() => {
                                                                        setOpenDropdown(null)
                                                                        setFocusedIndex(-1)
                                                                        onAddNewAddress()
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (
                                                                            e.key === 'Enter' ||
                                                                            e.key === ' '
                                                                        ) {
                                                                            setOpenDropdown(null)
                                                                            setFocusedIndex(-1)
                                                                            onAddNewAddress()
                                                                        }
                                                                    }}
                                                                >
                                                                    <VisuallyHidden id="add-new-address-description">
                                                                        {formatMessage({
                                                                            id: 'shipping_multi_address.add_new.description',
                                                                            defaultMessage:
                                                                                'Add a new delivery address'
                                                                        })}
                                                                    </VisuallyHidden>
                                                                    <VisuallyHidden id="add-new-address-description-mobile">
                                                                        {formatMessage({
                                                                            id: 'shipping_multi_address.add_new.description',
                                                                            defaultMessage:
                                                                                'Add a new delivery address'
                                                                        })}
                                                                    </VisuallyHidden>
                                                                    <HStack spacing={2}>
                                                                        <Text
                                                                            fontWeight="bold"
                                                                            fontSize="lg"
                                                                            aria-hidden="true"
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
                                        minH={openDropdown === mobileAddressKey ? '300px' : 'auto'}
                                        role="group"
                                        aria-labelledby={`delivery-address-label-${mobileAddressKey}`}
                                    >
                                        <Text
                                            id={`delivery-address-label-${mobileAddressKey}`}
                                            fontWeight="medium"
                                            fontSize="sm"
                                            mb={2}
                                        >
                                            {formatMessage(deliveryAddressLabel)}
                                        </Text>

                                        {/* Address Dropdown */}
                                        <Box
                                            ref={(el) =>
                                                (dropdownRefs.current[mobileAddressKey] = el)
                                            }
                                            position="relative"
                                            w="100%"
                                            mb={6}
                                            overflow="visible"
                                            minW={0}
                                            maxW="100%"
                                        >
                                            <Box
                                                position="relative"
                                                w="100%"
                                                minW={0}
                                                maxW="100%"
                                                overflow="visible"
                                            >
                                                <Box
                                                    role="combobox"
                                                    aria-expanded={
                                                        openDropdown === mobileAddressKey
                                                    }
                                                    aria-haspopup="listbox"
                                                    aria-labelledby={`delivery-address-label-${mobileAddressKey}`}
                                                    tabIndex={0}
                                                    border="1px solid"
                                                    borderColor="gray.300"
                                                    borderRadius="md"
                                                    p={2}
                                                    fontSize="md"
                                                    bg="white"
                                                    cursor="pointer"
                                                    w="100%"
                                                    display="flex"
                                                    alignItems="center"
                                                    justifyContent="space-between"
                                                    fontWeight="normal"
                                                    _hover={{bg: 'gray.50'}}
                                                    _focus={{
                                                        outline: '2px solid',
                                                        outlineColor: 'blue.500',
                                                        outlineOffset: '2px'
                                                    }}
                                                    onClick={() =>
                                                        setOpenDropdown(
                                                            openDropdown === mobileAddressKey
                                                                ? null
                                                                : mobileAddressKey
                                                        )
                                                    }
                                                    onKeyDown={(e) =>
                                                        handleDropdownKeyDown(e, addressKey, true)
                                                    }
                                                    overflow="hidden"
                                                    minW={0}
                                                    maxW="100%"
                                                >
                                                    <HStack
                                                        align="center"
                                                        spacing={2}
                                                        flex={1}
                                                        minW={0}
                                                        maxW="100%"
                                                        overflow="hidden"
                                                    >
                                                        <Text
                                                            fontWeight="bold"
                                                            fontSize={{base: 'sm', md: 'md'}}
                                                            whiteSpace="nowrap"
                                                            flexShrink={0}
                                                        >
                                                            {selectedAddress?.firstName}{' '}
                                                            {selectedAddress?.lastName}
                                                        </Text>
                                                        <Text flexShrink={0}>-</Text>
                                                        <Box
                                                            flex={1}
                                                            minW={0}
                                                            maxW={{
                                                                base: '100px',
                                                                sm: '120px',
                                                                md: '150px'
                                                            }}
                                                        >
                                                            <Text
                                                                fontWeight="normal"
                                                                fontSize={{base: 'xs', md: 'sm'}}
                                                                color="gray.600"
                                                                overflow="hidden"
                                                                textOverflow="ellipsis"
                                                                whiteSpace="nowrap"
                                                                w="100%"
                                                            >
                                                                {selectedAddress.address1},{' '}
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
                                                        </Box>
                                                    </HStack>
                                                    <Text
                                                        ml={2}
                                                        fontSize="lg"
                                                        color="gray.500"
                                                        flexShrink={0}
                                                        aria-hidden="true"
                                                    >
                                                        ▼
                                                    </Text>
                                                </Box>

                                                {/* Custom Dropdown */}
                                                {openDropdown === mobileAddressKey && (
                                                    <Box
                                                        role="listbox"
                                                        aria-label={formatMessage({
                                                            id: 'shipping_multi_address.dropdown.label',
                                                            defaultMessage:
                                                                'Delivery address options'
                                                        })}
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
                                                        maxH="200px"
                                                        w="100%"
                                                    >
                                                        <List
                                                            spacing={0}
                                                            overflowY="auto"
                                                            maxH="200px"
                                                            w="100%"
                                                        >
                                                            {addresses.map((addr, index) => (
                                                                <ListItem
                                                                    key={addr.addressId}
                                                                    role="option"
                                                                    aria-selected={
                                                                        addr.addressId ===
                                                                        selectedAddressId
                                                                    }
                                                                    aria-describedby={`address-${addr.addressId}-description`}
                                                                    tabIndex={
                                                                        focusedIndex === index
                                                                            ? 0
                                                                            : -1
                                                                    }
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
                                                                    _focus={{
                                                                        outline: '2px solid',
                                                                        outlineColor: 'blue.500',
                                                                        outlineOffset: '2px',
                                                                        bg: 'gray.50'
                                                                    }}
                                                                    onClick={() => {
                                                                        setSelectedAddresses(
                                                                            (prev) => ({
                                                                                ...prev,
                                                                                [addressKey]:
                                                                                    addr.addressId
                                                                            })
                                                                        )
                                                                        setOpenDropdown(null)
                                                                        setFocusedIndex(-1)
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
                                                                            setFocusedIndex(-1)
                                                                        }
                                                                    }}
                                                                >
                                                                    <VStack
                                                                        align="flex-start"
                                                                        spacing={1}
                                                                        w="100%"
                                                                    >
                                                                        <Text
                                                                            fontWeight="bold"
                                                                            fontSize={{
                                                                                base: 'sm',
                                                                                md: 'md'
                                                                            }}
                                                                        >
                                                                            {addr.firstName}{' '}
                                                                            {addr.lastName}
                                                                        </Text>
                                                                        <Text
                                                                            fontWeight="normal"
                                                                            color="gray.600"
                                                                            fontSize={{
                                                                                base: 'xs',
                                                                                md: 'sm'
                                                                            }}
                                                                            wordBreak="break-word"
                                                                        >
                                                                            {addr.address1},{' '}
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
                                                                role="option"
                                                                aria-describedby="add-new-address-description-mobile"
                                                                tabIndex={
                                                                    focusedIndex ===
                                                                    addresses.length
                                                                        ? 0
                                                                        : -1
                                                                }
                                                                p={3}
                                                                cursor="pointer"
                                                                fontSize="md"
                                                                color="blue.600"
                                                                borderTop="1px solid"
                                                                borderColor="gray.200"
                                                                _hover={{bg: 'blue.50'}}
                                                                _focus={{
                                                                    outline: '2px solid',
                                                                    outlineColor: 'blue.500',
                                                                    outlineOffset: '2px',
                                                                    bg: 'blue.50'
                                                                }}
                                                                onClick={() => {
                                                                    setOpenDropdown(null)
                                                                    setFocusedIndex(-1)
                                                                    onAddNewAddress()
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (
                                                                        e.key === 'Enter' ||
                                                                        e.key === ' '
                                                                    ) {
                                                                        setOpenDropdown(null)
                                                                        setFocusedIndex(-1)
                                                                        onAddNewAddress()
                                                                    }
                                                                }}
                                                            >
                                                                <HStack spacing={2}>
                                                                    <Text
                                                                        fontWeight="bold"
                                                                        fontSize="lg"
                                                                        aria-hidden="true"
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
