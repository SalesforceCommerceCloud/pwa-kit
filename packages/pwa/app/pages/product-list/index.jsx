/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React, {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {useHistory, useParams} from 'react-router-dom'
import {useIntl} from 'react-intl'
import {Helmet} from 'react-helmet'

// Components
import {
    Box,
    Flex,
    SimpleGrid,
    Select,
    FormLabel,
    FormControl,
    Stack,
    Button
} from '@chakra-ui/react'

// Project Components
import Pagination from '../../components/pagination'
import ProductTile, {Skeleton as ProductTileSkeleton} from '../../components/product-tile'
import {HideOnMobile, HideOnDesktop} from '../../components/responsive'
import EmptySearchResults from './partials/empty-results'
import PageHeader from './partials/page-header'

// Hooks
import {useLimitUrls, usePageUrls, useSortUrls, useSearchParams} from '../../hooks'
import useCustomerProductLists, {
    eventActions
} from '../../commerce-api/hooks/useCustomerProductLists'
import useNavigation from '../../hooks/use-navigation'
import {useToast} from '../../hooks/use-toast'

// Others
import {CategoriesContext} from '../../contexts'
import {HTTPNotFound} from 'pwa-kit-react-sdk/ssr/universal/errors'

// Constants
import {
    DEFAULT_SEARCH_PARAMS,
    DEFAULT_LIMIT_VALUES,
    customerProductListTypes
} from '../../constants'
import {API_ERROR_MESSAGE} from '../account/constant'

/*
 * This is a simple product listing page. It displays a paginated list
 * of product hit objects. Allowing for sorting and filtering based on the
 * allowable filters and sort refinements.
 */
const ProductList = (props) => {
    const intl = useIntl()
    const history = useHistory()
    const params = useParams()
    const searchParams = useSearchParams()
    const {categories} = useContext(CategoriesContext)
    const customerProductLists = useCustomerProductLists()
    const navigate = useNavigation()
    const showToast = useToast()

    const {
        searchQuery,
        productSearchResult,
        // eslint-disable-next-line react/prop-types
        staticContext,
        location,
        isLoading,
        ...rest
    } = props

    /**
     * Store which products exist in differnt list types.
     * Useful for handling toggle wishlist icon on product-tile
     */
    const [wishlist, setWishlist] = useState({})

    const {total, sortingOptions} = productSearchResult || {}

    // Get the current category from global state.
    let category = ''
    if (!searchQuery) {
        category = categories[params.categoryId]
    }

    const basePath = `${location.pathname}${location.search}`

    // Reset scroll position when `isLoaded` becomes `true`.
    useEffect(() => {
        isLoading && window.scrollTo(0, 0)
    }, [isLoading])

    // Get urls to be used for pagination, page size changes, and sorting.
    const pageUrls = usePageUrls({total})
    const sortUrls = useSortUrls({options: sortingOptions})
    const limitUrls = useLimitUrls()

    // If we are loaded and still have no products, show the no results component.
    const showNoResults = !isLoading && productSearchResult && !productSearchResult?.hits

    useEffect(() => {
        if (customerProductLists.data && productSearchResult) {
            // find the first wishlist in customer product list
            const wishlist = customerProductLists.data.find(
                (list) => list.type === customerProductListTypes.WISHLIST
            )
            setWishlist(wishlist)
        }
    }, [customerProductLists.data, productSearchResult])

    const handleViewWishlistClick = () => {
        navigate('/account/wishlist')
    }

    const showSuccessfulToast = (quantity) => {
        const toastAction = (
            <Button variant="link" onClick={handleViewWishlistClick}>
                View
            </Button>
        )
        showToast({
            title: intl.formatMessage(
                {
                    defaultMessage:
                        '{quantity, plural, one {# item} other {# items}} added to wishlist'
                },
                {quantity}
            ),
            status: 'success',
            action: toastAction
        })
    }

    const showErrorToast = () => {
        showToast({
            title: intl.formatMessage(
                {defaultMessage: '{errorMessage}'},
                {errorMessage: API_ERROR_MESSAGE}
            ),
            status: 'error'
        })
    }

    /**
     * Removes product from wishlist
     */
    const removeItemFromWishlist = async (product) => {
        // Extract productListItemId corresponding to product from wishlist
        const wishlistItemId = wishlist.customerProductListItems.find(
            (item) => item.productId === product.productId
        ).id
        try {
            await customerProductLists.deleteCustomerProductListItem(
                {id: wishlistItemId},
                wishlist.id
            )

            showToast({
                title: intl.formatMessage({defaultMessage: 'Item removed from wishlist'}),
                status: 'success'
            })
        } catch (err) {
            console.error(err)
            showToast({
                title: intl.formatMessage(
                    {defaultMessage: '{errorMessage}'},
                    {errorMessage: API_ERROR_MESSAGE}
                ),
                status: 'error'
            })
        }
    }

    const addItemToWishlist = async (product) => {
        try {
            // If product-lists have not loaded we push "Add to wishlist" event to eventQueue to be
            // processed once the product-lists have loaded.
            if (!customerProductLists?.loaded) {
                const event = {
                    item: {...product, id: product.productId, quantity: 1},
                    action: eventActions.ADD,
                    listType: customerProductListTypes.WISHLIST,
                    onSuccess: showSuccessfulToast,
                    onError: showErrorToast
                }

                customerProductLists.addActionToEventQueue(event)
            } else {
                const quantity = 1
                const wishlist = customerProductLists.getProductListPerType(
                    customerProductListTypes.WISHLIST
                )
                await customerProductLists.addItemToWishlist(
                    product.productId,
                    quantity,
                    wishlist.id
                )
                showSuccessfulToast(quantity)
            }
        } catch (err) {
            showErrorToast()
        }
    }

    return (
        <Box
            className="sf-product-list-page"
            data-testid="sf-product-list-page"
            layerStyle="page"
            paddingTop={{base: 6, lg: 8}}
            {...rest}
        >
            <Helmet>
                <title>{category?.pageTitle}</title>
                <meta name="description" content={category?.pageDescription} />
                <meta name="keywords" content={category?.pageKeywords} />
            </Helmet>
            {showNoResults ? (
                <EmptySearchResults searchQuery={searchQuery} category={category} />
            ) : (
                <>
                    {/* Header */}
                    <HideOnMobile>
                        <Flex
                            justifyContent="space-between"
                            alignItems="flex-end"
                            marginBottom={{base: 4, lg: 6}}
                        >
                            <PageHeader
                                searchQuery={searchQuery}
                                category={category}
                                productSearchResult={productSearchResult}
                                isLoading={isLoading}
                            />
                            <Sort
                                sortUrls={sortUrls}
                                productSearchResult={productSearchResult}
                                basePath={basePath}
                            />
                        </Flex>
                    </HideOnMobile>
                    <HideOnDesktop>
                        <Stack spacing={6} marginBottom={4}>
                            <PageHeader
                                searchQuery={searchQuery}
                                category={category}
                                productSearchResult={productSearchResult}
                                isLoading={isLoading}
                            />
                            <Sort
                                sortUrls={sortUrls}
                                productSearchResult={productSearchResult}
                                basePath={basePath}
                            />
                        </Stack>
                    </HideOnDesktop>

                    {/* Body */}
                    <SimpleGrid columns={[2, 2, 3, 3]} spacingX={4} spacingY={{base: 12, lg: 16}}>
                        {isLoading || !productSearchResult
                            ? new Array(searchParams.limit)
                                  .fill(0)
                                  .map((value, index) => <ProductTileSkeleton key={index} />)
                            : productSearchResult.hits.map((productSearchItem) => {
                                  const isInWishlist = wishlist?.customerProductListItems
                                      ?.map(({productId}) => productId)
                                      .includes(productSearchItem.productId)
                                  return (
                                      <ProductTile
                                          data-testid={`sf-product-tile-${productSearchItem.productId}`}
                                          key={productSearchItem.productId}
                                          productSearchItem={productSearchItem}
                                          onAddToWishlistClick={() =>
                                              addItemToWishlist(productSearchItem)
                                          }
                                          onRemoveWishlistClick={() => {
                                              removeItemFromWishlist(productSearchItem)
                                          }}
                                          isInWishlist={isInWishlist}
                                      />
                                  )
                              })}
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
                </>
            )}
        </Box>
    )
}

ProductList.getTemplateName = () => 'product-list'

ProductList.shouldGetProps = ({previousLocation, location}) =>
    !previousLocation ||
    previousLocation.pathname !== location.pathname ||
    previousLocation.search !== location.search

ProductList.getProps = async ({res, params, location, api}) => {
    const {categoryId} = params
    const urlParams = new URLSearchParams(location.search)
    let searchQuery = urlParams.get('q')
    let isSearch = false

    if (searchQuery) {
        isSearch = true
    }
    // In case somebody navigates to /search without a param
    if (!categoryId && !isSearch) {
        // We will simulate search for empty string
        return {searchQuery: ' ', productSearchResult: {}}
    }

    // Set the `cache-control` header values to align with the Commerce API settings.
    if (res) {
        res.set('Cache-Control', 'public, must-revalidate, max-age=900')
    }

    const refinements = [`cgid=${categoryId}`, 'htype=master']

    const [category, productSearchResult] = await Promise.all([
        isSearch
            ? Promise.resolve()
            : api.shopperProducts.getCategory({
                  parameters: {id: categoryId, levels: 0}
              }),
        api.shopperSearch.productSearch({
            parameters: {
                // Our product detail page currently only supports `master` products. For this reason we
                // are only going to fetch master products on the product list page.
                // BUG: Using this `array` method of adding refinements doesn't work when deployed. Figure out
                // how to fix it.
                // eslint-disable-next-line
                ...(isSearch && {q: searchQuery}),
                ...(!isSearch && {refine: refinements}),
                limit: urlParams.get('limit') || DEFAULT_SEARCH_PARAMS.limit,
                offset: urlParams.get('offset') || DEFAULT_SEARCH_PARAMS.offset,
                sort: urlParams.get('sort') || DEFAULT_SEARCH_PARAMS.sort
            }
        })
    ])

    // The `isomorphic-sdk` returns error objects when they occur, so we
    // need to check the category type and throw if required.
    if (category?.type?.endsWith('category-not-found')) {
        throw new HTTPNotFound(category.detail)
    }

    return {searchQuery: searchQuery, productSearchResult}
}

ProductList.propTypes = {
    /**
     * The search result object showing all the product hits, that belong
     * in the supplied category.
     */
    productSearchResult: PropTypes.object,
    /*
     * Indicated that `getProps` has been called but has yet to complete.
     *
     * Notes: This prop is internally provided.
     */
    isLoading: PropTypes.bool,
    /*
     * Object that represents the current location, it consists of the `pathname`
     * and `search` values.
     *
     * Notes: This prop is internally provided.
     */
    location: PropTypes.object,
    searchQuery: PropTypes.string,
    onAddToWishlistClick: PropTypes.func,
    onRemoveWishlistClick: PropTypes.func
}

export default ProductList

const Sort = ({sortUrls, productSearchResult, basePath, ...otherProps}) => {
    const intl = useIntl()
    const history = useHistory()

    return (
        <FormControl data-testid="sf-product-list-sort" id="page_sort" width="auto" {...otherProps}>
            <FormLabel>{intl.formatMessage({defaultMessage: 'Sort by'})}</FormLabel>
            <Select
                value={basePath.replace(/(offset)=(\d+)/i, '$1=0')}
                onChange={({target}) => {
                    history.push(target.value)
                }}
                height={11}
                width={200}
            >
                {sortUrls.map((href, index) => (
                    <option key={href} value={href}>
                        {productSearchResult?.sortingOptions[index].label}
                    </option>
                ))}
            </Select>
        </FormControl>
    )
}
Sort.propTypes = {
    sortUrls: PropTypes.array,
    productSearchResult: PropTypes.object,
    basePath: PropTypes.string
}
