import React, {useEffect, useState} from 'react'
import {Stack, Heading} from '@chakra-ui/layout'
import {FormattedMessage, useIntl} from 'react-intl'
import PageActionPlaceHolder from '../../../components/page-action-placeholder'
import {WishlistIcon} from '../../../components/icons'
import useNavigation from '../../../hooks/use-navigation'
import useCustomerProductLists from '../../../commerce-api/hooks/useCustomerProductLists'
import {Box, Flex, Skeleton} from '@chakra-ui/react'
import {customerProductListTypes} from '../../../constants'
import ProductItem from '../../../components/product-item/index'
import WishlistPrimaryAction from './partials/wishlist-primary-action'
import WishlistSecondaryButtonGroup from './partials/wishlist-secondary-button-group'

const numberOfSkeletonItems = 3

const AccountWishlist = () => {
    const navigate = useNavigation()
    const {formatMessage} = useIntl()
    const customerProductLists = useCustomerProductLists()
    const [wishlist, setWishlist] = useState()
    const [selectedItem, setSelectedItem] = useState(undefined)

    const handleActionClicked = (itemId) => {
        setSelectedItem(itemId)
    }

    const handleItemQuantityChanged = (quantity, item) => {
        const updatedProductList = {
            ...wishlist,
            customerProductListItems: wishlist.customerProductListItems.map((product) => {
                if (product.id === item.id) {
                    return {
                        ...product,
                        quantity: parseInt(quantity)
                    }
                }
                return product
            })
        }
        // TODO: Call product-list API to update item quantity in wishlist.
        setWishlist(updatedProductList)
    }

    useEffect(() => {
        if (customerProductLists.loaded) {
            const wishlist = customerProductLists.getProductListPerType(
                customerProductListTypes.WISHLIST
            )

            setWishlist(wishlist)
        }
    }, [customerProductLists])

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
                            productName: wishlist._productItemsDetail[item.productId].name,
                            price: wishlist._productItemsDetail[item.productId].price,
                            quantity: item.quantity
                        }}
                        showLoading={selectedItem === item.productId}
                        primaryAction={<WishlistPrimaryAction />}
                        onItemQuantityChange={(quantity) =>
                            handleItemQuantityChanged(quantity, item)
                        }
                        secondaryActions={
                            <WishlistSecondaryButtonGroup
                                productListItemId={item.id}
                                listId={wishlist.id}
                                onClick={handleActionClicked}
                            />
                        }
                    />
                ))}
        </Stack>
    )
}

export default AccountWishlist
