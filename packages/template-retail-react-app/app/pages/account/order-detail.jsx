/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {useHistory, useRouteMatch} from 'react-router'
import {
    Box,
    Heading,
    Text,
    Stack,
    Badge,
    Flex,
    Button,
    Divider,
    Grid,
    Link as ChakraLink,
    SimpleGrid,
    Skeleton,
    useDisclosure
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {getCreditCardIcon} from '@salesforce/retail-react-app/app/utils/cc-utils'
import {
    useOrder,
    useProducts,
    useStores,
    useCustomerType,
    useCustomerId
} from '@salesforce/commerce-sdk-react'
import Link from '@salesforce/retail-react-app/app/components/link'
import {ChevronLeftIcon, CloseIcon} from '@salesforce/retail-react-app/app/components/icons'
import OrderSummary from '@salesforce/retail-react-app/app/components/order-summary'
import ItemVariantProvider from '@salesforce/retail-react-app/app/components/item-variant'
import CartItemVariantImage from '@salesforce/retail-react-app/app/components/item-variant/item-image'
import CartItemVariantName from '@salesforce/retail-react-app/app/components/item-variant/item-name'
import CartItemVariantAttributes from '@salesforce/retail-react-app/app/components/item-variant/item-attributes'
import CartItemVariantPrice from '@salesforce/retail-react-app/app/components/item-variant/item-price'
import StoreDisplay from '@salesforce/retail-react-app/app/components/store-display'
import {groupShipmentsByDeliveryOption} from '@salesforce/retail-react-app/app/utils/shipment-utils'
import {STORE_LOCATOR_IS_ENABLED} from '@salesforce/retail-react-app/app/constants'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {consolidateDuplicateBonusProducts} from '@salesforce/retail-react-app/app/utils/bonus-product/cart'
import CancelOrderModal from '@salesforce/retail-react-app/app/components/cancel-order-modal'
import PropTypes from 'prop-types'
const onClient = typeof window !== 'undefined'

const OrderProducts = ({productItems, currency}) => {
    const orderProductIds = productItems.map((product) => product.productId)
    const {data: products, isLoading} = useProducts(
        {
            parameters: {
                ids: orderProductIds
            }
        },
        {
            enabled: !!orderProductIds && onClient,
            select: (result) => {
                return result?.data?.reduce((result, item) => {
                    const key = item.id
                    result[key] = item
                    return result
                }, {})
            }
        }
    )
    const consolidatedItems = consolidateDuplicateBonusProducts(productItems || [])
    const variants = consolidatedItems?.map((item) => {
        const product = products?.[item.productId]
        return {
            ...(product ? product : {}),
            isProductUnavailable: !product,
            ...item
        }
    })

    return (
        <>
            {!isLoading &&
                variants?.map((variant, index) => {
                    return (
                        <Box
                            p={[4, 6]}
                            key={index}
                            border="1px solid"
                            borderColor="gray.100"
                            borderRadius="base"
                        >
                            <ItemVariantProvider variant={variant} currency={currency}>
                                <Flex width="full" alignItems="flex-start">
                                    <CartItemVariantImage width={['88px', 36]} mr={4} />
                                    <Stack spacing={1} marginTop="-3px" flex={1}>
                                        <CartItemVariantName />
                                        <Flex
                                            width="full"
                                            justifyContent="space-between"
                                            alignItems="flex-end"
                                        >
                                            <CartItemVariantAttributes
                                                includeQuantity
                                                currency={currency}
                                            />
                                            <CartItemVariantPrice currency={currency} />
                                        </Flex>
                                    </Stack>
                                </Flex>
                            </ItemVariantProvider>
                        </Box>
                    )
                })}
        </>
    )
}

OrderProducts.propTypes = {
    productItems: PropTypes.array.isRequired,
    currency: PropTypes.string
}

const CANCEL_INELIGIBLE_STATUSES = ['cancelled', 'canceled', 'completed', 'failed']

const AccountOrderDetail = () => {
    const {params} = useRouteMatch()
    const history = useHistory()
    const {formatMessage, formatDate} = useIntl()
    const storeLocatorEnabled = getConfig()?.app?.storeLocatorEnabled ?? STORE_LOCATOR_IS_ENABLED
    const isOmsEnabled = getConfig()?.app?.oms?.enabled
    const {isRegistered} = useCustomerType()
    const customerId = useCustomerId()
    const {
        isOpen: isCancelModalOpen,
        onOpen: openCancelModal,
        onClose: closeCancelModal
    } = useDisclosure()
    // TODO: W-22806925 — replace dummy feedback with real API response
    const [cancelFeedback, setCancelFeedback] = useState(null)

    // expand: 'oms' returns order data from OMS if the order is successfully
    // ingested to OMS, otherwise returns data from ECOM
    // For regular non-oms orders, the order data is returned from ECOM
    const {data: order, isLoading: isOrderLoading} = useOrder(
        {
            parameters: {
                orderNo: params.orderNo,
                expand: 'oms, oms_shipments'
            }
        },
        {
            enabled: onClient && !!params.orderNo
        }
    )
    const isLoading = isOrderLoading || !order

    // Check if order has OMS data
    const isOmsOrder = useMemo(() => !!order?.omsData, [order?.omsData])

    const omsShipmentCount = order?.omsData?.shipments?.length ?? 0
    const ecomShipmentCount = order?.shipments?.length ?? 0

    const hasOmsShipment = useMemo(() => omsShipmentCount > 0, [omsShipmentCount])

    const isMultiShipmentOrder = useMemo(
        () => omsShipmentCount > 1 || ecomShipmentCount > 1,
        [omsShipmentCount, ecomShipmentCount]
    )

    const showMultiShipmentsFromOmsOnly = isOmsOrder && hasOmsShipment && isMultiShipmentOrder

    const canCancel = useMemo(() => {
        if (!isOmsEnabled || !isRegistered || !order) return false
        const ownsOrder = order.customerInfo?.customerId === customerId
        if (!ownsOrder) return false
        const status = (order.omsData?.status || order.status || '').toLowerCase()
        const statusEligible = !CANCEL_INELIGIBLE_STATUSES.includes(status)
        const shippingStatus = (order.shippingStatus || '').toLowerCase()
        const shippingEligible = shippingStatus === 'not_shipped'
        return statusEligible && shippingEligible
    }, [isOmsEnabled, isRegistered, order, customerId])

    const showCancelSuccess = useCallback(() => {
        setCancelFeedback({
            status: 'success',
            title: formatMessage({
                defaultMessage: 'Order cancelled',
                id: 'account_order_detail.alert.cancellation_success_title'
            }),
            description: formatMessage({
                defaultMessage: 'Your order was cancelled successfully.',
                id: 'account_order_detail.alert.cancellation_success_description'
            })
        })
    }, [formatMessage])

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const showCancelError = useCallback(() => {
        setCancelFeedback({
            status: 'error',
            title: formatMessage({
                defaultMessage: 'Unable to cancel order',
                id: 'account_order_detail.alert.cancellation_error_title'
            }),
            description: formatMessage({
                defaultMessage:
                    'We could not cancel this order. Please try again or contact support.',
                id: 'account_order_detail.alert.cancellation_error_description'
            })
        })
    }, [formatMessage])

    const handleCancelOrder = useCallback(() => {
        // TODO: W-22806925 — replace with real SCAPI cancel API call
        // On success: showCancelSuccess()
        // On error: showCancelError()
        closeCancelModal()
        // Delay allows screen readers to finish announcing modal close before the alert
        setTimeout(showCancelSuccess, 300)
    }, [closeCancelModal, showCancelSuccess])

    const {pickupShipments, deliveryShipments} = useMemo(() => {
        return storeLocatorEnabled
            ? groupShipmentsByDeliveryOption(order)
            : {pickupShipments: [], deliveryShipments: order?.shipments || []}
    }, [order?.shipments, storeLocatorEnabled])

    const storeIds = useMemo(
        () => pickupShipments.map((shipment) => shipment.c_fromStoreId).filter(Boolean),
        [pickupShipments]
    )

    const {data: storeData} = useStores(
        {
            parameters: {
                ids: storeIds.join(',')
            }
        },
        {
            enabled: storeIds.length > 0 && onClient
        }
    )

    const getStoreData = useCallback(
        (storeId) => {
            if (!storeData?.data) return null
            return storeData.data.find((store) => store.id === storeId)
        },
        [storeData?.data]
    )

    const renderShippingMethod = (
        shippingMethodName,
        shippingStatus,
        trackingNumber,
        trackingUrl,
        shipmentsLength,
        index
    ) => (
        <Stack spacing={1}>
            <Heading as="h2" fontSize="sm" pt={1}>
                {shipmentsLength > 1 ? (
                    <FormattedMessage
                        defaultMessage="Shipping Method {number}"
                        id="account_order_detail.heading.shipping_method_number"
                        values={{number: index + 1}}
                    />
                ) : (
                    <FormattedMessage
                        defaultMessage="Shipping Method"
                        id="account_order_detail.heading.shipping_method"
                    />
                )}
            </Heading>
            <Box>
                <Text fontSize="sm" textTransform="titlecase">
                    {{
                        not_shipped: formatMessage({
                            defaultMessage: 'Not shipped',
                            id: 'account_order_detail.shipping_status.not_shipped'
                        }),
                        part_shipped: formatMessage({
                            defaultMessage: 'Partially shipped',
                            id: 'account_order_detail.shipping_status.part_shipped'
                        }),
                        shipped: formatMessage({
                            defaultMessage: 'Shipped',
                            id: 'account_order_detail.shipping_status.shipped'
                        })
                    }[shippingStatus] || shippingStatus}
                </Text>
                <Text fontSize="sm">{shippingMethodName}</Text>
                {trackingNumber && (
                    <Text fontSize="sm">
                        <FormattedMessage
                            defaultMessage="Tracking Number"
                            id="account_order_detail.label.tracking_number"
                        />
                        :{' '}
                        {trackingUrl ? (
                            <ChakraLink href={trackingUrl} isExternal color="blue.600">
                                {trackingNumber}
                            </ChakraLink>
                        ) : (
                            trackingNumber
                        )}
                    </Text>
                )}
            </Box>
        </Stack>
    )

    const paymentCard = order?.paymentInstruments?.[0]?.paymentCard
    const CardIcon = getCreditCardIcon(paymentCard?.cardType)
    const itemCount = order?.productItems?.reduce((count, item) => item.quantity + count, 0) || 0

    const headingRef = useRef()
    useEffect(() => {
        // Focus the 'Order Details' header when the component mounts for accessibility
        headingRef?.current?.focus()
    }, [])

    return (
        <Stack spacing={6} data-testid="account-order-details-page">
            <Stack>
                <Box>
                    <Button
                        as={Link}
                        to={'/account/orders'}
                        variant="link"
                        leftIcon={<ChevronLeftIcon />}
                        size="sm"
                        onClick={(e) => {
                            if (history.action === 'PUSH') {
                                e.preventDefault()
                                history.goBack()
                            }
                        }}
                    >
                        <FormattedMessage
                            defaultMessage="Back to Order History"
                            id="account_order_detail.link.back_to_history"
                        />
                    </Button>
                </Box>

                <Box role="alert" aria-live="assertive" aria-atomic="true">
                    {cancelFeedback && (
                        <Box p={4} border="1px solid" borderColor="gray.200" borderRadius="base">
                            <Text
                                fontWeight="semibold"
                                fontSize="sm"
                                color={cancelFeedback.status === 'error' ? 'red.700' : undefined}
                            >
                                {cancelFeedback.title}
                            </Text>
                            <Text
                                fontSize="sm"
                                color={cancelFeedback.status === 'error' ? 'red.700' : 'gray.600'}
                            >
                                {cancelFeedback.description}
                            </Text>
                        </Box>
                    )}
                </Box>

                <Stack spacing={[1, 2]}>
                    <Flex justify="space-between" align="center">
                        <Heading as="h1" fontSize={['lg', '2xl']} tabIndex="0" ref={headingRef}>
                            <FormattedMessage
                                defaultMessage="Order Details"
                                id="account_order_detail.title.order_details"
                            />
                        </Heading>
                        {!isLoading && (
                            <Badge
                                colorScheme={cancelFeedback?.status === 'success' ? 'red' : 'green'}
                            >
                                {cancelFeedback?.status === 'success' ? (
                                    <Flex display="inline-flex" alignItems="center" gap={1}>
                                        <CloseIcon boxSize={2} aria-hidden />
                                        {formatMessage({
                                            defaultMessage: 'Cancelled',
                                            id: 'account_order_detail.badge.cancelled'
                                        })}
                                    </Flex>
                                ) : (
                                    order.status || order.omsData?.status
                                )}
                            </Badge>
                        )}
                    </Flex>

                    {!isLoading ? (
                        <Stack
                            direction={['column', 'row']}
                            alignItems={['flex-start', 'center']}
                            spacing={[0, 3]}
                            divider={
                                <Divider
                                    visibility={{base: 'visible'}}
                                    orientation="vertical"
                                    h={[0, 4]}
                                />
                            }
                        >
                            <Text fontSize={['sm', 'md']}>
                                <FormattedMessage
                                    defaultMessage="Ordered: {date}"
                                    id="account_order_detail.label.ordered_date"
                                    values={{
                                        date: formatDate(new Date(order.creationDate), {
                                            year: 'numeric',
                                            day: 'numeric',
                                            month: 'short'
                                        })
                                    }}
                                />
                            </Text>
                            <Text fontSize={['sm', 'md']}>
                                <FormattedMessage
                                    defaultMessage="Order Number: {orderNumber}"
                                    id="account_order_detail.label.order_number"
                                    values={{orderNumber: order.orderNo}}
                                />
                            </Text>
                        </Stack>
                    ) : (
                        <Skeleton h="20px" w="192px" />
                    )}
                </Stack>
            </Stack>

            {!isLoading && isOmsEnabled && (
                <Box>
                    <Text
                        fontSize="xs"
                        fontWeight="semibold"
                        textTransform="uppercase"
                        letterSpacing="wide"
                        color="gray.500"
                        mb={2}
                    >
                        <FormattedMessage
                            defaultMessage="Order Actions"
                            id="account_order_detail.heading.order_actions"
                        />
                    </Text>
                    <Flex gap={2} wrap="wrap">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setCancelFeedback(null)
                                openCancelModal()
                            }}
                            isDisabled={!canCancel || cancelFeedback?.status === 'success'}
                        >
                            <FormattedMessage
                                defaultMessage="Cancel order"
                                id="account_order_detail.button.cancel_order"
                            />
                        </Button>
                    </Flex>
                </Box>
            )}

            <Box layerStyle="cardBordered">
                <Grid templateColumns={{base: '1fr', xl: '60% 1fr'}} gap={{base: 6, xl: 2}}>
                    <SimpleGrid columns={{base: 1, sm: 2}} columnGap={4} rowGap={5} py={{xl: 6}}>
                        {isLoading ? (
                            <>
                                <Stack>
                                    <Skeleton h="20px" w="84px" />
                                    <Skeleton h="20px" w="112px" />
                                    <Skeleton h="20px" w="56px" />
                                </Stack>
                                <Stack>
                                    <Skeleton h="20px" w="84px" />
                                    <Skeleton h="20px" w="56px" />
                                </Stack>
                                <Stack>
                                    <Skeleton h="20px" w="112px" />
                                    <Skeleton h="20px" w="84px" />
                                    <Skeleton h="20px" w="56px" />
                                </Stack>
                                <Stack>
                                    <Skeleton h="20px" w="60px" />
                                    <Skeleton h="20px" w="84px" />
                                    <Skeleton h="20px" w="56px" />
                                </Stack>
                            </>
                        ) : (
                            <>
                                {/* Pickup Shipments */}
                                {pickupShipments.map((shipment, index) => {
                                    const storeData = getStoreData(shipment.c_fromStoreId)
                                    return (
                                        <Stack
                                            spacing={1}
                                            key={`pickup-${index}`}
                                            gridColumn={{sm: 'span 2'}}
                                        >
                                            <Heading as="h2" fontSize="sm" pt={1}>
                                                {pickupShipments.length > 1 ? (
                                                    <FormattedMessage
                                                        defaultMessage="Pickup Address {number}"
                                                        id="account_order_detail.heading.pickup_address_number"
                                                        values={{number: index + 1}}
                                                    />
                                                ) : (
                                                    <FormattedMessage
                                                        defaultMessage="Pickup Address"
                                                        id="account_order_detail.heading.pickup_address"
                                                    />
                                                )}
                                            </Heading>
                                            <Box>
                                                {storeData ? (
                                                    <StoreDisplay
                                                        store={storeData}
                                                        showDistance={false}
                                                        showEmail={false}
                                                        showPhone={true}
                                                        showStoreHours={false}
                                                    />
                                                ) : (
                                                    <Text fontSize="sm">
                                                        <FormattedMessage
                                                            defaultMessage="Pick up from Store {storeId}"
                                                            id="account_order_detail.label.pickup_from_store"
                                                            values={{
                                                                storeId: shipment.c_fromStoreId
                                                            }}
                                                        />
                                                    </Text>
                                                )}
                                            </Box>
                                        </Stack>
                                    )
                                })}
                                {/* Any type of Non-OMS or any type of single shipment order: show DeliveryMethods and Shipments info*/}
                                {!showMultiShipmentsFromOmsOnly &&
                                    deliveryShipments.map((shipment, index) => {
                                        const omsShipment = isOmsOrder
                                            ? order.omsData.shipments?.[index]
                                            : null

                                        const shippingMethodName =
                                            omsShipment?.provider || shipment.shippingMethod?.name
                                        const shippingStatus =
                                            omsShipment?.status || shipment.shippingStatus
                                        const trackingNumber =
                                            omsShipment?.trackingNumber || shipment.trackingNumber
                                        const trackingUrl = omsShipment?.trackingUrl

                                        return (
                                            <React.Fragment key={`delivery-${index}`}>
                                                {renderShippingMethod(
                                                    shippingMethodName,
                                                    shippingStatus,
                                                    trackingNumber,
                                                    trackingUrl,
                                                    deliveryShipments.length,
                                                    index
                                                )}
                                                <Stack spacing={1}>
                                                    <Heading as="h2" fontSize="sm" pt={1}>
                                                        {deliveryShipments.length > 1 ? (
                                                            <FormattedMessage
                                                                defaultMessage="Shipping Address {number}"
                                                                id="account_order_detail.heading.shipping_address_number"
                                                                values={{number: index + 1}}
                                                            />
                                                        ) : (
                                                            <FormattedMessage
                                                                defaultMessage="Shipping Address"
                                                                id="account_order_detail.heading.shipping_address"
                                                            />
                                                        )}
                                                    </Heading>
                                                    <Box>
                                                        <Text fontSize="sm">
                                                            {shipment.shippingAddress.firstName &&
                                                            shipment.shippingAddress.lastName
                                                                ? `${shipment.shippingAddress.firstName} ${shipment.shippingAddress.lastName}`
                                                                : shipment.shippingAddress.fullName}
                                                        </Text>
                                                        <Text fontSize="sm">
                                                            {shipment.shippingAddress.address1}
                                                        </Text>
                                                        <Text fontSize="sm">
                                                            {shipment.shippingAddress.city},{' '}
                                                            {shipment.shippingAddress.stateCode}{' '}
                                                            {shipment.shippingAddress.postalCode}
                                                        </Text>
                                                    </Box>
                                                </Stack>
                                            </React.Fragment>
                                        )
                                    })}

                                {/* Any OMS multi-shipment: Only show OMS Shipments info;*/}
                                {showMultiShipmentsFromOmsOnly &&
                                    order?.omsData?.shipments?.map((shipment, index) => (
                                        <React.Fragment key={`oms-shipment-${index}`}>
                                            {renderShippingMethod(
                                                shipment.provider,
                                                shipment.status,
                                                shipment.trackingNumber,
                                                shipment.trackingUrl,
                                                omsShipmentCount,
                                                index
                                            )}
                                        </React.Fragment>
                                    ))}

                                {/* Payment Method */}
                                {paymentCard && (
                                    <Stack spacing={1}>
                                        <Heading as="h2" fontSize="sm" pt={1}>
                                            <FormattedMessage
                                                defaultMessage="Payment Method"
                                                id="account_order_detail.heading.payment_method"
                                            />
                                        </Heading>
                                        <Stack direction="row">
                                            {CardIcon && (
                                                <CardIcon layerStyle="ccIcon" aria-hidden="true" />
                                            )}
                                            <Box>
                                                <Text fontSize="sm">{paymentCard?.cardType}</Text>
                                                <Stack direction="row">
                                                    <Text fontSize="sm">
                                                        &bull;&bull;&bull;&bull;{' '}
                                                        {paymentCard?.numberLastDigits}
                                                    </Text>
                                                    <Text fontSize="sm">
                                                        {paymentCard?.expirationMonth}/
                                                        {paymentCard?.expirationYear}
                                                    </Text>
                                                </Stack>
                                            </Box>
                                        </Stack>
                                    </Stack>
                                )}

                                {/* Billing Address */}
                                <Stack spacing={1}>
                                    <Heading as="h2" fontSize="sm" pt={1}>
                                        <FormattedMessage
                                            defaultMessage="Billing Address"
                                            id="account_order_detail.heading.billing_address"
                                        />
                                    </Heading>
                                    <Box>
                                        <Text fontSize="sm">
                                            {order.billingAddress.firstName}{' '}
                                            {order.billingAddress.lastName}
                                        </Text>
                                        <Text fontSize="sm">{order.billingAddress.address1}</Text>
                                        <Text fontSize="sm">
                                            {order.billingAddress.city},{' '}
                                            {order.billingAddress.stateCode}{' '}
                                            {order.billingAddress.postalCode}
                                        </Text>
                                    </Box>
                                </Stack>
                            </>
                        )}
                    </SimpleGrid>

                    {!isLoading ? (
                        <Box
                            py={{base: 6}}
                            px={{base: 6, xl: 8}}
                            background="gray.50"
                            borderRadius="base"
                        >
                            <OrderSummary basket={order} fontSize="sm" />
                        </Box>
                    ) : (
                        <Skeleton h="full" />
                    )}
                </Grid>
            </Box>

            <Stack spacing={4}>
                {!isLoading && (
                    <Text>
                        <FormattedMessage
                            defaultMessage="{count} items"
                            values={{count: itemCount}}
                            id="account_order_detail.heading.num_of_items"
                        />
                    </Text>
                )}

                <Stack spacing={4}>
                    {isLoading ? (
                        [1, 2, 3].map((i) => (
                            <Box
                                key={i}
                                p={[4, 6]}
                                border="1px solid"
                                borderColor="gray.100"
                                borderRadius="base"
                            >
                                <Flex width="full" align="flex-start">
                                    <Skeleton boxSize={['88px', 36]} mr={4} />

                                    <Stack spacing={2}>
                                        <Skeleton h="20px" w="112px" />
                                        <Skeleton h="20px" w="84px" />
                                        <Skeleton h="20px" w="140px" />
                                    </Stack>
                                </Flex>
                            </Box>
                        ))
                    ) : (
                        <OrderProducts
                            productItems={order.productItems}
                            currency={order.currency}
                        />
                    )}
                </Stack>
            </Stack>

            {isOmsEnabled && (
                <CancelOrderModal
                    isOpen={isCancelModalOpen}
                    onClose={closeCancelModal}
                    order={order}
                    onCancel={handleCancelOrder}
                />
            )}
        </Stack>
    )
}

AccountOrderDetail.getTemplateName = () => 'account-order-history'

export default AccountOrderDetail
