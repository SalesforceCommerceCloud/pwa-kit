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
    Flex,
    Button,
    Divider,
    Grid,
    SimpleGrid,
    Skeleton,
    VisuallyHidden,
    Link as ChakraLink,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverBody,
    useDisclosure
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {getCreditCardIcon} from '@salesforce/retail-react-app/app/utils/cc-utils'
import {
    useOrder,
    useProducts,
    useStores,
    useCustomerType,
    useCustomerId,
    useShopperOrdersMutation,
    ShopperOrdersMutations
} from '@salesforce/commerce-sdk-react'
import {useOmsMetaData} from '@salesforce/commerce-sdk-react'
import Link from '@salesforce/retail-react-app/app/components/link'
import {ChevronLeftIcon, ChevronDownIcon} from '@salesforce/retail-react-app/app/components/icons'
import OrderSummary from '@salesforce/retail-react-app/app/components/order-summary'
import ItemVariantProvider from '@salesforce/retail-react-app/app/components/item-variant'
import CartItemVariantImage from '@salesforce/retail-react-app/app/components/item-variant/item-image'
import CartItemVariantName from '@salesforce/retail-react-app/app/components/item-variant/item-name'
import CartItemVariantAttributes from '@salesforce/retail-react-app/app/components/item-variant/item-attributes'
import CartItemVariantPrice from '@salesforce/retail-react-app/app/components/item-variant/item-price'
import StoreDisplay from '@salesforce/retail-react-app/app/components/store-display'
import OrderTracking from '@salesforce/retail-react-app/app/components/order-tracking'
import ShipmentStatusLabel from '@salesforce/retail-react-app/app/components/order-tracking/shipment-status-label'
import OrderLoadError from '@salesforce/retail-react-app/app/components/order-load-error'
import {groupShipmentsByDeliveryOption} from '@salesforce/retail-react-app/app/utils/shipment-utils'
import {getReturnableItems} from '@salesforce/retail-react-app/app/utils/return-utils'
import {ensureExternalUrl} from '@salesforce/retail-react-app/app/utils/url'
import OrderStatusBadge from '@salesforce/retail-react-app/app/components/order-status-badge'
import {
    classifyReturnError,
    ReturnErrorKind
} from '@salesforce/retail-react-app/app/utils/return-error-utils'
import {STORE_LOCATOR_IS_ENABLED} from '@salesforce/retail-react-app/app/constants'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {consolidateDuplicateBonusProducts} from '@salesforce/retail-react-app/app/utils/bonus-product/cart'
import CancelOrderModal from '@salesforce/retail-react-app/app/components/cancel-order-modal'
import ReturnItemsModal from '@salesforce/retail-react-app/app/components/return-items-modal'
import PropTypes from 'prop-types'
const onClient = typeof window !== 'undefined'

// Delay before surfacing a cancel/return feedback alert, so screen readers finish
// announcing the modal close before the alert steals the live-region announcement.
const ANNOUNCE_DELAY_MS = 300

// Static id linking the Return Items button to its VisuallyHidden disabled-reason
// hint (only one such button exists per page, so a constant is safe).
const RETURN_DISABLED_HINT_ID = 'return-items-disabled-hint'

// Static id linking the Cancel order button to its VisuallyHidden disabled-reason
// hint (only one such button exists per page, so a constant is safe).
const CANCEL_DISABLED_HINT_ID = 'cancel-order-disabled-hint'

// Static id linking the disabled Track Shipment button to its VisuallyHidden
// disabled-reason hint (only one such button exists per page, so a constant is safe).
const TRACK_DISABLED_HINT_ID = 'track-shipment-disabled-hint'

// Group productItems by their shipmentId so each shipment box can render its own
// items. Items with no shipmentId fall under 'default'.
const groupProductItemsByShipmentId = (productItems) =>
    (productItems || []).reduce((itemsByShipmentId, item) => {
        const shipmentId = item.shipmentId ?? 'default'
        if (!itemsByShipmentId[shipmentId]) itemsByShipmentId[shipmentId] = []
        itemsByShipmentId[shipmentId].push(item)
        return itemsByShipmentId
    }, {})

