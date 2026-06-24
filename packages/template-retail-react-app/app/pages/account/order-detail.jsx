/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {useHistory, useLocation, useRouteMatch} from 'react-router'
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
    SimpleGrid,
    Skeleton,
    VisuallyHidden,
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
import {ChevronLeftIcon, CloseIcon} from '@salesforce/retail-react-app/app/components/icons'
import OrderSummary from '@salesforce/retail-react-app/app/components/order-summary'
import ItemVariantProvider from '@salesforce/retail-react-app/app/components/item-variant'
import CartItemVariantImage from '@salesforce/retail-react-app/app/components/item-variant/item-image'
import CartItemVariantName from '@salesforce/retail-react-app/app/components/item-variant/item-name'
import CartItemVariantAttributes from '@salesforce/retail-react-app/app/components/item-variant/item-attributes'
import CartItemVariantPrice from '@salesforce/retail-react-app/app/components/item-variant/item-price'
import StoreDisplay from '@salesforce/retail-react-app/app/components/store-display'
import OrderTracking from '@salesforce/retail-react-app/app/components/order-tracking'
import OrderLoadError from '@salesforce/retail-react-app/app/components/order-load-error'
import {groupShipmentsByDeliveryOption} from '@salesforce/retail-react-app/app/utils/shipment-utils'
import {getReturnableItems} from '@salesforce/retail-react-app/app/utils/return-utils'
import {rebuildPathWithParams} from '@salesforce/retail-react-app/app/utils/url'
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

// Name of the URL query param that carries an in-progress return selection so
// it survives a silent SDK token-refresh mid-return (WI-5 case 1). Only the
// checked rows' itemId/quantity/reasonCode are stored — no PII.
const RETURN_DRAFT_PARAM = 'returnDraft'

// Static id linking the Return Items button to its VisuallyHidden disabled-reason
// hint (only one such button exists per page, so a constant is safe).
const RETURN_DISABLED_HINT_ID = 'return-items-disabled-hint'

/**
 * Serialize the checked rows of a return selection to a compact URL-safe
 * string, or '' when nothing is selected (so the param is dropped).
 */
const encodeReturnDraft = (selection) => {
    const rows = Object.entries(selection || {})
        .filter(([, row]) => row?.checked)
        .map(([itemId, row]) => ({i: itemId, q: row.quantity, r: row.reasonCode}))
    if (!rows.length) return ''
    try {
        return encodeURIComponent(JSON.stringify(rows))
    } catch {
        return ''
    }
}

/**
 * Inverse of {@link encodeReturnDraft}: returns a `returnSelection`-shaped
 * object, or null when the param is absent/malformed.
 */
const decodeReturnDraft = (raw) => {
    if (!raw) return null
    try {
        const rows = JSON.parse(decodeURIComponent(raw))
        if (!Array.isArray(rows) || !rows.length) return null
        const selection = {}
        rows.forEach((row) => {
            if (!row?.i) return
            selection[row.i] = {
                checked: true,
                // Clamp to a whole number >= 1: a tampered URL could carry 0,
                // a negative, or a float. The modal re-validates against the
                // live max before enabling submit, but a sane floor keeps the
                // restored quantity picker from showing a nonsense value.
                quantity: Number.isFinite(row.q) && row.q >= 1 ? Math.floor(row.q) : 1,
                reasonCode: row.r
            }
        })
        return Object.keys(selection).length ? selection : null
    } catch {
        return null
    }
}

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

