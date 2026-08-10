/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {useQuery} from '@tanstack/react-query'
import {
    Box,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    Button,
    Divider,
    Flex,
    Grid,
    Heading,
    Skeleton,
    Stack,
    Text
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useCustomerType, useAccessToken} from '@salesforce/commerce-sdk-react'
import {Redirect, useHistory, useLocation, Link as RouterLink} from 'react-router-dom'
import {ChevronRightIcon} from '@salesforce/retail-react-app/app/components/icons'
import OrderSummary from '@salesforce/retail-react-app/app/components/order-summary'
import OrderStatusBadge from '@salesforce/retail-react-app/app/components/order-status-badge'
import OrderTracking from '@salesforce/retail-react-app/app/components/order-tracking'
import CancelOrderModal from '@salesforce/retail-react-app/app/components/cancel-order-modal'
import ReturnItemsModal from '@salesforce/retail-react-app/app/components/return-items-modal'
import {getReturnableItems} from '@salesforce/retail-react-app/app/utils/return-utils'

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

/**
 * All-or-nothing cancel eligibility: every product item must have its full
 * ordered quantity available to cancel via OMS.
 */
const isCancellable = (order) => {
    if (!order?.productItems?.length) return false
    if (!order.productItems.every((item) => item.omsData)) return false
    return order.productItems.every((item) => {
        const {quantityAvailableToCancel, quantityOrdered} = item.omsData
        return (
            Number.isFinite(quantityAvailableToCancel) &&
            Number.isFinite(quantityOrdered) &&
            quantityAvailableToCancel > 0 &&
            quantityAvailableToCancel === quantityOrdered
        )
    })
}

