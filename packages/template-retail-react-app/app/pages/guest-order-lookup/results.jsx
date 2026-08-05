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
    Alert,
    AlertIcon,
    Box,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    Button,
    Container,
    Divider,
    Flex,
    FormControl,
    FormLabel,
    Grid,
    HStack,
    Heading,
    Input,
    Skeleton,
    Stack,
    Text
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useCustomerType, useAccessToken} from '@salesforce/commerce-sdk-react'
import {Redirect, useHistory, useLocation, Link as RouterLink} from 'react-router-dom'
import {ChevronRightIcon} from '@salesforce/retail-react-app/app/components/icons'
import OrderSummary from '@salesforce/retail-react-app/app/components/order-summary'
import OrderProducts, {groupProductItemsByShipmentId} from '@salesforce/retail-react-app/app/components/order-products'
import OrderStatusBadge from '@salesforce/retail-react-app/app/components/order-status-badge'
import ShipmentStatusLabel from '@salesforce/retail-react-app/app/components/order-tracking/shipment-status-label'
import OrderTracking from '@salesforce/retail-react-app/app/components/order-tracking'
import CancelOrderModal from '@salesforce/retail-react-app/app/components/cancel-order-modal'
import ReturnItemsModal from '@salesforce/retail-react-app/app/components/return-items-modal'
import {getReturnableItems} from '@salesforce/retail-react-app/app/utils/return-utils'

const OTP_LENGTH = 6

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