const AccountOrderDetail = () => {
    const {params} = useRouteMatch()
    const history = useHistory()
    const location = useLocation()
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
    // viewport resize doesn't lose the shopper's progress, and so W-22821838's
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

    const omsShipmentCount = order?.omsData?.shipments?.length ?? 0
    const ecomShipmentCount = order?.shipments?.length ?? 0

    const hasOmsShipment = useMemo(() => omsShipmentCount > 0, [omsShipmentCount])

    const isMultiShipmentOrder = useMemo(
        () => omsShipmentCount > 1 || ecomShipmentCount > 1,
        [omsShipmentCount, ecomShipmentCount]
    )

    const showMultiShipmentsFromOmsOnly = isOmsOrder && hasOmsShipment && isMultiShipmentOrder

    const returnableItems = useMemo(() => getReturnableItems(order), [order])
    const ownsOrder = order?.customerInfo?.customerId === customerId
    // Render gate is identity-only (registered + owns the order); whether there
    // are actually returnable items drives the button's *disabled* state, not
    // whether it renders — mirroring the always-rendered Cancel order button.
    // (Guest enablement is a future WI; the gate stays registered-only here.)
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

    const {data: omsMetaData} = useOmsMetaData({parameters: {}}, {enabled: isOmsOrder && onClient})

    // Debounce timer for the returnDraft URL write; cancelled on close/unmount so
    // a late write can't re-introduce a draft after the selection was cleared.
    const returnDraftTimerRef = useRef(null)
    // Restore-once latch so stripping the returnDraft param after hydrate doesn't
    // retrigger restore, and a manual close doesn't reopen the modal.
    const didRestoreDraftRef = useRef(false)

    // Drop the returnDraft param from the current URL without a history push, so
    // a closed/submitted return doesn't leave a stale draft that would re-open
    // the modal on the next mount. Reads history.location (always current) to
    // avoid threading `location` through the close callback's deps.
    const stripReturnDraftParam = useCallback(() => {
        const {pathname, search} = history.location
        if (!search || !search.includes(`${RETURN_DRAFT_PARAM}=`)) return
        history.replace(rebuildPathWithParams(`${pathname}${search}`, {[RETURN_DRAFT_PARAM]: ''}))
    }, [history])

    const handleCloseReturnModal = useCallback(() => {
        // Invalidate any in-flight submit so its async result is ignored.
        returnSubmitTokenRef.current += 1
        // Cancel any pending debounced draft write so it can't fire after we clear.
        if (returnDraftTimerRef.current) {
            clearTimeout(returnDraftTimerRef.current)
            returnDraftTimerRef.current = null
        }
        stripReturnDraftParam()
        closeReturnModal()
        setReturnSelection({})
        setReturnSubmitError(null)
    }, [closeReturnModal, stripReturnDraftParam])

    // Restore an in-progress return that survived a silent token-refresh remount
    // (WI-5 case 1): if the URL carries a returnDraft, hydrate the selection and
    // re-open the modal. Runs once per mount (latched) so manually closing the
    // modal — which strips the param — can't reopen it.
    useEffect(() => {
        if (didRestoreDraftRef.current) return
        const params = new URLSearchParams(location.search)
        const raw = params.get(RETURN_DRAFT_PARAM)
        if (!raw) return
        didRestoreDraftRef.current = true
        const restored = decodeReturnDraft(raw)
        if (!restored) {
            // Malformed/empty draft — clean the URL and bail.
            stripReturnDraftParam()
            return
        }
        setReturnSelection(restored)
        openReturnModal()
    }, [])

    // Persist the in-progress selection to the URL (debounced) while the modal is
    // open, so a silent token-refresh remount can restore it. Cleared on close via
    // handleCloseReturnModal; here we only write while open.
    useEffect(() => {
        if (!isReturnModalOpen) return undefined
        if (returnDraftTimerRef.current) clearTimeout(returnDraftTimerRef.current)
        returnDraftTimerRef.current = setTimeout(() => {
            const encoded = encodeReturnDraft(returnSelection)
            const {pathname, search} = history.location
            const next = rebuildPathWithParams(`${pathname}${search}`, {
                [RETURN_DRAFT_PARAM]: encoded
            })
            if (next !== `${pathname}${search}`) history.replace(next)
        }, 400)
        return () => {
            if (returnDraftTimerRef.current) {
                clearTimeout(returnDraftTimerRef.current)
                returnDraftTimerRef.current = null
            }
        }
    }, [returnSelection, isReturnModalOpen, history])

    // After a recoverable error (quantityExceeded / unknownItems) the parent
    // refetches the order, so `returnableItems` may shrink (an item is now fully
    // returned/ineligible) or its max may drop. Reconcile the open selection to
    // that fresh state: drop checked rows whose item disappeared, and clamp any
    // quantity above the new max. Otherwise a now-hidden/over-max row would keep
    // `isSelectionValid` false with no on-screen control for the shopper to fix.
    useEffect(() => {
        // Gate on `order` being loaded: returnableItems is [] while the order
        // fetch is in flight (e.g. the restore-on-mount path opens the modal
        // before the order resolves), and pruning then would wipe a valid
        // restored selection before the real items arrive.
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
                returnFeedbackTimerRef.current = setTimeout(showReturnSuccess, 300)
            } catch (e) {
                // Classifying reads the response body (async, once) for the 400
                // errorCode discriminator, so re-check the token AFTER the await:
                // the modal may have been closed/reopened while we were reading.
                const classified = await classifyReturnError(e)
                if (token !== returnSubmitTokenRef.current) return
                switch (classified.kind) {
                    case ReturnErrorKind.NOT_FOUND:
                    case ReturnErrorKind.CONFLICT:
                        // Terminal: retrying the same payload won't help. Keep the
                        // modal open and hand the classified error to it — the modal
                        // shows a no-retry banner with a recovery link (404 -> order
                        // history, 409 -> support) in place. Do NOT refetch: the same
                        // 404/409 would flip useOrder's isError and collapse the whole
                        // page (modal included) to <OrderLoadError />. Mirror the cancel
                        // flow, which also leaves the loaded order on screen on terminal
                        // errors so order details stay visible behind the modal.
                        setReturnSubmitError(classified)
                        break
                    case ReturnErrorKind.QUANTITY_EXCEEDED:
                    case ReturnErrorKind.UNKNOWN_ITEMS:
                        // Recoverable but needs fresh server state: refetch the order
                        // so returnableItems/maxes update, keep the modal open, and
                        // hand the classified error to the modal (it drops to the
                        // select view and shows the affected-items banner).
                        refetchOrder?.()
                        setReturnSubmitError(classified)
                        break
                    default:
                        // invalidReason / network / unknown — keep the modal open for
                        // an inline retry / reason repopulation.
                        setReturnSubmitError(classified)
                }
            }
        },
        [returnMutation, order?.orderNo, handleCloseReturnModal, showReturnSuccess, refetchOrder]
    )

    const canCancel = useMemo(() => {
        if (!isRegistered || !order) return false
        if (!order.omsData) return false
        const ownsOrder = order.customerInfo?.customerId === customerId
        if (!ownsOrder) return false
        return (
            order.productItems?.every(
                (item) =>
                    item.omsData != null &&
                    item.omsData.quantityAvailableToCancel === item.omsData.quantityOrdered
            ) ?? false
        )
    }, [isRegistered, order, customerId])

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
                        'This order is already being processed and cannot be cancelled. Please reach out to the merchant.',
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
                cancelFeedbackTimerRef.current = setTimeout(showCancelSuccess, 300)
            } catch (e) {
                closeCancelModal()
                if (cancelFeedbackTimerRef.current) clearTimeout(cancelFeedbackTimerRef.current)
                cancelFeedbackTimerRef.current = setTimeout(() => showCancelError(e), 300)
            }
        },
        [closeCancelModal, cancelMutation, showCancelSuccess, showCancelError]
    )

    // Clear any pending feedback timers on unmount so they can't fire after the
    // component is gone (e.g. shopper navigates away during the 300ms delay).
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
                    <Flex gap={2} wrap="wrap">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setCancelFeedback(null)
                                setReturnFeedback(null)
                                openCancelModal()
                            }}
                            isDisabled={
                                !canCancel || cancelFeedback?.status === 'success' || cancelTerminal
                            }
                        >
                            <FormattedMessage
                                defaultMessage="Cancel order"
                                id="account_order_detail.button.cancel_order"
                            />
                        </Button>
                        {showStartReturn && (
                            <>
                                <Button
                                    data-testid="account-order-detail-start-return"
                                    variant="outline"
                                    size="sm"
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
                                        const expectedDeliveryDate =
                                            omsShipment?.expectedDeliveryDate
                                        const actualDeliveryDate = omsShipment?.actualDeliveryDate

                                        return (
                                            <React.Fragment key={`delivery-${index}`}>
                                                <OrderTracking
                                                    shippingMethodName={shippingMethodName}
                                                    shippingStatus={shippingStatus}
                                                    trackingNumber={trackingNumber}
                                                    trackingUrl={trackingUrl}
                                                    expectedDeliveryDate={expectedDeliveryDate}
                                                    actualDeliveryDate={actualDeliveryDate}
                                                    shipmentsLength={deliveryShipments.length}
                                                    index={index}
                                                />
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
                                        <OrderTracking
                                            key={`oms-shipment-${index}`}
                                            shippingMethodName={shipment.provider}
                                            shippingStatus={shipment.status}
                                            trackingNumber={shipment.trackingNumber}
                                            trackingUrl={shipment.trackingUrl}
                                            expectedDeliveryDate={shipment.expectedDeliveryDate}
                                            actualDeliveryDate={shipment.actualDeliveryDate}
                                            shipmentsLength={omsShipmentCount}
                                            index={index}
                                        />
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
                    selection={returnSelection}
                    onSelectionChange={setReturnSelection}
                    onSubmit={handleSubmitReturn}
                    onClearSubmitError={() => setReturnSubmitError(null)}
                    isSubmitting={returnMutation.isLoading}
                    submitError={returnSubmitError}
                    finalFocusRef={headingRef}
                />
            )}
        </Stack>
    )
}

AccountOrderDetail.getTemplateName = () => 'account-order-history'

export default AccountOrderDetail
