/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import {Stack, Heading} from '@chakra-ui/layout'
import {FormattedMessage, useIntl} from 'react-intl'
import PageActionPlaceHolder from '../../../components/page-action-placeholder'
import {WishlistIcon} from '../../../components/icons'
import useNavigation from '../../../hooks/use-navigation'
import useCustomerProductLists from '../../../commerce-api/hooks/useCustomerProductLists'
import {Box, Flex, Skeleton} from '@chakra-ui/react'
import {API_ERROR_MESSAGE, customerProductListTypes} from '../../../constants'
import ProductItem from '../../../components/product-item/index'
import {useToast} from '../../../hooks/use-toast'
import WishlistPrimaryAction from './partials/wishlist-primary-action'
import WishlistSecondaryButtonGroup from './partials/wishlist-secondary-button-group'

const numberOfSkeletonItems = 3

const AccountWishlist = () => {
    const navigate = useNavigation()
    const {formatMessage} = useIntl()
    const customerProductLists = useCustomerProductLists()
    const [wishlist, setWishlist] = useState()
    const [selectedItem, setSelectedItem] = useState(undefined)
    const [localQuantity, setLocalQuantity] = useState({})
    const showToast = useToast()
    const [isWishlistItemLoading, setWishlistItemLoading] = useState(false)

    const handleActionClicked = (itemId) => {
        setWishlistItemLoading(!!itemId)
        setSelectedItem(itemId)
    }

    const handleItemQuantityChanged = async (quantity, item) => {
        try {
            // This local state allows the dropdown to show the desired quantity
            // while the API call to update it is happening.
            setLocalQuantity({...localQuantity, [item.productId]: quantity})
            setWishlistItemLoading(true)
            setSelectedItem(item.productId)
            await customerProductLists.updateCustomerProductListItem(wishlist, {
                ...item,
                quantity: parseInt(quantity)
            })
        } catch (err) {
            console.error(err)
            showToast({
                title: formatMessage(
                    {defaultMessage: '{errorMessage}'},
                    {errorMessage: API_ERROR_MESSAGE}
                ),
                status: 'error'
            })
        } finally {
            setWishlistItemLoading(false)
            setSelectedItem(undefined)
            setLocalQuantity({...localQuantity, [item.productId]: undefined})
        }
    }

    useEffect(() => {
        if (customerProductLists.loaded) {
            const wishlist = customerProductLists.getProductListPerType(
                customerProductListTypes.WISHLIST
            )
            if (!wishlist?.customerProductListItems?.length || wishlist?._productItemsDetail) {
                setWishlist(wishlist)
            }
        }
    }, [customerProductLists.data])

    if (!wishlist) {
        return (
            <Stack spacing={4} data-testid="account-wishlist-page">
                <Heading as="h1" fontSize="2xl">
                    <FormattedMessage defaultMessage="Wishlist" />
                </Heading>
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
            </Stack>
        )
    }

    if (!wishlist.customerProductListItems || wishlist.customerProductListItems.length === 0) {
        return (
            <Stack spacing={4} data-testid="account-wishlist-page">
                <Heading as="h1" fontSize="2xl">
                    <FormattedMessage defaultMessage="Wishlist" />
                </Heading>
                <PageActionPlaceHolder
                    data-testid="empty-wishlist"
                    icon={<WishlistIcon boxSize={8} />}
                    heading={formatMessage({defaultMessage: 'No Wishlist Items'})}
                    text={formatMessage({
                        defaultMessage: 'Continue shopping and add items to your wishlist'
                    })}
                    buttonText={formatMessage({
                        defaultMessage: 'Continue Shopping'
                    })}
                    buttonProps={{leftIcon: undefined}}
                    onButtonClick={() => navigate('/')}
                />
            </Stack>
        )
    }

    return (
        <Stack spacing={4} data-testid="account-wishlist-page">
            <Heading as="h1" fontSize="2xl">
                <FormattedMessage defaultMessage="Wishlist" />
            </Heading>

            {wishlist._productItemsDetail &&
                wishlist?.customerProductListItems.map((item) => (
                    <ProductItem
                        key={item.id}
                        product={{
                            ...wishlist._productItemsDetail[item.productId],
                            productId: item.productId,
                            productName: wishlist._productItemsDetail[item.productId].name,
                            price: wishlist._productItemsDetail[item.productId].price,
                            quantity: localQuantity[item.productId]
                                ? localQuantity[item.productId]
                                : item.quantity
                        }}
                        showLoading={isWishlistItemLoading && selectedItem === item.productId}
                        primaryAction={<WishlistPrimaryAction />}
                        onItemQuantityChange={(quantity) =>
                            handleItemQuantityChanged(quantity, item)
                        }
                        secondaryActions={
                            <WishlistSecondaryButtonGroup
                                productListItemId={item.id}
                                list={wishlist}
                                onClick={handleActionClicked}
                            />
                        }
                    />
                ))}
        </Stack>
    )
}

export default AccountWishlist
