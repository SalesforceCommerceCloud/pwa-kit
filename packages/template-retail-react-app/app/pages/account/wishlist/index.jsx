/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useEffect, useRef} from 'react'
import {Stack, Heading} from '@chakra-ui/layout'
import {FormattedMessage, useIntl} from 'react-intl'
import {Box, Flex, Skeleton} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useProducts, useShopperCustomersMutation} from '@salesforce/commerce-sdk-react'

import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {useWishList} from '@salesforce/retail-react-app/app/hooks/use-wish-list'

import PageActionPlaceHolder from '@salesforce/retail-react-app/app/components/page-action-placeholder'
import {HeartIcon} from '@salesforce/retail-react-app/app/components/icons'
import ProductItem from '@salesforce/retail-react-app/app/components/product-item'
import WishlistPrimaryAction from '@salesforce/retail-react-app/app/pages/account/wishlist/partials/wishlist-primary-action'
import WishlistSecondaryButtonGroup from '@salesforce/retail-react-app/app/pages/account/wishlist/partials/wishlist-secondary-button-group'

import {API_ERROR_MESSAGE} from '@salesforce/retail-react-app/app/constants'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import UnavailableProductConfirmationModal from '@salesforce/retail-react-app/app/components/unavailable-product-confirmation-modal'

const numberOfSkeletonItems = 3

const AccountWishlist = () => {
    const navigate = useNavigation()
    const {formatMessage} = useIntl()
    const toast = useToast()

    const headingRef = useRef()
    useEffect(() => {
        // Focus the 'Wishlist' header when the component mounts for accessibility
        headingRef?.current?.focus()
    }, [])

    const [selectedItem, setSelectedItem] = useState(undefined)
    const [isWishlistItemLoading, setWishlistItemLoading] = useState(false)

    const {data: wishListData, isLoading: isWishListLoading} = useWishList()
    const productIds = wishListData?.customerProductListItems?.map((item) => item.productId)

    const {data: productsData, isLoading: isProductsLoading} = useProducts(
        {
            parameters: {
                ids: productIds?.join(','),
                allImages: true,
                perPricebook: true
            }
        },
        {enabled: productIds?.length > 0}
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
    const deleteCustomerProductListItem = useShopperCustomersMutation(
        'deleteCustomerProductListItem'
    )

    const {data: customer} = useCurrentCustomer()

    const handleSecondaryAction = async (itemId, promise) => {
        setWishlistItemLoading(true)
        setSelectedItem(itemId)

        try {
            await promise
            // No need to handle error here, as the inner component will take care of it
        } finally {
            setWishlistItemLoading(false)
            setSelectedItem(undefined)
        }
    }

    const handleUnavailableProducts = async (unavailableProductIds) => {
        if (!unavailableProductIds.length) return
        await Promise.all(
            unavailableProductIds.map(async (id) => {
                const item = wishListItems?.find((item) => {
                    return item.productId.toString() === id.toString()
                })
                const parameters = {
                    customerId: customer.customerId,
                    itemId: item?.id,
                    listId: wishListData?.id
                }
                await deleteCustomerProductListItem.mutateAsync({parameters})
            })
        )
    }

    const handleItemQuantityChanged = async (quantity, item) => {
        let isValidChange = false
        setSelectedItem(item.productId)

        const body = {
            ...item,
            quantity: parseInt(quantity)
        }
        // To meet expected schema, remove the custom `product` we added
        delete body.product

        const parameters = {
            customerId: customer.customerId,
            itemId: item.id,
            listId: wishListData?.id
        }

        const mutation =
            parseInt(quantity) > 0
                ? updateCustomerProductListItem.mutateAsync({body, parameters})
                : deleteCustomerProductListItem.mutateAsync({parameters})

        try {
            await mutation
            isValidChange = true
            setSelectedItem(undefined)
        } catch (err) {
            toast({
                title: formatMessage(API_ERROR_MESSAGE),
                status: 'error'
            })
        }

        // If true, the quantity picker would immediately update its number
        // without waiting for the invalidated lists data to finish refetching
        return isValidChange
    }

    const hasWishlistItems = wishListItems?.length > 0
    const isPageLoading = hasWishlistItems ? isProductsLoading : isWishListLoading

    return (
        <Stack spacing={4} data-testid="account-wishlist-page">
            <Heading as="h1" fontSize="2xl" tabIndex="0" ref={headingRef}>
                <FormattedMessage defaultMessage="Wishlist" id="account_wishlist.title.wishlist" />
            </Heading>

            {isPageLoading && (
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

            {!isPageLoading && !hasWishlistItems && (
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

            {!isPageLoading &&
                wishListItems &&
                wishListItems.map((item) => (
                    <ProductItem
                        key={item.id}
                        product={{
                            ...item.product,
                            quantity: item.quantity
                        }}
                        showLoading={
                            (updateCustomerProductListItem.isLoading ||
                                deleteCustomerProductListItem.isLoading ||
                                isWishlistItemLoading) &&
                            selectedItem === item.productId
                        }
                        primaryAction={<WishlistPrimaryAction />}
                        onItemQuantityChange={(quantity) =>
                            handleItemQuantityChanged(quantity, item)
                        }
                        secondaryActions={
                            <WishlistSecondaryButtonGroup
                                productListItemId={item.id}
                                // Focus to 'Wishlist' header after remove for accessibility
                                focusElementOnRemove={headingRef}
                                onClick={handleSecondaryAction}
                            />
                        }
                    />
                ))}

            <UnavailableProductConfirmationModal
                productIds={productIds}
                handleUnavailableProducts={handleUnavailableProducts}
            />
        </Stack>
    )
}

export default AccountWishlist
