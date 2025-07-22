/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useRef, useEffect} from 'react'
import {useIntl} from 'react-intl'
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
    VisuallyHidden,
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

// Separate component for address form to properly use hooks
const AddressFormComponent = ({item, index, onSubmit, onCancel}) => {
    const form = useForm({
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
                    <FormActionButtons
                        onCancel={onCancel}
                        saveButtonLabel={{
                            defaultMessage: 'Save',
                            id: 'shipping_address_form.button.save'
                        }}
                    />
                </Stack>
            </form>
        </Box>
    )
}

AddressFormComponent.propTypes = {
    item: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
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
    const [focusedIndex, setFocusedIndex] = useState(-1)

    // Add address form state - track which product card is showing the add address form
    const [showAddAddressForm, setShowAddAddressForm] = useState({}) // productId-index -> boolean
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formErrors, setFormErrors] = useState({}) // Track form-specific errors

    const createCustomerAddress = useShopperCustomersMutation('createCustomerAddress')
    const showToast = useToast()

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

    // Focus the element at the current focused index
    useEffect(() => {
        if (focusedIndex >= 0 && openDropdown) {
            const dropdownKey = openDropdown.endsWith('-mobile') ? openDropdown : openDropdown
            const isMobile = dropdownKey.endsWith('-mobile')
            const baseKey = isMobile ? dropdownKey.replace('-mobile', '') : dropdownKey

            // Find the element to focus
            let elementToFocus = null
            if (focusedIndex < addresses.length) {
                // Focus an address item
                const addressId = addresses[focusedIndex]?.addressId
                if (addressId) {
                    elementToFocus = document.querySelector(`[data-address-id="${addressId}"]`)
                }
            } else {
                // Focus the "Add New Address" item
                elementToFocus = document.querySelector(`[data-add-new-address="${baseKey}"]`)
            }

            if (elementToFocus) {
                elementToFocus.focus()
            }
        }
    }, [focusedIndex, openDropdown, addresses])

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
        const addressKey = itemId || `${productId}-${index}`

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

            // Clear any previous errors for this form
            setFormErrors((prev) => ({...prev, [addressKey]: null}))

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
            console.error('Error creating address:', error)
            setFormErrors((prev) => ({
                ...prev,
                [addressKey]: formatMessage({
                    id: 'shipping_multi_address.error.save_failed',
                    defaultMessage: 'Failed to save address. Please try again.'
                })
            }))

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
                            const addressKey = item.itemId || `${item.productId}-${index}`
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
                                                            ? 'add-new-address'
                                                            : selectedAddressId || ''
                                                    }
                                                    onChange={(e) => {
                                                        const value = e.target.value
                                                        const key =
                                                            item.itemId ||
                                                            `${item.productId}-${index}`

                                                        if (value === 'add-new-address') {
                                                            // Show the address form when "Add New Address" is selected
                                                            setShowAddAddressForm((prev) => ({
                                                                ...prev,
                                                                [key]: true
                                                            }))
                                                            // Don't set a selected address since we're adding a new one
                                                        } else {
                                                            // Hide the address form when a real address is selected
                                                            setShowAddAddressForm((prev) => ({
                                                                ...prev,
                                                                [key]: false
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
                                                    <option value="add-new-address">
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
                                            {/* Error display */}
                                            {formErrors[addressKey] && (
                                                <Alert status="error" mb={4}>
                                                    <AlertIcon />
                                                    <Box>
                                                        <AlertTitle>
                                                            {formatMessage({
                                                                id: 'shipping_multi_address.error.title',
                                                                defaultMessage: 'Error'
                                                            })}
                                                        </AlertTitle>
                                                        <AlertDescription>
                                                            {formErrors[addressKey]}
                                                        </AlertDescription>
                                                    </Box>
                                                </Alert>
                                            )}

                                            <AddressFormComponent
                                                item={item}
                                                index={index}
                                                onSubmit={handleCreateAddress}
                                                onCancel={() => {
                                                    setShowAddAddressForm((prev) => ({
                                                        ...prev,
                                                        [addressKey]: false
                                                    }))
                                                    setFormErrors((prev) => ({
                                                        ...prev,
                                                        [addressKey]: null
                                                    }))
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
                            isLoading={isSubmitting}
                            loadingText={formatMessage({
                                id: 'shipping_multi_address.submit.loading',
                                defaultMessage: 'Saving address...'
                            })}
                            onClick={async () => {
                                setIsSubmitting(true)

                                try {
                                    // Check if there are any open address forms that need to be saved
                                    const openForms = Object.keys(showAddAddressForm).filter(
                                        (key) => showAddAddressForm[key]
                                    )

                                    if (openForms.length > 0) {
                                        showToast({
                                            title: formatMessage({
                                                id: 'shipping_multi_address.error.forms_open',
                                                defaultMessage:
                                                    'Please save or cancel all address forms before continuing'
                                            }),
                                            status: 'warning'
                                        })
                                        setIsSubmitting(false)
                                        return
                                    }

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
                                } finally {
                                    setIsSubmitting(false)
                                }
                            }}
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
