/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import PropTypes from 'prop-types'

// Components
import {
    Box,
    Flex,
    SimpleGrid,
    Grid,
    Select,
    Stack,
    Button
} from '@salesforce/retail-react-app/app/components/shared/ui'

// Project Components
import Pagination from '@salesforce/retail-react-app/app/components/pagination'
import ProductTile, {
    Skeleton as ProductTileSkeleton
} from '@salesforce/retail-react-app/app/components/product-tile'
import Refinements from '@salesforce/retail-react-app/app/pages/product-list/partials/refinements'

// Hooks
import {useIntl} from 'react-intl'
import {useCustomerId, useShopperCustomersMutation} from '@salesforce/commerce-sdk-react'
import {
    useEinstein,
    useLimitUrls,
    usePageUrls,
    useToast
} from '@salesforce/retail-react-app/app/hooks'

// Constants
import {
    DEFAULT_LIMIT_VALUES,
    API_ERROR_MESSAGE,
    TOAST_ACTION_VIEW_WISHLIST,
    TOAST_MESSAGE_ADDED_TO_WISHLIST,
    TOAST_MESSAGE_REMOVED_FROM_WISHLIST
} from '@salesforce/retail-react-app/app/constants'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useWishList} from '@salesforce/retail-react-app/app/hooks/use-wish-list'
import {isHydrated} from '@salesforce/retail-react-app/app/utils/utils'

const useWishListControls = () => {
    const {formatMessage} = useIntl()
    const navigate = useNavigation()
    const toast = useToast()
    const customerId = useCustomerId()
    const [wishlistLoading, setWishlistLoading] = useState([])
    const {data: wishlist} = useWishList()
    const {mutateAsync: createCustomerProductListItem} = useShopperCustomersMutation(
        'createCustomerProductListItem'
    )
    const {mutateAsync: deleteCustomerProductListItem} = useShopperCustomersMutation(
        'deleteCustomerProductListItem'
    )
    const addItemToWishlist = async (product) => {
        setWishlistLoading([...wishlistLoading, product.productId])

        // TODO: This wishlist object is from an old API, we need to replace it with the new one.
        const listId = wishlist.id
        await createCustomerProductListItem(
            {
                parameters: {customerId, listId},
                body: {
                    quantity: 1,
                    public: false,
                    priority: 1,
                    type: 'product',
                    productId: product.productId
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
                    toast({
                        title: formatMessage(TOAST_MESSAGE_ADDED_TO_WISHLIST, {quantity: 1}),
                        status: 'success',
                        action: (
                            // it would be better if we could use <Button as={Link}>
                            // but unfortunately the Link component is not compatible
                            // with Chakra Toast, since the ToastManager is rendered via portal
                            // and the toast doesn't have access to intl provider, which is a
                            // requirement of the Link component.
                            <Button variant="link" onClick={() => navigate('/account/wishlist')}>
                                {formatMessage(TOAST_ACTION_VIEW_WISHLIST)}
                            </Button>
                        )
                    })
                },
                onSettled: () => {
                    setWishlistLoading(wishlistLoading.filter((id) => id !== product.productId))
                }
            }
        )
    }

    const removeItemFromWishlist = async (product) => {
        setWishlistLoading([...wishlistLoading, product.productId])

        const listId = wishlist.id
        const itemId = wishlist.customerProductListItems.find(
            (i) => i.productId === product.productId
        ).id

        await deleteCustomerProductListItem(
            {
                body: {},
                parameters: {customerId, listId, itemId}
            },
            {
                onError: () => {
                    toast({
                        title: formatMessage(API_ERROR_MESSAGE),
                        status: 'error'
                    })
                },
                onSuccess: () => {
                    toast({
                        title: formatMessage(TOAST_MESSAGE_REMOVED_FROM_WISHLIST),
                        status: 'success'
                    })
                },
                onSettled: () => {
                    setWishlistLoading(wishlistLoading.filter((id) => id !== product.productId))
                }
            }
        )
    }

    const isInWishlist = (productId) => {
        return !!wishlist?.customerProductListItems?.find((item) => item.productId === productId)
    }
    return {isInWishlist, addItemToWishlist, removeItemFromWishlist}
}

const ProductListBody = ({
    toggleFilter,
    productSearchResult,
    searchParams,
    isRefetching,
    searchQuery,
    category,
    basePath
}) => {
    const einstein = useEinstein()
    const pageUrls = usePageUrls({total: productSearchResult?.total})
    const limitUrls = useLimitUrls()
    const {addItemToWishlist, isInWishlist, removeItemFromWishlist} = useWishListControls()

    return (
        <Grid templateColumns={{base: '1fr', md: '280px 1fr'}} columnGap={6}>
            <Stack display={{base: 'none', md: 'flex'}}>
                <Refinements
                    isLoading={isRefetching}
                    toggleFilter={toggleFilter}
                    filters={productSearchResult?.refinements}
                    selectedFilters={searchParams.refine}
                />
            </Stack>
            <Box>
                <SimpleGrid columns={[2, 2, 3, 3]} spacingX={4} spacingY={{base: 12, lg: 16}}>
                    {isHydrated() && (isRefetching || !productSearchResult)
                        ? new Array(searchParams.limit)
                              .fill(0)
                              .map((value, index) => <ProductTileSkeleton key={index} />)
                        : productSearchResult?.hits?.map((productSearchItem) => (
                              <ProductTile
                                  data-testid={`sf-product-tile-${productSearchItem.productId}`}
                                  key={productSearchItem.productId}
                                  product={productSearchItem}
                                  enableFavourite={true}
                                  isFavourite={isInWishlist(productSearchItem.productId)}
                                  onClick={() => {
                                      if (searchQuery) {
                                          einstein.sendClickSearch(searchQuery, productSearchItem)
                                      } else if (category) {
                                          einstein.sendClickCategory(category, productSearchItem)
                                      }
                                  }}
                                  onFavouriteToggle={(isFavourite) => {
                                      const action = isFavourite
                                          ? addItemToWishlist
                                          : removeItemFromWishlist
                                      return action(productSearchItem)
                                  }}
                                  dynamicImageProps={{
                                      widths: ['50vw', '50vw', '20vw', '20vw', '25vw']
                                  }}
                              />
                          ))}
                </SimpleGrid>
                {/* Footer */}
                <Flex justifyContent={['center', 'center', 'flex-start']} paddingTop={8}>
                    <Pagination currentURL={basePath} urls={pageUrls} />

                    {/*
              Our design doesn't call for a page size select. Show this element if you want
              to add one to your design.
          */}
                    <Select
                        display="none"
                        value={basePath}
                        onChange={({target}) => {
                            history.push(target.value)
                        }}
                    >
                        {limitUrls.map((href, index) => (
                            <option key={href} value={href}>
                                {DEFAULT_LIMIT_VALUES[index]}
                            </option>
                        ))}
                    </Select>
                </Flex>
            </Box>
        </Grid>
    )
}

ProductListBody.propTypes = {
    toggleFilter: PropTypes.func,
    resetFilters: PropTypes.func,
    productSearchResult: PropTypes.object,
    searchParams: PropTypes.object,
    isRefetching: PropTypes.bool,
    category: PropTypes.object,
    basePath: PropTypes.string,
    searchQuery: PropTypes.string
}

export default ProductListBody
