/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {FormattedMessage, FormattedNumber, useIntl} from 'react-intl'
import {
    Box,
    Button,
    Container,
    Flex,
    Radio,
    RadioGroup,
    Stack,
    Text,
    VStack,
    HStack,
    Image,
    List,
    ListItem
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useForm, Controller} from 'react-hook-form'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'
import {
    ToggleCard,
    ToggleCardEdit,
    ToggleCardSummary
} from '@salesforce/retail-react-app/app/components/toggle-card'
import {
    useShippingMethodsForShipment,
    useShopperBasketsMutation
} from '@salesforce/commerce-sdk-react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks'
import DisplayPrice from '@salesforce/retail-react-app/app/components/display-price'
import {getPriceData} from '@salesforce/retail-react-app/app/utils/product-utils'
import PropTypes from 'prop-types'
import LoadingSpinner from '@salesforce/retail-react-app/app/components/loading-spinner'

import {findImageGroupBy} from '@salesforce/retail-react-app/app/utils/image-groups-utils'
import {useProducts} from '@salesforce/commerce-sdk-react'
import ItemVariantProvider from '@salesforce/retail-react-app/app/components/item-variant'

// Component to display product attributes (variants)
const ProductAttributes = ({variant, includeQuantity = true}) => {
    const {formatMessage} = useIntl()
    const variationAttributes = variant?.variationAttributes || []
    const variationValues = variant?.variationValues || {}

    return (
        <List
            spacing={1.5}
            flex={1}
            aria-label={formatMessage({
                id: 'shipping_options.product_attributes.label',
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
                            id: 'shipping_options.quantity.label',
                            defaultMessage: 'Quantity'
                        })}
                        : {variant.quantity}
                    </Text>
                </ListItem>
            )}
        </List>
    )
}

ProductAttributes.propTypes = {
    variant: PropTypes.object.isRequired,
    includeQuantity: PropTypes.bool
}

// Component to display a single product item
const ProductItem = ({item, currency, productsMap}) => {
    const {formatMessage} = useIntl()

    // Get product details and image using the exact same approach as shipping-multi-address
    const productDetail = productsMap?.[item.productId] || {}
    const variant = {...item, ...productDetail}
    const image = findImageGroupBy(productDetail.imageGroups, {
        viewType: 'small',
        selectedVariationAttributes: variant.variationValues
    })?.images?.[0]
    const imageUrl = image?.disBaseLink || image?.link || ''

    return (
        <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={4} bg="white">
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
                                        id: 'shipping_options.image.alt',
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
                                    fontWeight="medium"
                                    fontSize={{base: 'sm', md: 'md'}}
                                    mb={1}
                                    color="gray.900"
                                    textAlign="left"
                                >
                                    {item.productName}
                                </Text>
                                <Box>
                                    <ProductAttributes variant={variant} includeQuantity={true} />
                                </Box>
                            </VStack>
                        </ItemVariantProvider>
                    </HStack>
                </Flex>

                <Box
                    w="100%"
                    flex={{base: 'none', md: '1'}}
                    minW={{base: '100%', md: '280px'}}
                    maxW={{base: '100%', md: '400px'}}
                    pt={0}
                    mt={{base: 4, md: 0}}
                    display="flex"
                    justifyContent="flex-end"
                    alignItems="flex-start"
                >
                    <DisplayPrice
                        priceData={getPriceData(item)}
                        currency={currency}
                        labelForA11y={item.productName}
                    />
                </Box>
            </Flex>
        </Box>
    )
}

ProductItem.propTypes = {
    item: PropTypes.shape({
        itemId: PropTypes.string.isRequired,
        productId: PropTypes.string,
        productName: PropTypes.string,
        name: PropTypes.string,
        image: PropTypes.string,
        imageUrl: PropTypes.string,
        primaryImage: PropTypes.string,
        images: PropTypes.array,
        quantity: PropTypes.number,
        variationValues: PropTypes.object,
        variations: PropTypes.object
    }).isRequired,
    currency: PropTypes.string.isRequired,
    productsMap: PropTypes.object
}

