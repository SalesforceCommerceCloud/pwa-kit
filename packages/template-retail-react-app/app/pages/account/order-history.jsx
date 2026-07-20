/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useRef} from 'react'
import {FormattedMessage, FormattedNumber, useIntl} from 'react-intl'
import {useLocation} from 'react-router'
import {
    Box,
    Heading,
    Text,
    Stack,
    Flex,
    Button,
    Divider,
    Grid,
    AspectRatio,
    Img,
    Skeleton
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useCustomerOrders, useProducts} from '@salesforce/commerce-sdk-react'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {usePageUrls, useSearchParams} from '@salesforce/retail-react-app/app/hooks'
import PageActionPlaceHolder from '@salesforce/retail-react-app/app/components/page-action-placeholder'
import Link from '@salesforce/retail-react-app/app/components/link'
import {ChevronRightIcon, ReceiptIcon} from '@salesforce/retail-react-app/app/components/icons'
import Pagination from '@salesforce/retail-react-app/app/components/pagination'
import PropTypes from 'prop-types'
import {DEFAULT_ORDERS_SEARCH_PARAMS} from '@salesforce/retail-react-app/app/constants'
import OrderStatusBadge from '@salesforce/retail-react-app/app/components/order-status-badge'

// Fetches products for an order's `productItems` and returns the catalog-only subset —
// entries whose `productId` misses the Shopper Products response are dropped. This
// catches the OMS-emitted shipping-cost surcharge (productId is a shipping-method id
// like `UK_Ground`, missing from the catalog), so image thumbnails and the "N items"
// count both reflect real products. Falls through to the raw list while the batch is
// in flight or on failure, so a transient outage doesn't blank the card.
const useCatalogProductItems = (productItems) => {
    const ids = (productItems || []).map((item) => item.productId).join(',') ?? ''
    const {data: {data: products} = {}, isLoading} = useProducts({
        parameters: {ids}
    })
    const productsById = products?.reduce((acc, p) => {
        acc[p.id] = p
        return acc
    }, {})
    const filtered =
        productsById && Object.keys(productsById).length > 0
            ? (productItems || []).filter((item) => item.productId && productsById[item.productId])
            : productItems
    return {productItems: filtered, productsById, isLoading}
}

const OrderProductImages = ({productItems}) => {
    const {productItems: filtered, productsById, isLoading} = useCatalogProductItems(productItems)

    const images = filtered?.map((item) => {
        const product = productsById?.[item.productId]
        return product?.imageGroups?.find((group) => group.viewType === 'small')?.images?.[0]
    })

    return (
        <>
            {!isLoading && productsById && Object.keys(productsById).length > 0
                ? images?.map((image, index) => {
                      return (
                          <AspectRatio
                              key={index}
                              ratio={1}
                              width="88px"
                              w="88px"
                              borderRadius="base"
                              overflow="hidden"
                          >
                              <Img
                                  alt={image?.alt}
                                  src={image?.disBaseLink || image?.link}
                                  fallback={<Box background="gray.100" boxSize="full" />}
                              />
                          </AspectRatio>
                      )
                  })
                : (productItems || []).map((item, index) => {
                      return <Skeleton key={index} h="88px" w="88px" />
                  })}
        </>
    )
}
OrderProductImages.propTypes = {
    productItems: PropTypes.array
}

// Renders the catalog-only item count so shipping-surcharge lines don't inflate it.
// Reuses the same useProducts query as OrderProductImages, so tanstack-query dedupes
// the two calls and no extra request is made.
const OrderItemCount = ({productItems}) => {
    const {productItems: filtered} = useCatalogProductItems(productItems)
    return (
        <FormattedMessage
            defaultMessage="{count, plural, one {# item} other {# items}}"
            id="account_order_history.label.num_of_items"
            description="Number of items in order"
            values={{count: filtered?.length ?? 0}}
        />
    )
}
OrderItemCount.propTypes = {
    productItems: PropTypes.array
}

