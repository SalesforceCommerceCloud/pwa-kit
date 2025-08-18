/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useRef} from 'react'
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
} from '@chakra-ui/react'
import {getCreditCardIcon} from '@salesforce/retail-react-app/app/utils/cc-utils'
import {useOrder, useProducts} from '@salesforce/commerce-sdk-react'
import Link from '@salesforce/retail-react-app/app/components/link'
import {ChevronLeftIcon} from '@salesforce/retail-react-app/app/components/icons'
import OrderSummary from '@salesforce/retail-react-app/app/components/order-summary'
import ProductList from '@salesforce/retail-react-app/app/components/product-list'
import CancelOrderModal from '@salesforce/retail-react-app/app/components/cancel-order-modal'
import OrderStatusBar from '@salesforce/retail-react-app/app/components/order-status-bar/index'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {getOrderStatusColorScheme} from '@salesforce/retail-react-app/app/pages/account/order-history'
import {getLocalizedOrderStatus} from '@salesforce/retail-react-app/app/pages/account/order-history'
import {useCustomerId, useCustomerType} from '@salesforce/commerce-sdk-react'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'

const onClient = typeof window !== 'undefined'

const AccountOrderDetail = () => {
    const {params} = useRouteMatch()
    const history = useHistory()
    const {formatMessage, formatDate} = useIntl()

    const {
        isOpen: isCancelModalOpen,
        onOpen: onCancelModalOpen,
        onClose: onCancelModalClose
    } = useDisclosure()

    const {data: order, isLoading: isOrderLoading} = useOrder(
        {
            parameters: {orderNo: params.orderNo}
        },
        {
            enabled: onClient && !!params.orderNo
        }
    )
    const isLoading = isOrderLoading || !order
    const shipment = order?.shipments[0]
    const {shippingAddress, shippingMethod, shippingStatus, trackingNumber} = shipment || {}
    const paymentCard = order?.paymentInstruments[0]?.paymentCard
    const CardIcon = getCreditCardIcon(paymentCard?.cardType)
    const itemCount = order?.productItems.reduce((count, item) => item.quantity + count, 0) || 0

    // Cancel order gating (POC)
    const customerId = useCustomerId()
    const {isRegistered} = useCustomerType()
    const {data: currentCustomer} = useCurrentCustomer()

    const isCancelEnabled = getConfig().app?.oms?.cancel?.enabled
    const isOrderStatusBarEnabled = getConfig().app?.oms?.orderStatusBar?.enabled
    const orderStatus = (order?.status || '').toLowerCase()
    const shipmentStatus = (shippingStatus || '').toLowerCase()
    const statusEligible = !['cancelled', 'canceled', 'completed', 'failed'].includes(orderStatus)
    const shippingEligible = shipmentStatus === 'not_shipped'
    const ownsOrder =
        (order?.customerInfo?.customerId && order.customerInfo.customerId === customerId) ||
        (order?.customerInfo?.email &&
            currentCustomer?.email &&
            order.customerInfo.email.toLowerCase() === currentCustomer.email.toLowerCase())

    const canCancel =
        !isLoading &&
        isCancelEnabled &&
        isRegistered &&
        ownsOrder &&
        statusEligible &&
        shippingEligible

    // Debug purposes only
    /*
    console.groupCollapsed('Cancel Order gating debug')
    console.log('isCancelEnabled (config flag app.oms.cancel.enabled):', isCancelEnabled)
    console.log('isRegistered (authenticated user):', isRegistered)
    console.log('customerId (from useCustomerId):', customerId)
    console.log('currentCustomerEmail (from useCurrentCustomer):', currentCustomer?.email)
    console.log('orderStatus (normalized from order.status):', orderStatus)
    console.log('shipmentStatus (normalized from first shipment shippingStatus):', shipmentStatus)
    console.log('statusEligible (!cancelled/canceled/completed/failed):', statusEligible)
    console.log('shippingEligible (shipmentStatus === "not_shipped"): ', shippingEligible)
    console.log('ownsOrder (customerId match OR email match with current customer):', ownsOrder)
    console.log('canCancel (final gate):', canCancel)
    console.groupEnd()
    */
    // Fetch product data for order items
    const productIds = order?.productItems?.map((product) => product.productId) || []
    const {data: products, isLoading: isProductsLoading} = useProducts(
        {
            parameters: {
                ids: productIds.join(','),
                allImages: true
            }
        },
        {
            enabled: !!productIds.length && onClient,
            select: (result) => {
                return result?.data?.reduce((result, item) => {
                    const key = item.id
                    result[key] = item
                    return result
                }, {})
            }
        }
    )

    // Merge product data with order items
    const variants =
        order?.productItems?.map((item) => {
            const product = products?.[item.productId]
            return {
                ...(product ? product : {}),
                isProductUnavailable: !product,
                ...item
            }
        }) || []

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

                <Stack spacing={[1, 2]}>
                    <Flex justify="space-between" align="center">
                        <Heading as="h1" fontSize={['lg', '2xl']} tabIndex="0" ref={headingRef}>
                            <FormattedMessage
                                defaultMessage="Order Details"
                                id="account_order_detail.title.order_details"
                            />
                        </Heading>
                        {/* POC: Gate Cancel Order by config flag */}
                        {canCancel && (
                            <Button variant="link" size="sm" onClick={onCancelModalOpen}>
                                <FormattedMessage
                                    defaultMessage="Cancel order"
                                    id="account_order_detail.button.cancel_order"
                                />
                            </Button>
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
                            <Stack direction="row" alignItems="center">
                                <Text fontSize={['sm', 'md']}>
                                    <FormattedMessage
                                        defaultMessage="Order Number: {orderNumber}"
                                        id="account_order_detail.label.order_number"
                                        values={{orderNumber: order.orderNo}}
                                    />
                                </Text>
                                <Badge
                                    bg={getOrderStatusColorScheme(order.status).bg}
                                    color={getOrderStatusColorScheme(order.status).color}
                                    variant="solid"
                                >
                                    {getLocalizedOrderStatus(order.status, formatMessage)}
                                </Badge>
                            </Stack>
                        </Stack>
                    ) : (
                        <Skeleton h="20px" w="192px" />
                    )}
                </Stack>
            </Stack>

            {!isLoading && isOrderStatusBarEnabled && (
                <OrderStatusBar currentStepLabel={order.status} />
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
                                <Stack spacing={1}>
                                    <Heading as="h2" fontSize="sm" pt={1}>
                                        <FormattedMessage
                                            defaultMessage="Shipping Method"
                                            id="account_order_detail.heading.shipping_method"
                                        />
                                    </Heading>
                                    <Box>
                                        <Text fontSize="sm" textTransform="titlecase">
                                            {
                                                {
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
                                                }[shippingStatus]
                                            }
                                        </Text>
                                        <Text fontSize="sm">{shippingMethod.name}</Text>
                                        <Text fontSize="sm">
                                            <FormattedMessage
                                                defaultMessage="Tracking Number"
                                                id="account_order_detail.label.tracking_number"
                                            />
                                            :{' '}
                                            {trackingNumber ||
                                                formatMessage({
                                                    defaultMessage: 'Pending',
                                                    id: 'account_order_detail.label.pending_tracking_number'
                                                })}
                                        </Text>
                                    </Box>
                                </Stack>
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
                                <Stack spacing={1}>
                                    <Heading as="h2" fontSize="sm" pt={1}>
                                        <FormattedMessage
                                            defaultMessage="Shipping Address"
                                            id="account_order_detail.heading.shipping_address"
                                        />
                                    </Heading>
                                    <Box>
                                        <Text fontSize="sm">
                                            {shippingAddress.firstName} {shippingAddress.lastName}
                                        </Text>
                                        <Text fontSize="sm">{shippingAddress.address1}</Text>
                                        <Text fontSize="sm">
                                            {shippingAddress.city}, {shippingAddress.stateCode}{' '}
                                            {shippingAddress.postalCode}
                                        </Text>
                                    </Box>
                                </Stack>
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
                    ) : !isProductsLoading ? (
                        <ProductList variants={variants} currency={order.currency} spacing={2} />
                    ) : (
                        <Stack spacing={2}>
                            {Array.from({length: 3}).map((_, index) => (
                                <Box
                                    key={index}
                                    p={4}
                                    border="1px solid"
                                    borderColor="gray.100"
                                    borderRadius="base"
                                >
                                    <Flex alignItems="flex-start">
                                        <Skeleton w="20" h="20" mr={4} />
                                        <Stack spacing={1} flex={1}>
                                            <Skeleton h="20px" w="60%" />
                                            <Skeleton h="16px" w="40%" />
                                            <Skeleton h="16px" w="30%" />
                                        </Stack>
                                    </Flex>
                                </Box>
                            ))}
                        </Stack>
                    )}
                </Stack>
            </Stack>

            {canCancel && (
                <CancelOrderModal
                    isOpen={isCancelModalOpen}
                    onClose={onCancelModalClose}
                    order={order}
                    onCancel={(order, selectedReason) => {
                        // POC: No backend call yet
                        console.log('Requesting cancellation for order:', order?.orderNo)
                        console.log('Cancellation reason:', selectedReason)
                    }}
                />
            )}
        </Stack>
    )
}

AccountOrderDetail.getTemplateName = () => 'account-order-history'

export default AccountOrderDetail
