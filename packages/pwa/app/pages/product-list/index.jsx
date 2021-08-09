/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React, {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {useHistory, useParams} from 'react-router-dom'
import {defineMessage, useIntl} from 'react-intl'
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
    Button,
    useDisclosure
} from '@chakra-ui/react'

// Project Components
import Pagination from '../../components/pagination'
import ProductTile, {Skeleton as ProductTileSkeleton} from '../../components/product-tile'
import {HideOnMobile, HideOnDesktop} from '../../components/responsive'
import EmptySearchResults from './partials/empty-results'
import PageHeader from './partials/page-header'
import ConfirmationModal from '../../components/confirmation-modal/index'

// Hooks
import {useLimitUrls, usePageUrls, useSortUrls, useSearchParams} from '../../hooks'
import useCustomerProductLists, {
    eventActions
} from '../../commerce-api/hooks/useCustomerProductLists'
import useNavigation from '../../hooks/use-navigation'
import {useToast} from '../../hooks/use-toast'

// Others
import {CategoriesContext} from '../../contexts'
import {HTTPNotFound} from 'pwa-kit-react-sdk/dist/ssr/universal/errors'
import {noop} from '../../utils/utils'

// Constants
import {
    DEFAULT_SEARCH_PARAMS,
    DEFAULT_LIMIT_VALUES,
    customerProductListTypes
} from '../../constants'
import {API_ERROR_MESSAGE} from '../account/constant'

export const REMOVE_WISHLIST_ITEM_CONFIRMATION_DIALOG_CONFIG = {
    dialogTitle: defineMessage({defaultMessage: 'Confirm Remove Item'}),
    confirmationMessage: defineMessage({
        defaultMessage: 'Are you sure you want to remove this item from your wishlist?'
    }),
    primaryActionLabel: defineMessage({defaultMessage: 'Yes, remove item'}),
    alternateActionLabel: defineMessage({defaultMessage: 'No, keep item'}),
    onPrimaryAction: noop
}

// Once loaded, we re-use the wishlist object to extract wishlistId for adding/removing items. Declaring it globally prevents unwanted re-initialization.
let wishlist = {}

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
    const modalProps = useDisclosure()

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
    const [productsExistInList, setProductsExistInList] = useState({})

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

    /**
     * Build productsFoundInListTypes object by comparing productId of items in wishlist
     * with productId for products from productSearchResult
     */
    const checkProductsExistInWishlist = () => {
        wishlist = customerProductLists.data.find(
            (list) => list.type === customerProductListTypes.WISHLIST
        )

        const wishlistProductIds = wishlist?.customerProductListItems.map((item) => item.productId)

        const productsInWishlist = []
        productSearchResult.hits.map((product) => {
            const isProductAddedToWishlist = wishlistProductIds.includes(product.productId)

            if (isProductAddedToWishlist) {
                productsInWishlist.push(product.productId)
            }
            return product
        })

        setProductsExistInList({
            ...productsExistInList,
            [customerProductListTypes.WISHLIST]: productsInWishlist
        })
    }

    useEffect(() => {
        if (customerProductLists.data && productSearchResult) {
            checkProductsExistInWishlist()
        }
    }, [customerProductLists.data, productSearchResult])

    const handleViewWishlistClick = () => {
        navigate('/account/wishlist')
    }

    const handleWishlistItemToggled = (product) => {
        // If product is found in wishlist, remove item from wishlist
        if (productsExistInList[customerProductListTypes.WISHLIST]?.includes(product.productId)) {
            REMOVE_WISHLIST_ITEM_CONFIRMATION_DIALOG_CONFIG.onPrimaryAction = () =>
                removeItemFromWishlist(product.productId)
            modalProps.onOpen()
        } else {
            // If product does not exist in wishlist, add item to wishlist
            // Actively update wishlist icon while sdk call executes in the background. (Reverts if request fails)

            setProductsExistInList({
                ...productsExistInList,
                [customerProductListTypes.WISHLIST]: [
                    ...productsExistInList[customerProductListTypes.WISHLIST],
                    product.productId
                ]
            })

            try {
                addItemToWishlist(product)
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
    }

    /**
     * Removes product from wishlist
     * @param {string} productId productId of item to be removed from wishlist.
     */
    const removeItemFromWishlist = async (productId) => {
        setProductsExistInList({
            ...productsExistInList,
            [customerProductListTypes.WISHLIST]: productsExistInList[
                customerProductListTypes.WISHLIST
            ].filter((item) => item.productId !== productId)
        })
        // Extract productListItemId corresponding to product from wishlist
        console.log('removing from wishlist', wishlist)
        const productListItemId = wishlist.customerProductListItems.find(
            (item) => item.productId === productId
        )?.id

        try {
            await customerProductLists.deleteCustomerProductListItem(
                {id: productListItemId},
                wishlist.id
            )

            showToast({
                title: intl.formatMessage({defaultMessage: '1 item removed from wishlist'}),
                status: 'success'
            })
        } catch (err) {
            console.error(err)
            showToast({
                title: intl.formatMessage(
                    {defaultMessage: '{errorMessage}'},
                    {errorMessage: 'Something went wrong. Try again!'}
                ),
                status: 'error'
            })
        }
    }

    const addItemToWishlist = async (product) => {
        // If product-lists have not loaded we push "Add to wishlist" event to eventQueue to be
        // processed once the product-lists have loaded.
        if (!customerProductLists?.loaded) {
            const event = {
                item: {...product, id: product.productId, quantity: 1},
                action: eventActions.ADD,
                listType: customerProductListTypes.WISHLIST
            }

            customerProductLists.addActionToEventQueue(event)
        } else {
            const requestBody = {
                productId: product.productId,
                priority: 1,
                quantity: 1,
                public: false,
                type: 'product'
            }

            const wishlistItem = await customerProductLists.createCustomerProductListItem(
                requestBody,
                wishlist.id
            )

            if (wishlistItem?.id) {
                const toastAction = (
                    <Button variant="link" onClick={handleViewWishlistClick}>
                        View
                    </Button>
                )
                showToast({
                    title: intl.formatMessage({defaultMessage: '1 item added to wishlist'}),
                    status: 'success',
                    action: toastAction
                })
            }
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
                            : productSearchResult.hits.map((productSearchItem) => (
                                  <ProductTile
                                      data-testid={`sf-product-tile-${productSearchItem.productId}`}
                                      key={productSearchItem.productId}
                                      productSearchItem={productSearchItem}
                                      onWishlistItemToggled={() =>
                                          handleWishlistItemToggled(productSearchItem)
                                      }
                                      existsInListTypes={productsExistInList}
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
                </>
            )}
            <ConfirmationModal
                {...REMOVE_WISHLIST_ITEM_CONFIRMATION_DIALOG_CONFIG}
                {...modalProps}
            />
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

    searchQuery: PropTypes.string
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
