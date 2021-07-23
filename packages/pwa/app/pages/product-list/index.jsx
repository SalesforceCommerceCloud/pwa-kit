/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React, {useContext, useEffect, Fragment} from 'react'
import PropTypes from 'prop-types'
import {Link as RouteLink, useHistory, useParams} from 'react-router-dom'
import {useIntl} from 'react-intl'
import {Helmet} from 'react-helmet'

// Components
import {
    Box,
    Heading,
    Flex,
    Link,
    SimpleGrid,
    Select,
    Text,
    FormLabel,
    FormControl,
    Fade,
    Stack
} from '@chakra-ui/react'

// Project Components
import Breadcrumb from '../../components/breadcrumb'
import Pagination from '../../components/pagination'
import ProductTile, {Skeleton as ProductTileSkeleton} from '../../components/product-tile'
import {HideOnMobile, HideOnDesktop} from '../../components/responsive'

// Icons
import {SearchIcon} from '../../components/icons'

// Hooks
import {useLimitUrls, usePageUrls, useSortUrls, useSearchParams} from '../../hooks'

// Others
import {CategoriesContext} from '../../contexts'
import {HTTPNotFound} from 'pwa-kit-react-sdk/dist/ssr/universal/errors'
import {isServer} from '../../utils/utils'

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
                <Flex
                    direction="column"
                    alignItems="center"
                    textAlign="center"
                    paddingTop={28}
                    paddingBottom={28}
                >
                    <SearchIcon boxSize={[6, 6, 12, 12]} marginBottom={5} />
                    <Text fontSize={['l', 'l', 'xl', '2xl']} fontWeight="700" marginBottom={2}>
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
                    <HideOnMobile>
                        <Flex
                            justifyContent="space-between"
                            alignItems="flex-end"
                            marginBottom={{base: 4, lg: 6}}
                        >
                            <BreadcrumbAndTitle
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
                            <BreadcrumbAndTitle
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
                                      key={productSearchItem.productId}
                                      productSearchItem={productSearchItem}
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

    const [category, productSearchResult] = await Promise.all([
        api.shopperProducts.getCategory({
            parameters: {id: categoryId, levels: 0}
        }),
        api.shopperSearch.productSearch({
            parameters: {
                // Our product detail page currently only supports `master` products. For this reason we
                // are only going to fetch master products on the product list page.
                // BUG: Using this `array` method of adding refinements doesn't work when deployed. Figure out
                // how to fix it.
                refine: [`cgid=${categoryId}`, 'htype=master'],
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

    return {productSearchResult}
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

const BreadcrumbAndTitle = ({category, productSearchResult, isLoading, ...otherProps}) => {
    return (
        <Box {...otherProps}>
            {/* Breadcrumb */}
            {category && <Breadcrumb categories={category.parentCategoryTree} />}

            {/* Category Title */}
            <Flex>
                <Heading as="h2" size="lg" marginRight={2}>
                    {`${category?.name}`}
                </Heading>
                <Heading as="h2" size="lg" marginRight={2}>
                    {isServer ? (
                        <Fragment>({productSearchResult?.total})</Fragment>
                    ) : (
                        // Fade in the total when available. When it's changed or not available yet, do not render it
                        !isLoading && <Fade in={true}>({productSearchResult?.total})</Fade>
                    )}
                </Heading>
            </Flex>
        </Box>
    )
}
BreadcrumbAndTitle.propTypes = {
    category: PropTypes.object,
    productSearchResult: PropTypes.object,
    isLoading: PropTypes.bool
}

const Sort = ({sortUrls, productSearchResult, basePath, ...otherProps}) => {
    const intl = useIntl()
    const history = useHistory()

    return (
        <FormControl id="page_sort" width="auto" {...otherProps}>
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
