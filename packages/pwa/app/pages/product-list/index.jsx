/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React, {useContext, useEffect} from 'react'
import PropTypes from 'prop-types'
import {Link as RouteLink, useHistory, useParams} from 'react-router-dom'
import {useIntl} from 'react-intl'
import {Helmet} from 'react-helmet'

// Components
import {
    Box,
    Button,
    Heading,
    Flex,
    Link,
    Skeleton,
    SimpleGrid,
    Select,
    Text,

    // Hooks
    useStyleConfig
} from '@chakra-ui/react'

// Project Components
import Breadcrumb from '../../components/breadcrumb'
import Pagination from '../../components/pagination'
import ProductTile, {Skeleton as ProductTileSkeleton} from '../../components/product-tile'

// Icons
import {FilterIcon, SearchIcon} from '../../components/icons'

// Hooks
import {useLimitUrls, usePageUrls, useSortUrls, useSearchParams} from '../../hooks'

// Others
import {CategoriesContext} from '../../contexts'
import {HTTPNotFound} from 'pwa-kit-react-sdk/dist/ssr/universal/errors'

// Helpers
const isServer = typeof window === 'undefined'

// Constants
import {DEFAULT_SEARCH_PARAMS, DEFAULT_LIMIT_VALUES} from '../../constants'

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

    const styles = useStyleConfig('ProductList')

    const {
        productSearchResult,
        // eslint-disable-next-line react/prop-types
        staticContext,
        location,
        isLoading,
        ...rest
    } = props

    const {total, sortingOptions} = productSearchResult || {}

    // Get the current category from global state.
    const category = categories[params.categoryId]
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

    return (
        <Box className="sf-product-list-page" layerStyle="page" {...styles.container} {...rest}>
            <Helmet>
                <title>{category?.pageTitle}</title>
                <meta name="description" content={category?.pageDescription} />
                <meta name="keywords" content={category?.pageKeywords} />
            </Helmet>

            {showNoResults ? (
                <Flex {...styles.noResults}>
                    <SearchIcon {...styles.noResultsIcon} />
                    <Text {...styles.noResultsText}>
                        {intl.formatMessage(
                            {
                                id: 'product_list_page.no_results',
                                defaultMessage:
                                    'We couldn’t find anything for {category}. Try searching for a product or {link}.'
                            },
                            {
                                category: category.name,
                                link: (
                                    <Link as={RouteLink} to={'/'}>
                                        {intl.formatMessage({
                                            id: 'product_list_page.no_results.contact_us',
                                            defaultMessage: 'contact us'
                                        })}
                                    </Link>
                                )
                            }
                        )}
                    </Text>
                </Flex>
            ) : (
                <>
                    {/* Header */}
                    <Box {...styles.header}>
                        <Box>
                            {/* Breadcrumb */}
                            {category && (
                                <Breadcrumb
                                    marginBottom={2}
                                    categories={category.parentCategoryTree}
                                />
                            )}

                            {/* Category Title */}
                            <Flex {...styles.headerTitle}>
                                <Heading as="h2" size="lg" marginRight={2}>
                                    {`${category?.name}`}
                                </Heading>
                                <Heading as="h2" size="lg" marginRight={2}>
                                    <Skeleton height={9} width={85} isLoaded={!isLoading}>
                                        {`(${productSearchResult?.total})`}
                                    </Skeleton>
                                </Heading>
                            </Flex>
                        </Box>

                        <Flex {...styles.toolbar}>
                            <Button
                                aria-label="Search Filters"
                                variant="outline"
                                {...styles.filterButton}
                            >
                                <FilterIcon boxSize={4} />
                                <Text marginLeft={3}>
                                    {intl.formatMessage({
                                        id: 'product_list_page.filter_button',
                                        defaultMessage: 'Filter'
                                    })}
                                </Text>
                            </Button>

                            <Select
                                id="page_sort"
                                value={basePath.replace(/(offset)=(\d+)/i, '$1=0')}
                                onChange={({target}) => {
                                    history.push(target.value)
                                }}
                                {...styles.sortSelect}
                            >
                                {sortUrls.map((href, index) => (
                                    <option key={href} value={href}>
                                        {productSearchResult?.sortingOptions[index].label}
                                    </option>
                                ))}
                            </Select>
                        </Flex>
                    </Box>

                    {/* Body */}
                    <SimpleGrid {...styles.body}>
                        {isLoading || !productSearchResult
                            ? new Array(searchParams.limit)
                                  .fill(0)
                                  .map((value, index) => <ProductTileSkeleton key={index} />)
                            : productSearchResult.hits.map((productSearchItem) => (
                                  <ProductTile
                                      key={productSearchItem.productId}
                                      productSearchItem={productSearchItem}
                                  />
                              ))}
                    </SimpleGrid>

                    {/* Footer */}
                    <Flex {...styles.footer}>
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

            {/* This logic ensures page navigation works if the react app fails to load. */}
            {isServer && (
                <div
                    dangerouslySetInnerHTML={{
                        __html: `<script>document.getElementById('page_sort').addEventListener('change', ({target}) => { window.location = target.value})</script>`
                    }}
                />
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

    // Set the `cache-control` header values to align with the Commerce API settings.
    if (res) {
        res.set('Cache-Control', 'public, must-revalidate, max-age=900')
    }

    // Login as `guest` to get session.
    await api.auth.login()

    const [category, productSearchResult] = await Promise.all([
        api.shopperProducts.getCategory({
            parameters: {id: categoryId, levels: 0}
        }),
        api.shopperSearch.productSearch({
            parameters: {
                refine: `cgid=${categoryId}`,
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

    return {category, productSearchResult}
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
    location: PropTypes.object
}

export default ProductList
