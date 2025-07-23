/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useRef, useEffect} from 'react'
import {useIntl, defineMessage} from 'react-intl'
import PropTypes from 'prop-types'
import {useForm} from 'react-hook-form'
import {nanoid} from 'nanoid'

import {useProducts, useShopperCustomersMutation} from '@salesforce/commerce-sdk-react'
import {findImageGroupBy} from '@salesforce/retail-react-app/app/utils/image-groups-utils'
import {getPriceData} from '@salesforce/retail-react-app/app/utils/product-utils'
import DisplayPrice from '@salesforce/retail-react-app/app/components/display-price'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks'
import ItemVariantProvider from '@salesforce/retail-react-app/app/components/item-variant'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {ADD_NEW_ADDRESS_OPTION} from '@salesforce/retail-react-app/app/constants'

import AddressFields from '@salesforce/retail-react-app/app/components/forms/address-fields'
import FormActionButtons from '@salesforce/retail-react-app/app/components/forms/form-action-buttons'
import LoadingSpinner from '@salesforce/retail-react-app/app/components/loading-spinner'
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
    Spinner,
    Container,
    Stack
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

// Address form component - receives form as prop from parent
const AddressForm = ({item, index, form, onSubmit, onCancel}) => {
    const saveButtonLabel = defineMessage({
        defaultMessage: 'Save',
        id: 'shipping_address_form.button.save'
    })
    return (
        <Box position="relative" bg="white" padding={6} width="100%">
            {form.formState.isSubmitting && <LoadingSpinner />}
            <form
                onSubmit={form.handleSubmit(async (data) => {
                    await onSubmit(data, item.productId, index, form, item.itemId)
                })}
            >
                <Stack spacing={6} width="100%">
                    {form.formState.errors?.global && (
                        <Alert status="error">
                            <AlertIcon color="red.600" boxSize={4} />
                            <Text fontSize="sm" ml={3}>
                                {form.formState.errors.global.message}
                            </Text>
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
    index: PropTypes.number.isRequired,
    form: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
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
    const {data: customer, refetch: refetchCustomer} = useCurrentCustomer()
    const addresses = customer?.addresses || []
    const [selectedAddresses, setSelectedAddresses] = useState({})
    const [openDropdown, setOpenDropdown] = useState(null)
    const dropdownRefs = useRef({})

    // Add address form state - track which product card is showing the add address form
    const [showAddAddressForm, setShowAddAddressForm] = useState({}) // productId-index -> boolean

    // Create form instance for address form
    const addressForm = useForm({
        mode: 'onSubmit',
        defaultValues: {
            firstName: '',
            lastName: '',
            phone: '',
            countryCode: 'US',
            address1: '',
            city: '',
            stateCode: '',
            postalCode: '',
            preferred: false
        }
    })

    const createCustomerAddress = useShopperCustomersMutation('createCustomerAddress')
    const showToast = useToast()

    // Calculate if button should be disabled
    const openForms = Object.keys(showAddAddressForm).filter((key) => showAddAddressForm[key])

    // Button is disabled when any address form is open
    const isButtonDisabled = openForms.length > 0

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

    // Handle address creation
    const handleCreateAddress = async (addressData, productId, index, form, itemId) => {
        // itemId is unique for each basket item and always present
        const addressKey = itemId

        try {
            const newAddress = {
                ...addressData,
                addressId: nanoid()
            }

            // Create the address and wait for the mutation to complete
            const createdAddress = await createCustomerAddress.mutateAsync({
                body: newAddress,
                parameters: {customerId: customer.customerId}
            })

            // Close form and reset
            setShowAddAddressForm((prev) => ({...prev, [addressKey]: false}))
            form.reset()

            // Clear form errors using react-hook-form
            form.clearErrors()

            // Refetch customer data to get the updated addresses list
            await refetchCustomer()

            // Automatically select the newly created address for this product card
            setSelectedAddresses((prev) => ({
                ...prev,
                [addressKey]: createdAddress.addressId
            }))

            showToast({
                title: formatMessage({
                    id: 'shipping_multi_address.success.address_saved',
                    defaultMessage: 'Address saved successfully'
                }),
                status: 'success'
            })
        } catch (error) {
            showToast({
                title: formatMessage({
                    id: 'shipping_multi_address.error.save_failed',
                    defaultMessage: 'Failed to save address'
                }),
                status: 'error'
            })
        }
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
                        {basket.productItems.map((item, index) => {
                            const productDetail = productsMap?.[item.productId] || {}
                            const variant = {...item, ...productDetail}
                            const image = findImageGroupBy(productDetail.imageGroups, {
                                viewType: 'small',
                                selectedVariationAttributes: variant.variationValues
                            })?.images?.[0]
                            const imageUrl = image?.disBaseLink || image?.link || ''
                            // itemId is unique for each basket item and always present
                            const addressKey = item.itemId
                            const selectedAddressId =
                                selectedAddresses[addressKey] ||
                                (addresses.length > 0 ? addresses[0]?.addressId : '')

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
                                                    value={
                                                        showAddAddressForm[addressKey]
                                                            ? ADD_NEW_ADDRESS_OPTION
                                                            : selectedAddressId || ''
                                                    }
                                                    onChange={(e) => {
                                                        const value = e.target.value

                                                        if (value === ADD_NEW_ADDRESS_OPTION) {
                                                            // Show the address form when "Add New Address" is selected
                                                            setShowAddAddressForm((prev) => ({
                                                                ...prev,
                                                                [addressKey]: true
                                                            }))
                                                            // Don't set a selected address since we're adding a new one
                                                        } else {
                                                            // Hide the address form when a real address is selected
                                                            setShowAddAddressForm((prev) => ({
                                                                ...prev,
                                                                [addressKey]: false
                                                            }))
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
                                                    <option value={ADD_NEW_ADDRESS_OPTION}>
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

                                    {/* Add New Address Form - appears inside the product card */}
                                    {showAddAddressForm[addressKey] && (
                                        <Box position="relative" mt={4} width="100%">
                                            <AddressForm
                                                item={item}
                                                index={index}
                                                form={addressForm}
                                                onSubmit={handleCreateAddress}
                                                onCancel={() => {
                                                    setShowAddAddressForm((prev) => ({
                                                        ...prev,
                                                        [addressKey]: false
                                                    }))
                                                    // Clear form errors using react-hook-form
                                                    addressForm.clearErrors()
                                                }}
                                            />
                                        </Box>
                                    )}
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
                            isLoading={addressForm.formState.isSubmitting}
                            {...(isButtonDisabled && {disabled: true, 'data-disabled': true})}
                            data-testid="continue-to-shipping-button"
                            loadingText={formatMessage({
                                id: 'shipping_multi_address.submit.loading',
                                defaultMessage: 'Saving address...'
                            })}
                            aria-label={formatMessage({
                                id: 'shipping_multi_address.submit.description',
                                defaultMessage:
                                    'Continue to next step with selected delivery addresses'
                            })}
                            onClick={async () => {
                                // Prevent click if button is disabled
                                if (isButtonDisabled) {
                                    return
                                }

                                try {
                                    // Now proceed with the checkout
                                    onSubmit()
                                } catch (error) {
                                    console.error('Error during submission:', error)
                                    showToast({
                                        title: formatMessage({
                                            id: 'shipping_multi_address.error.submission_failed',
                                            defaultMessage: 'Failed to proceed with checkout'
                                        }),
                                        status: 'error'
                                    })
                                }
                            }}
                        >
                            {formatMessage(submitButtonLabel)}
                        </Button>
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
