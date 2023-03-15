/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import {Stack, Heading} from '@chakra-ui/layout'
import {FormattedMessage, useIntl} from 'react-intl'
import {Box, Flex, Skeleton} from '@chakra-ui/react'

import useCustomer from '../../../commerce-api/hooks/useCustomer'
import useNavigation from '../../../hooks/use-navigation'
import useWishlist from '../../../hooks/use-wishlist'
import {useToast} from '../../../hooks/use-toast'

import PageActionPlaceHolder from '../../../components/page-action-placeholder'
import {HeartIcon} from '../../../components/icons'
import ProductItem from '../../../components/product-item/index'
import WishlistPrimaryAction from './partials/wishlist-primary-action'
import WishlistSecondaryButtonGroup from './partials/wishlist-secondary-button-group'

import {API_ERROR_MESSAGE} from '../../../constants'

const numberOfSkeletonItems = 3

const AccountWishlist = () => {
    const customer = useCustomer()
    const navigate = useNavigation()
    const {formatMessage} = useIntl()
    const toast = useToast()
    const [selectedItem, setSelectedItem] = useState(undefined)
    const [localQuantity, setLocalQuantity] = useState({})
    const [isWishlistItemLoading, setWishlistItemLoading] = useState(false)
    const wishlist = useWishlist()

    const handleActionClicked = (itemId) => {
        setWishlistItemLoading(!!itemId)
        setSelectedItem(itemId)
    }

    const handleItemQuantityChanged = async (quantity, item) => {
        // This local state allows the dropdown to show the desired quantity
        // while the API call to update it is happening.
        setLocalQuantity({...localQuantity, [item.productId]: quantity})
        setWishlistItemLoading(true)
        setSelectedItem(item.productId)
        try {
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
        setWishlistItemLoading(false)
        setSelectedItem(undefined)
        setLocalQuantity({...localQuantity, [item.productId]: undefined})
    }

    useEffect(() => {
        if (customer.isRegistered) {
            // We want to reset the wishlist here
            // because it is possible that a user
            // adds an item to the wishlist on another page
            // and the wishlist page may not have enough
            // data to render the page.
            // Reset the wishlist will make sure the
            // initialization state is correct.
            if (wishlist.isInitialized) {
                wishlist.reset()
            }

            wishlist.init({detail: true})
        }
    }, [customer.isRegistered])

    return (
        <Stack spacing={4} data-testid="account-wishlist-page">
            <Heading as="h1" fontSize="2xl">
                <FormattedMessage defaultMessage="Wishlist" id="account_wishlist.title.wishlist" />
            </Heading>
            {!wishlist.hasDetail && (
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

            {wishlist.hasDetail && wishlist.isEmpty && (
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

            {wishlist.hasDetail &&
                !wishlist.isEmpty &&
                wishlist.items.map((item) => (
                    <ProductItem
                        key={item.id}
                        product={{
                            ...item.product,
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
                                onClick={handleActionClicked}
                            />
                        }
                    />
                ))}
        </Stack>
    )
}

export default AccountWishlist