const GuestOrderLookupOrder = () => {
    const {formatMessage, formatDate, formatTime} = useIntl()
    const {isRegistered} = useCustomerType()
    const history = useHistory()
    const location = useLocation()
    // orderNo comes from verify.jsx via router state; on hard refresh state is gone
    // and orderNo is '', which triggers the guard redirect below.
    const orderNo = location.state?.orderNo || ''
    const {getTokenWhenReady} = useAccessToken()

    // useAccessToken returns a new getTokenWhenReady on every render — store in ref
    // so effects can always call the latest version with a stable dep array.
    const getTokenWhenReadyRef = useRef(getTokenWhenReady)
    useEffect(() => {
        getTokenWhenReadyRef.current = getTokenWhenReady
    })

    const {
        data: order,
        isLoading,
        isError,
        error,
        isFetching,
        isSuccess,
        dataUpdatedAt,
        refetch
    } = useQuery({
        queryKey: ['guestOrderLookup', 'order', orderNo],
        queryFn: async () => {
            const token = await getTokenWhenReadyRef.current()
            const res = await fetch(`/api/order-lookup/order/${encodeURIComponent(orderNo)}`, {
                headers: {Authorization: `Bearer ${token}`}
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
        enabled: !!orderNo,
        retry: false,
        staleTime: 30_000
    })

    // OMS metadata for cancel/return reason codes
    const [omsMeta, setOmsMeta] = useState({
        omsActive: false,
        cancelReasonCodes: [],
        returnReasonCodes: []
    })
    const [omsMetaLoading, setOmsMetaLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        const fetchMeta = async () => {
            try {
                const token = await getTokenWhenReadyRef.current()
                const res = await fetch('/api/order-lookup/oms-meta', {
                    headers: {Authorization: `Bearer ${token}`}
                })
                if (res.ok && !cancelled) setOmsMeta(await res.json())
            } catch {
                // Swallow — omsActive stays false, cancel/return buttons stay hidden
            }
            if (!cancelled) setOmsMetaLoading(false)
        }
        fetchMeta()
        return () => {
            cancelled = true
        }
    }, [])

    // Cancel state
    const [cancelModalOpen, setCancelModalOpen] = useState(false)
    const [cancelSubmitting, setCancelSubmitting] = useState(false)
    const [cancelSuccess, setCancelSuccess] = useState(false)

    // Return state
    const [returnModalOpen, setReturnModalOpen] = useState(false)
    const [returnSubmitting, setReturnSubmitting] = useState(false)
    const [returnError, setReturnError] = useState(null)
    const [returnSuccess, setReturnSuccess] = useState(false)
    const [returnSelection, setReturnSelection] = useState({})

    const returnableItems = useMemo(() => getReturnableItems(order), [order])

    const trackingEntries = useMemo(() => {
        const omsShipments = order?.omsData?.shipments ?? []
        const ecomShipments = order?.shipments ?? []
        const singleMethodFallback =
            omsShipments.length === 1 && ecomShipments.length === 1
                ? ecomShipments[0].shippingMethod?.name
                : undefined
        return omsShipments.length > 0
            ? omsShipments.map((s, i) => ({
                  key: s.id ?? `oms-${i}`,
                  shippingMethodName: s.provider || singleMethodFallback,
                  shippingStatus: s.status,
                  trackingNumber: s.trackingNumber,
                  trackingUrl: s.trackingUrl,
                  expectedDeliveryDate: s.expectedDeliveryDate,
                  actualDeliveryDate: s.actualDeliveryDate
              }))
            : ecomShipments.map((s, i) => ({
                  key: s.shipmentId ?? `ecom-${i}`,
                  shippingMethodName: s.shippingMethod?.name,
                  shippingStatus: s.shippingStatus,
                  trackingNumber: s.trackingNumber
              }))
    }, [order?.omsData?.shipments, order?.shipments])

    const handleCancel = async (orderArg, reason) => {
        setCancelSubmitting(true)
        try {
            const token = await getTokenWhenReady()
            const res = await fetch('/api/order-lookup/cancel', {
                method: 'POST',
                headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
                body: JSON.stringify({orderNo: orderArg.orderNo, ...(reason ? {reason} : {})})
            })
            if (res.ok) {
                setCancelModalOpen(false)
                setCancelSuccess(true)
                refetch()
            }
        } catch {
            // Error handled by modal
        } finally {
            setCancelSubmitting(false)
        }
    }

    const handleReturn = async (productItems) => {
        setReturnError(null)
        setReturnSubmitting(true)
        try {
            const token = await getTokenWhenReady()
            const res = await fetch('/api/order-lookup/return', {
                method: 'POST',
                headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
                body: JSON.stringify({orderNo: order.orderNo, productItems})
            })
            const data = await res.json()
            if (res.ok) {
                setReturnModalOpen(false)
                setReturnSuccess(true)
                refetch()
            } else {
                setReturnError({kind: data.errorKind ?? 'transient'})
            }
        } catch {
            setReturnError({kind: 'transient'})
        } finally {
            setReturnSubmitting(false)
        }
    }

    const handleRefetchReasons = useCallback(async () => {
        try {
            const token = await getTokenWhenReadyRef.current()
            const res = await fetch('/api/order-lookup/oms-meta', {
                headers: {Authorization: `Bearer ${token}`}
            })
            if (res.ok) setOmsMeta(await res.json())
        } catch {
            // Swallow — stale reasons remain
        }
    }, [])

    const handleRefresh = async () => {
        const result = await refetch()
        if (result.error?.status === 404) {
            history.replace('/order-lookup?expired=1')
        }
    }

    if (isRegistered) return <Redirect to="/account/orders" />

    // Missing orderNo (hard refresh clears router state — redirect to request form)
    if (!orderNo) return <Redirect to="/order-lookup" />

    if (isLoading) {
        return (
            <Box layerStyle="page"><Stack spacing={6}>
                <Skeleton height="20px" width="200px" />
                <Stack spacing={2}>
                    <Skeleton height="32px" width="200px" />
                    <Skeleton height="20px" width="150px" />
                </Stack>
                <Skeleton height="300px" />
            </Stack></Box>
        )
    }

    if (isError && error?.status === 404) {
        history.replace('/order-lookup?expired=1')
        return null
    }

    if (isError) {
        return (
            <Box layerStyle="page"><Stack spacing={4}>
                <Box p={4} bg="red.50" borderRadius="md" role="alert">
                    <Text color="red.700">
                        <FormattedMessage
                            id="guestOrderLookup.order.error.generic"
                            defaultMessage="Something went wrong loading your order. Please try again."
                        />
                    </Text>
                    <Button mt={4} onClick={() => refetch()} isLoading={isFetching}>
                        <FormattedMessage
                            id="guestOrderLookup.order.button.retry"
                            defaultMessage="Try Again"
                        />
                    </Button>
                </Box>
            </Stack></Box>
        )
    }

    if (!order) return null

    const itemCount = order.productItems?.reduce((n, item) => n + item.quantity, 0) || 0
    const canCancel = !cancelSuccess && isCancellable(order)
    const canReturn = returnableItems.length > 0
    const showActions = omsMeta.omsActive && !omsMetaLoading && (canCancel || canReturn)

    const shipments = order.shipments || []

    return (
        <Box layerStyle="page" data-testid="guest-order-details-page"><Stack spacing={6}>
            {/* Breadcrumb */}
            <Breadcrumb
                separator={<ChevronRightIcon color="gray.500" boxSize="12px" />}
                fontSize="sm"
                color="gray.600"
            >
                <BreadcrumbItem>
                    <BreadcrumbLink as={RouterLink} to="/">
                        <FormattedMessage
                            id="guestOrderLookup.order.breadcrumb.home"
                            defaultMessage="Home"
                        />
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                    <BreadcrumbLink as={RouterLink} to="/order-lookup">
                        <FormattedMessage
                            id="guestOrderLookup.order.breadcrumb.orderLookup"
                            defaultMessage="Order Lookup"
                        />
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem isCurrentPage>
                    <BreadcrumbLink>#{order.orderNo}</BreadcrumbLink>
                </BreadcrumbItem>
            </Breadcrumb>

            {/* Heading */}
            <Stack spacing={2}>
                <Heading as="h1" fontSize={['lg', '2xl']}>
                    <FormattedMessage
                        id="guestOrderLookup.order.heading"
                        defaultMessage="Order Details"
                    />
                </Heading>
                <Text fontSize={['sm', 'md']}>Order #{order.orderNo}</Text>
                <Text fontSize={['sm', 'md']}>Status: {order.status}</Text>
                {order.creationDate && (
                    <Text fontSize={['sm', 'md']}>
                        <FormattedMessage
                            id="guestOrderLookup.order.orderedDate"
                            defaultMessage="Ordered: {date}"
                            values={{
                                date: formatDate(new Date(order.creationDate), {
                                    year: 'numeric',
                                    day: 'numeric',
                                    month: 'short'
                                })
                            }}
                        />
                    </Text>
                )}
            </Stack>

            {/* Refresh Status button + last-updated */}
            <Flex align="center" gap={4} wrap="wrap">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRefresh}
                    isLoading={isFetching}
                    loadingText={formatMessage({
                        id: 'guestOrderLookup.order.button.refreshing',
                        defaultMessage: 'Refreshing...'
                    })}
                >
                    {formatMessage({
                        id: 'guestOrderLookup.order.button.refresh',
                        defaultMessage: 'Refresh Order Status'
                    })}
                </Button>
                {isSuccess && dataUpdatedAt ? (
                    <Text
                        fontSize="xs"
                        color="gray.500"
                        data-testid="last-updated"
                        aria-live="polite"
                    >
                        {formatMessage(
                            {
                                id: 'guestOrderLookup.order.lastUpdated',
                                defaultMessage: 'Last updated at {time}'
                            },
                            {
                                time: formatTime(new Date(dataUpdatedAt), {
                                    hour: 'numeric',
                                    minute: '2-digit'
                                })
                            }
                        )}
                    </Text>
                ) : null}
            </Flex>

            {/* Cancel / Return buttons */}
            {showActions && (
                <Flex gap={2} direction={{base: 'column', sm: 'row'}} wrap="wrap">
                    {canCancel && (
                        <Button
                            variant="outline"
                            size="sm"
                            width={{base: 'full', sm: 'auto'}}
                            onClick={() => setCancelModalOpen(true)}
                        >
                            <FormattedMessage
                                id="guestOrderLookup.order.button.cancel"
                                defaultMessage="Cancel Order"
                            />
                        </Button>
                    )}
                    {canReturn && (
                        <Button
                            variant="outline"
                            size="sm"
                            width={{base: 'full', sm: 'auto'}}
                            onClick={() => {
                                setReturnError(null)
                                setReturnModalOpen(true)
                            }}
                        >
                            <FormattedMessage
                                id="guestOrderLookup.order.button.return"
                                defaultMessage="Return Items"
                            />
                        </Button>
                    )}
                </Flex>
            )}

            {/* Post-action success banners */}
            {cancelSuccess && (
                <Box p={4} border="1px solid" borderColor="gray.200" borderRadius="base" role="alert">
                    <Text fontWeight="semibold" fontSize="sm">
                        <FormattedMessage
                            id="guestOrderLookup.order.cancel.success"
                            defaultMessage="Your order has been cancelled."
                        />
                    </Text>
                </Box>
            )}
            {returnSuccess && (
                <Box p={4} border="1px solid" borderColor="gray.200" borderRadius="base" role="alert">
                    <Text fontWeight="semibold" fontSize="sm">
                        <FormattedMessage
                            id="guestOrderLookup.order.return.success"
                            defaultMessage="Your return has been submitted."
                        />
                    </Text>
                </Box>
            )}

            {/* Order contents */}
            <Grid templateColumns={{base: '1fr', xl: '60% 1fr'}} gap={{base: 6, xl: 2}}>
                {/* Products + Shipping */}
                <Stack spacing={6}>
                    {/* Product items */}
                    <Stack spacing={4}>
                        <Text fontSize="sm" color="gray.600">
                            <FormattedMessage
                                id="guestOrderLookup.order.itemCount"
                                defaultMessage="{count, plural, one {# item} other {# items}}"
                                values={{count: itemCount}}
                            />
                        </Text>
                        {order.productItems?.map((item) => (
                            <Flex key={item.itemId} gap={4} align="flex-start">
                                <Stack spacing={1} flex="1">
                                    <Text fontWeight="semibold" fontSize="sm">
                                        {item.productName}
                                    </Text>
                                    <Text fontSize="sm" color="gray.600">
                                        Qty: {item.quantity}
                                    </Text>
                                </Stack>
                            </Flex>
                        ))}
                    </Stack>

                    {/* Shipping section */}
                    {shipments.length > 0 && (
                        <Stack spacing={3}>
                            <Heading as="h2" fontSize="md">
                                <FormattedMessage
                                    id="guestOrderLookup.order.section.shipping"
                                    defaultMessage="Shipping"
                                />
                            </Heading>
                            {shipments.map((shipment, i) => (
                                <Stack key={shipment.shipmentId ?? `ship-${i}`} spacing={1}>
                                    {shipment.shippingAddress?.postalCode && (
                                        <Text fontSize="sm">
                                            Postal code: {shipment.shippingAddress.postalCode}
                                        </Text>
                                    )}
                                    {shipment.shippingAddress?.city && (
                                        <Text fontSize="sm">
                                            {[
                                                shipment.shippingAddress.city,
                                                shipment.shippingAddress.stateCode
                                            ]
                                                .filter(Boolean)
                                                .join(', ')}
                                        </Text>
                                    )}
                                </Stack>
                            ))}
                        </Stack>
                    )}

                    {/* Tracking */}
                    {trackingEntries.length > 0 && (
                        <Stack spacing={3} data-testid="guest-order-detail-tracking">
                            <Heading as="h2" fontSize="md">
                                <FormattedMessage
                                    id="guestOrderLookup.order.section.tracking"
                                    defaultMessage="Tracking"
                                />
                            </Heading>
                            {trackingEntries.map(({key, ...entry}) => (
                                <OrderTracking key={key} {...entry} />
                            ))}
                        </Stack>
                    )}
                </Stack>

                {/* Order Summary */}
                <Box py={{base: 6}} px={{base: 6, xl: 8}} background="gray.50" borderRadius="base">
                    <OrderSummary basket={order} fontSize="sm" />
                </Box>
            </Grid>

            {/* Modals */}
            <CancelOrderModal
                isOpen={cancelModalOpen}
                onClose={() => setCancelModalOpen(false)}
                order={order}
                onCancel={handleCancel}
                isSubmitting={cancelSubmitting}
                reasonCodes={omsMeta.cancelReasonCodes}
            />
            <ReturnItemsModal
                isOpen={returnModalOpen}
                onClose={() => {
                    setReturnModalOpen(false)
                    setReturnSelection({})
                }}
                order={order}
                returnableItems={returnableItems}
                reasonCodes={omsMeta.returnReasonCodes}
                selection={returnSelection}
                onSelectionChange={setReturnSelection}
                onSubmit={handleReturn}
                isSubmitting={returnSubmitting}
                submitError={returnError}
                onClearSubmitError={() => setReturnError(null)}
                onRefetchReasons={handleRefetchReasons}
            />
        </Stack></Box>
    )
}

export default GuestOrderLookupOrder
