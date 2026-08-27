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
    SimpleGrid,
    Skeleton,
    Stack,
    Text,
    useStyleConfig
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useCustomerType, useAccessToken} from '@salesforce/commerce-sdk-react'
import {Redirect, useParams, Link as RouterLink} from 'react-router-dom'
import {ChevronRightIcon} from '@salesforce/retail-react-app/app/components/icons'
import OrderSummary from '@salesforce/retail-react-app/app/components/order-summary'
import OrderProducts, {
    groupProductItemsByShipmentId
} from '@salesforce/retail-react-app/app/components/order-products'
import OrderStatusBadge from '@salesforce/retail-react-app/app/components/order-status-badge'
import ShipmentStatusLabel from '@salesforce/retail-react-app/app/components/order-tracking/shipment-status-label'
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
    const {formatDate} = useIntl()
    const breadcrumbStyles = useStyleConfig('Breadcrumb')
    const {isRegistered} = useCustomerType()
    const {orderNo} = useParams()
    const {getTokenWhenReady} = useAccessToken()

    // useAccessToken returns a new getTokenWhenReady on every render — store in ref
    // so effects can always call the latest version with a stable dep array.
    const getTokenWhenReadyRef = useRef(getTokenWhenReady)
    // eslint-disable-next-line use-effect-no-deps/use-effect-no-deps -- intentionally runs every render to keep the ref current
    useEffect(() => {
        getTokenWhenReadyRef.current = getTokenWhenReady
    })

    const {
        data: order,
        isLoading,
        isError,
        error,
        isFetching,
        refetch
    } = useQuery({
        queryKey: ['guestOrderLookup', 'order', orderNo],
        queryFn: async () => {
            const token = await getTokenWhenReadyRef.current()
            const res = await fetch(`/api/order-lookup/order/${encodeURIComponent(orderNo)}`, {
                headers: {Authorization: `Bearer ${token}`}
            })
            if (res.status === 401 || res.status === 403) {
                const err = new Error('not-verified')
                err.status = res.status
                throw err
            }
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
        enabled: !!orderNo && typeof window !== 'undefined',
        retry: (failureCount, err) => failureCount < 1 && err?.status >= 500,
        staleTime: 15 * 60 * 1000,
        gcTime: 15 * 60 * 1000
    })

    // ─── OMS metadata ──────────────────────────────────────────────────────────
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

    // ─── Cancel state ──────────────────────────────────────────────────────────
    const [cancelModalOpen, setCancelModalOpen] = useState(false)
    const [cancelSubmitting, setCancelSubmitting] = useState(false)
    const [cancelSuccess, setCancelSuccess] = useState(false)
    const [cancelError, setCancelError] = useState(null)

    // ─── Return state ──────────────────────────────────────────────────────────
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
        setCancelError(null)
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
            } else {
                const data = await res.json().catch(() => ({}))
                setCancelModalOpen(false)
                setCancelError(data.errorKind ?? 'transient')
            }
        } catch {
            setCancelError('transient')
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
            const data = await res.json().catch(() => ({}))
            if (res.ok) {
                setReturnModalOpen(false)
                setReturnSuccess(true)
                refetch()
            } else {
                const kind = data.errorKind ?? 'transient'
                setReturnError({kind})
                if (kind === 'unknownItems' || kind === 'quantityExceeded') {
                    refetch()
                }
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

    // ─── Guards ────────────────────────────────────────────────────────────────

    if (isRegistered) return <Redirect to="/account/orders" />

    if (!orderNo) return <Redirect to="/order-lookup" />

    // ─── Loading ───────────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <Box layerStyle="page">
                <Stack spacing={6}>
                    {/* Breadcrumb */}
                    <Skeleton height="16px" width="220px" />
                    {/* h1 + status badge row */}
                    <Stack spacing={2}>
                        <Flex align="center" justify="space-between">
                            <Skeleton height="32px" width="160px" />
                            <Skeleton height="22px" width="72px" borderRadius="full" />
                        </Flex>
                        {/* Ordered date + order number */}
                        <Flex gap={4}>
                            <Skeleton height="16px" width="120px" />
                            <Skeleton height="16px" width="160px" />
                        </Flex>
                    </Stack>
                    {/* Billing address + order summary card */}
                    <Skeleton height="140px" width="100%" borderRadius="md" />
                    {/* Item count */}
                    <Skeleton height="16px" width="60px" />
                    {/* Shipment box */}
                    <Skeleton height="220px" width="100%" borderRadius="md" />
                    {/* Tracking card */}
                    <Skeleton height="80px" width="100%" borderRadius="md" />
                </Stack>
            </Box>
        )
    }

    // ─── Session expired (404 / 401 / 403) ────────────────────────────────────

    if (isError && (error?.status === 404 || error?.status === 401 || error?.status === 403)) {
        return <Redirect to={`/order-lookup?order=${encodeURIComponent(orderNo)}&expired=1`} />
    }

    // ─── Generic fetch error ───────────────────────────────────────────────────

    if (isError) {
        const is429 = error?.status === 429
        return (
            <Box layerStyle="page">
                <Stack spacing={4}>
                    <Box p={4} bg="red.50" borderRadius="md" role="alert">
                        <Text color="red.700">
                            {is429 ? (
                                <FormattedMessage
                                    id="guestOrderLookup.order.error.tooManyRequests"
                                    defaultMessage="You've refreshed too many times. Please wait a moment before trying again."
                                />
                            ) : (
                                <FormattedMessage
                                    id="guestOrderLookup.order.error.generic"
                                    defaultMessage="Something went wrong loading your order. Please try again."
                                />
                            )}
                        </Text>
                        {!is429 && (
                            <Button mt={4} onClick={() => refetch()} isLoading={isFetching}>
                                <FormattedMessage
                                    id="guestOrderLookup.order.button.retry"
                                    defaultMessage="Try Again"
                                />
                            </Button>
                        )}
                    </Box>
                </Stack>
            </Box>
        )
    }

    if (!order) return null

    // ─── Order details ─────────────────────────────────────────────────────────

    const itemCount = order.productItems?.reduce((n, item) => n + item.quantity, 0) || 0
    const canCancel = !cancelSuccess && isCancellable(order)
    const canReturn = returnableItems.length > 0
    const showActions = omsMeta.omsActive && !omsMetaLoading && (canCancel || canReturn)

    const shipments = order.shipments || []
    const isSingleShipment = shipments.length === 1
    const itemsByShipmentId = groupProductItemsByShipmentId(order.productItems)

    return (
        <Box layerStyle="page" data-testid="guest-order-details-page">
            <Stack spacing={6}>
                {/* Breadcrumb — styled to match PLP via Breadcrumb theme */}
                <Breadcrumb
                    className="sf-breadcrumb"
                    sx={breadcrumbStyles.container}
                    separator={<ChevronRightIcon {...breadcrumbStyles.icon} aria-hidden="true" />}
                >
                    <BreadcrumbItem>
                        <BreadcrumbLink as={RouterLink} to="/" sx={breadcrumbStyles.link}>
                            <FormattedMessage
                                id="guestOrderLookup.order.breadcrumb.home"
                                defaultMessage="Home"
                            />
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem>
                        <BreadcrumbLink
                            as={RouterLink}
                            to="/order-lookup"
                            sx={breadcrumbStyles.link}
                        >
                            <FormattedMessage
                                id="guestOrderLookup.order.breadcrumb.orderLookup"
                                defaultMessage="Order Lookup"
                            />
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem isCurrentPage>
                        <BreadcrumbLink sx={breadcrumbStyles.link}>#{order.orderNo}</BreadcrumbLink>
                    </BreadcrumbItem>
                </Breadcrumb>

                {/* Heading + status badge */}
                <Stack spacing={[1, 2]}>
                    <Flex justify="space-between" align="center">
                        <Heading as="h1" fontSize={['lg', '2xl']}>
                            <FormattedMessage
                                id="guestOrderLookup.order.heading"
                                defaultMessage="Order Details"
                            />
                        </Heading>
                        <OrderStatusBadge order={order} />
                    </Flex>
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
                        <Text fontSize={['sm', 'md']}>
                            <FormattedMessage
                                id="guestOrderLookup.order.orderNumber"
                                defaultMessage="Order Number: {orderNo}"
                                values={{orderNo: order.orderNo}}
                            />
                        </Text>
                    </Stack>
                </Stack>

                {/* Cancel / Return buttons — only when OMS is active */}
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
                    <Box
                        p={4}
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="base"
                        role="alert"
                    >
                        <Text fontWeight="semibold" fontSize="sm">
                            <FormattedMessage
                                id="guestOrderLookup.order.cancel.success"
                                defaultMessage="Your order has been cancelled."
                            />
                        </Text>
                    </Box>
                )}
                {cancelError && (
                    <Box
                        p={4}
                        border="1px solid"
                        borderColor="red.300"
                        borderRadius="base"
                        bg="red.50"
                        role="alert"
                    >
                        <Text fontWeight="semibold" fontSize="sm" color="red.700">
                            {cancelError === 'not_cancellable' ? (
                                <FormattedMessage
                                    id="guestOrderLookup.order.cancel.error.notCancellable"
                                    defaultMessage="This order can no longer be cancelled."
                                />
                            ) : cancelError === 'not_found' ? (
                                <FormattedMessage
                                    id="guestOrderLookup.order.cancel.error.notFound"
                                    defaultMessage="Order not found."
                                />
                            ) : (
                                <FormattedMessage
                                    id="guestOrderLookup.order.cancel.error.generic"
                                    defaultMessage="We couldn't cancel your order. Please try again."
                                />
                            )}
                        </Text>
                    </Box>
                )}
                {returnSuccess && (
                    <Box
                        p={4}
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="base"
                        role="alert"
                    >
                        <Text fontWeight="semibold" fontSize="sm">
                            <FormattedMessage
                                id="guestOrderLookup.order.return.success"
                                defaultMessage="Your return has been submitted."
                            />
                        </Text>
                    </Box>
                )}

                {/* Top card: Billing Address (left) + Order Summary (right) — matches account order detail */}
                <Box layerStyle="cardBordered">
                    <Grid templateColumns={{base: '1fr', xl: '60% 1fr'}} gap={{base: 6, xl: 2}}>
                        <SimpleGrid
                            columns={{base: 1, sm: 2}}
                            columnGap={4}
                            rowGap={5}
                            py={{xl: 6}}
                        >
                            {/* Billing Address */}
                            {order.billingAddress && (
                                <Stack spacing={1}>
                                    <Heading as="h2" fontSize="sm" pt={1}>
                                        <FormattedMessage
                                            id="guestOrderLookup.order.heading.billingAddress"
                                            defaultMessage="Billing Address"
                                        />
                                    </Heading>
                                    <Box>
                                        {(order.billingAddress.firstName ||
                                            order.billingAddress.lastName) && (
                                            <Text fontSize="sm">
                                                {order.billingAddress.firstName}{' '}
                                                {order.billingAddress.lastName}
                                            </Text>
                                        )}
                                        {order.billingAddress.address1 && (
                                            <Text fontSize="sm">
                                                {order.billingAddress.address1}
                                            </Text>
                                        )}
                                        {(order.billingAddress.city ||
                                            order.billingAddress.stateCode ||
                                            order.billingAddress.postalCode) && (
                                            <Text fontSize="sm">
                                                {order.billingAddress.city},{' '}
                                                {order.billingAddress.stateCode}{' '}
                                                {order.billingAddress.postalCode}
                                            </Text>
                                        )}
                                    </Box>
                                </Stack>
                            )}
                        </SimpleGrid>

                        {/* Order Summary (right column on xl) */}
                        <Box
                            py={{base: 6}}
                            px={{base: 6, xl: 8}}
                            background="gray.50"
                            borderRadius="base"
                        >
                            <OrderSummary basket={order} fontSize="sm" />
                        </Box>
                    </Grid>
                </Box>

                {/* Item count */}
                <Text fontSize="sm" color="gray.600">
                    <FormattedMessage
                        id="guestOrderLookup.order.itemCount"
                        defaultMessage="{count, plural, one {# item} other {# items}}"
                        values={{count: itemCount}}
                    />
                </Text>

                {/* Per-shipment boxes */}
                <Stack spacing={4}>
                    {shipments.length === 0 ? (
                        <OrderProducts
                            productItems={order.productItems}
                            currency={order.currency}
                        />
                    ) : (
                        (() => {
                            const renderedBucketIds = new Set()
                            const boxes = shipments.map((shipment, index) => {
                                const sid = shipment.shipmentId ?? `ship-${index}`
                                const items = isSingleShipment
                                    ? order.productItems
                                    : itemsByShipmentId[sid] ?? []
                                if (isSingleShipment) {
                                    Object.keys(itemsByShipmentId).forEach((k) =>
                                        renderedBucketIds.add(k)
                                    )
                                } else if (itemsByShipmentId[sid]) {
                                    renderedBucketIds.add(sid)
                                }
                                const address = shipment.shippingAddress
                                return (
                                    <Box
                                        key={sid}
                                        border="1px solid"
                                        borderColor="gray.100"
                                        borderRadius="base"
                                        overflow="hidden"
                                    >
                                        <Flex
                                            bg="gray.50"
                                            px={4}
                                            py={3}
                                            justify="space-between"
                                            align="center"
                                            gap={2}
                                        >
                                            <Heading as="h2" fontSize="sm" fontWeight="semibold">
                                                {shipments.length > 1 ? (
                                                    <FormattedMessage
                                                        id="guestOrderLookup.order.shipment.number"
                                                        defaultMessage="Shipment {number}"
                                                        values={{number: index + 1}}
                                                    />
                                                ) : (
                                                    <FormattedMessage
                                                        id="guestOrderLookup.order.shipment"
                                                        defaultMessage="Shipment"
                                                    />
                                                )}
                                            </Heading>
                                            {shipment.shippingStatus && (
                                                <Text
                                                    as="span"
                                                    px={2}
                                                    py={1}
                                                    bg="gray.200"
                                                    color="gray.800"
                                                    fontSize="xs"
                                                    fontWeight="semibold"
                                                    borderRadius="sm"
                                                    textTransform="capitalize"
                                                    whiteSpace="nowrap"
                                                >
                                                    <ShipmentStatusLabel
                                                        status={shipment.shippingStatus}
                                                    />
                                                </Text>
                                            )}
                                        </Flex>
                                        <Stack spacing={4} p={[4, 6]}>
                                            <OrderProducts
                                                productItems={items}
                                                currency={order.currency}
                                            />
                                            {address && (
                                                <Stack
                                                    spacing={1}
                                                    borderTop="1px solid"
                                                    borderColor="gray.100"
                                                    pt={4}
                                                >
                                                    <Heading as="h3" fontSize="sm">
                                                        <FormattedMessage
                                                            id="guestOrderLookup.order.shippingAddress"
                                                            defaultMessage="Shipping Address"
                                                        />
                                                    </Heading>
                                                    <Box>
                                                        {(address.firstName ||
                                                            address.lastName) && (
                                                            <Text fontSize="sm">
                                                                {address.firstName}{' '}
                                                                {address.lastName}
                                                            </Text>
                                                        )}
                                                        {address.address1 && (
                                                            <Text fontSize="sm">
                                                                {address.address1}
                                                            </Text>
                                                        )}
                                                        {(address.city ||
                                                            address.stateCode ||
                                                            address.postalCode) && (
                                                            <Text fontSize="sm">
                                                                {address.city}, {address.stateCode}{' '}
                                                                {address.postalCode}
                                                            </Text>
                                                        )}
                                                        {shipment.shippingMethod?.name && (
                                                            <Text fontSize="sm" color="gray.600">
                                                                {shipment.shippingMethod.name}
                                                            </Text>
                                                        )}
                                                    </Box>
                                                </Stack>
                                            )}
                                        </Stack>
                                    </Box>
                                )
                            })
                            const leftoverItems = Object.entries(itemsByShipmentId)
                                .filter(([k]) => !renderedBucketIds.has(k))
                                .flatMap(([, items]) => items)
                            if (leftoverItems.length > 0) {
                                boxes.push(
                                    <Box
                                        key="other-items"
                                        border="1px solid"
                                        borderColor="gray.100"
                                        borderRadius="base"
                                        overflow="hidden"
                                    >
                                        <Flex bg="gray.50" px={4} py={3} align="center">
                                            <Heading as="h2" fontSize="sm" fontWeight="semibold">
                                                <FormattedMessage
                                                    id="guestOrderLookup.order.otherItems"
                                                    defaultMessage="Other items"
                                                />
                                            </Heading>
                                        </Flex>
                                        <Stack spacing={4} p={[4, 6]}>
                                            <OrderProducts
                                                productItems={leftoverItems}
                                                currency={order.currency}
                                            />
                                        </Stack>
                                    </Box>
                                )
                            }
                            return boxes
                        })()
                    )}
                </Stack>

                {/* Tracking section */}
                {trackingEntries.length > 0 && (
                    <Stack spacing={3} data-testid="guest-order-detail-tracking">
                        <Heading as="h2" fontSize="lg">
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
            </Stack>
        </Box>
    )
}

export default GuestOrderLookupOrder
