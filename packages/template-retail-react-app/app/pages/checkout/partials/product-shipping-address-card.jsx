/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {
    Box,
    Flex,
    VStack,
    HStack,
    Select,
    Button,
    Image,
    Text,
    List,
    ListItem,
    Alert,
    AlertIcon,
    AlertDescription,
    Stack
} from '@salesforce/retail-react-app/app/components/shared/ui'
import LoadingSpinner from '@salesforce/retail-react-app/app/components/loading-spinner'
import {useIntl, defineMessage} from 'react-intl'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks'
import {getPriceData} from '@salesforce/retail-react-app/app/utils/product-utils'
import ItemVariantProvider from '@salesforce/retail-react-app/app/components/item-variant'
import DisplayPrice from '@salesforce/retail-react-app/app/components/display-price'
import AddressFields from '@salesforce/retail-react-app/app/components/forms/address-fields'
import FormActionButtons from '@salesforce/retail-react-app/app/components/forms/form-action-buttons'

const MultiShippingItemAttributes = ({variant, includeQuantity = true}) => {
    const {formatMessage} = useIntl()
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

const AddressForm = ({item, form, onSubmit, onCancel}) => {
    const saveButtonLabel = defineMessage({
        defaultMessage: 'Save',
        id: 'shipping_address_form.button.save'
    })
    return (
        <Box position="relative" bg="white" padding={6} width="100%">
            {form.formState.isSubmitting && <LoadingSpinner />}
            <form
                data-testid="address-form"
                onSubmit={form.handleSubmit(async (data) => {
                    await onSubmit(data, form, item.itemId)
                })}
            >
                <Stack spacing={6} width="100%">
                    {form.formState.errors?.global && (
                        <Alert status="error">
                            <AlertIcon color="red.600" boxSize={4} />
                            <AlertDescription>
                                {form.formState.errors.global.message}
                            </AlertDescription>
                        </Alert>
                    )}
                    <AddressFields form={form} />
                    <FormActionButtons onCancel={onCancel} saveButtonLabel={saveButtonLabel} />
                </Stack>
            </form>
        </Box>
    )
}

AddressForm.propTypes = {
    item: PropTypes.object.isRequired,
    form: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
}

/**
 * Component for selecting address for a single product item
 */
const ProductShippingAddressCard = ({
    item,
    variant,
    imageUrl,
    addressKey,
    selectedAddressId,
    availableAddresses,
    isGuestUser,
    customerLoading,
    onAddressSelect,
    onAddNewAddress,
    showAddAddressForm,
    addressForm,
    handleCreateAddress,
    closeForm
}) => {
    const {formatMessage} = useIntl()
    const {currency} = useCurrency()

    return (
        <Box
            key={addressKey}
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            p={2}
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
                                        defaultMessage: 'Product image for {productName}'
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
                    flex={{base: 'none', md: '1'}}
                    minW={{base: '100%', md: '280px'}}
                    maxW={{base: '100%', md: '400px'}}
                    pt={0}
                    spacing={1}
                    mt={{base: 4, md: 0}}
                >
                    <Text
                        id={`delivery-address-label-${addressKey}`}
                        data-testid={`delivery-address-label-${addressKey}`}
                        fontWeight="medium"
                        fontSize="sm"
                        mb={1}
                    >
                        {formatMessage({
                            defaultMessage: 'Delivery Address',
                            id: 'shipping_address.label.shipping_address'
                        })}
                    </Text>

                    <Box w="100%" mb={6}>
                        <VStack spacing={3} align="stretch">
                            {!isGuestUser && customerLoading ? (
                                <Box p={4} textAlign="center">
                                    <Text color="gray.500">
                                        {formatMessage({
                                            id: 'shipping_multi_address.loading_addresses',
                                            defaultMessage: 'Loading addresses...'
                                        })}
                                    </Text>
                                </Box>
                            ) : (
                                <Select
                                    value={selectedAddressId || ''}
                                    onChange={(e) => {
                                        const value = e.target.value
                                        closeForm(addressKey)
                                        onAddressSelect(addressKey, value)
                                    }}
                                    disabled={
                                        availableAddresses.length === 0 ||
                                        (!isGuestUser && customerLoading)
                                    }
                                    aria-labelledby={`delivery-address-label-${addressKey}`}
                                    borderColor="gray.300"
                                    _hover={{borderColor: 'gray.400'}}
                                    _focus={{
                                        borderColor: 'blue.500',
                                        boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                                    }}
                                    data-testid={`address-dropdown-${addressKey}`}
                                >
                                    {availableAddresses.length === 0 ? (
                                        <option value="">
                                            {formatMessage({
                                                id: 'shipping_multi_address.no_addresses_available',
                                                defaultMessage: 'No address available'
                                            })}
                                        </option>
                                    ) : (
                                        availableAddresses.map((addr) => (
                                            <option
                                                key={addr.addressId}
                                                value={addr.addressId}
                                                data-testid={`address-option-${addr.addressId}`}
                                            >
                                                {addr.firstName} {addr.lastName} - {addr.address1},{' '}
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
                                        ))
                                    )}
                                </Select>
                            )}
                            <Button
                                variant="link"
                                size="sm"
                                onClick={() => {
                                    onAddNewAddress(addressKey)
                                }}
                                alignSelf="flex-start"
                                aria-label={formatMessage(
                                    {
                                        id: 'shipping_multi_address.add_new_address.aria_label',
                                        defaultMessage: 'Add new delivery address for {productName}'
                                    },
                                    {
                                        productName: item.productName
                                    }
                                )}
                            >
                                {formatMessage({
                                    defaultMessage: '+ Add New Address',
                                    id: 'shipping_address.button.add_new_address'
                                })}
                            </Button>
                        </VStack>
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

            {/* Add New Address Form - appears inside the product card */}
            {showAddAddressForm[addressKey] && (
                <Box position="relative" mt={4} width="100%">
                    <AddressForm
                        item={item}
                        form={addressForm}
                        onSubmit={(addressData, form, itemId) =>
                            handleCreateAddress(addressData, itemId)
                        }
                        onCancel={() => closeForm(addressKey)}
                    />
                </Box>
            )}
        </Box>
    )
}

ProductShippingAddressCard.displayName = 'ProductShippingAddressCard'

ProductShippingAddressCard.propTypes = {
    item: PropTypes.object.isRequired,
    variant: PropTypes.object.isRequired,
    imageUrl: PropTypes.string.isRequired,
    addressKey: PropTypes.string.isRequired,
    selectedAddressId: PropTypes.string,
    availableAddresses: PropTypes.array.isRequired,
    isGuestUser: PropTypes.bool.isRequired,
    customerLoading: PropTypes.bool.isRequired,
    onAddressSelect: PropTypes.func.isRequired,
    onAddNewAddress: PropTypes.func.isRequired,
    showAddAddressForm: PropTypes.object.isRequired,
    addressForm: PropTypes.object.isRequired,
    handleCreateAddress: PropTypes.func.isRequired,
    closeForm: PropTypes.func.isRequired
}

export default ProductShippingAddressCard