const OrderProducts = ({productItems, currency}) => {
    // Guard the map: a per-shipment box can pass an empty/undefined items list, and
    // the consolidate call below is already `|| []`-guarded — keep this symmetric so
    // a missing list never throws before that.
    const orderProductIds = (productItems || []).map((product) => product.productId)
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

const AccountOrderDetail = () => {
    const {params} = useRouteMatch()
    const history = useHistory()
    const {formatMessage, formatDate} = useIntl()
    const storeLocatorEnabled = getConfig()?.app?.storeLocatorEnabled ?? STORE_LOCATOR_IS_ENABLED
    const {isRegistered} = useCustomerType()
    const customerId = useCustomerId()
    const {
        isOpen: isCancelModalOpen,
        onOpen: openCancelModal,
        onClose: closeCancelModal
    } = useDisclosure()
    const {
        isOpen: isReturnModalOpen,
        onOpen: openReturnModal,
        onClose: closeReturnModal
    } = useDisclosure()
    const [cancelFeedback, setCancelFeedback] = useState(null)
    // Terminal errors (404/409) mean retrying won't help — disable the button
    const [cancelTerminal, setCancelTerminal] = useState(false)
    const cancelMutation = useShopperOrdersMutation(ShopperOrdersMutations.CancelOmsOrder)
    const returnMutation = useShopperOrdersMutation(ShopperOrdersMutations.ReturnOmsOrder)
    // Return feedback is kept separate from cancelFeedback so the "Cancelled"
    // badge (which keys off cancelFeedback) never fires on a return success.
    const [returnFeedback, setReturnFeedback] = useState(null)
    const [returnSubmitError, setReturnSubmitError] = useState(null)
    // Monotonic token: a submit's async result is only applied if it's still the
    // latest submit AND the modal hasn't been closed/reopened since it started.
    // Guards against a stale success closing a freshly-reopened modal or a stale
    // failure setting an error after close.
    const returnSubmitTokenRef = useRef(0)
    // setTimeout ids for the SR-announce-delayed feedback alerts, cleared on
    // unmount and before scheduling a new one so a late timer can't fire after
    // the component is gone or after feedback was intentionally cleared.
    const returnFeedbackTimerRef = useRef(null)
    const cancelFeedbackTimerRef = useRef(null)
    // Selection state lives on the parent so the Modal/Drawer wrapper swap on
    // viewport resize doesn't lose the shopper's progress, and so the
    // review step can read the same payload without prop-drilling.
    const [returnSelection, setReturnSelection] = useState({})

    // expand: 'oms' returns order data from OMS if the order is successfully
    // ingested to OMS, otherwise returns data from ECOM
    // For regular non-oms orders, the order data is returned from ECOM
    const {
        data: order,
        isLoading: isOrderLoading,
        isError,
        refetch: refetchOrder
    } = useOrder(
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
    // Note: keep `|| !order` so the skeleton shows until the order resolves, but a
    // failed fetch is caught by `isError` below and routed to the error card — so it
    // no longer hangs on the skeleton forever (the AC6 bug). `isError` is the
    // TanStack Query failure flag; it is NOT set merely because the query is
    // disabled/not-yet-fetched (e.g. during SSR), so the SSR skeleton is unaffected.
    const isLoading = isOrderLoading || !order

    // Check if order has OMS data
    const isOmsOrder = useMemo(() => !!order?.omsData, [order?.omsData])

    // Every shipment with a SAFE, externalizable carrier tracking URL, labeled for the
    // dropdown. Each raw `omsData.shipments[].trackingUrl` is run through
    // `ensureExternalUrl` (the same hardening the tracking-number card links use): it
    // prepends https:// to a scheme-less host (e.g. `www.carrier.com/x` →
    // `https://www.carrier.com/x`) and rejects relative/unsafe values. Without it, a
    // scheme-less URL would resolve relative to the current route and navigate the
    // shopper INSIDE the app instead of to the carrier. Entries whose URL doesn't
    // externalize are dropped so the dropdown never shows a broken link.
    const trackingUrlOptions = useMemo(
        () =>
            (order?.omsData?.shipments ?? [])
                .map((shipment, index) => ({
                    key: shipment.id ?? `track-${index}`,
                    url: ensureExternalUrl(shipment?.trackingUrl),
                    trackingNumber: shipment?.trackingNumber,
                    index
                }))
                .filter((option) => !!option.url),
        [order?.omsData?.shipments]
    )

    // The single-button path (one trackable shipment) links to the first externalizable
    // URL — the same source as the dropdown options, so they can never diverge. When
    // none externalize, the button is shown disabled so the action stays visible.
    const firstTrackingUrl = trackingUrlOptions[0]?.url

    const returnableItems = useMemo(() => getReturnableItems(order), [order])
    // Require a concrete customerId match — `undefined === undefined` would
    // otherwise grant ownership when both sides are missing. Mirrors canCancel.
    const ownsOrder = !!customerId && order?.customerInfo?.customerId === customerId
    // Render gate is identity-only (registered + owns the order); whether there
    // are actually returnable items drives the button's *disabled* state, not
    // whether it renders — mirroring the always-rendered Cancel order button.
    // (Guest enablement is future work; the gate stays registered-only here.)
    const showStartReturn = isRegistered && ownsOrder
    const hasReturnableItems = returnableItems.length > 0
    // The button renders whenever the shopper owns the order, but is disabled when
    // there's nothing to return, a cancellation just succeeded / is in flight, or a
    // terminal cancel error has made the order un-actionable. A terminal *return*
    // error (404/409) is surfaced inside the modal (no-retry banner + recovery
    // link), so it no longer disables the page-level trigger.
    const returnDisabled =
        !hasReturnableItems ||
        cancelFeedback?.status === 'success' ||
        cancelMutation.isLoading ||
        cancelTerminal
    // SR hint explaining *why* the focusable-but-disabled button is unavailable.
    // The two persistent reasons get explicit copy: nothing to return, or the
    // order has reached a terminal cancel state. The transient reasons (cancel
    // success / in-flight) are self-evident from the adjacent feedback banner and
    // the Cancelled badge, so they intentionally carry no hint.
    const returnDisabledHint = !hasReturnableItems
        ? formatMessage({
              defaultMessage: 'No items on this order are available to return.',
              id: 'account_order_detail.hint.no_returnable_items'
          })
        : cancelTerminal
        ? formatMessage({
              defaultMessage: 'This order can no longer be returned.',
              id: 'account_order_detail.hint.return_unavailable'
          })
        : null

    const {data: omsMetaData, refetch: refetchOmsMetaData} = useOmsMetaData(
        {parameters: {}},
        {enabled: isOmsOrder && onClient}
    )

    const handleCloseReturnModal = useCallback(() => {
        // Invalidate any in-flight submit so its async result is ignored.
        returnSubmitTokenRef.current += 1
        closeReturnModal()
        setReturnSelection({})
        setReturnSubmitError(null)
    }, [closeReturnModal])

    // After a recoverable error (quantityExceeded / unknownItems) the parent
    // refetches the order, so `returnableItems` may shrink (an item is now fully
    // returned/ineligible) or its max may drop. Reconcile the open selection to
    // that fresh state: drop checked rows whose item disappeared, and clamp any
    // quantity above the new max. Otherwise a now-hidden/over-max row would keep
    // `isSelectionValid` false with no on-screen control for the shopper to fix.
    useEffect(() => {
        // Gate on `order` being loaded: returnableItems is [] while the order
        // fetch is in flight, and pruning then would wipe a valid selection
        // before the real items arrive.
        if (!isReturnModalOpen || !order) return
        setReturnSelection((prev) => {
            if (!prev || !Object.keys(prev).length) return prev
            let next = prev
            let changed = false
            Object.entries(prev).forEach(([itemId, row]) => {
                if (!row?.checked) return
                const item = returnableItems.find((i) => i.itemId === itemId)
                const max = item?.omsData?.quantityAvailableToReturn ?? 0
                if (!item || max <= 0) {
                    // Item no longer returnable — drop the row entirely.
                    if (!changed) {
                        next = {...prev}
                        changed = true
                    }
                    delete next[itemId]
                } else if (Number(row.quantity) > max) {
                    // Max shrank — clamp so the row stays valid.
                    if (!changed) {
                        next = {...prev}
                        changed = true
                    }
                    next[itemId] = {...row, quantity: max}
                }
            })
            return changed ? next : prev
        })
    }, [returnableItems, isReturnModalOpen, order])

    const showReturnSuccess = useCallback(() => {
        setReturnFeedback({
            status: 'success',
            title: formatMessage({
                defaultMessage: 'Return submitted',
                id: 'account_order_detail.alert.return_success_title'
            }),
            description: formatMessage({
                defaultMessage: "We'll email a return label shortly.",
                id: 'account_order_detail.alert.return_success_description'
            })
        })
    }, [formatMessage])

    const handleSubmitReturn = useCallback(
        async (productItems) => {
            // Guard against `order` going null between modal open and submit
            // (e.g. a background refetch error) — the body dereferences
            // order.orderNo unconditionally below.
            if (!order) return
            setReturnSubmitError(null)
            // Snapshot the token for this submit. If the modal is closed/reopened
            // (token bumps) before the request settles, this result is stale.
            const token = returnSubmitTokenRef.current
            try {
                await returnMutation.mutateAsync({
                    parameters: {orderNo: order.orderNo},
                    body: {productItems}
                })
                if (token !== returnSubmitTokenRef.current) return
                handleCloseReturnModal()
                // Delay lets screen readers finish announcing modal close before the alert
                if (returnFeedbackTimerRef.current) clearTimeout(returnFeedbackTimerRef.current)
                returnFeedbackTimerRef.current = setTimeout(showReturnSuccess, ANNOUNCE_DELAY_MS)
            } catch (e) {
                // Classifying reads the response body (async, once) for the 400
                // errorCode discriminator, so re-check the token AFTER the await:
                // the modal may have been closed/reopened while we were reading.
                const classified = await classifyReturnError(e)
                if (token !== returnSubmitTokenRef.current) return
                // Recoverable-but-stale errors (quantityExceeded / unknownItems) need
                // fresh server state, so refetch the order — returnableItems/maxes
                // update and the open modal's reconciliation effect clamps the
                // selection. All other kinds keep the current order on screen: terminal
                // 404/409 must NOT refetch (the same error would flip useOrder's isError
                // and collapse the page to <OrderLoadError />, modal included), and
                // invalidReason / network / unknown just need an inline retry. In every
                // case we keep the modal open and hand it the classified error to render.
                if (
                    classified.kind === ReturnErrorKind.QUANTITY_EXCEEDED ||
                    classified.kind === ReturnErrorKind.UNKNOWN_ITEMS
                ) {
                    refetchOrder?.()
                }
                setReturnSubmitError(classified)
            }
        },
        [returnMutation, order?.orderNo, handleCloseReturnModal, showReturnSuccess, refetchOrder]
    )

    const canCancel = useMemo(() => {
        if (!isRegistered || !order) return false
        if (!order.omsData) return false
        // Require a concrete customerId match — `undefined === undefined` would
        // otherwise grant ownership when both sides are missing.
        const ownsOrder = !!customerId && order.customerInfo?.customerId === customerId
        if (!ownsOrder) return false
        // An order with no items should never be cancellable; `[].every()` is
        // vacuously true, so guard the empty case explicitly.
        if (!(order.productItems?.length > 0)) return false
        return order.productItems.every(
            (item) =>
                item.omsData != null &&
                item.omsData.quantityAvailableToCancel === item.omsData.quantityOrdered
        )
    }, [isRegistered, order, customerId])

    // The Cancel order button renders unconditionally but is disabled when the
    // order can't be cancelled, a cancellation just succeeded, or a terminal
    // cancel error has made the order un-actionable. Mirrors returnDisabled.
    const cancelDisabled = !canCancel || cancelFeedback?.status === 'success' || cancelTerminal
    // SR hint explaining *why* the focusable-but-disabled button is unavailable.
    // Only the persistent reasons get copy: the order isn't cancellable, or it has
    // reached a terminal cancel state. The transient success case is self-evident
    // from the adjacent Cancelled badge, so it intentionally carries no hint.
    const cancelDisabledHint = cancelTerminal
        ? formatMessage({
              defaultMessage: 'This order can no longer be canceled.',
              id: 'account_order_detail.hint.cancel_unavailable'
          })
        : !canCancel
        ? formatMessage({
              defaultMessage: "This order isn't eligible for cancellation.",
              id: 'account_order_detail.hint.not_cancellable'
          })
        : null

    const showCancelSuccess = useCallback(() => {
        setCancelFeedback({
            status: 'success',
            title: formatMessage({
                defaultMessage: 'Order canceled',
                id: 'account_order_detail.alert.cancellation_success_title'
            }),
            description: formatMessage({
                defaultMessage: 'Your order was canceled successfully.',
                id: 'account_order_detail.alert.cancellation_success_description'
            })
        })
    }, [formatMessage])

    const showCancelError = useCallback(
        (error) => {
            const status = error?.response?.status
            let description
            if (status === 404) {
                description = formatMessage({
                    defaultMessage: 'We could not find this order. Please refresh and try again.',
                    id: 'account_order_detail.alert.cancellation_error_not_found'
                })
            } else if (status === 409) {
                description = formatMessage({
                    defaultMessage:
                        'This order is already being processed and cannot be canceled. Please reach out to the merchant.',
                    id: 'account_order_detail.alert.cancellation_error_conflict'
                })
            } else {
                description = formatMessage({
                    defaultMessage:
                        "We couldn't process your cancellation right now. Please wait a moment and try again.",
                    id: 'account_order_detail.alert.cancellation_error_generic'
                })
            }
            const title =
                status === 404 || status === 409
                    ? formatMessage({
                          defaultMessage: 'Unable to cancel order',
                          id: 'account_order_detail.alert.cancellation_error_title'
                      })
                    : formatMessage({
                          defaultMessage: 'Something went wrong',
                          id: 'account_order_detail.alert.cancellation_error_title_generic'
                      })
            setCancelFeedback({status: 'error', title, description})
            // 404/409 are terminal — the order can't be cancelled, disable the button
            if (status === 404 || status === 409) setCancelTerminal(true)
        },
        [formatMessage]
    )

    const handleCancelOrder = useCallback(
        async (order, reason) => {
            try {
                await cancelMutation.mutateAsync({
                    parameters: {orderNo: order.orderNo},
                    body: reason ? {reason} : {}
                })
                closeCancelModal()
                // Delay allows screen readers to finish announcing modal close before the alert
                if (cancelFeedbackTimerRef.current) clearTimeout(cancelFeedbackTimerRef.current)
                cancelFeedbackTimerRef.current = setTimeout(showCancelSuccess, ANNOUNCE_DELAY_MS)
            } catch (e) {
                closeCancelModal()
                if (cancelFeedbackTimerRef.current) clearTimeout(cancelFeedbackTimerRef.current)
                cancelFeedbackTimerRef.current = setTimeout(
                    () => showCancelError(e),
                    ANNOUNCE_DELAY_MS
                )
            }
        },
        [closeCancelModal, cancelMutation, showCancelSuccess, showCancelError]
    )

    // Clear any pending feedback timers on unmount so they can't fire after the
    // component is gone (e.g. shopper navigates away during the announce delay).
    useEffect(() => {
        return () => {
            if (returnFeedbackTimerRef.current) clearTimeout(returnFeedbackTimerRef.current)
            if (cancelFeedbackTimerRef.current) clearTimeout(cancelFeedbackTimerRef.current)
        }
    }, [])

    const {pickupShipments, deliveryShipments} = useMemo(() => {
        return storeLocatorEnabled
            ? groupShipmentsByDeliveryOption(order)
            : {pickupShipments: [], deliveryShipments: order?.shipments || []}
    }, [order?.shipments, storeLocatorEnabled])

    // Tracking entries for the dedicated Tracking section (rendered as its own block,
    // not inside the top summary card). Flat list: OMS-preferred (omsData.shipments[])
    // when present, else ECOM fallback (order.shipments[]). One source XOR the other,
    // NEVER a positional OMS↔ECOM index-join across a multi-shipment order: the OMS and
    // ECOM shipment arrays share no join key, so pairing them by position would attach a
    // tracking number to the wrong shipment. Entries therefore carry no shipping address —
    // associating a tracking entry with a specific shipment's address is not yet supported.
    const trackingEntries = useMemo(() => {
        const omsShipments = order?.omsData?.shipments ?? []
        const ecomShipments = order?.shipments ?? []
        // Single-shipment carrier-name fallback only: when there is exactly one OMS
        // shipment and one delivery shipment, an OMS shipment with no `provider` can
        // borrow the lone delivery shipment's method name — unambiguous (one ↔ one), so
        // it is NOT the forbidden multi-shipment index-join. For multi-shipment we never
        // join, so a provider-less OMS shipment simply shows no carrier name.
        const singleMethodFallback =
            omsShipments.length === 1 && deliveryShipments.length === 1
                ? deliveryShipments[0].shippingMethod?.name
                : undefined
        return omsShipments.length > 0
            ? omsShipments.map((s, index) => ({
                  key: s.id ?? `oms-${index}`,
                  shippingMethodName: s.provider || singleMethodFallback,
                  shippingStatus: s.status,
                  trackingNumber: s.trackingNumber,
                  trackingUrl: s.trackingUrl,
                  expectedDeliveryDate: s.expectedDeliveryDate,
                  actualDeliveryDate: s.actualDeliveryDate
              }))
            : ecomShipments.map((s, index) => ({
                  key: s.shipmentId ?? `ecom-${index}`,
                  shippingMethodName: s.shippingMethod?.name,
                  shippingStatus: s.shippingStatus,
                  trackingNumber: s.trackingNumber
                  // provider / trackingUrl / dates are OMS-only → undefined here
              }))
    }, [order?.omsData?.shipments, order?.shipments, deliveryShipments])

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

    const paymentCard = order?.paymentInstruments?.[0]?.paymentCard
    const CardIcon = getCreditCardIcon(paymentCard?.cardType)
    const itemCount = order?.productItems?.reduce((count, item) => item.quantity + count, 0) || 0

    const headingRef = useRef()
    useEffect(() => {
        // Focus the 'Order Details' header when the component mounts for accessibility
        headingRef?.current?.focus()
    }, [])

    // A failed order fetch shows a full-card error with a path back to order history,
    // instead of hanging on the loading skeleton forever (AC6). The success-with-no-
    // omsData case is NOT an error — it has `order` and falls through to the normal
    // render (ECOM fallback), so only the TanStack Query `isError` flag triggers this.
    if (isError) {
        return <OrderLoadError />
    }

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
                    {/* Cancel and return each clear the other's feedback before they run,
                        so at most one is set; render whichever is present. */}
                    {(returnFeedback || cancelFeedback) &&
                        (() => {
                            const feedback = returnFeedback || cancelFeedback
                            return (
                                <Box
                                    p={4}
                                    border="1px solid"
                                    borderColor="gray.200"
                                    borderRadius="base"
                                >
                                    <Text
                                        fontWeight="semibold"
                                        fontSize="sm"
                                        color={feedback.status === 'error' ? 'red.700' : undefined}
                                    >
                                        {feedback.title}
                                    </Text>
                                    <Text
                                        fontSize="sm"
                                        color={feedback.status === 'error' ? 'red.700' : 'gray.600'}
                                    >
                                        {feedback.description}
                                    </Text>
                                    {feedback.link && (
                                        <Box mt={2}>
                                            <Button
                                                as={Link}
                                                to={feedback.link.to}
                                                variant="link"
                                                size="sm"
                                                data-testid="return-feedback-link"
                                            >
                                                {feedback.link.label}
                                            </Button>
                                        </Box>
                                    )}
                                </Box>
                            )
                        })()}
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
                            <OrderStatusBadge
                                order={order}
                                cancelFeedback={cancelFeedback}
                                returnFeedback={returnFeedback}
                            />
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

            {!isLoading && isOmsOrder && (
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
                    {/* Buttons are full-width and stack on mobile, then sit inline from `sm`
                        up. This keeps the row from overflowing horizontally once a third (and
                        a per-shipment fourth, fifth, …) button is present on narrow screens. */}
                    <Flex gap={2} direction={{base: 'column', sm: 'row'}} wrap="wrap">
                        {/* Track Shipment action. ZERO tracking URLs → disabled button (action
                            stays visible). ONE URL → a simple external link button (the common
                            single-shipment case). MULTIPLE URLs (multi-shipment) → a dropdown so
                            the shopper can pick which carrier link to open, since a tracking entry
                            cannot be reliably tied to a specific shipment's items (the OMS and ECOM
                            shipment arrays share no join key). Built on Popover (shared/ui exposes
                            no Chakra Menu); each option is an external ChakraLink so the carrier
                            URL opens the carrier site in a new tab. */}
                        {trackingUrlOptions.length > 1 ? (
                            <Popover placement="bottom-start" gutter={2}>
                                <PopoverTrigger>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        width={{base: 'full', sm: 'auto'}}
                                        rightIcon={<ChevronDownIcon />}
                                        data-testid="account-order-detail-track-shipment"
                                    >
                                        <FormattedMessage
                                            defaultMessage="Track Shipment"
                                            id="account_order_detail.button.track_shipment"
                                        />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent width="auto" minW="3xs">
                                    <PopoverBody p={1}>
                                        <Stack spacing={0} data-testid="track-shipment-options">
                                            {trackingUrlOptions.map((option) => (
                                                <ChakraLink
                                                    key={option.key}
                                                    href={option.url}
                                                    isExternal
                                                    rel="noopener noreferrer"
                                                    px={3}
                                                    py={2}
                                                    fontSize="sm"
                                                    borderRadius="base"
                                                    _hover={{
                                                        bg: 'gray.100',
                                                        textDecoration: 'none'
                                                    }}
                                                >
                                                    {option.trackingNumber ? (
                                                        <FormattedMessage
                                                            defaultMessage="Track {trackingNumber}"
                                                            id="account_order_detail.button.track_number"
                                                            values={{
                                                                trackingNumber:
                                                                    option.trackingNumber
                                                            }}
                                                        />
                                                    ) : (
                                                        <FormattedMessage
                                                            defaultMessage="Track Shipment {number}"
                                                            id="account_order_detail.button.track_shipment_number"
                                                            values={{number: option.index + 1}}
                                                        />
                                                    )}
                                                </ChakraLink>
                                            ))}
                                        </Stack>
                                    </PopoverBody>
                                </PopoverContent>
                            </Popover>
                        ) : firstTrackingUrl ? (
                            <Button
                                // ChakraLink (not the SPA Link) + href + isExternal so the raw
                                // carrier URL opens the carrier site in a new tab. The SPA Link
                                // would run the URL through the multi-site builder and treat it as
                                // an internal route. Mirrors the tracking-number links in the cards.
                                as={ChakraLink}
                                href={firstTrackingUrl}
                                isExternal
                                rel="noopener noreferrer"
                                variant="outline"
                                size="sm"
                                width={{base: 'full', sm: 'auto'}}
                                data-testid="account-order-detail-track-shipment"
                            >
                                <FormattedMessage
                                    defaultMessage="Track Shipment"
                                    id="account_order_detail.button.track_shipment"
                                />
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    width={{base: 'full', sm: 'auto'}}
                                    // Use aria-disabled (not isDisabled) so the button stays
                                    // focusable while disabled — a native disabled button can't be
                                    // focused, so a keyboard/SR user would never hear the hint
                                    // explaining why it's unavailable. Mirrors the Cancel/Return
                                    // buttons in this same row.
                                    aria-disabled={true}
                                    aria-describedby={TRACK_DISABLED_HINT_ID}
                                    data-testid="account-order-detail-track-shipment"
                                >
                                    <FormattedMessage
                                        defaultMessage="Track Shipment"
                                        id="account_order_detail.button.track_shipment"
                                    />
                                </Button>
                                <VisuallyHidden id={TRACK_DISABLED_HINT_ID}>
                                    <FormattedMessage
                                        defaultMessage="Tracking is not available for this order yet."
                                        id="account_order_detail.hint.no_tracking"
                                    />
                                </VisuallyHidden>
                            </>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            width={{base: 'full', sm: 'auto'}}
                            onClick={() => {
                                // No-op while disabled — see aria-disabled note below.
                                if (cancelDisabled) return
                                setCancelFeedback(null)
                                setReturnFeedback(null)
                                openCancelModal()
                            }}
                            // Use aria-disabled (not isDisabled) so the button stays
                            // focusable while disabled — a native disabled button can't be
                            // focused, so a keyboard/SR user would never hear the hint
                            // explaining why it's unavailable. Mirrors the Return Items
                            // button. The hint is wired only for the persistent reasons.
                            aria-disabled={cancelDisabled}
                            aria-describedby={
                                cancelDisabledHint ? CANCEL_DISABLED_HINT_ID : undefined
                            }
                        >
                            <FormattedMessage
                                defaultMessage="Cancel Order"
                                id="account_order_detail.button.cancel_order"
                            />
                        </Button>
                        {cancelDisabledHint && (
                            <VisuallyHidden id={CANCEL_DISABLED_HINT_ID}>
                                {cancelDisabledHint}
                            </VisuallyHidden>
                        )}
                        {showStartReturn && (
                            <>
                                <Button
                                    data-testid="account-order-detail-start-return"
                                    variant="outline"
                                    size="sm"
                                    width={{base: 'full', sm: 'auto'}}
                                    onClick={() => {
                                        // No-op while disabled — see aria-disabled note below.
                                        if (returnDisabled) return
                                        // Don't wipe a *successful* cancellation — that's the
                                        // source of the "Cancelled" badge. Only clear a stale
                                        // cancel error/in-progress feedback.
                                        if (cancelFeedback?.status !== 'success') {
                                            setCancelFeedback(null)
                                        }
                                        setReturnFeedback(null)
                                        openReturnModal()
                                    }}
                                    // Use aria-disabled (not isDisabled) so the button stays
                                    // focusable while disabled — a native disabled button
                                    // can't be focused, so a keyboard/SR user would never
                                    // hear the hint explaining why it's unavailable. Mirrors
                                    // the modal's "Review return" button. The hint is wired
                                    // only for the persistent reasons (see returnDisabledHint).
                                    aria-disabled={returnDisabled}
                                    aria-describedby={
                                        returnDisabledHint ? RETURN_DISABLED_HINT_ID : undefined
                                    }
                                >
                                    <FormattedMessage
                                        defaultMessage="Return Items"
                                        id="account_order_detail.button.start_return"
                                    />
                                </Button>
                                {returnDisabledHint && (
                                    <VisuallyHidden id={RETURN_DISABLED_HINT_ID}>
                                        {returnDisabledHint}
                                    </VisuallyHidden>
                                )}
                            </>
                        )}
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
                                {/* Shipping Address now renders inside each per-shipment box in the
                                    Items Ordered section, so it is not repeated here. */}

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
                            defaultMessage="{count, plural, one {# item} other {# items}}"
                            values={{count: itemCount}}
                            id="account_order_detail.heading.num_of_items"
                        />
                    </Text>
                )}

                <Stack spacing={4}>
                    {isLoading
                        ? [1, 2, 3].map((i) => (
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
                        : (() => {
                              // Per-shipment boxes: iterate the ECOM shipments, render each as a
                              // bordered box with a "Shipment N" header + status, its items
                              // (grouped by shipmentId), and the shipment's own native shipping
                              // address. Tracking is NOT inside the boxes: OMS tracking has no join
                              // key back to a specific ECOM shipment, so it renders as a single flat
                              // section BELOW all the boxes (see after this Stack). The shopper, like
                              // the storefront, can't tell which tracking maps to which shipment, and
                              // the flat layout is honest about that rather than implying a false link.
                              const itemsByShipmentId = groupProductItemsByShipmentId(
                                  order.productItems
                              )
                              // No delivery shipment to box the items under (e.g. BOPIS
                              // pickup-only orders) → render the items as one flat list. Tracking
                              // still renders in the flat section below this Stack.
                              if (deliveryShipments.length === 0) {
                                  return (
                                      <OrderProducts
                                          productItems={order.productItems}
                                          currency={order.currency}
                                      />
                                  )
                              }
                              const isSingleShipment = deliveryShipments.length === 1
                              // Track which item buckets a box actually renders, so any item that
                              // matches no box (no shipmentId → 'default' bucket, or a shipmentId
                              // that names no delivery shipment) can be surfaced in a fallback box
                              // below instead of silently disappearing. The "{count} items" header
                              // counts every productItem, so an unrendered item would otherwise be a
                              // visible count/contents mismatch.
                              const renderedBucketIds = new Set()
                              const shipmentBoxes = deliveryShipments.map((shipment, index) => {
                                  const sid = shipment.shipmentId ?? `ship-${index}`
                                  // For a single shipment, all items belong to it (cover the
                                  // common case where productItems carry no shipmentId → they
                                  // land under 'default'). For multiple shipments, match strictly
                                  // by shipmentId so items never duplicate across boxes.
                                  const items = isSingleShipment
                                      ? order.productItems
                                      : itemsByShipmentId[sid] ?? []
                                  if (isSingleShipment) {
                                      // Single box owns every bucket.
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
                                          data-shipment-id={sid}
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
                                                  {deliveryShipments.length > 1 ? (
                                                      <FormattedMessage
                                                          defaultMessage="Shipment {number}"
                                                          id="account_order_detail.heading.shipment_number"
                                                          values={{number: index + 1}}
                                                      />
                                                  ) : (
                                                      <FormattedMessage
                                                          defaultMessage="Shipment"
                                                          id="account_order_detail.heading.shipment"
                                                      />
                                                  )}
                                              </Heading>
                                              {shipment.shippingStatus && (
                                                  <Text
                                                      as="span"
                                                      px={2}
                                                      py={1}
                                                      bg="gray.200"
                                                      // gray.800 (not gray.700) on gray.200 → 5.88:1,
                                                      // clears WCAG AA 4.5:1; gray.700 was 4.04:1 and
                                                      // failed the a11y snapshot.
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
                                                              defaultMessage="Shipping Address"
                                                              id="account_order_detail.heading.shipping_address"
                                                          />
                                                      </Heading>
                                                      <Box>
                                                          <Text fontSize="sm">
                                                              {address.firstName && address.lastName
                                                                  ? `${address.firstName} ${address.lastName}`
                                                                  : address.fullName}
                                                          </Text>
                                                          <Text fontSize="sm">
                                                              {address.address1}
                                                          </Text>
                                                          <Text fontSize="sm">
                                                              {address.city}, {address.stateCode}{' '}
                                                              {address.postalCode}
                                                          </Text>
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
                              // Any items that landed in no rendered box (untagged → 'default', or a
                              // shipmentId naming no delivery shipment) are shown in a final "Other
                              // items" box so nothing the shopper paid for silently disappears.
                              const leftoverItems = Object.entries(itemsByShipmentId)
                                  .filter(([bucketId]) => !renderedBucketIds.has(bucketId))
                                  .flatMap(([, items]) => items)
                              if (leftoverItems.length > 0) {
                                  shipmentBoxes.push(
                                      <Box
                                          key="other-items"
                                          data-shipment-id="other-items"
                                          border="1px solid"
                                          borderColor="gray.100"
                                          borderRadius="base"
                                          overflow="hidden"
                                      >
                                          <Flex bg="gray.50" px={4} py={3} align="center">
                                              <Heading as="h2" fontSize="sm" fontWeight="semibold">
                                                  <FormattedMessage
                                                      defaultMessage="Other items"
                                                      id="account_order_detail.heading.other_items"
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
                              return shipmentBoxes
                          })()}
                </Stack>
            </Stack>

            {/* Tracking — a single flat section BELOW all the shipment boxes. OMS tracking
                (omsData.shipments[]) has no join key back to a specific ECOM shipment, so we
                cannot say which tracking belongs to which box. Rather than imply a false link
                by nesting tracking in a box, we list every tracking entry here as peers of the
                boxes — neither the shopper nor the storefront can tell which is which, and the
                flat layout is honest about that. ECOM fallback applies when there are no OMS
                shipments. */}
            {!isLoading && trackingEntries.length > 0 && (
                <Stack spacing={3} data-testid="account-order-detail-tracking">
                    <Heading as="h2" fontSize="lg">
                        <FormattedMessage
                            defaultMessage="Tracking"
                            id="account_order_detail.heading.tracking"
                        />
                    </Heading>
                    {trackingEntries.map(({key, ...entry}) => (
                        <OrderTracking key={key} {...entry} />
                    ))}
                </Stack>
            )}

            {isOmsOrder && (
                <CancelOrderModal
                    isOpen={isCancelModalOpen}
                    onClose={closeCancelModal}
                    order={order}
                    onCancel={handleCancelOrder}
                    isSubmitting={cancelMutation.isLoading}
                    reasonCodes={omsMetaData?.cancelReasonCodes}
                />
            )}
            {isOmsOrder && (
                <ReturnItemsModal
                    isOpen={isReturnModalOpen}
                    onClose={handleCloseReturnModal}
                    order={order}
                    returnableItems={returnableItems}
                    reasonCodes={omsMetaData?.returnReasonCodes}
                    selection={returnSelection}
                    onSelectionChange={setReturnSelection}
                    onSubmit={handleSubmitReturn}
                    onClearSubmitError={() => setReturnSubmitError(null)}
                    onRefetchReasons={refetchOmsMetaData}
                    isSubmitting={returnMutation.isLoading}
                    submitError={returnSubmitError}
                />
            )}
        </Stack>
    )
}

AccountOrderDetail.getTemplateName = () => 'account-order-history'

export default AccountOrderDetail