const GuestOrderLookupResults = () => {
    const {formatMessage, formatDate} = useIntl()
    const {isRegistered} = useCustomerType()
    const history = useHistory()
    const location = useLocation()
    const {getTokenWhenReady} = useAccessToken()

    // Read order number and email from query params — matches sf-next /order-lookup/results?order=<n>&email=<e>
    const searchParams = new URLSearchParams(location.search)
    const orderNo = searchParams.get('order') || ''
    const email = searchParams.get('email') || ''

    // useAccessToken returns a new getTokenWhenReady on every render — store in ref
    // so effects can always call the latest version with a stable dep array.
    const getTokenWhenReadyRef = useRef(getTokenWhenReady)
    useEffect(() => {
        getTokenWhenReadyRef.current = getTokenWhenReady
    })

    // ─── Order data ────────────────────────────────────────────────────────────
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
                // Not verified yet — expected on first visit before OTP entry.
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
        enabled: !!orderNo,
        retry: false,
        staleTime: 30_000
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

    // ─── Verify form state ─────────────────────────────────────────────────────
    const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''))
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [serverError, setServerError] = useState(null)
    const inputRefs = useRef([])

    const handleDigitChange = useCallback(
        (index, value) => {
            const cleaned = value.replace(/\D/g, '').slice(-1)
            const next = [...digits]
            next[index] = cleaned
            setDigits(next)
            setServerError(null)
            if (cleaned && index < OTP_LENGTH - 1) {
                inputRefs.current[index + 1]?.focus()
            }
        },
        [digits]
    )

    const handleKeyDown = useCallback(
        (index, e) => {
            if (e.key === 'Backspace' && !digits[index] && index > 0) {
                inputRefs.current[index - 1]?.focus()
            }
        },
        [digits]
    )

    const handlePaste = useCallback((e) => {
        e.preventDefault()
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
        if (!pasted) return
        const next = Array(OTP_LENGTH).fill('')
        for (let i = 0; i < pasted.length; i++) {
            next[i] = pasted[i]
        }
        setDigits(next)
        inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus()
    }, [])

    const enteredCode = digits.join('')
    const isComplete = enteredCode.length === OTP_LENGTH

    const onVerifySubmit = async (e) => {
        e.preventDefault()
        if (!isComplete || isSubmitting) return
        setServerError(null)
        setIsSubmitting(true)
        try {
            const token = await getTokenWhenReadyRef.current()
            const res = await fetch('/api/order-lookup/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({orderNo, email, accessCode: enteredCode})
            })
            if (res.ok) {
                // Cookie is now written server-side. Refetch so the query transitions
                // out of error state and renders order details.
                await refetch()
                return
            }
            if (res.status === 404) {
                setServerError(
                    formatMessage({
                        id: 'guestOrderLookup.verify.error.invalidCode',
                        defaultMessage:
                            'The code you entered is invalid or has expired. Please try again.'
                    })
                )
            } else if (res.status === 429) {
                setServerError(
                    formatMessage({
                        id: 'guestOrderLookup.verify.error.tooManyAttempts',
                        defaultMessage: 'Too many attempts. Please wait a moment and try again.'
                    })
                )
            } else {
                setServerError(
                    formatMessage({
                        id: 'guestOrderLookup.verify.error.generic',
                        defaultMessage: 'Something went wrong. Please try again.'
                    })
                )
            }
            inputRefs.current[0]?.focus()
        } catch {
            setServerError(
                formatMessage({
                    id: 'guestOrderLookup.verify.error.generic',
                    defaultMessage: 'Something went wrong. Please try again.'
                })
            )
        } finally {
            setIsSubmitting(false)
        }
    }

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

    // ─── Guards ────────────────────────────────────────────────────────────────

    if (isRegistered) return <Redirect to="/account/orders" />

    // Missing required query params — redirect to the entry form
    if (!orderNo || !email) return <Redirect to="/order-lookup" />

    // ─── Loading ───────────────────────────────────────────────────────────────

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

    // ─── Session expired (404) ─────────────────────────────────────────────────

    if (isError && error?.status === 404) {
        // Redirect handled by effect — render nothing while navigating
        history.replace(`/order-lookup?order=${encodeURIComponent(orderNo)}&email=${encodeURIComponent(email)}`)
        return null
    }

    // ─── Generic fetch error (order already verified but fetch failed) ─────────

    if (isError && error?.status !== 401 && error?.status !== 403) {
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

    // ─── Verify form (401/403 = not yet verified) ──────────────────────────────

    if (!order) {
        return (
            <Container maxW="lg" py={12}>
                <Stack spacing={8}>
                    <Box textAlign="center">
                        <Heading as="h1" fontSize="3xl" fontWeight="bold" mb={2}>
                            {formatMessage({
                                id: 'guestOrderLookup.verify.heading',
                                defaultMessage: 'Verify Your Email'
                            })}
                        </Heading>
                        <Text color="gray.600">
                            {formatMessage(
                                {
                                    id: 'guestOrderLookup.verify.subtext',
                                    defaultMessage:
                                        "We've sent a verification code to {email}. Please enter it below."
                                },
                                {email}
                            )}
                        </Text>
                    </Box>

                    <Box
                        as="form"
                        onSubmit={onVerifySubmit}
                        noValidate
                        borderWidth="1px"
                        borderRadius="lg"
                        p={8}
                    >
                        <Stack spacing={6}>
                            {serverError && (
                                <Alert id="otp-error" status="error" borderRadius="md">
                                    <AlertIcon />
                                    {serverError}
                                </Alert>
                            )}

                            <FormControl isInvalid={!!serverError}>
                                <FormLabel htmlFor="otp-input-0" textAlign="center">
                                    {formatMessage({
                                        id: 'guestOrderLookup.verify.label.code',
                                        defaultMessage: 'Verification code'
                                    })}
                                </FormLabel>
                                <HStack spacing={3} justify="center">
                                    {Array.from({length: OTP_LENGTH}, (_, i) => (
                                        <Input
                                            key={i}
                                            id={i === 0 ? 'otp-input-0' : undefined}
                                            ref={(el) => {
                                                inputRefs.current[i] = el
                                            }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digits[i]}
                                            onChange={(e) => handleDigitChange(i, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(i, e)}
                                            onPaste={handlePaste}
                                            isDisabled={isSubmitting}
                                            autoComplete={i === 0 ? 'one-time-code' : 'off'}
                                            textAlign="center"
                                            fontSize="xl"
                                            fontWeight="bold"
                                            w="12"
                                            h="14"
                                            borderWidth="2px"
                                            aria-label={formatMessage(
                                                {
                                                    id: 'guestOrderLookup.verify.label.digitN',
                                                    defaultMessage: 'Digit {n} of {total}'
                                                },
                                                {n: i + 1, total: OTP_LENGTH}
                                            )}
                                            aria-invalid={!!serverError || undefined}
                                            aria-describedby={serverError ? 'otp-error' : undefined}
                                        />
                                    ))}
                                </HStack>
                            </FormControl>

                            <Button
                                type="submit"
                                colorScheme="blue"
                                isLoading={isSubmitting}
                                isDisabled={!isComplete || isSubmitting}
                                width="full"
                                size="lg"
                            >
                                {formatMessage({
                                    id: 'guestOrderLookup.verify.button.submit',
                                    defaultMessage: 'Verify Code'
                                })}
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                width="full"
                                onClick={() =>
                                    history.push(
                                        `/order-lookup?order=${encodeURIComponent(orderNo)}&email=${encodeURIComponent(email)}`
                                    )
                                }
                            >
                                {formatMessage({
                                    id: 'guestOrderLookup.verify.button.requestNewCode',
                                    defaultMessage: 'Request a new code'
                                })}
                            </Button>
                        </Stack>
                    </Box>
                </Stack>
            </Container>
        )
    }

    // ─── Order details ─────────────────────────────────────────────────────────

    const itemCount = order.productItems?.reduce((n, item) => n + item.quantity, 0) || 0
    const canCancel = !cancelSuccess && isCancellable(order)
    const canReturn = returnableItems.length > 0
    const showActions = omsMeta.omsActive && !omsMetaLoading && (canCancel || canReturn)

    const shipments = order.shipments || []
    const isSingleShipment = shipments.length === 1
    const itemsByShipmentId = groupProductItemsByShipmentId(order.productItems)

    return (
        <Box layerStyle="page" data-testid="guest-order-details-page"><Stack spacing={6}>
            {/* Breadcrumb: Home > Order Lookup > #orderNo */}
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

            {/* Main card: Items Ordered (left) + Order Summary (right) */}
            <Box layerStyle="cardBordered">
                <Grid templateColumns={{base: '1fr', xl: '60% 1fr'}} gap={{base: 6, xl: 2}}>
                    {/* Items Ordered */}
                    <Stack spacing={4} py={{xl: 6}} px={{base: 6, xl: 0}} pt={{base: 6}}>
                        <Heading as="h2" fontSize="md" fontWeight="semibold">
                            <FormattedMessage
                                id="guestOrderLookup.order.section.items"
                                defaultMessage="Items Ordered"
                            />
                        </Heading>
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
                                                    <Heading
                                                        as="h3"
                                                        fontSize="sm"
                                                        fontWeight="semibold"
                                                    >
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
                                                            <Heading as="h4" fontSize="sm">
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
                                                                        {[
                                                                            address.postalCode,
                                                                            address.city,
                                                                            address.stateCode
                                                                        ]
                                                                            .filter(Boolean)
                                                                            .join(', ')}
                                                                    </Text>
                                                                )}
                                                                {shipment.shippingMethod
                                                                    ?.name && (
                                                                    <Text
                                                                        fontSize="sm"
                                                                        color="gray.600"
                                                                    >
                                                                        {
                                                                            shipment.shippingMethod
                                                                                .name
                                                                        }
                                                                    </Text>
                                                                )}
                                                            </Box>
                                                        </Stack>
                                                    )}
                                                </Stack>
                                            </Box>
                                        )
                                    })
                                    // Items not covered by any delivery shipment box
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
                                                <Flex
                                                    bg="gray.50"
                                                    px={4}
                                                    py={3}
                                                    align="center"
                                                >
                                                    <Heading
                                                        as="h3"
                                                        fontSize="sm"
                                                        fontWeight="semibold"
                                                    >
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
                    </Stack>

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
        </Stack></Box>
    )
}

export default GuestOrderLookupResults
