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
import {
    getOrderDisplayStatus,
    ORDER_DISPLAY_STATUS
} from '@salesforce/retail-react-app/app/utils/order-status-utils'
import {STORE_LOCATOR_IS_ENABLED} from '@salesforce/retail-react-app/app/constants'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {consolidateDuplicateBonusProducts} from '@salesforce/retail-react-app/app/utils/bonus-product/cart'
import CancelOrderModal from '@salesforce/retail-react-app/app/components/cancel-order-modal'
import ReturnItemsModal from '@salesforce/retail-react-app/app/components/return-items-modal'
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
    // Terminal return errors (404/409) mean retrying won't help — disable the button
    const [returnTerminal, setReturnTerminal] = useState(false)
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
    const showStartReturn = isRegistered && ownsOrder && returnableItems.length > 0

    const isCancelled =
        cancelFeedback?.status === 'success' ||
        getOrderDisplayStatus(order) === ORDER_DISPLAY_STATUS.CANCELLED

    const {data: omsMetaData} = useOmsMetaData({parameters: {}}, {enabled: isOmsOrder && onClient})

    const handleCloseReturnModal = useCallback(() => {
        // Invalidate any in-flight submit so its async result is ignored.
        returnSubmitTokenRef.current += 1
        closeReturnModal()
        setReturnSelection({})
        setReturnSubmitError(null)
        setReturnTerminal(false)
    }, [closeReturnModal])

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

    // Inline submit-error copy lives in the modal (with Retry); this is the
    // post-close banner shown only for terminal failures, mirroring the cancel
    // flow's 404/409 messaging.
    const showReturnError = useCallback(
        (error) => {
            const status = error?.response?.status
            const description =
                status === 404
                    ? formatMessage({
                          defaultMessage:
                              'We could not find this order. Please refresh and try again.',
                          id: 'account_order_detail.alert.return_error_not_found'
                      })
                    : formatMessage({
                          defaultMessage:
                              'Some of these items can no longer be returned. We have refreshed the order — please review and try again.',
                          id: 'account_order_detail.alert.return_error_conflict'
                      })
            setReturnFeedback({
                status: 'error',
                title: formatMessage({
                    defaultMessage: 'Unable to submit return',
                    id: 'account_order_detail.alert.return_error_title'
                }),
                description
            })
            // 404/409 are terminal — set it here (after the modal close) so a fresh
            // open via handleCloseReturnModal doesn't immediately reset it.
            if (status === 404 || status === 409) setReturnTerminal(true)
        },
        [formatMessage]
    )

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
                if (token !== returnSubmitTokenRef.current) return
                const status = e?.response?.status
                // 404 (order gone) / 409 (items no longer returnable) are terminal:
                // retrying the same payload won't help. Close the modal, refetch so
                // returnableItems reflect reality, and show a terminal banner. The
                // terminal flag is set inside showReturnError (after the close) so
                // handleCloseReturnModal's reset doesn't clobber it.
                if (status === 404 || status === 409) {
                    handleCloseReturnModal()
                    refetchOrder?.()
                    if (returnFeedbackTimerRef.current) clearTimeout(returnFeedbackTimerRef.current)
                    returnFeedbackTimerRef.current = setTimeout(() => showReturnError(e), 300)
                } else {
                    // Transient — keep the modal open so the shopper can retry inline.
                    setReturnSubmitError(e)
                }
            }
        },
        [
            returnMutation,
            order?.orderNo,
            handleCloseReturnModal,
            showReturnSuccess,
            showReturnError,
            refetchOrder
        ]
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
                            <Badge colorScheme={isCancelled ? 'red' : 'green'}>
                                {isCancelled ? (
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
                            <Button
                                data-testid="account-order-detail-start-return"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    // Don't wipe a *successful* cancellation — that's the
                                    // source of the "Cancelled" badge. Only clear a stale
                                    // cancel error/in-progress feedback.
                                    if (cancelFeedback?.status !== 'success') {
                                        setCancelFeedback(null)
                                    }
                                    setReturnFeedback(null)
                                    openReturnModal()
                                }}
                                isDisabled={
                                    cancelFeedback?.status === 'success' ||
                                    cancelMutation.isLoading ||
                                    cancelTerminal ||
                                    returnTerminal
                                }
                            >
                                <FormattedMessage
                                    defaultMessage="Return Items"
                                    id="account_order_detail.button.start_return"
                                />
                            </Button>
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
