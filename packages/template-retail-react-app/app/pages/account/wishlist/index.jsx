/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import {Stack, Heading} from '@chakra-ui/layout'
import {FormattedMessage, useIntl} from 'react-intl'
import {Box, Flex, Skeleton} from '@chakra-ui/react'
import {useProducts, useShopperCustomersMutation} from 'commerce-sdk-react-preview'

import useNavigation from '../../../hooks/use-navigation'
import {useToast} from '../../../hooks/use-toast'
import {useWishList} from '../../../hooks/use-wish-list'

import PageActionPlaceHolder from '../../../components/page-action-placeholder'
import {HeartIcon} from '../../../components/icons'
import ProductItem from '../../../components/product-item/index'
import WishlistPrimaryAction from './partials/wishlist-primary-action'
import WishlistSecondaryButtonGroup from './partials/wishlist-secondary-button-group'

import {API_ERROR_MESSAGE} from '../../../constants'
import {useCurrentCustomer} from '../../../hooks/use-current-customer'

const numberOfSkeletonItems = 3

const AccountWishlist = () => {
    const navigate = useNavigation()
    const {formatMessage} = useIntl()
    const toast = useToast()

    const [selectedItem, setSelectedItem] = useState(undefined)
    const [isWishlistItemLoading, setWishlistItemLoading] = useState(false)

    const {data: wishListData} = useWishList()
    const productIds = wishListData?.customerProductListItems?.map((item) => item.productId)

    const {data: productsData, isLoading: isProductsLoading} = useProducts(
        {parameters: {ids: productIds?.join(','), allImages: true}},
        {enabled: Boolean(wishListData)}
    )

    const wishListItems = wishListData?.customerProductListItems?.map((item, i) => {
        return {
            ...item,
            product: productsData?.data?.[i]
        }
    })

    const updateCustomerProductListItem = useShopperCustomersMutation(
        'updateCustomerProductListItem'
    )
    const {data: customer} = useCurrentCustomer()

    const handleActionClicked = (itemId) => {
        console.log('--- handleActionClicked')
        setWishlistItemLoading(!!itemId)
        setSelectedItem(itemId)
    }

    const handleItemQuantityChanged = async (quantity, item) => {
        setWishlistItemLoading(true)
        setSelectedItem(item.productId)

        const body = {
            ...item,
            quantity: parseInt(quantity)
        }
        // TODO
        delete body.product

        updateCustomerProductListItem.mutate(
            {
                body,
                parameters: {
                    customerId: customer.customerId,
                    itemId: item.id,
                    listId: wishListData.id
                }
            },
            {
                onError: () => {
                    toast({
                        title: formatMessage(API_ERROR_MESSAGE),
                        status: 'error'
                    })
                },
                onSuccess: () => {
                    setWishlistItemLoading(false)
                    setSelectedItem(undefined)
                }
            }
        )

        /*
        try {
            // TODO
            await wishlist.updateListItem({
                ...item,
                quantity: parseInt(quantity)
            })
        } catch {
            toast({
                title: formatMessage(API_ERROR_MESSAGE),
                status: 'error'
            })
        }
        */
    }

    return (
        <Stack spacing={4} data-testid="account-wishlist-page">
            <Heading as="h1" fontSize="2xl">
                <FormattedMessage defaultMessage="Wishlist" id="account_wishlist.title.wishlist" />
            </Heading>

            {isProductsLoading && (
                <Box data-testid="sf-wishlist-skeleton">
                    {new Array(numberOfSkeletonItems).fill(0).map((i, idx) => (
                        <Box
                            key={idx}
                            p={[4, 6]}
                            my={4}
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
                </Box>
            )}

            {!isProductsLoading && productsData.total === 0 && (
                <PageActionPlaceHolder
                    data-testid="empty-wishlist"
                    icon={<HeartIcon boxSize={8} />}
                    heading={formatMessage({
                        defaultMessage: 'No Wishlist Items',
                        id: 'account_wishlist.heading.no_wishlist'
                    })}
                    text={formatMessage({
                        defaultMessage: 'Continue shopping and add items to your wishlist.',
                        id: 'account_wishlist.description.continue_shopping'
                    })}
                    buttonText={formatMessage({
                        defaultMessage: 'Continue Shopping',
                        id: 'account_wishlist.button.continue_shopping'
                    })}
                    buttonProps={{leftIcon: undefined}}
                    onButtonClick={() => navigate('/')}
                />
            )}

            {!isProductsLoading &&
                productsData.total > 0 &&
                wishListItems.map((item) => (
                    <ProductItem
                        key={item.id}
                        product={{
                            ...item.product,
                            // TODO: simplify the UX by not doing this optimistically, because we're already showing the loader anyways
                            quantity: item.quantity
                        }}
                        showLoading={isWishlistItemLoading && selectedItem === item.productId}
                        primaryAction={<WishlistPrimaryAction />}
                        onItemQuantityChange={(quantity) =>
                            handleItemQuantityChanged(quantity, item)
                        }
                        secondaryActions={
                            <WishlistSecondaryButtonGroup
                                productListItemId={item.id}
                                onClick={handleActionClicked}
                            />
                        }
                    />
                ))}
        </Stack>
    )
}

export default AccountWishlist
