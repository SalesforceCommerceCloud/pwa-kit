/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.com/licenses/BSD-3-Clause
 */

import React, {useEffect, useRef} from 'react'
import {FormattedMessage, FormattedNumber, useIntl} from 'react-intl'
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
import {useOrder, useProducts, useCustomerId, useCustomerType} from '@salesforce/commerce-sdk-react'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import Link from '@salesforce/retail-react-app/app/components/link'
import {ChevronLeftIcon} from '@salesforce/retail-react-app/app/components/icons'
import OrderSummary from '@salesforce/retail-react-app/app/components/order-summary'
import ProductList from '@salesforce/retail-react-app/app/components/product-list'
import CancelOrderModal from '@salesforce/retail-react-app/app/components/cancel-order-modal'
import OrderStatusBar from '@salesforce/retail-react-app/app/components/order-status-bar/index'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {getOrderStatusColorScheme} from '@salesforce/retail-react-app/app/pages/account/order-history'
import {getLocalizedOrderStatus} from '@salesforce/retail-react-app/app/pages/account/order-history'
import {useSomOrderQuery} from '@salesforce/retail-react-app/app/hooks/use-som-order-query'

const onClient = typeof window !== 'undefined'

const AccountOrderDetail = () => {
    const {params} = useRouteMatch()
    const history = useHistory()
    const {formatMessage, formatDate} = useIntl()
    const toast = useToast()
    const {data: customer} = useCurrentCustomer()
    
    // Get order data from navigation state (for guest users)
    const location = history.location
    const passedOrderData = location.state?.orderData
    const isGuestUser = location.state?.isGuestUser

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

    // Call OrderDetails API for additional order information (for registered users)
    // or use passed data for guest users
    const orderDetailsQuery = useSomOrderQuery('orderDetails', {
        siteId: 'RefArch',
        c_orderNumber: params.orderNo
    }, {
        enabled: !isGuestUser && onClient && !!params.orderNo
    })

    // Extract order data from API response or passed data
    const orderDetailsData = orderDetailsQuery.data
    const orderFromAPI = isGuestUser ? passedOrderData : orderDetailsData?.order
    
    const orderStatus = orderFromAPI?.Status || order?.status
    const orderNumber = orderFromAPI?.OrderNumber || order?.orderNo
    const orderedDate = orderFromAPI?.OrderedDate || order?.creationDate
    
    // Simple pricing - use trackOrder data directly for guest users, original data for registered users
    const grandTotal = isGuestUser ? (orderFromAPI?.GrandTotalAmount || 0) : (order?.orderTotal || 0)
    
    // Try multiple possible field names for subtotal/product total
    const productTotal = isGuestUser ? (
        orderFromAPI?.TotalAdjustedProductAmount || 
        orderFromAPI?.SubtotalAmount || 
        orderFromAPI?.ProductTotalAmount || 
        orderFromAPI?.ItemTotalAmount || 
        orderFromAPI?.NetAmount || 
        0
    ) : (order?.productTotal || 0)
    
    const shippingTotal = isGuestUser ? (orderFromAPI?.TotalAdjustedDeliveryAmount || 0) : (order?.shippingTotal || 0)
    const taxTotal = isGuestUser ? (orderFromAPI?.TotalTaxAmount || 0) : (order?.taxTotal || 0)
    const currency = isGuestUser ? (orderFromAPI?.Currency || 'USD') : (order?.currency || 'USD')
    
    
    const paymentSummaries = orderFromAPI?.OrderPaymentSummaries?.records || order?.paymentInstruments || []
    const orderItems = orderFromAPI?.OrderItemSummaries?.records || order?.productItems || []

    const isLoading = isOrderLoading || (!isGuestUser && orderDetailsQuery.isLoading) || (!order && !orderFromAPI)
    const paymentCard = order?.paymentInstruments?.[0]?.paymentCard
    const CardIcon = getCreditCardIcon(paymentCard?.cardType)
    const itemCount = orderItems.length > 0 
        ? orderItems.reduce((count, item) => item.Quantity + count, 0) 
        : order?.productItems?.reduce((count, item) => item.quantity + count, 0) || 0

    // Create product items array for both registered and guest users
    const productItems = isGuestUser && orderItems.length > 0 
        ? orderItems
            .filter(item => {
                // Filter out delivery charges, taxes, and other non-product items
                const type = item.Type || item.TypeCode || ''
                const isProduct = type.toLowerCase().includes('product') || 
                                 type.toLowerCase().includes('item') ||
                                 (!type.toLowerCase().includes('delivery') && 
                                  !type.toLowerCase().includes('shipping') && 
                                  !type.toLowerCase().includes('tax') &&
                                  !type.toLowerCase().includes('discount') &&
                                  !type.toLowerCase().includes('fee'))
                return isProduct && item.ProductCode
            })
            .map((item, index) => {
                // Calculate unit price from total price and quantity
                const unitPrice = item.UnitPrice || (item.TotalPrice && item.Quantity ? item.TotalPrice / item.Quantity : 0)
                return {
                    itemId: item.Id || `guest-item-${index}`,
                    productId: item.ProductCode, // Use ProductCode instead of ProductId
                    productName: item.ProductName || `Product ${item.ProductCode}`,
                    quantity: item.Quantity || 1,
                    price: unitPrice,
                    priceAfterItemDiscount: unitPrice,
                    currency: orderFromAPI?.Currency || 'USD',
                    attributes: item.ProductAttributes || [],
                    image: item.ProductImage || item.Product?.Image
                }
            })
        : order?.productItems || []

    // Cancel order gating
    const customerId = useCustomerId()
    const {isRegistered} = useCustomerType()
    const {data: currentCustomer} = useCurrentCustomer()

    const isOmsEnabled = getConfig().app?.oms?.enabled
    const orderStatusLower = (order?.status || '').toLowerCase()
    const shipmentStatus = (order?.shippingStatus || '').toLowerCase()
    const statusEligible = !['cancelled', 'canceled', 'completed', 'failed'].includes(orderStatusLower)
    const shippingEligible = shipmentStatus === 'not_shipped'
    const ownsOrder =
        (order?.customerInfo?.customerId && order.customerInfo.customerId === customerId) ||
        (order?.customerInfo?.email &&
            currentCustomer?.email &&
            order.customerInfo.email.toLowerCase() === currentCustomer.email.toLowerCase())

    const canCancel =
        !isLoading &&
        isOmsEnabled &&
        isRegistered &&
        ownsOrder &&
        statusEligible &&
        shippingEligible

    // NOTE: intentionally left API call as no-op until the cancel API is ready.
    // When the API is available, replace call with real API request.
    // The handler should update UI (e.g., refetch order, show a toast, navigate back to orders).
    const handleCancelOrder = async () => {
        try {
            // const response = await realCancelOrderApi(_order.orderNo, _reasonId)
            const response = undefined // no-op placeholder for now

            // Error (4xx/5xx)
            if (response && !response.ok) {
                toast({
                    title: formatMessage({
                        defaultMessage: 'Something went wrong with the order cancellation.',
                        id: 'account_order_detail.toast.cancellation_failed'
                    }),
                    status: 'error'
                })
                return
            }

            // Success (2xx)
            toast({
                title: formatMessage({
                    defaultMessage: 'Your order cancellation request was submitted.',
                    id: 'account_order_detail.toast.cancellation_success'
                }),
                status: 'success'
            })
        } catch (e) {
            // Network/unexpected error
            toast({
                title: formatMessage({
                    defaultMessage: 'Something went wrong with the order cancellation.',
                    id: 'account_order_detail.toast.cancellation_failed'
                }),
                status: 'error'
            })
        }
    }

    // Fetch product data for order items
    const productIds = productItems.map((product) => product.productId).filter(Boolean)
    
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
    const variants = productItems.map((item) => {
        const product = products?.[item.productId]
        const variant = {
            ...(product ? product : {}),
            isProductUnavailable: !product,
            // Ensure item data (including price) takes precedence over product data
            ...item,
            // Explicitly set the price to ensure it's not overridden
            price: item.price
        }
        return variant
    })

    // Create basket-like object for OrderSummary component
    const basketForSummary = {
        orderNo: orderNumber,
        currency: currency,
        orderTotal: Number(grandTotal) || 0,
        productTotal: Number(productTotal) || 0,
        productItems: variants, // Use variants which have merged product data
        shippingItems: order?.shippingItems || [],
        couponItems: order?.couponItems || [],
        shippingTotal: Number(shippingTotal) || 0,
        taxTotal: Number(taxTotal) || 0,
        productSubTotal: Number(productTotal) || 0, // OrderSummary expects productSubTotal, not subtotal
        paymentInstruments: order?.paymentInstruments || []
    }
    

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
                                        date: formatDate(new Date(orderedDate), {
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
                                        values={{orderNumber: orderNumber}}
                                    />
                                </Text>
                                <Badge
                                    bg={getOrderStatusColorScheme(orderStatus).bg}
                                    color={getOrderStatusColorScheme(orderStatus).color}
                                    variant="solid"
                                >
                                    {getLocalizedOrderStatus(orderStatus, formatMessage)}
                                </Badge>
                            </Stack>
                        </Stack>
                    ) : (
                        <Skeleton h="20px" w="192px" />
                    )}
                </Stack>
            </Stack>

            {!isLoading && isOmsEnabled && <OrderStatusBar currentStepLabel={orderStatus} />}

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
                            </>
                        ) : (
                            <>
                                <Stack spacing={1}>
                                    <Heading as="h2" fontSize="sm" pt={1}>
                                        <FormattedMessage
                                            defaultMessage="Order Status"
                                            id="account_order_detail.heading.order_status"
                                        />
                                    </Heading>
                                    <Box>
                                        <Badge
                                            bg={getOrderStatusColorScheme(orderStatus).bg}
                                            color={getOrderStatusColorScheme(orderStatus).color}
                                            variant="solid"
                                            fontSize="sm"
                                        >
                                            {getLocalizedOrderStatus(orderStatus, formatMessage)}
                                        </Badge>
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
                                            <Text fontSize="sm">
                                                {paymentSummaries.length > 0 ? (
                                                    paymentSummaries[0].Method
                                                ) : (
                                                    paymentCard?.cardType
                                                )}
                                            </Text>
                                            {paymentSummaries.length > 0 ? (
                                                <Text fontSize="sm">
                                                    {paymentSummaries[0].FullName}
                                                </Text>
                                            ) : (
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
                                            )}
                                        </Box>
                                    </Stack>
                                </Stack>
                                <Stack spacing={1}>
                                    <Heading as="h2" fontSize="sm" pt={1}>
                                        <FormattedMessage
                                            defaultMessage="Order Total"
                                            id="account_order_detail.heading.order_total"
                                        />
                                    </Heading>
                                    <Text fontSize="lg" fontWeight="bold">
                                        <FormattedNumber
                                            style="currency"
                                            currency={order?.currency || 'USD'}
                                            value={grandTotal}
                                        />
                                    </Text>
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
                            <OrderSummary 
                                basket={basketForSummary} 
                                fontSize="sm" 
                                orderTotal={grandTotal}
                            />
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
                        <ProductList variants={variants} currency={basketForSummary.currency} spacing={2} />
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
                    onCancel={handleCancelOrder}
                />
            )}
        </Stack>
    )
}

AccountOrderDetail.getTemplateName = () => 'account-order-history'

export default AccountOrderDetail