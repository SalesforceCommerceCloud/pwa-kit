/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useEffect} from 'react'
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
    Stack
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useMultiship} from '@salesforce/retail-react-app/app/hooks/use-multiship'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'

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
    form: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired
}

const ShippingMultiAddress = ({
    basket,
    submitButtonLabel,
    addNewAddressLabel,
    noItemsInBasketMessage,
    deliveryAddressLabel,
    onProceedSuccess
}) => {
    const {formatMessage} = useIntl()
    const {currency} = useCurrency()
    const {STEPS, goToStep} = useCheckout()
    const showToast = useToast()
    const {
        findDeliveryShipmentWithSameAddress,
        createNewDeliveryShipmentWithAddress,
        moveItemsToDeliveryShipment,
        removeEmptyShipments
    } = useMultiship(basket)
    


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
    const {
        data: customer,
        refetch: refetchCustomer,
        isLoading: customerLoading
    } = useCurrentCustomer()
    
    // Get addresses from customer profile for registered users, or use memory storage for guests
    const customerAddresses = customer?.addresses || []
    
    // Memory storage for guest user addresses - persist in sessionStorage
    const [guestAddresses, setGuestAddresses] = useState(() => {
        const saved = sessionStorage.getItem('pwa-kit-multiship-guest-addresses')
        return saved ? JSON.parse(saved) : []
    })
    
    // Persist guest addresses to sessionStorage whenever they change
    useEffect(() => {
        if (customer?.isGuest) {
            sessionStorage.setItem('pwa-kit-multiship-guest-addresses', JSON.stringify(guestAddresses))
        }
    }, [guestAddresses, customer?.isGuest])
    
    // Check if there's a previously saved address from the single address flow
    const existingBasketAddress = basket?.shipments?.[0]?.shippingAddress
    
    // Convert basket address to our address format if it exists
    const basketAddress = existingBasketAddress ? {
        addressId: 'basket-address',
        address1: existingBasketAddress.address1,
        city: existingBasketAddress.city,
        countryCode: existingBasketAddress.countryCode,
        firstName: existingBasketAddress.firstName,
        lastName: existingBasketAddress.lastName,
        phone: existingBasketAddress.phone,
        postalCode: existingBasketAddress.postalCode,
        stateCode: existingBasketAddress.stateCode,
        preferred: true // Mark as preferred since it was previously selected
    } : null
    
    // Use customer addresses for registered users, guest addresses for guest users
    // Include basket address if it exists
    const baseAddresses = customer?.isGuest ? guestAddresses : customerAddresses
    const addresses = basketAddress ? [basketAddress, ...baseAddresses] : baseAddresses

    // Initialize selected addresses with default addresses - persist in sessionStorage
    const [selectedAddresses, setSelectedAddresses] = useState(() => {
        const saved = sessionStorage.getItem('pwa-kit-multiship-selected-addresses')
        return saved ? JSON.parse(saved) : {}
    })
    
    // Persist selected addresses to sessionStorage whenever they change
    useEffect(() => {
        sessionStorage.setItem('pwa-kit-multiship-selected-addresses', JSON.stringify(selectedAddresses))
    }, [selectedAddresses])

    // Update selected addresses when customer data changes
    useEffect(() => {
        if (basket?.productItems && addresses.length > 0) {
            const initialSelected = {}
            const existingSelections = Object.values(selectedAddresses)
            
            basket.productItems.forEach((item) => {
                const addressKey = item.itemId
                // Only set default if no address is currently selected for this item
                if (!selectedAddresses[addressKey]) {
                    // For new products, try to use the same address as existing products
                    // If no existing selections, use preferred address or first address
                    let defaultAddress = null
                    
                    if (existingSelections.length > 0) {
                        // Use the first existing selection as default for new products
                        const firstExistingAddressId = existingSelections[0]
                        defaultAddress = addresses.find(addr => addr.addressId === firstExistingAddressId)
                    }
                    
                    // If no existing selections or address not found, use preferred or first address
                    if (!defaultAddress) {
                        defaultAddress = addresses.find((addr) => addr.preferred) || addresses[0]
                    }
                    
                    if (defaultAddress) {
                        initialSelected[addressKey] = defaultAddress.addressId
                    }
                }
            })
            // Only update if we have new selections to make
            if (Object.keys(initialSelected).length > 0) {
                setSelectedAddresses(prev => ({...prev, ...initialSelected}))
            }
        }
    }, [customer, basket?.productItems, addresses])

    // For guest users, we don't need to wait for customer data to load
    const isGuestUser = customer?.isGuest
    const shouldShowLoading = isGuestUser ? productsLoading : (customerLoading || productsLoading)

    const [showAddAddressForm, setShowAddAddressForm] = useState({})

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
    const [isSubmitting, setIsSubmitting] = useState(false)

    const isAddressFormOpen =
        Object.keys(showAddAddressForm).filter((key) => showAddAddressForm[key])?.length > 0

    // Unified loading state - check if either customer or products are loading
    const isLoading = shouldShowLoading

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

    // Show loading message when loading
    if (isLoading) {
        return (
            <Center p={8} textAlign="center" color="gray.500">
                <VStack spacing={4}>
                    <Text fontSize="lg" fontWeight="medium">
                        {formatMessage({
                            id: 'shipping_multi_address.loading.message',
                            defaultMessage: 'Loading...'
                        })}
                    </Text>
                </VStack>
            </Center>
        )
    }

    const handleCancelAddressForm = (addressKey) => {
        setShowAddAddressForm((prev) => ({
            ...prev,
            [addressKey]: false
        }))
        addressForm.clearErrors()
    }

    const handleCreateAddress = async (addressData, form, itemId) => {
        const addressKey = itemId

        try {
            const newAddress = {
                ...addressData,
                addressId: nanoid()
            }

            if (customer?.isGuest) {
                // For guest users, store address in memory
                const updatedGuestAddresses = [...guestAddresses, newAddress]
                setGuestAddresses(updatedGuestAddresses)
                
                setShowAddAddressForm((prev) => ({...prev, [addressKey]: false}))
                form.reset()
                form.clearErrors()

                // Automatically assign the new address to the product that triggered the form
                setSelectedAddresses((prev) => ({
                    ...prev,
                    [addressKey]: newAddress.addressId
                }))

                showToast({
                    title: formatMessage({
                        id: 'shipping_multi_address.success.address_saved',
                        defaultMessage: 'Address saved successfully'
                    }),
                    status: 'success'
                })
            } else {
                // For registered users, save to customer profile
                const createdAddress = await createCustomerAddress.mutateAsync({
                    body: newAddress,
                    parameters: {customerId: customer.customerId}
                })

                setShowAddAddressForm((prev) => ({...prev, [addressKey]: false}))
                form.reset()
                form.clearErrors()

                await refetchCustomer()

                // Automatically assign the new address to the product that triggered the form
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
            }
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

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            console.log('handleSubmit - selectedAddresses:', selectedAddresses)
            console.log('handleSubmit - addresses:', addresses)
            
            // Based on the shopper's selected addresses, create a map of unique addressIds and their associated items
            const addressToItemsMap = {}

            basket.productItems.forEach((item) => {
                // Defaults to the first address if no address is selected
                const addressId = selectedAddresses[item.itemId] || addresses[0]?.addressId
                const address = addresses.find((addr) => addr.addressId === addressId)
                
                console.log('Processing item:', item.itemId, 'addressId:', addressId, 'address:', address)
                console.log('Available addresses:', addresses)

                // Skip if no address found
                if (!address) {
                    console.error('No address found for item:', item.itemId, 'addressId:', addressId)
                    return
                }

                // If there is an existing shipment with the same address, use it in the next step
                const shipmentIdWithSameAddress = findDeliveryShipmentWithSameAddress(
                    basket,
                    address
                )

                if (!addressToItemsMap[addressId]) {
                    addressToItemsMap[addressId] = {
                        address: address,
                        items: [],
                        shipmentId: shipmentIdWithSameAddress
                    }
                }
                addressToItemsMap[addressId].items.push(item)
            })
            


            for (const [addressId, data] of Object.entries(addressToItemsMap)) {
                const {address, items, shipmentId: existingShipmentId} = data
                
                console.log('Processing addressId:', addressId, 'data:', data)

                // For each unique address, if there is no existing shipment with the same address, create a new one.
                if (!existingShipmentId) {
                    console.log('Creating new shipment for address:', address)
                    addressToItemsMap[addressId].shipmentId =
                        await createNewDeliveryShipmentWithAddress(basket, address)
                    console.log('Created shipment ID:', addressToItemsMap[addressId].shipmentId)
                } else {
                    console.log('Using existing shipment ID:', existingShipmentId)
                }

                // Move items to the new shipment if needed.
                const targetShipmentId = addressToItemsMap[addressId].shipmentId
                const itemsToMove = items.filter((item) => item.shipmentId !== targetShipmentId)
                console.log('Items to move:', itemsToMove, 'targetShipmentId:', targetShipmentId)
                
                if (itemsToMove.length > 0) {
                    // Get default inventory ID from the first item that has one, or from basket items
                    const defaultInventoryId = itemsToMove.find(item => item.inventoryId)?.inventoryId || 
                        basket.productItems.find(item => item.inventoryId)?.inventoryId || 
                        'default'
                    console.log('Moving items with defaultInventoryId:', defaultInventoryId)
                    await moveItemsToDeliveryShipment(itemsToMove, targetShipmentId, defaultInventoryId)
                    console.log('Successfully moved items to shipment:', targetShipmentId)
                }
            }

            // Remove any empty shipments. TODO: Need to handle swapping over addresses if default is empty
            await removeEmptyShipments()

            // Mark multi-shipping as completed after successful proceed
            sessionStorage.setItem('pwa-kit-multiship-completed', 'true')
            console.log('Marked multi-shipping as completed')
            
            // Call the callback to update parent state
            if (onProceedSuccess) {
                onProceedSuccess()
            }

            console.log('Going to shipping options step:', STEPS.SHIPPING_OPTIONS)
            console.log('Basket state after multi-shipping:', {
                shipments: basket.shipments,
                shippingMethods: basket.shipments?.map(s => s.shippingMethod),
                hasShippingMethods: basket.shipments?.some(s => s.shippingMethod)
            })
            goToStep(STEPS.SHIPPING_OPTIONS)
        } catch (error) {
            console.error('handleSubmit error:', error)
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                response: error.response
            })
            showToast({
                title: formatMessage({
                    defaultMessage: 'Error setting up shipments. Please try again.',
                    id: 'shipping_multi_address.error.submit_failed'
                }),
                status: 'error'
            })
        } finally {
            setIsSubmitting(false)
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
                        {basket.productItems.map((item) => {
                            const productDetail = productsMap?.[item.productId] || {}
                            const variant = {...item, ...productDetail}
                            const image = findImageGroupBy(productDetail.imageGroups, {
                                viewType: 'small',
                                selectedVariationAttributes: variant.variationValues
                            })?.images?.[0]
                            const imageUrl = image?.disBaseLink || image?.link || ''
                            const addressKey = item.itemId

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
                                                {formatMessage(deliveryAddressLabel)}
                                            </Text>

                                            <Box w="100%" mb={6}>
                                                <VStack spacing={3} align="stretch">
                                                    <Select
                                                        value={selectedAddresses[addressKey] || ''}
                                                        onChange={(e) => {
                                                            const value = e.target.value
                                                            // Hide the address form when an existing address is selected
                                                            setShowAddAddressForm((prev) => ({
                                                                ...prev,
                                                                [addressKey]: false
                                                            }))
                                                            setSelectedAddresses((prev) => {
                                                                const newState = {...prev}
                                                                if (value === '') {
                                                                    delete newState[addressKey]
                                                                } else {
                                                                    newState[addressKey] = value
                                                                }
                                                                return newState
                                                            })
                                                        }}
                                                        disabled={addresses.length === 0}
                                                        aria-labelledby={`delivery-address-label-${addressKey}`}
                                                        borderColor="gray.300"
                                                        _hover={{borderColor: 'gray.400'}}
                                                        _focus={{
                                                            borderColor: 'blue.500',
                                                            boxShadow:
                                                                '0 0 0 1px var(--chakra-colors-blue-500)'
                                                        }}
                                                    >
                                                        {addresses.length === 0 ? (
                                                            <option value="">
                                                                {formatMessage({
                                                                    id: 'shipping_multi_address.no_addresses_available',
                                                                    defaultMessage:
                                                                        'No Address Available'
                                                                })}
                                                            </option>
                                                        ) : (
                                                            addresses.map((addr) => (
                                                                <option
                                                                    key={addr.addressId}
                                                                    value={addr.addressId}
                                                                >
                                                                    {addr.firstName} {addr.lastName}{' '}
                                                                    - {addr.address1},{' '}
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
                                                                </option>
                                                            ))
                                                        )}
                                                    </Select>
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        onClick={() => {
                                                            setShowAddAddressForm((prev) => ({
                                                                ...prev,
                                                                [addressKey]: true
                                                            }))
                                                        }}
                                                        alignSelf="flex-start"
                                                        aria-label={formatMessage(
                                                            {
                                                                id: 'shipping_multi_address.add_new_address.aria_label',
                                                                defaultMessage:
                                                                    'Add new delivery address for {productName}'
                                                            },
                                                            {
                                                                productName: item.productName
                                                            }
                                                        )}
                                                    >
                                                        {formatMessage(addNewAddressLabel)}
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
                                                onSubmit={handleCreateAddress}
                                                onCancel={() => handleCancelAddressForm(addressKey)}
                                            />
                                        </Box>
                                    )}
                                </Box>
                            )
                        })}
                    </VStack>
                </Box>
                <Button
                    type="button"
                    width="full"
                    mt={2}
                    isLoading={addressForm.formState.isSubmitting || isSubmitting}
                    {...(isAddressFormOpen && {disabled: true})}
                    data-testid="continue-to-shipping-button"
                    loadingText={formatMessage({
                        id: 'shipping_multi_address.submit.loading',
                        defaultMessage: 'Setting up shipments...'
                    })}
                    aria-label={formatMessage({
                        id: 'shipping_multi_address.submit.description',
                        defaultMessage: 'Continue to next step with selected delivery addresses'
                    })}
                    onClick={() => {
                        if (!isAddressFormOpen) {
                            handleSubmit()
                        }
                    }}
                >
                    {formatMessage(submitButtonLabel)}
                </Button>
            </VStack>
        </Box>
    )
}

ShippingMultiAddress.propTypes = {
    basket: PropTypes.object.isRequired,
    submitButtonLabel: PropTypes.object.isRequired,
    addNewAddressLabel: PropTypes.object.isRequired,
    noItemsInBasketMessage: PropTypes.object.isRequired,
    deliveryAddressLabel: PropTypes.object.isRequired
}

export default ShippingMultiAddress