const onClient = typeof window !== 'undefined'
const AccountOrderHistory = () => {
    const location = useLocation()
    const {formatMessage, formatDate} = useIntl()
    const navigate = useNavigation()

    const {data: customer} = useCurrentCustomer()
    const {customerId} = customer

    const searchParams = useSearchParams(DEFAULT_ORDERS_SEARCH_PARAMS)
    const {limit, offset} = searchParams[0]

    // expand: 'oms' returns order data from OMS if successfully ingested, otherwise from ECOM
    const {data: {data: orders, ...paging} = {}, isLoading} = useCustomerOrders(
        {
            parameters: {customerId, limit, offset, expand: 'oms'}
        },
        {enabled: onClient && !!customerId}
    )

    const hasOrders = orders?.length > 0

    const pageUrls = usePageUrls({total: paging.total, limit})

    const headingRef = useRef()
    useEffect(() => {
        // Focus the 'Order History' header when the component mounts for accessibility
        headingRef?.current?.focus()
    }, [])

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [customer, searchParams.offset])

    return (
        <Stack spacing={4} data-testid="account-order-history-page">
            <Stack>
                <Heading as="h1" fontSize="2xl" tabIndex="0" ref={headingRef}>
                    <FormattedMessage
                        defaultMessage="Order History"
                        id="account_order_history.title.order_history"
                    />
                </Heading>
            </Stack>

            {isLoading ? (
                [1, 2, 3].map((i) => (
                    <Stack key={i} spacing={4} layerStyle="cardBordered">
                        <Stack spacing={2}>
                            <Skeleton h="20px" w="112px" />
                            <Skeleton h="20px" w="200px" />
                        </Stack>
                        <Grid templateColumns={{base: 'repeat(auto-fit, 88px)'}} gap={4}>
                            {Array.from(Array(4).keys()).map((i) => (
                                <Skeleton key={i} w="88px" h="88px" />
                            ))}
                        </Grid>
                        <Skeleton h="20px" w="200px" />
                    </Stack>
                ))
            ) : (
                <Stack spacing={4}>
                    {orders?.map((order) => {
                        return (
                            <Stack key={order.orderNo} spacing={4} layerStyle="cardBordered">
                                <Box>
                                    <Flex justifyContent="space-between">
                                        <Text fontWeight="bold" fontSize="lg">
                                            <FormattedMessage
                                                defaultMessage="Ordered: {date}"
                                                id="account_order_history.label.ordered_date"
                                                values={{
                                                    date: formatDate(new Date(order.creationDate), {
                                                        year: 'numeric',
                                                        day: 'numeric',
                                                        month: 'short'
                                                    })
                                                }}
                                            />
                                        </Text>
                                        <Box>
                                            <Button
                                                as={Link}
                                                to={`/account/orders/${order.orderNo}`}
                                                variant="link"
                                                rightIcon={
                                                    <ChevronRightIcon boxSize={5} mx={-1.5} />
                                                }
                                                fontSize={{base: 'sm', lg: 'md'}}
                                            >
                                                <FormattedMessage
                                                    defaultMessage="View Details"
                                                    id="account_order_history.link.view_details"
                                                />
                                            </Button>
                                        </Box>
                                    </Flex>
                                    <Stack direction="row" alignItems="center">
                                        <Text>
                                            <FormattedMessage
                                                defaultMessage="Order Number: {orderNumber}"
                                                id="account_order_history.label.order_number"
                                                values={{orderNumber: order.orderNo}}
                                            />
                                        </Text>
                                        <OrderStatusBadge order={order} />
                                    </Stack>
                                </Box>
                                <Grid templateColumns={{base: 'repeat(auto-fit, 88px)'}} gap={4}>
                                    <OrderProductImages productItems={order.productItems} />
                                </Grid>

                                <Stack
                                    direction={{base: 'column', lg: 'row'}}
                                    alignItems={{base: 'flex-start', lg: 'center'}}
                                    spacing={{base: '2px', lg: 3}}
                                    divider={
                                        <Divider
                                            visibility={{base: 'hidden', lg: 'visible'}}
                                            orientation={'vertical'}
                                            h={{base: 0, lg: 4}}
                                        />
                                    }
                                >
                                    <Text>
                                        <OrderItemCount productItems={order.productItems} />
                                    </Text>
                                    <Text>
                                        <FormattedNumber
                                            style="currency"
                                            currency={order.currency}
                                            value={order.orderTotal}
                                        />
                                    </Text>
                                    <Text>
                                        <FormattedMessage
                                            defaultMessage="Shipped to: {name}"
                                            id="account_order_history.label.shipped_to"
                                            values={{
                                                name:
                                                    order.shipments[0].shippingAddress.firstName &&
                                                    order.shipments[0].shippingAddress.lastName
                                                        ? `${order.shipments[0].shippingAddress.firstName} ${order.shipments[0].shippingAddress.lastName}`
                                                        : order.shipments[0].shippingAddress
                                                              .fullName
                                            }}
                                        />
                                    </Text>
                                </Stack>
                            </Stack>
                        )
                    })}

                    {hasOrders && orders?.length < paging.total && (
                        <Box pt={4}>
                            <Pagination
                                currentURL={`${location.pathname}${location.search}`}
                                urls={pageUrls}
                            />
                        </Box>
                    )}
                </Stack>
            )}

            {!hasOrders && !isLoading && (
                <Stack data-testid="account-order-history-place-holder">
                    <PageActionPlaceHolder
                        icon={<ReceiptIcon boxSize={8} />}
                        heading={formatMessage({
                            defaultMessage: "You haven't placed an order yet.",
                            id: 'account_order_history.heading.no_order_yet'
                        })}
                        text={formatMessage({
                            defaultMessage:
                                'Once you place an order the details will show up here.',
                            id: 'account_order_history.description.once_you_place_order'
                        })}
                        buttonText={formatMessage({
                            defaultMessage: 'Continue Shopping',
                            id: 'account_order_history.button.continue_shopping'
                        })}
                        buttonProps={{leftIcon: undefined}}
                        onButtonClick={() => navigate('/')}
                    />
                </Stack>
            )}
        </Stack>
    )
}

AccountOrderHistory.getTemplateName = () => 'account-order-history'

export default AccountOrderHistory
