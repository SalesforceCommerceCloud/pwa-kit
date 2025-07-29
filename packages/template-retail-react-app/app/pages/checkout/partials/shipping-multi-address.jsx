/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
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
    Spinner,
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
    deliveryAddressLabel
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

    const ADD_NEW_ADDRESS_OPTION_VALUE = 'add-new-address'
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

    // Initialize selected addresses with default addresses
    const [selectedAddresses, setSelectedAddresses] = useState(() => {
        const initialSelected = {}
        if (basket?.productItems) {
            basket.productItems.forEach((item) => {
                const addressKey = item.itemId
                // Find preferred address or use first address as default
                const defaultAddress = addresses.find((addr) => addr.preferred) || addresses[0]
                if (defaultAddress) {
                    initialSelected[addressKey] = defaultAddress.addressId
                }
            })
        }
        return initialSelected
    })

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

            const createdAddress = await createCustomerAddress.mutateAsync({
                body: newAddress,
                parameters: {customerId: customer.customerId}
            })

            setShowAddAddressForm((prev) => ({...prev, [addressKey]: false}))
            form.reset()

            form.clearErrors()

            await refetchCustomer()

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

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            // Based on the shopper's selected addresses, create a map of unique addressIds and their associated items
            const addressToItemsMap = {}

            basket.productItems.forEach((item) => {
                // Defaults to the first address if no address is selected
                const addressId = selectedAddresses[item.itemId] || addresses[0]?.addressId
                const address = addresses.find((addr) => addr.addressId === addressId)

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

                // For each unique address, if there is no existing shipment with the same address, create a new one.
                if (!existingShipmentId) {
                    addressToItemsMap[addressId].shipmentId =
                        await createNewDeliveryShipmentWithAddress(basket, address)
                }

                // Move items to the new shipment if needed.
                const targetShipmentId = addressToItemsMap[addressId].shipmentId
                const itemsToMove = items.filter((item) => item.shipmentId !== targetShipmentId)
                if (itemsToMove.length > 0) {
                    await moveItemsToDeliveryShipment(itemsToMove, targetShipmentId)
                }
            }

            // Remove any empty shipments. TODO: Need to handle swapping over addresses if default is empty
            await removeEmptyShipments()

            goToStep(STEPS.SHIPPING_OPTIONS)
        } catch (error) {
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
                                                <VStack spacing={3} align="stretch">
                                                    <Select
                                                        value={selectedAddresses[addressKey] || ''}
                                                        onChange={(e) => {
                                                            const value = e.target.value
                                                            setShowAddAddressForm((prev) => ({
                                                                ...prev,
                                                                [addressKey]: false
                                                            }))
                                                            setSelectedAddresses((prev) => ({
                                                                ...prev,
                                                                [addressKey]: value
                                                            }))
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
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setShowAddAddressForm((prev) => ({
                                                                ...prev,
                                                                [addressKey]: true
                                                            }))
                                                        }}
                                                        leftIcon={<Box as="span">+</Box>}
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
                                        <Box
                                            position="relative"
                                            mt={4}
                                            width="100%"
                                            data-testid="address-form"
                                        >
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
