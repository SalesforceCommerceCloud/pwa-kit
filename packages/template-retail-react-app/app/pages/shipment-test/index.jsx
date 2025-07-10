/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useEffect} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {
    Box,
    Button,
    Container,
    Text,
    VStack,
    HStack,
    FormControl,
    FormLabel,
    Input,
    Select,
    Divider,
    Badge,
    Alert,
    AlertIcon,
    AlertTitle,
    useToast,
    Heading,
    SimpleGrid,
    Flex,
    Spacer
} from '@salesforce/retail-react-app/app/components/shared/ui'

// Hooks
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {
    useShopperBasketsMutation,
    useShippingMethodsForShipment
} from '@salesforce/commerce-sdk-react'

const ShipmentTestPage = () => {
    const {formatMessage} = useIntl()
    const toast = useToast()
    const {data: basket, isLoading: isBasketLoading} = useCurrentBasket()

    // Mutations
    const createShipmentMutation = useShopperBasketsMutation('createShipmentForBasket')
    const updateShipmentMutation = useShopperBasketsMutation('updateShipmentForBasket')
    const removeShipmentMutation = useShopperBasketsMutation('removeShipmentFromBasket')
    const updateShippingMethodMutation = useShopperBasketsMutation('updateShippingMethodForShipment')
    const updateShippingAddressMutation = useShopperBasketsMutation('updateShippingAddressForShipment')
    const updateBasketItemMutation = useShopperBasketsMutation('updateItemInBasket')

    // Shipping methods
    const {data: shippingMethods, refetch: refetchShippingMethods} = useShippingMethodsForShipment(
        {
            parameters: {
                basketId: basket?.basketId,
                shipmentId: 'me'
            }
        },
        {
            enabled: !!basket?.basketId
        }
    )

    // State
    const [isLoading, setIsLoading] = useState(false)
    const [selectedShipmentId, setSelectedShipmentId] = useState('me')
    const [createShipmentForm, setCreateShipmentForm] = useState({
        id: '',
        shippingMethodId: '',
        c_fromStoreId: '',
        gift: false,
        giftMessage: ''
    })
    const [updateShipmentForm, setUpdateShipmentForm] = useState({
        shippingMethodId: '',
        c_fromStoreId: '',
        gift: false,
        giftMessage: ''
    })
    const [shippingAddressForm, setShippingAddressForm] = useState({
        address1: '',
        address2: '',
        city: '',
        countryCode: 'US',
        firstName: '',
        lastName: '',
        phone: '',
        postalCode: '',
        stateCode: ''
    })
    const [itemMoveForm, setItemMoveForm] = useState({
        itemId: '',
        targetShipmentId: ''
    })

    // Effects
    useEffect(() => {
        if (basket?.shipments?.length > 0) {
            setSelectedShipmentId(basket.shipments[0].shipmentId || 'me')
        }
    }, [basket])

    useEffect(() => {
        if (shippingMethods?.applicableShippingMethods?.length > 0) {
            const pickupMethod = shippingMethods.applicableShippingMethods.find(
                method => method.c_storePickupEnabled === true
            )
            if (pickupMethod) {
                setCreateShipmentForm(prev => ({
                    ...prev,
                    shippingMethodId: pickupMethod.id
                }))
                setUpdateShipmentForm(prev => ({
                    ...prev,
                    shippingMethodId: pickupMethod.id
                }))
            }
        }
    }, [shippingMethods])

    // Helper functions
    const showSuccess = (message) => {
        toast({
            title: message,
            status: 'success',
            duration: 5000
        })
    }

    const showError = (message) => {
        toast({
            title: message,
            status: 'error',
            duration: 5000
        })
    }

    const getSelectedShipment = () => {
        if (!basket?.shipments) return null
        return basket.shipments.find(shipment => shipment.shipmentId === selectedShipmentId)
    }

    const isDefaultShipment = (shipmentId) => {
        return shipmentId === 'me' || shipmentId === basket?.shipments?.[0]?.shipmentId
    }

    const getItemCountForShipment = (shipmentId) => {
        return basket.productItems?.filter(item => item.shipmentId === shipmentId).length || 0
    }

    // API Functions
    const handleCreateShipment = async () => {
        if (!basket?.basketId) {
            showError('No basket available')
            return
        }

        setIsLoading(true)
        try {
            const body = {
                id: createShipmentForm.id || undefined,
                shippingMethod: createShipmentForm.shippingMethodId ? {
                    id: createShipmentForm.shippingMethodId
                } : undefined,
                c_fromStoreId: createShipmentForm.c_fromStoreId || undefined,
                gift: createShipmentForm.gift,
                giftMessage: createShipmentForm.giftMessage || undefined
            }

            // Remove undefined values
            Object.keys(body).forEach(key => {
                if (body[key] === undefined) {
                    delete body[key]
                }
            })

            await createShipmentMutation.mutateAsync({
                parameters: {
                    basketId: basket.basketId
                },
                body
            })

            showSuccess('Shipment created successfully')
            setCreateShipmentForm({
                id: '',
                shippingMethodId: '',
                c_fromStoreId: '',
                gift: false,
                giftMessage: ''
            })
        } catch (error) {
            console.error('Create shipment error:', error)
            showError(`Failed to create shipment: ${error.message || 'Unknown error'}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdateShipment = async () => {
        if (!basket?.basketId || !selectedShipmentId) {
            showError('No basket or shipment selected')
            return
        }

        setIsLoading(true)
        try {
            const body = {
                shippingMethod: updateShipmentForm.shippingMethodId ? {
                    id: updateShipmentForm.shippingMethodId
                } : undefined,
                c_fromStoreId: updateShipmentForm.c_fromStoreId || undefined,
                gift: updateShipmentForm.gift,
                giftMessage: updateShipmentForm.giftMessage || undefined
            }

            // Remove undefined values
            Object.keys(body).forEach(key => {
                if (body[key] === undefined) {
                    delete body[key]
                }
            })

            await updateShipmentMutation.mutateAsync({
                parameters: {
                    basketId: basket.basketId,
                    shipmentId: selectedShipmentId
                },
                body
            })

            showSuccess('Shipment updated successfully')
        } catch (error) {
            console.error('Update shipment error:', error)
            showError(`Failed to update shipment: ${error.message || 'Unknown error'}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleRemoveShipment = async () => {
        if (!basket?.basketId || !selectedShipmentId) {
            showError('No basket or shipment selected')
            return
        }

        if (isDefaultShipment(selectedShipmentId)) {
            showError('Cannot remove the default shipment')
            return
        }

        setIsLoading(true)
        try {
            await removeShipmentMutation.mutateAsync({
                parameters: {
                    basketId: basket.basketId,
                    shipmentId: selectedShipmentId
                }
            })

            showSuccess('Shipment removed successfully')
            setSelectedShipmentId('me')
        } catch (error) {
            console.error('Remove shipment error:', error)
            showError(`Failed to remove shipment: ${error.message || 'Unknown error'}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdateShippingMethod = async () => {
        if (!basket?.basketId || !selectedShipmentId) {
            showError('No basket or shipment selected')
            return
        }

        if (!updateShipmentForm.shippingMethodId) {
            showError('Please select a shipping method')
            return
        }

        setIsLoading(true)
        try {
            await updateShippingMethodMutation.mutateAsync({
                parameters: {
                    basketId: basket.basketId,
                    shipmentId: selectedShipmentId
                },
                body: {
                    id: updateShipmentForm.shippingMethodId
                }
            })

            showSuccess('Shipping method updated successfully')
        } catch (error) {
            console.error('Update shipping method error:', error)
            showError(`Failed to update shipping method: ${error.message || 'Unknown error'}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdateShippingAddress = async () => {
        if (!basket?.basketId || !selectedShipmentId) {
            showError('No basket or shipment selected')
            return
        }

        setIsLoading(true)
        try {
            await updateShippingAddressMutation.mutateAsync({
                parameters: {
                    basketId: basket.basketId,
                    shipmentId: selectedShipmentId,
                    useAsBilling: false
                },
                body: shippingAddressForm
            })

            showSuccess('Shipping address updated successfully')
        } catch (error) {
            console.error('Update shipping address error:', error)
            showError(`Failed to update shipping address: ${error.message || 'Unknown error'}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleRefreshShippingMethods = async () => {
        try {
            await refetchShippingMethods()
            showSuccess('Shipping methods refreshed')
        } catch (error) {
            console.error('Refresh shipping methods error:', error)
            showError(`Failed to refresh shipping methods: ${error.message || 'Unknown error'}`)
        }
    }

    const handleMoveItem = async () => {
        if (!basket?.basketId || !itemMoveForm.itemId || !itemMoveForm.targetShipmentId) {
            showError('Please select both item and target shipment')
            return
        }

        const item = basket.productItems?.find(item => item.itemId === itemMoveForm.itemId)
        if (!item) {
            showError('Selected item not found')
            return
        }

        if (item.shipmentId === itemMoveForm.targetShipmentId) {
            showError('Item is already in the target shipment')
            return
        }

        setIsLoading(true)
        try {
            await updateBasketItemMutation.mutateAsync({
                parameters: {
                    basketId: basket.basketId,
                    itemId: itemMoveForm.itemId
                },
                body: {
                    productId: item.productId,
                    quantity: item.quantity,
                    shipmentId: itemMoveForm.targetShipmentId
                }
            })

            showSuccess(`Successfully moved item ${item.itemId} to shipment ${itemMoveForm.targetShipmentId}`)
            setItemMoveForm({
                itemId: '',
                targetShipmentId: ''
            })
        } catch (error) {
            console.error('Move item error:', error)
            showError(`Failed to move item: ${error.message || 'Unknown error'}`)
        } finally {
            setIsLoading(false)
        }
    }

    if (isBasketLoading) {
        return (
            <Container maxW="container.xl" py={8}>
                <Text>Loading basket...</Text>
            </Container>
        )
    }

    if (!basket?.basketId) {
        return (
            <Container maxW="container.xl" py={8}>
                <Alert status="warning">
                    <AlertIcon />
                    <AlertTitle>No Basket Available</AlertTitle>
                    <Text>
                        Please add items to your cart first to test shipment APIs.
                    </Text>
                </Alert>
            </Container>
        )
    }

    const selectedShipment = getSelectedShipment()

    return (
        <Container maxW="container.xl" py={8}>
            <VStack spacing={8} align="stretch">
                <Box>
                    <Heading size="lg" mb={4}>
                        Shipment API Test Page
                    </Heading>
                    <Text color="gray.600">
                        Test all shipment-related APIs for basket management
                    </Text>
                </Box>

                {/* Basket Info */}
                <Box border="1px" borderColor="gray.200" borderRadius="md" p={6}>
                    <Box mb={4}>
                        <Heading size="md">Basket Information</Heading>
                    </Box>
                    <VStack align="start" spacing={2}>
                        <Text><strong>Basket ID:</strong> {basket.basketId}</Text>
                        <Text><strong>Total Items:</strong> {basket.productItems?.length || 0}</Text>
                        <Text><strong>Shipments:</strong> {basket.shipments?.length || 0}</Text>
                    </VStack>
                </Box>

                {/* Shipment Selection */}
                <Box border="1px" borderColor="gray.200" borderRadius="md" p={6}>
                    <Box mb={4}>
                        <Heading size="md">Shipment Selection</Heading>
                    </Box>
                    <VStack spacing={4}>
                        <FormControl>
                            <FormLabel>Select Shipment</FormLabel>
                            <Select
                                value={selectedShipmentId}
                                onChange={(e) => setSelectedShipmentId(e.target.value)}
                            >
                                {basket.shipments?.map((shipment) => (
                                    <option key={shipment.shipmentId} value={shipment.shipmentId}>
                                        {shipment.shipmentId} {isDefaultShipment(shipment.shipmentId) && '(Default)'}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>

                        {selectedShipment && (
                            <Box p={4} bg="gray.50" borderRadius="md" w="full">
                                <Text><strong>Selected Shipment:</strong> {selectedShipment.shipmentId}</Text>
                                <Text><strong>Shipping Method:</strong> {selectedShipment.shippingMethod?.id || 'None'}</Text>
                                <Text><strong>Store ID:</strong> {selectedShipment.c_fromStoreId || 'None'}</Text>
                                <Text><strong>Gift:</strong> {selectedShipment.gift ? 'Yes' : 'No'}</Text>
                                {selectedShipment.shippingAddress && (
                                    <Text><strong>Address:</strong> {selectedShipment.shippingAddress.address1}, {selectedShipment.shippingAddress.city}</Text>
                                )}
                            </Box>
                        )}
                    </VStack>
                </Box>

                <SimpleGrid columns={{base: 1, lg: 2}} spacing={8}>
                    {/* Create Shipment */}
                    <Box border="1px" borderColor="gray.200" borderRadius="md" p={6}>
                        <Box mb={4}>
                            <Heading size="md">Create Shipment</Heading>
                        </Box>
                            <VStack spacing={4}>
                                <FormControl>
                                    <FormLabel>Shipment ID (optional)</FormLabel>
                                    <Input
                                        value={createShipmentForm.id}
                                        onChange={(e) => setCreateShipmentForm(prev => ({...prev, id: e.target.value}))}
                                        placeholder="Auto-generated if empty"
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Shipping Method</FormLabel>
                                    <Select
                                        value={createShipmentForm.shippingMethodId}
                                        onChange={(e) => setCreateShipmentForm(prev => ({...prev, shippingMethodId: e.target.value}))}
                                    >
                                        <option value="">Select shipping method</option>
                                        {shippingMethods?.applicableShippingMethods?.map((method) => (
                                            <option key={method.id} value={method.id}>
                                                {method.name || method.id} {method.c_storePickupEnabled && '(Pickup)'}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Store ID (for pickup)</FormLabel>
                                    <Input
                                        value={createShipmentForm.c_fromStoreId}
                                        onChange={(e) => setCreateShipmentForm(prev => ({...prev, c_fromStoreId: e.target.value}))}
                                        placeholder="Store ID for pickup"
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Gift Message</FormLabel>
                                    <Input
                                        value={createShipmentForm.giftMessage}
                                        onChange={(e) => setCreateShipmentForm(prev => ({...prev, giftMessage: e.target.value}))}
                                        placeholder="Gift message"
                                    />
                                </FormControl>

                                <Button
                                    colorScheme="blue"
                                    onClick={handleCreateShipment}
                                    isLoading={isLoading}
                                    loadingText="Creating..."
                                    w="full"
                                >
                                    Create Shipment
                                </Button>
                            </VStack>
                        </Box>

                        {/* Update Shipment */}
                        <Box border="1px" borderColor="gray.200" borderRadius="md" p={6}>
                            <Box mb={4}>
                                <Heading size="md">Update Shipment</Heading>
                            </Box>
                            <VStack spacing={4}>
                                <FormControl>
                                    <FormLabel>Shipping Method</FormLabel>
                                    <Select
                                        value={updateShipmentForm.shippingMethodId}
                                        onChange={(e) => setUpdateShipmentForm(prev => ({...prev, shippingMethodId: e.target.value}))}
                                    >
                                        <option value="">Select shipping method</option>
                                        {shippingMethods?.applicableShippingMethods?.map((method) => (
                                            <option key={method.id} value={method.id}>
                                                {method.name || method.id} {method.c_storePickupEnabled && '(Pickup)'}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Store ID (for pickup)</FormLabel>
                                    <Input
                                        value={updateShipmentForm.c_fromStoreId}
                                        onChange={(e) => setUpdateShipmentForm(prev => ({...prev, c_fromStoreId: e.target.value}))}
                                        placeholder="Store ID for pickup"
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Gift Message</FormLabel>
                                    <Input
                                        value={updateShipmentForm.giftMessage}
                                        onChange={(e) => setUpdateShipmentForm(prev => ({...prev, giftMessage: e.target.value}))}
                                        placeholder="Gift message"
                                    />
                                </FormControl>

                                <HStack spacing={4} w="full">
                                    <Button
                                        colorScheme="green"
                                        onClick={handleUpdateShipment}
                                        isLoading={isLoading}
                                        loadingText="Updating..."
                                        flex={1}
                                    >
                                        Update Shipment
                                    </Button>
                                    <Button
                                        colorScheme="red"
                                        onClick={handleRemoveShipment}
                                        isLoading={isLoading}
                                        loadingText="Removing..."
                                        flex={1}
                                        isDisabled={isDefaultShipment(selectedShipmentId)}
                                    >
                                        Remove Shipment
                                    </Button>
                                </HStack>
                            </VStack>
                        </Box>
                    </SimpleGrid>

                    {/* Shipping Address */}
                    <Box border="1px" borderColor="gray.200" borderRadius="md" p={6}>
                        <Box mb={4}>
                            <Heading size="md">Shipping Address</Heading>
                        </Box>
                        <VStack spacing={4}>
                            <SimpleGrid columns={{base: 1, md: 2}} spacing={4}>
                                <FormControl>
                                    <FormLabel>First Name</FormLabel>
                                    <Input
                                        value={shippingAddressForm.firstName}
                                        onChange={(e) => setShippingAddressForm(prev => ({...prev, firstName: e.target.value}))}
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Last Name</FormLabel>
                                    <Input
                                        value={shippingAddressForm.lastName}
                                        onChange={(e) => setShippingAddressForm(prev => ({...prev, lastName: e.target.value}))}
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Address Line 1</FormLabel>
                                    <Input
                                        value={shippingAddressForm.address1}
                                        onChange={(e) => setShippingAddressForm(prev => ({...prev, address1: e.target.value}))}
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Address Line 2</FormLabel>
                                    <Input
                                        value={shippingAddressForm.address2}
                                        onChange={(e) => setShippingAddressForm(prev => ({...prev, address2: e.target.value}))}
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>City</FormLabel>
                                    <Input
                                        value={shippingAddressForm.city}
                                        onChange={(e) => setShippingAddressForm(prev => ({...prev, city: e.target.value}))}
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>State/Province</FormLabel>
                                    <Input
                                        value={shippingAddressForm.stateCode}
                                        onChange={(e) => setShippingAddressForm(prev => ({...prev, stateCode: e.target.value}))}
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Postal Code</FormLabel>
                                    <Input
                                        value={shippingAddressForm.postalCode}
                                        onChange={(e) => setShippingAddressForm(prev => ({...prev, postalCode: e.target.value}))}
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Country</FormLabel>
                                    <Select
                                        value={shippingAddressForm.countryCode}
                                        onChange={(e) => setShippingAddressForm(prev => ({...prev, countryCode: e.target.value}))}
                                    >
                                        <option value="US">United States</option>
                                        <option value="CA">Canada</option>
                                        <option value="GB">United Kingdom</option>
                                        <option value="DE">Germany</option>
                                        <option value="FR">France</option>
                                    </Select>
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Phone</FormLabel>
                                    <Input
                                        value={shippingAddressForm.phone}
                                        onChange={(e) => setShippingAddressForm(prev => ({...prev, phone: e.target.value}))}
                                    />
                                </FormControl>
                            </SimpleGrid>

                            <Button
                                colorScheme="purple"
                                onClick={handleUpdateShippingAddress}
                                isLoading={isLoading}
                                loadingText="Updating Address..."
                                w="full"
                            >
                                Update Shipping Address
                            </Button>
                        </VStack>
                    </Box>

                    {/* Item Management */}
                    <Box border="1px" borderColor="gray.200" borderRadius="md" p={6}>
                        <Box mb={4}>
                            <Heading size="md">Item Management</Heading>
                        </Box>
                        <VStack spacing={4}>
                            {/* Item List */}
                            <Box w="full">
                                <Text fontWeight="bold" mb={2}>Basket Items:</Text>
                                <VStack spacing={2} align="start">
                                    {basket.productItems?.map((item) => (
                                        <Box key={item.itemId} p={3} bg="gray.50" borderRadius="md" w="full">
                                            <HStack justify="space-between" align="start">
                                                <VStack align="start" spacing={1}>
                                                    <Text fontWeight="bold">{item.productName || item.productId}</Text>
                                                    <Text fontSize="sm" color="gray.600">Item ID: {item.itemId}</Text>
                                                    <Text fontSize="sm" color="gray.600">Quantity: {item.quantity}</Text>
                                                    <Text fontSize="sm" color="gray.600">Current Shipment: {item.shipmentId}</Text>
                                                </VStack>
                                                <Badge colorScheme={isDefaultShipment(item.shipmentId) ? "blue" : "green"}>
                                                    {isDefaultShipment(item.shipmentId) ? "Default" : "Custom"}
                                                </Badge>
                                            </HStack>
                                        </Box>
                                    ))}
                                </VStack>
                            </Box>

                            {/* Move Item */}
                            <Box w="full">
                                <Text fontWeight="bold" mb={2}>Move Item to Different Shipment:</Text>
                                <SimpleGrid columns={{base: 1, md: 2}} spacing={4}>
                                    <FormControl>
                                        <FormLabel>Select Item</FormLabel>
                                        <Select
                                            value={itemMoveForm.itemId}
                                            onChange={(e) => setItemMoveForm(prev => ({...prev, itemId: e.target.value}))}
                                        >
                                            <option value="">Choose an item</option>
                                            {basket.productItems?.map((item) => (
                                                <option key={item.itemId} value={item.itemId}>
                                                    {item.productName || item.productId} (Qty: {item.quantity})
                                                </option>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel>Target Shipment</FormLabel>
                                        <Select
                                            value={itemMoveForm.targetShipmentId}
                                            onChange={(e) => setItemMoveForm(prev => ({...prev, targetShipmentId: e.target.value}))}
                                        >
                                            <option value="">Choose target shipment</option>
                                            {basket.shipments?.map((shipment) => (
                                                <option key={shipment.shipmentId} value={shipment.shipmentId}>
                                                    {shipment.shipmentId} {isDefaultShipment(shipment.shipmentId) && '(Default)'}
                                                </option>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </SimpleGrid>

                                <Button
                                    colorScheme="indigo"
                                    onClick={handleMoveItem}
                                    isLoading={isLoading}
                                    loadingText="Moving..."
                                    mt={4}
                                    w="full"
                                    isDisabled={!itemMoveForm.itemId || !itemMoveForm.targetShipmentId}
                                >
                                    Move Item
                                </Button>
                            </Box>

                            {/* Shipment Summary */}
                            <Box w="full">
                                <Text fontWeight="bold" mb={2}>Shipment Summary:</Text>
                                <VStack spacing={2} align="start">
                                    {basket.shipments?.map((shipment) => (
                                        <Box key={shipment.shipmentId} p={2} bg="blue.50" borderRadius="md" w="full">
                                            <HStack justify="space-between">
                                                <Text>
                                                    <strong>{shipment.shipmentId}</strong>
                                                    {isDefaultShipment(shipment.shipmentId) && ' (Default)'}
                                                </Text>
                                                <Text>
                                                    Items: {getItemCountForShipment(shipment.shipmentId)}
                                                </Text>
                                            </HStack>
                                        </Box>
                                    ))}
                                </VStack>
                            </Box>
                        </VStack>
                    </Box>

                    {/* Quick Actions */}
                    <Box border="1px" borderColor="gray.200" borderRadius="md" p={6}>
                        <Box mb={4}>
                            <Heading size="md">Quick Actions</Heading>
                        </Box>
                        <HStack spacing={4} wrap="wrap">
                            <Button
                                colorScheme="teal"
                                onClick={handleUpdateShippingMethod}
                                isLoading={isLoading}
                                loadingText="Updating..."
                                isDisabled={!updateShipmentForm.shippingMethodId}
                            >
                                Update Shipping Method Only
                            </Button>

                            <Button
                                colorScheme="orange"
                                onClick={handleRefreshShippingMethods}
                                isLoading={isLoading}
                                loadingText="Refreshing..."
                            >
                                Refresh Shipping Methods
                            </Button>
                        </HStack>
                    </Box>

                    {/* Shipping Methods Info */}
                    {shippingMethods && (
                        <Box border="1px" borderColor="gray.200" borderRadius="md" p={6}>
                            <Box mb={4}>
                                <Heading size="md">Available Shipping Methods</Heading>
                            </Box>
                            <VStack spacing={2} align="start">
                                <Text><strong>Default Method:</strong> {shippingMethods.defaultShippingMethodId || 'None'}</Text>
                                <Text><strong>Available Methods:</strong></Text>
                                {shippingMethods.applicableShippingMethods?.map((method) => (
                                    <Box key={method.id} p={2} bg="gray.50" borderRadius="md" w="full">
                                        <HStack justify="space-between">
                                            <VStack align="start" spacing={1}>
                                                <Text fontWeight="bold">{method.name || method.id}</Text>
                                                <Text fontSize="sm" color="gray.600">ID: {method.id}</Text>
                                                {method.description && (
                                                    <Text fontSize="sm" color="gray.600">{method.description}</Text>
                                                )}
                                            </VStack>
                                            <VStack align="end" spacing={1}>
                                                {method.c_storePickupEnabled && (
                                                    <Badge colorScheme="green">Pickup</Badge>
                                                )}
                                                {method.id === shippingMethods.defaultShippingMethodId && (
                                                    <Badge colorScheme="blue">Default</Badge>
                                                )}
                                            </VStack>
                                        </HStack>
                                    </Box>
                                ))}
                            </VStack>
                        </Box>
                    )}
                </VStack>
            </Container>
        )
    }

ShipmentTestPage.getTemplateName = () => 'shipment-test'

export default ShipmentTestPage 