/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
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
    Skeleton
} from '@chakra-ui/react'
import {getCreditCardIcon} from '../../utils/cc-utils'
import {useAccountOrders} from './util/order-context'
import Link from '../../components/link'
import {ChevronLeftIcon} from '../../components/icons'
import OrderSummary from '../../components/order-summary'
import ItemVariantProvider from '../../components/item-variant'
import CartItemVariantImage from '../../components/item-variant/item-image'
import CartItemVariantName from '../../components/item-variant/item-name'
import CartItemVariantAttributes from '../../components/item-variant/item-attributes'
import CartItemVariantPrice from '../../components/item-variant/item-price'

const AccountOrderDetail = () => {
    const {url, params} = useRouteMatch()
    const history = useHistory()
    const {formatMessage, formatDate} = useIntl()
    const {ordersById, productsById, isLoading, fetchOrder} = useAccountOrders()
    const order = ordersById[params.orderNo]

    useEffect(() => {
        fetchOrder(params.orderNo)
    }, [])

    const shipment = order?.shipments[0]
    const {shippingAddress, shippingMethod, shippingStatus, trackingNumber} = shipment || {}
    const paymentCard = order?.paymentInstruments[0]?.paymentCard
    const CardIcon = getCreditCardIcon(paymentCard?.cardType)
    const itemCount = order?.productItems.reduce((count, item) => item.quantity + count, 0)

    return (
        <Stack spacing={6} data-testid="account-order-details-page">
            <Stack>
                <Box>
                    <Button
                        as={Link}
                        to={`${url.replace(`/${params.orderNo}`, '')}`}
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
                    <Heading as="h1" fontSize={['lg', '2xl']}>
                        <FormattedMessage
                            defaultMessage="Order Details"
                            id="account_order_detail.title.order_details"
                        />
                    </Heading>

                    {!isLoading ? (
                        <Stack
                            direction={['column', 'row']}
                            alignItems={['flex-start', 'center']}
                            spacing={[0, 3]}
                            divider={
                                <Divider
                                    visibility={{base: 'hidden', lg: 'visible'}}
                                    orientation={{lg: 'vertical'}}
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
                                <Badge colorScheme="green">{order.status}</Badge>
                            </Stack>
                        </Stack>
                    ) : (
                        <Skeleton h="20px" w="192px" />
                    )}
                </Stack>
            </Stack>

            <Box layerStyle="cardBordered">
                <Grid templateColumns={{base: '1fr', xl: '60% 1fr'}} gap={{base: 6, xl: 2}}>
                    <SimpleGrid columns={{base: 1, sm: 2}} columnGap={4} rowGap={5} py={{xl: 6}}>
                        {isLoading && (
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
                        )}

                        {!isLoading && (
                            <>
                                <Stack spacing={1}>
                                    <Text fontWeight="bold" fontSize="sm">
                                        <FormattedMessage
                                            defaultMessage="Shipping Method"
                                            id="account_order_detail.heading.shipping_method"
                                        />
                                    </Text>
                                    <Box>
                                        <Text fontSize="sm" textTransform="titlecase">
                                            {shippingStatus.replace(/_/g, ' ')}
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
                                    <Text fontWeight="bold" fontSize="sm">
                                        <FormattedMessage
                                            defaultMessage="Payment Method"
                                            id="account_order_detail.heading.payment_method"
                                        />
                                    </Text>
                                    <Stack direction="row">
                                        {CardIcon && <CardIcon layerStyle="ccIcon" />}
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
                                    <Text fontWeight="bold" fontSize="sm">
                                        <FormattedMessage
                                            defaultMessage="Shipping Address"
                                            id="account_order_detail.heading.shipping_address"
                                        />
                                    </Text>
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
                                    <Text fontWeight="bold" fontSize="sm">
                                        <FormattedMessage
                                            defaultMessage="Billing Address"
                                            id="account_order_detail.heading.billing_address"
                                        />
                                    </Text>
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
                    {isLoading &&
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
                        ))}

                    {!isLoading &&
                        order.productItems?.map((product, idx) => {
                            const variant = {
                                ...product,
                                ...productsById[product.productId],
                                price: product.price
                            }
                            return (
                                <Box
                                    p={[4, 6]}
                                    key={product.productId}
                                    border="1px solid"
                                    borderColor="gray.100"
                                    borderRadius="base"
                                >
                                    <ItemVariantProvider
                                        index={idx}
                                        variant={variant}
                                        currency={order.currency}
                                    >
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
                                                        currency={order.currency}
                                                    />
                                                    <CartItemVariantPrice
                                                        currency={order.currency}
                                                    />
                                                </Flex>
                                            </Stack>
                                        </Flex>
                                    </ItemVariantProvider>
                                </Box>
                            )
                        })}
                </Stack>
            </Stack>
        </Stack>
    )
}

AccountOrderDetail.getTemplateName = () => 'account-order-history'

export default AccountOrderDetail