// Component to handle shipping options for a single shipment
const ShipmentOptions = ({shipment, basketId, currency, control, basket}) => {
    const {formatMessage} = useIntl()
    const {data: shippingMethods, isLoading: isShippingMethodsLoading} =
        useShippingMethodsForShipment(
            {
                parameters: {
                    basketId: basketId,
                    shipmentId: shipment.shipmentId
                }
            },
            {
                enabled: Boolean(basketId && shipment.shipmentId && shipment.shippingAddress)
            }
        )

    // Get all items for this shipment
    const shipmentItems =
        basket?.productItems?.filter((item) => item.shipmentId === shipment.shipmentId) || []

    // Fetch product details using the exact same approach as shipping-multi-address
    const productIds = shipmentItems.map((item) => item.productId).join(',')
    const {data: productsMap, isLoading: isProductLoading} = useProducts(
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

    if (!shipment.shippingAddress) {
        return null
    }

    const fieldName = `shippingMethodId_${shipment.shipmentId}`
    const defaultValue =
        shipment.shippingMethod?.id || shippingMethods?.defaultShippingMethodId || ''

    return (
        <VStack spacing={6} align="stretch">
            {/* Delivery Address */}
            <Box>
                <Text fontWeight="bold" fontSize="md" mb={1}>
                    {formatMessage(
                        {
                            defaultMessage: 'Delivering to {name}',
                            id: 'shipping_options.label.delivering_to'
                        },
                        {
                            name: `${shipment.shippingAddress.firstName} ${shipment.shippingAddress.lastName}`
                        }
                    )}
                </Text>
                <Text fontSize="sm" color="gray.600">
                    {shipment.shippingAddress.address1}, {shipment.shippingAddress.city},{' '}
                    {shipment.shippingAddress.stateCode} {shipment.shippingAddress.postalCode}
                </Text>
            </Box>

            {/* Combined Product Cards and Shipping Options */}
            <Box
                border="1px solid"
                borderColor="gray.200"
                borderRadius="lg"
                pt={2}
                pb={6}
                px={2}
                bg="white"
            >
                <VStack spacing={2} align="stretch">
                    {/* Product Cards */}
                    {isProductLoading ? (
                        <LoadingSpinner />
                    ) : (
                        shipmentItems.map((item) => (
                            <ProductItem
                                key={item.itemId}
                                item={item}
                                currency={currency}
                                productsMap={productsMap}
                            />
                        ))
                    )}

                    {/* Shipping Methods */}
                    {isShippingMethodsLoading ? (
                        <Box mt={4} px={4}>
                            <LoadingSpinner />
                        </Box>
                    ) : (
                        shippingMethods?.applicableShippingMethods && (
                            <Box mt={4} px={4}>
                                <Controller
                                    name={fieldName}
                                    control={control}
                                    defaultValue={defaultValue}
                                    rules={{required: true}}
                                    render={({field}) => (
                                        <RadioGroup
                                            {...field}
                                            name={`shipping-options-radiogroup-${shipment.shipmentId}`}
                                        >
                                            <Stack spacing={2}>
                                                {shippingMethods.applicableShippingMethods.map(
                                                    (opt) => (
                                                        <Radio value={opt.id} key={opt.id}>
                                                            <Box w="full">
                                                                <Flex
                                                                    justify="space-between"
                                                                    w="full"
                                                                    align="flex-start"
                                                                >
                                                                    <Box flex={1}>
                                                                        <Text
                                                                            fontSize="sm"
                                                                            fontWeight="medium"
                                                                        >
                                                                            {opt.name}
                                                                        </Text>
                                                                        <Text
                                                                            fontSize="xs"
                                                                            color="gray.600"
                                                                            mt={0.5}
                                                                        >
                                                                            {opt.description}
                                                                        </Text>
                                                                    </Box>
                                                                    <Text
                                                                        fontWeight="bold"
                                                                        fontSize="sm"
                                                                        ml={2}
                                                                    >
                                                                        {opt.price === 0 ? (
                                                                            <Text color="green.600">
                                                                                {formatMessage({
                                                                                    defaultMessage:
                                                                                        'Free',
                                                                                    id: 'shipping_options.free'
                                                                                })}
                                                                            </Text>
                                                                        ) : (
                                                                            <FormattedNumber
                                                                                value={opt.price}
                                                                                style="currency"
                                                                                currency={currency}
                                                                            />
                                                                        )}
                                                                    </Text>
                                                                </Flex>
                                                                {opt.shippingPromotions &&
                                                                    opt.shippingPromotions.length >
                                                                        0 && (
                                                                        <VStack
                                                                            spacing={0.5}
                                                                            mt={1}
                                                                            align="flex-start"
                                                                        >
                                                                            {opt.shippingPromotions.map(
                                                                                (promo) => (
                                                                                    <Text
                                                                                        key={
                                                                                            promo.promotionId
                                                                                        }
                                                                                        fontSize="xs"
                                                                                        color="green.600"
                                                                                    >
                                                                                        {
                                                                                            promo.calloutMsg
                                                                                        }
                                                                                    </Text>
                                                                                )
                                                                            )}
                                                                        </VStack>
                                                                    )}
                                                            </Box>
                                                        </Radio>
                                                    )
                                                )}
                                            </Stack>
                                        </RadioGroup>
                                    )}
                                />
                            </Box>
                        )
                    )}
                </VStack>
            </Box>
        </VStack>
    )
}

ShipmentOptions.propTypes = {
    shipment: PropTypes.shape({
        shipmentId: PropTypes.string.isRequired,
        shippingAddress: PropTypes.shape({
            firstName: PropTypes.string,
            lastName: PropTypes.string,
            address1: PropTypes.string,
            city: PropTypes.string,
            stateCode: PropTypes.string,
            postalCode: PropTypes.string
        }),
        shippingMethod: PropTypes.shape({
            id: PropTypes.string
        })
    }).isRequired,
    basketId: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    control: PropTypes.object.isRequired,
    basket: PropTypes.shape({
        productItems: PropTypes.arrayOf(
            PropTypes.shape({
                itemId: PropTypes.string.isRequired,
                shipmentId: PropTypes.string,
                productName: PropTypes.string,
                image: PropTypes.string,
                imageUrl: PropTypes.string,
                primaryImage: PropTypes.string,
                images: PropTypes.array,
                quantity: PropTypes.number,
                variationValues: PropTypes.object,
                variations: PropTypes.object
            })
        )
    }).isRequired
}

export default function ShippingOptions() {
    const {formatMessage} = useIntl()
    const {step, STEPS, goToStep, goToNextStep} = useCheckout()
    const {data: basket, isLoading: isBasketLoading} = useCurrentBasket()
    const {currency} = useCurrency()
    const updateShippingMethod = useShopperBasketsMutation('updateShippingMethodForShipment')

    // Get all shipments that have shipping addresses
    const shipmentsWithAddresses =
        basket?.shipments?.filter((shipment) => shipment.shippingAddress) || []

    // Build initial form values
    const getInitialValues = () => {
        const values = {}
        shipmentsWithAddresses.forEach((shipment) => {
            values[`shippingMethodId_${shipment.shipmentId}`] = shipment.shippingMethod?.id || ''
        })
        return values
    }

    const form = useForm({
        mode: 'onChange',
        defaultValues: getInitialValues()
    })

    // Update form when shipments change
    useEffect(() => {
        const currentValues = form.getValues()
        const newDefaults = getInitialValues()

        // Only reset if there are new fields or values have changed
        const hasNewFields = Object.keys(newDefaults).some((key) => !(key in currentValues))
        if (hasNewFields) {
            form.reset(newDefaults)
        }
    }, [shipmentsWithAddresses.length])

    const submitForm = async (formData) => {
        // Submit shipping method for each shipment
        const promises = shipmentsWithAddresses.map((shipment) => {
            const methodId = formData[`shippingMethodId_${shipment.shipmentId}`]
            if (methodId) {
                return updateShippingMethod.mutateAsync({
                    parameters: {
                        basketId: basket.basketId,
                        shipmentId: shipment.shipmentId
                    },
                    body: {
                        id: methodId
                    }
                })
            }
            return Promise.resolve()
        })

        await Promise.all(promises)
        goToNextStep()
    }

    // Calculate total shipping info
    const totalShippingCost =
        basket?.shippingItems?.reduce((total, item) => {
            return total + (item.priceAfterItemDiscount || item.price || 0)
        }, 0) || 0

    const freeLabel = formatMessage({
        defaultMessage: 'Free',
        id: 'checkout_confirmation.label.free'
    })

    // Check if all shipments have valid shipping info
    const hasValidShippingInfo =
        shipmentsWithAddresses.length > 0 && shipmentsWithAddresses.every((s) => s.shippingAddress)

    const isFormValid =
        form.formState.isValid || shipmentsWithAddresses.every((s) => s.shippingMethod?.id)

    // Show loading spinner if basket is loading
    if (isBasketLoading) {
        return (
            <ToggleCard
                id="step-2"
                title={formatMessage({
                    defaultMessage: 'Shipping & Gift Options',
                    id: 'shipping_options.title.shipping_gift_options'
                })}
                editing={step === STEPS.SHIPPING_OPTIONS}
                isLoading={true}
                disabled={true}
                onEdit={() => goToStep(STEPS.SHIPPING_OPTIONS)}
                editLabel={formatMessage({
                    defaultMessage: 'Edit Shipping Options',
                    id: 'toggle_card.action.editShippingOptions'
                })}
            >
                <ToggleCardEdit>
                    <Box display="flex" justifyContent="center" alignItems="center" minH="200px">
                        <LoadingSpinner />
                    </Box>
                </ToggleCardEdit>
            </ToggleCard>
        )
    }

    return (
        <ToggleCard
            id="step-2"
            title={formatMessage({
                defaultMessage: 'Shipping & Gift Options',
                id: 'shipping_options.title.shipping_gift_options'
            })}
            editing={step === STEPS.SHIPPING_OPTIONS}
            isLoading={form.formState.isSubmitting}
            disabled={!hasValidShippingInfo}
            onEdit={() => goToStep(STEPS.SHIPPING_OPTIONS)}
            editLabel={formatMessage({
                defaultMessage: 'Edit Shipping Options',
                id: 'toggle_card.action.editShippingOptions'
            })}
        >
            <ToggleCardEdit>
                <form
                    onSubmit={form.handleSubmit(submitForm)}
                    data-testid="sf-checkout-shipping-options-form"
                >
                    <Stack spacing={6}>
                        {/* Dynamically create shipping method options for each shipment */}
                        {shipmentsWithAddresses.map((shipment) => (
                            <Box key={shipment.shipmentId}>
                                <ShipmentOptions
                                    shipment={shipment}
                                    basketId={basket.basketId}
                                    currency={currency}
                                    control={form.control}
                                    basket={basket}
                                />
                            </Box>
                        ))}

                        <Box>
                            <Container variant="form">
                                <Button w="full" type="submit" isDisabled={!isFormValid}>
                                    <FormattedMessage
                                        defaultMessage="Continue to Payment"
                                        id="shipping_options.button.continue_to_payment"
                                    />
                                </Button>
                            </Container>
                        </Box>
                    </Stack>
                </form>
            </ToggleCardEdit>

            {hasValidShippingInfo && (
                <ToggleCardSummary>
                    {shipmentsWithAddresses.length === 1 ? (
                        // Single shipment summary
                        <Box>
                            {shipmentsWithAddresses[0].shippingMethod && (
                                <>
                                    <Flex justify="space-between" w="full">
                                        <Text>{shipmentsWithAddresses[0].shippingMethod.name}</Text>
                                        <Text fontWeight="bold">
                                            {totalShippingCost === 0 ? (
                                                freeLabel
                                            ) : (
                                                <FormattedNumber
                                                    value={totalShippingCost}
                                                    style="currency"
                                                    currency={currency}
                                                />
                                            )}
                                        </Text>
                                    </Flex>
                                    <Text fontSize="sm" color="gray.700">
                                        {shipmentsWithAddresses[0].shippingMethod.description}
                                    </Text>
                                </>
                            )}
                        </Box>
                    ) : (
                        // Multiple shipments summary
                        <Stack spacing={2}>
                            {shipmentsWithAddresses.map((shipment) => {
                                const shippingItem = basket.shippingItems?.find(
                                    (item) => item.shipmentId === shipment.shipmentId
                                )
                                const itemCost =
                                    shippingItem?.priceAfterItemDiscount || shippingItem?.price || 0

                                return (
                                    <Box key={shipment.shipmentId}>
                                        <Flex justify="space-between" w="full">
                                            <Box flex="1">
                                                <Text fontWeight="semibold">
                                                    {formatMessage(
                                                        {
                                                            defaultMessage: 'Delivering to {name}',
                                                            id: 'shipping_options.label.delivering_to'
                                                        },
                                                        {
                                                            name: `${shipment.shippingAddress.firstName} ${shipment.shippingAddress.lastName}`
                                                        }
                                                    )}
                                                </Text>
                                                <Text>
                                                    {shipment.shippingAddress.address1},{' '}
                                                    {shipment.shippingAddress.city},{' '}
                                                    {shipment.shippingAddress.stateCode}{' '}
                                                    {shipment.shippingAddress.postalCode}
                                                </Text>
                                                {shipment.shippingMethod ? (
                                                    <>
                                                        <Text mt={2}>
                                                            {shipment.shippingMethod.name}
                                                        </Text>
                                                        <Text fontSize="sm" color="gray.700">
                                                            {shipment.shippingMethod.description}
                                                        </Text>
                                                    </>
                                                ) : (
                                                    <Text mt={2} fontSize="sm" color="gray.500">
                                                        {formatMessage({
                                                            defaultMessage:
                                                                'No shipping method selected',
                                                            id: 'shipping_options.label.no_method_selected'
                                                        })}
                                                    </Text>
                                                )}
                                            </Box>
                                            <Text fontWeight="bold" fontSize="sm">
                                                {itemCost === 0 ? (
                                                    freeLabel
                                                ) : (
                                                    <FormattedNumber
                                                        value={itemCost}
                                                        style="currency"
                                                        currency={currency}
                                                    />
                                                )}
                                            </Text>
                                        </Flex>
                                    </Box>
                                )
                            })}
                            {shipmentsWithAddresses.length > 1 && (
                                <Box borderTopWidth="1px" pt={2} mt={2}>
                                    <Flex justify="space-between" w="full">
                                        <Text fontWeight="semibold">
                                            {formatMessage({
                                                defaultMessage: 'Total Shipping',
                                                id: 'shipping_options.label.total_shipping'
                                            })}
                                        </Text>
                                        <Text fontWeight="bold">
                                            <FormattedNumber
                                                value={totalShippingCost}
                                                style="currency"
                                                currency={currency}
                                            />
                                        </Text>
                                    </Flex>
                                </Box>
                            )}
                        </Stack>
                    )}
                </ToggleCardSummary>
            )}
        </ToggleCard>
    )
}
