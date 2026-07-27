/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {useIntl} from 'react-intl'
import {useQuery} from '@tanstack/react-query'
import {
    Box,
    Button,
    Container,
    Divider,
    Flex,
    Heading,
    Skeleton,
    Stack,
    Text
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useCustomerType, useAccessToken} from '@salesforce/commerce-sdk-react'
import {Redirect, useHistory, useLocation} from 'react-router-dom'

// Fields suppressed by the server — asserted here as a client-side security backstop (S10).
// Any value from this set must never appear rendered in the DOM.
export const GUEST_ORDER_CLIENT_SUPPRESSED_FIELDS = new Set([
    'paymentCard',
    'expirationMonth',
    'expirationYear',
    'phone',
    'globalPartyId',
    'orderToken',
    'orderViewCode'
])

const GuestOrderAccessOrder = () => {
    const {formatMessage, formatDate, formatTime, formatNumber} = useIntl()
    const {isRegistered} = useCustomerType()
    const history = useHistory()
    const location = useLocation()
    const {getTokenWhenReady} = useAccessToken()

    // orderNo may come from router state (Step 2 → Step 3 navigation).
    // On refresh there is no router state; the server reads the orderNo from the
    // HttpOnly cookie so the client sends the request without a query param and
    // the server serves whichever verified order is in the cookie.
    const orderNoFromState = location.state?.orderNo

    const queryKey = orderNoFromState
        ? ['guestOrderAccess', 'order', orderNoFromState]
        : ['guestOrderAccess', 'order', '__cookie__']

    const {
        data: order,
        isLoading,
        isError,
        error,
        isFetching,
        dataUpdatedAt,
        refetch,
        isSuccess
    } = useQuery({
        queryKey,
        queryFn: async () => {
            const token = await getTokenWhenReady()
            const url = orderNoFromState
                ? `/api/order-access/order?orderNo=${encodeURIComponent(orderNoFromState)}`
                : '/api/order-access/order'
            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            if (res.status === 404) {
                const err = new Error('Session expired or order not found')
                err.status = 404
                throw err
            }
            if (!res.ok) {
                const err = new Error('Failed to fetch order')
                err.status = res.status
                throw err
            }
            return res.json()
        },
        retry: false,
        staleTime: 0
    })

    // Redirect on 404 (expired session) — useEffect so redirect happens after render
    useEffect(() => {
        if (isError && error?.status === 404) {
            history.replace('/order-access?expired=1')
        }
    }, [isError, error, history])

    if (isRegistered) return <Redirect to="/account/orders" />

    // While loading the first time, show skeleton
    if (isLoading) {
        return (
            <Container maxW="2xl" py={12}>
                <Stack spacing={4}>
                    <Skeleton height="32px" width="60%" />
                    <Skeleton height="20px" width="40%" />
                    <Skeleton height="20px" width="50%" />
                    <Skeleton height="100px" />
                    <Skeleton height="80px" />
                </Stack>
            </Container>
        )
    }

    // Non-404 error state
    if (isError && error?.status !== 404) {
        return (
            <Container maxW="2xl" py={12}>
                <Box p={4} bg="red.50" borderRadius="md" role="alert">
                    <Text color="red.700">
                        {formatMessage({
                            id: 'guestOrderAccess.order.error.generic',
                            defaultMessage:
                                'Something went wrong loading your order. Please try again.'
                        })}
                    </Text>
                    <Button mt={4} onClick={() => refetch()} isLoading={isFetching}>
                        {formatMessage({
                            id: 'guestOrderAccess.order.button.retry',
                            defaultMessage: 'Try Again'
                        })}
                    </Button>
                </Box>
            </Container>
        )
    }

    if (!order) return null

    const orderDate = order.creationDate
        ? formatDate(new Date(order.creationDate), {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
          })
        : null

    const lastUpdatedTime =
        isSuccess && dataUpdatedAt
            ? formatTime(new Date(dataUpdatedAt), {
                  hour: 'numeric',
                  minute: '2-digit',
                  second: '2-digit'
              })
            : null

    const handleRefresh = async () => {
        const result = await refetch()
        if (result.error?.status === 404) {
            history.replace('/order-access?expired=1')
        }
    }

    return (
        <Container maxW="2xl" py={12}>
            <Stack spacing={8}>
                {/* Header */}
                <Flex justify="space-between" align="flex-start" flexWrap="wrap" gap={3}>
                    <Box>
                        <Heading as="h1" fontSize="2xl" mb={1}>
                            {formatMessage({
                                id: 'guestOrderAccess.order.heading',
                                defaultMessage: 'Order Details'
                            })}
                        </Heading>
                        {order.orderNo && (
                            <Text color="gray.600" fontSize="sm">
                                {formatMessage(
                                    {
                                        id: 'guestOrderAccess.order.orderNumber',
                                        defaultMessage: 'Order #{orderNo}'
                                    },
                                    {orderNo: order.orderNo}
                                )}
                            </Text>
                        )}
                        {orderDate && (
                            <Text color="gray.600" fontSize="sm">
                                {formatMessage(
                                    {
                                        id: 'guestOrderAccess.order.placedOn',
                                        defaultMessage: 'Placed on {date}'
                                    },
                                    {date: orderDate}
                                )}
                            </Text>
                        )}
                        {order.status && (
                            <Text fontWeight="semibold" mt={1}>
                                {formatMessage(
                                    {
                                        id: 'guestOrderAccess.order.status',
                                        defaultMessage: 'Status: {status}'
                                    },
                                    {status: order.status}
                                )}
                            </Text>
                        )}
                    </Box>

                    {/* Refresh Status + Last Updated (S11) */}
                    <Box textAlign={{base: 'left', md: 'right'}}>
                        <Button
                            onClick={handleRefresh}
                            isLoading={isFetching}
                            loadingText={formatMessage({
                                id: 'guestOrderAccess.order.button.refreshing',
                                defaultMessage: 'Refreshing…'
                            })}
                            variant="outline"
                            size="sm"
                            aria-label={formatMessage({
                                id: 'guestOrderAccess.order.button.refreshStatus.aria',
                                defaultMessage: 'Refresh order status'
                            })}
                        >
                            {formatMessage({
                                id: 'guestOrderAccess.order.button.refreshStatus',
                                defaultMessage: 'Refresh Status'
                            })}
                        </Button>
                        {lastUpdatedTime && (
                            <Text fontSize="xs" color="gray.500" mt={1} data-testid="last-updated">
                                {formatMessage(
                                    {
                                        id: 'guestOrderAccess.order.lastUpdated',
                                        defaultMessage: 'Last updated at {time}'
                                    },
                                    {time: lastUpdatedTime}
                                )}
                            </Text>
                        )}
                    </Box>
                </Flex>

                <Divider />

                {/* Order Items */}
                {order.productItems && order.productItems.length > 0 && (
                    <Box>
                        <Heading as="h2" fontSize="lg" mb={4}>
                            {formatMessage({
                                id: 'guestOrderAccess.order.section.items',
                                defaultMessage: 'Items'
                            })}
                        </Heading>
                        <Stack spacing={4} divider={<Divider />}>
                            {order.productItems.map((item, idx) => {
                                const price =
                                    item.adjustedPrice != null
                                        ? formatNumber(item.adjustedPrice, {
                                              style: 'currency',
                                              currency: order.currency || 'USD'
                                          })
                                        : item.price != null
                                        ? formatNumber(item.price, {
                                              style: 'currency',
                                              currency: order.currency || 'USD'
                                          })
                                        : null

                                return (
                                    <Flex
                                        key={item.itemId || idx}
                                        justify="space-between"
                                        align="flex-start"
                                    >
                                        <Box flex="1" pr={4}>
                                            <Text fontWeight="medium">
                                                {item.productName ||
                                                    item.itemText ||
                                                    formatMessage({
                                                        id: 'guestOrderAccess.order.item.unnamed',
                                                        defaultMessage: 'Product'
                                                    })}
                                            </Text>
                                            <Text fontSize="sm" color="gray.600">
                                                {formatMessage(
                                                    {
                                                        id: 'guestOrderAccess.order.item.qty',
                                                        defaultMessage: 'Qty: {qty}'
                                                    },
                                                    {qty: item.quantity ?? 1}
                                                )}
                                            </Text>
                                        </Box>
                                        {price && (
                                            <Text fontWeight="medium" flexShrink={0}>
                                                {price}
                                            </Text>
                                        )}
                                    </Flex>
                                )
                            })}
                        </Stack>
                    </Box>
                )}

                <Divider />

                {/* Shipping info — postalCode only per field allowlist */}
                {order.shipments && order.shipments.length > 0 && (
                    <Box>
                        <Heading as="h2" fontSize="lg" mb={3}>
                            {formatMessage({
                                id: 'guestOrderAccess.order.section.shipping',
                                defaultMessage: 'Shipping'
                            })}
                        </Heading>
                        {order.shipments.map((shipment, idx) => (
                            <Box key={shipment.shipmentId || idx} mb={3}>
                                {shipment.shippingStatus && (
                                    <Text fontSize="sm">
                                        {formatMessage(
                                            {
                                                id: 'guestOrderAccess.order.shipping.status',
                                                defaultMessage: 'Shipping status: {status}'
                                            },
                                            {status: shipment.shippingStatus}
                                        )}
                                    </Text>
                                )}
                                {shipment.shippingAddress?.postalCode && (
                                    <Text fontSize="sm" color="gray.600">
                                        {formatMessage(
                                            {
                                                id: 'guestOrderAccess.order.shipping.postalCode',
                                                defaultMessage: 'Postal code: {postalCode}'
                                            },
                                            {postalCode: shipment.shippingAddress.postalCode}
                                        )}
                                    </Text>
                                )}
                                {shipment.expectedDeliveryDate && (
                                    <Text fontSize="sm" color="gray.600">
                                        {formatMessage(
                                            {
                                                id: 'guestOrderAccess.order.shipping.expectedDelivery',
                                                defaultMessage: 'Expected delivery: {date}'
                                            },
                                            {
                                                date: formatDate(
                                                    new Date(shipment.expectedDeliveryDate),
                                                    {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    }
                                                )
                                            }
                                        )}
                                    </Text>
                                )}
                                {shipment.trackingNumber && (
                                    <Text fontSize="sm" color="gray.600">
                                        {formatMessage(
                                            {
                                                id: 'guestOrderAccess.order.shipping.tracking',
                                                defaultMessage: 'Tracking: {trackingNumber}'
                                            },
                                            {trackingNumber: shipment.trackingNumber}
                                        )}
                                    </Text>
                                )}
                            </Box>
                        ))}
                    </Box>
                )}

                <Divider />

                {/* Order Totals */}
                <Box>
                    <Heading as="h2" fontSize="lg" mb={3}>
                        {formatMessage({
                            id: 'guestOrderAccess.order.section.totals',
                            defaultMessage: 'Order Summary'
                        })}
                    </Heading>
                    <Stack spacing={2}>
                        {order.productSubTotal != null && (
                            <Flex justify="space-between">
                                <Text>
                                    {formatMessage({
                                        id: 'guestOrderAccess.order.totals.subtotal',
                                        defaultMessage: 'Subtotal'
                                    })}
                                </Text>
                                <Text>
                                    {formatNumber(order.productSubTotal, {
                                        style: 'currency',
                                        currency: order.currency || 'USD'
                                    })}
                                </Text>
                            </Flex>
                        )}
                        {order.shippingTotal != null && (
                            <Flex justify="space-between">
                                <Text>
                                    {formatMessage({
                                        id: 'guestOrderAccess.order.totals.shipping',
                                        defaultMessage: 'Shipping'
                                    })}
                                </Text>
                                <Text>
                                    {formatNumber(order.shippingTotal, {
                                        style: 'currency',
                                        currency: order.currency || 'USD'
                                    })}
                                </Text>
                            </Flex>
                        )}
                        {order.taxTotal != null && (
                            <Flex justify="space-between">
                                <Text>
                                    {formatMessage({
                                        id: 'guestOrderAccess.order.totals.tax',
                                        defaultMessage: 'Tax'
                                    })}
                                </Text>
                                <Text>
                                    {formatNumber(order.taxTotal, {
                                        style: 'currency',
                                        currency: order.currency || 'USD'
                                    })}
                                </Text>
                            </Flex>
                        )}
                        {order.orderTotal != null && (
                            <Flex
                                justify="space-between"
                                fontWeight="bold"
                                pt={2}
                                borderTopWidth="1px"
                            >
                                <Text>
                                    {formatMessage({
                                        id: 'guestOrderAccess.order.totals.total',
                                        defaultMessage: 'Total'
                                    })}
                                </Text>
                                <Text>
                                    {formatNumber(order.orderTotal, {
                                        style: 'currency',
                                        currency: order.currency || 'USD'
                                    })}
                                </Text>
                            </Flex>
                        )}
                    </Stack>
                </Box>
            </Stack>
        </Container>
    )
}

export default GuestOrderAccessOrder
