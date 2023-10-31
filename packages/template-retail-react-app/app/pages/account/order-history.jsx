/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import {FormattedMessage, FormattedNumber, useIntl} from 'react-intl'
import {useLocation} from 'react-router'
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

const OrderProductImages = ({productItems}) => {
    const ids = productItems.map((item) => item.productId).join(',') ?? ''
    const {data: {data: products} = {}, isLoading} = useProducts({
        parameters: {
            ids: ids
        }
    })

    const images = products?.map((product) => {
        return product?.imageGroups?.find((group) => group.viewType === 'small').images[0]
    })

    return (
        <>
            {!isLoading && products
                ? images.map((image, index) => {
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
                : productItems.map((item, index) => {
                      return <Skeleton key={index} h="88px" w="88px" />
                  })}
        </>
    )
}
OrderProductImages.propTypes = {
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

    const {data: {data: orders, ...paging} = {}, isLoading} = useCustomerOrders(
        {
            parameters: {customerId, limit, offset}
        },
        {enabled: onClient && !!customerId}
    )

    const hasOrders = orders?.length > 0

    const pageUrls = usePageUrls({total: paging.total, limit})

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [customer, searchParams.offset])

    return (
        <Stack spacing={4} data-testid="account-order-history-page">
            <Stack>
                <Heading as="h1" fontSize="2xl">
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
                                                    defaultMessage="View details"
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
                                        <Badge colorScheme="green">{order.status}</Badge>
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
                                            orientation={{lg: 'vertical'}}
                                            h={{base: 0, lg: 4}}
                                        />
                                    }
                                >
                                    <Text>
                                        <FormattedMessage
                                            defaultMessage="{count} items"
                                            id="account_order_history.label.num_of_items"
                                            description="Number of items in order"
                                            values={{count: order.productItems.length}}
                                        />
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
                                                name: `${order.shipments[0].shippingAddress.firstName} ${order.shipments[0].shippingAddress.lastName}`
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
