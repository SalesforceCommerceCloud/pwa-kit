/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {useHistory, useLocation, useParams} from 'react-router-dom'
import {FormattedMessage, useIntl} from 'react-intl'
import {Helmet} from 'react-helmet'

// Components
import {
    Box,
    Flex,
    SimpleGrid,
    Grid,
    GridItem,
    Select,
    Spacer,
    Text,
    FormControl,
    Stack,
    useDisclosure,
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalContent,
    ModalCloseButton,
    ModalOverlay,
    Drawer,
    DrawerBody,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    useBreakpointValue
} from '@chakra-ui/react'

// Project Components
import Pagination from '../../../components/pagination'
//import ProductTile, {Skeleton as ProductTileSkeleton} from '../../components/product-tile'
import {HideOnDesktop} from '../../../components/responsive'
import Refinements from '../../product-list/partials/refinements'
import SelectedRefinements from '../../product-list/partials/selected-refinements'
import EmptySearchResults from '../../product-list/partials/empty-results'
import PageHeader from '../../product-list/partials/page-header'

// Amplience Components
import AmplienceWrapper from '../../../components/amplience/wrapper'
import _ from 'lodash'

// TO switch back to the OOTB Product Tile, comment the next 2 line out and uncomment line 46 above
import AmplienceProductTile from '../../../components/amplience/product-tile'
import {Skeleton as ProductTileSkeleton} from '../../../components/amplience/product-tile'

// Icons
import {FilterIcon, ChevronDownIcon} from '../../../components/icons'

// Hooks
import {useLimitUrls, useSortUrls, useSearchParams} from '../../../hooks'
import {useToast} from '../../../hooks/use-toast'
import useWishlist from '../../../hooks/use-wishlist'
import {parse as parseSearchParams} from '../../../hooks/use-search-params'
import useEinstein from '../../../commerce-api/hooks/useEinstein'
import useMultiSite from '../../../hooks/use-multi-site'

// Others
import {HTTPNotFound} from 'pwa-kit-react-sdk/ssr/universal/errors'

// Constants
import {
    DEFAULT_LIMIT_VALUES,
    API_ERROR_MESSAGE,
    MAX_CACHE_AGE,
    TOAST_ACTION_VIEW_WISHLIST,
    TOAST_MESSAGE_ADDED_TO_WISHLIST,
    TOAST_MESSAGE_REMOVED_FROM_WISHLIST,
    DEFAULT_SEARCH_PARAMS
} from '../../../constants'
import useNavigation from '../../../hooks/use-navigation'
import LoadingSpinner from '../../../components/loading-spinner'
import {resolveSiteFromUrl} from '../../../utils/site-utils'
import {getTargetLocale} from '../../../utils/locale'
import {useMemo} from 'react'
import {buildUrlSet} from '../../../utils/url'
import {useAmpRtv} from '../../../utils/amplience/rtv'
import {defaultAmpClient} from '../../../amplience-api'
import GridItemHero from '../../../components/amplience/hero/gridItemHero'
import PersonalisedComponent from '../../../components/amplience/personalised-component'
import {personalisationChanged} from '../../../amplience-api/utils'

const PersonalisedComponentGridItem = ({...props}) => {
    return <PersonalisedComponent limit="1" components={inGridComponents} {...props} />
}

const inGridComponents = {
    'https://sfcc.com/components/hero': GridItemHero,
    'https://sfcc.com/components/personalised-ingrid-component': PersonalisedComponentGridItem
}

// NOTE: You can ignore certain refinements on a template level by updating the below
// list of ignored refinements.
const REFINEMENT_DISALLOW_LIST = ['c_isNew']

function getIdsForContent(item) {
    return {id: item.id}
}

const processSlots = (ampSlots, setValidationResult) => {
    if (ampSlots == null) {
        return ampSlots
    }

    ampSlots.sort((a, b) => a.position - b.position)

    // Validate slots to remove invalid overlaps.
    // Also flag an error when a page is 100% in-grid content.

    let removed = []
    let pageFilled = []
    let lastPage = 0
    let pageSlots = 0

    for (let i = 0; i < ampSlots.length; i++) {
        const slot = ampSlots[i]

        const pos = slot.position
        const size = (slot.rows || 1) * (slot.cols || 1)
        const end = pos + size

        for (let j = 0; j < i; j++) {
            const slot2 = ampSlots[j]

            const pos2 = slot2.position
            const size2 = (slot2.rows || 1) * (slot2.cols || 1)
            const end2 = pos2 + size2

            if (pos < end2 && end > pos) {
                // These two slots overlap, remove the later one and add an error.
                removed.push(`(${slot.position}:\xa0${slot.cols}x${slot.rows})`)
                ampSlots.splice(i--, 1)
                break
            }
        }

        let page = Math.floor(pos / DEFAULT_SEARCH_PARAMS.limit)

        if (page != lastPage) {
            lastPage = page
            pageSlots = 0
        }

        pageSlots += size
        if (pageSlots >= DEFAULT_SEARCH_PARAMS.limit) {
            pageFilled.push(page)
        }
    }

    if (removed.length > 0 || pageFilled.length > 0) {
        const messages = []

        if (removed.length > 0) {
            messages.push(`In-grid content at invalid positions: ${removed.join(', ')}`)
        }

        if (pageFilled.length > 0) {
            messages.push(
                `In-grid content is hidden on desktop b/c Page (${pageFilled.join(
                    ', '
                )}) is completely filled - move in-grid content or reduce sizes.`
            )
        }

        setValidationResult(messages.join('\n'))
    } else {
        setValidationResult(null)
    }

    return ampSlots
}

const calculatePageOffsets = (pageSize, totalCount, ampSlots, isMobile) => {
    // Amplience slots reduce the page size of sfcc content.
    const pages = []
    let processed = 0
    let offset = 0

    const pageNumber = (index) => {
        return Math.floor(index / pageSize)
    }

    const fillPages = (upTo) => {
        const uptoBasePage = pageNumber(upTo)

        while (pages.length <= uptoBasePage) {
            pages.push(pages.length * pageSize - offset)
        }

        processed = upTo
    }

    const skipContent = (size) => {
        // If this splits a page, create one.
        offset += size

        fillPages(processed)
    }

    if (ampSlots) {
        for (let i = 0; i < ampSlots.length; i++) {
            const slot = ampSlots[i]
            slot.rows = Number(slot.rows) || 1
            slot.cols = Number(slot.cols) || 1

            if (slot.position > totalCount + offset) {
                // Slots outside of the bounds of the shown products are not drawn.
                break
            }

            fillPages(slot.position)

            const size = isMobile ? 1 : slot.cols * slot.rows

            skipContent(size)
        }
    }

    fillPages(totalCount + offset)

    return pages
}

const generateIndices = (pos, rows, cols) => {
    const result = []
    const size = rows * cols
    for (let i = 0; i < size; i++) {
        result.push(pos + i)
    }

    return result
}

const enrichResults = (productSearchResults, pageSize, ampSlots, pages, isMobile) => {
    if (productSearchResults?.hits) {
        const offset = productSearchResults.offset
        const total = productSearchResults.total

        let pageId = pages.findIndex((pageIndex) => pageIndex > offset) - 1
        if (pageId == -2) {
            pageId = pages.length - 1
        }

        const pageBase = pageId * pageSize

        const sfccCount = (pages[pageId + 1] ?? total) - pages[pageId]
        const items = productSearchResults.hits.slice(0, sfccCount)

        let reservedSpaces = 0

        let lastIndex = 0
        let lastPos = pageBase

        const fillIndices = (to, toPos) => {
            for (let i = lastIndex; i < to; i++) {
                items[i].indices = [lastPos++]
            }

            lastIndex = Math.max(0, to + 1)
            lastPos = toPos
        }

        if (ampSlots) {
            for (let slot of ampSlots) {
                const pos = slot.position
                slot.rows = Number(slot.rows) || 1
                slot.cols = Number(slot.cols) || 1

                if (pos < pageBase) {
                    continue
                }

                if (pos >= pageBase + pageSize) {
                    break
                }

                // Place content up to the given slot.
                const size = isMobile ? 1 : Number(slot.rows) * Number(slot.cols)
                const index = pos - pageBase - reservedSpaces

                if (index > items.length) {
                    break
                }

                slot.isAmplience = true
                slot.indices = generateIndices(
                    pos,
                    isMobile ? 1 : slot.rows,
                    isMobile ? 1 : slot.cols
                )

                if (index <= items.length) {
                    items.splice(index, 0, slot)
                }

                fillIndices(index, pos + size)

                reservedSpaces += size - 1
            }
        }

        fillIndices(items.length, pageBase + pageSize)

        return items
    }

    return productSearchResults?.hits
}

/*
 * Generate a memoized list of page size urls influenced by inline amplience content.
 * Changing the page size will reset the offset to zero to simplify things.
 */
export const useAmpPageUrls = ({total = 0, limit, pageOffsets}) => {
    const location = useLocation()
    const [searchParams] = useSearchParams()
    const _limit = limit || searchParams.limit

    return useMemo(() => {
        return buildUrlSet(`${location.pathname}${location.search}`, 'offset', pageOffsets)
    }, [location.pathname, location.search, _limit, total, pageOffsets])
}

/*
 * This is a simple product listing page. It displays a paginated list
 * of product hit objects. Allowing for sorting and filtering based on the
 * allowable filters and sort refinements.
 */
const ProductList = (props) => {
    const {
        searchQuery,
        productSearchResult,
        category,
        // eslint-disable-next-line react/prop-types
        staticContext,
        location,
        isLoading,
        ampTopContent: initialAmpTopContent,
        ampBottomContent: initialAmpBottomContent,
        ampSlots: initialAmpSlots,
        ...rest
    } = props
    const {isOpen, onOpen, onClose} = useDisclosure()
    const {formatMessage} = useIntl()
    const navigate = useNavigation()
    const history = useHistory()
    const params = useParams()
    const toast = useToast()
    const einstein = useEinstein()
    const {locale} = useMultiSite()
    const [searchParams, {stringify: stringifySearchParams}] = useSearchParams()

    /**************** Einstein ****************/
    useEffect(() => {
        if (productSearchResult) {
            searchQuery
                ? einstein.sendViewSearch(searchQuery, productSearchResult)
                : einstein.sendViewCategory(category, productSearchResult)
        }
    }, [productSearchResult])

    const limitUrls = useLimitUrls()
    const wishlist = useWishlist()

    const [ampSlots, setAmpSlots] = useState(initialAmpSlots)
    const [ampTopContent, setAmpTopContent] = useState(initialAmpTopContent)
    const [ampBottomContent, setAmpBottomContent] = useState(initialAmpBottomContent)
    const [validationResult, setValidationResult] = useState(null)
    const [sortOpen, setSortOpen] = useState(false)
    const [wishlistLoading, setWishlistLoading] = useState([])
    const [filtersLoading, setFiltersLoading] = useState(false)
    const [rtvActive, setRtvActive] = useState(false)

    const {total, sortingOptions} = productSearchResult || {}
    const basePath = `${location.pathname}${location.search}`
    //const category = !searchQuery && params.categoryId ? categories[params.categoryId] : undefined

    const isMobile = useBreakpointValue({base: true, lg: false, xl: false, xxl: false, xxxl: false})
    const sortUrls = useSortUrls({options: sortingOptions})

    const pageOffsets = useMemo(() => {
        return calculatePageOffsets(searchParams.limit, total, ampSlots, isMobile)
    }, [searchParams.limit, total, ampSlots, isMobile])

    const pageUrls = useAmpPageUrls({total, pageOffsets})

    const showNoResults = !isLoading && productSearchResult && !productSearchResult?.hits

    useAmpRtv(
        async (model) => {
            setAmpSlots(processSlots(model.content?.gridItem, setValidationResult))

            const childContentPromise = async () => {
                if (!model.content.topContent) return []
                const topContentIDs = model.content?.topContent.map(getIdsForContent) || []
                if (topContentIDs && topContentIDs.length) {
                    const rtvTopContent = await defaultAmpClient.fetchContent(topContentIDs, {
                        locale: locale.id + ',*'
                    })
                    return rtvTopContent
                } else {
                    return []
                }
            }
            const dataForTopContent = await childContentPromise()
            setAmpTopContent(dataForTopContent)
            setAmpBottomContent(model.content.bottomContent)
            setRtvActive(true)
        },
        undefined,
        [initialAmpSlots, initialAmpBottomContent, initialAmpTopContent]
    )

    useEffect(() => {
        setAmpSlots(initialAmpSlots)
        setAmpTopContent(initialAmpTopContent)
        setAmpBottomContent(initialAmpBottomContent)
    }, [initialAmpSlots, initialAmpTopContent, initialAmpBottomContent])

    useEffect(() => {
        isLoading && window.scrollTo(0, 0)
        setFiltersLoading(isLoading)
    }, [isLoading])

    useEffect(() => {
        let dist = Infinity
        let pageId = 0

        for (let i = 0; i < pageOffsets.length; i++) {
            const myDist = Math.abs(pageOffsets[i] - searchParams.offset)

            if (myDist < dist) {
                dist = myDist
                pageId = i
            }
        }

        if (pageOffsets[pageId] !== searchParams.offset) {
            const searchParamsCopy = {...searchParams, offset: pageOffsets[pageId]}
            navigate(`/category/${params.categoryId}?${stringifySearchParams(searchParamsCopy)}`)
        }
    }, [isMobile, searchParams.offset])

    // TODO: DRY this handler when intl provider is available globally
    const addItemToWishlist = async (product) => {
        try {
            setWishlistLoading([...wishlistLoading, product.productId])
            await wishlist.createListItem({
                id: product.productId,
                quantity: 1
            })
            toast({
                title: formatMessage(TOAST_MESSAGE_ADDED_TO_WISHLIST, {quantity: 1}),
                status: 'success',
                action: (
                    <Button variant="link" onClick={() => navigate('/account/wishlist')}>
                        {formatMessage(TOAST_ACTION_VIEW_WISHLIST)}
                    </Button>
                )
            })
        } catch {
            toast({
                title: formatMessage(API_ERROR_MESSAGE),
                status: 'error'
            })
        } finally {
            setWishlistLoading(wishlistLoading.filter((id) => id !== product.productId))
        }
    }

    // TODO: DRY this handler when intl provider is available globally
    const removeItemFromWishlist = async (product) => {
        try {
            setWishlistLoading([...wishlistLoading, product.productId])
            await wishlist.removeListItemByProductId(product.productId)
            toast({
                title: formatMessage(TOAST_MESSAGE_REMOVED_FROM_WISHLIST),
                status: 'success'
            })
        } catch {
            toast({
                title: formatMessage(API_ERROR_MESSAGE),
                status: 'error'
            })
        } finally {
            setWishlistLoading(wishlistLoading.filter((id) => id !== product.productId))
        }
    }

    const toggleFilter = (value, attributeId, selected, allowMultiple = true) => {
        const searchParamsCopy = {...searchParams}

        delete searchParamsCopy.offset
        if (!allowMultiple) {
            delete searchParamsCopy.refine[attributeId]

            if (!selected) {
                searchParamsCopy.refine[attributeId] = value.value
            }
        } else {
            let attributeValue = searchParamsCopy.refine[attributeId] || []
            let values = Array.isArray(attributeValue) ? attributeValue : attributeValue.split('|')

            if (!selected) {
                values.push(value.value)
            } else {
                values = values?.filter((v) => v !== value.value)
            }

            searchParamsCopy.refine[attributeId] = values

            if (searchParamsCopy.refine[attributeId].length === 0) {
                delete searchParamsCopy.refine[attributeId]
            }
        }

        navigate(`/category/${params.categoryId}?${stringifySearchParams(searchParamsCopy)}`)
    }

    const resetFilters = () => {
        navigate(window.location.pathname)
    }

    const selectedSortingOptionLabel =
        productSearchResult?.sortingOptions?.find(
            (option) => option.id === productSearchResult?.selectedSortingOption
        ) || productSearchResult?.sortingOptions?.[0]

    const results = enrichResults(
        productSearchResult,
        searchParams.limit,
        ampSlots,
        pageOffsets,
        isMobile
    )

    const indexStyle = {
        position: 'absolute',
        zIndex: '1',
        background: 'white',
        padding: '2px 9px',
        margin: '5px',
        borderRadius: '30px'
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
                    {/* Amplience - Top Content SSR */}
                    {ampTopContent &&
                        _.compact(ampTopContent).map((content, ind) => (
                            <AmplienceWrapper key={ind} content={content}></AmplienceWrapper>
                        ))}
                    <Stack
                        display={{base: 'none', lg: 'flex'}}
                        direction="row"
                        justify="flex-start"
                        align="flex-start"
                        spacing={4}
                        marginBottom={6}
                    >
                        <Flex align="left" width="287px">
                            <PageHeader
                                searchQuery={searchQuery}
                                category={category}
                                productSearchResult={productSearchResult}
                                isLoading={isLoading}
                            />
                        </Flex>
                        <Box flex={1} paddingTop={'45px'}>
                            <SelectedRefinements
                                filters={productSearchResult?.refinements}
                                toggleFilter={toggleFilter}
                                resetFilters={resetFilters}
                                selectedFilterValues={productSearchResult?.selectedRefinements}
                            />
                        </Box>

                        <Box paddingTop={'45px'}>
                            <Sort
                                sortUrls={sortUrls}
                                productSearchResult={productSearchResult}
                                basePath={basePath}
                            />
                        </Box>
                    </Stack>

                    <HideOnDesktop>
                        <Stack spacing={6}>
                            <PageHeader
                                searchQuery={searchQuery}
                                category={category}
                                productSearchResult={productSearchResult}
                                isLoading={isLoading}
                            />
                            <Stack
                                display={{base: 'flex', md: 'none'}}
                                direction="row"
                                justify="flex-start"
                                align="center"
                                spacing={1}
                                height={12}
                                borderColor="gray.100"
                            >
                                <Flex align="center">
                                    <Button
                                        fontSize="sm"
                                        colorScheme="black"
                                        variant="outline"
                                        marginRight={2}
                                        display="inline-flex"
                                        leftIcon={<FilterIcon boxSize={5} />}
                                        onClick={onOpen}
                                    >
                                        <FormattedMessage
                                            defaultMessage="Filter"
                                            id="product_list.button.filter"
                                        />
                                    </Button>
                                </Flex>
                                <Flex align="center">
                                    <Button
                                        maxWidth="245px"
                                        fontSize="sm"
                                        marginRight={2}
                                        colorScheme="black"
                                        variant="outline"
                                        display="inline-flex"
                                        rightIcon={<ChevronDownIcon boxSize={5} />}
                                        onClick={() => setSortOpen(true)}
                                    >
                                        {formatMessage(
                                            {
                                                id: 'product_list.button.sort_by',
                                                defaultMessage: 'Sort By: {sortOption}'
                                            },
                                            {
                                                sortOption: selectedSortingOptionLabel?.label
                                            }
                                        )}
                                    </Button>
                                </Flex>
                            </Stack>
                        </Stack>
                        <Box marginBottom={4}>
                            <SelectedRefinements
                                filters={productSearchResult?.refinements}
                                toggleFilter={toggleFilter}
                                resetFilters={resetFilters}
                                selectedFilterValues={productSearchResult?.selectedRefinements}
                            />
                        </Box>
                    </HideOnDesktop>
                    {/* Body  */}
                    <Grid templateColumns={{base: '1fr', md: '280px 1fr'}} columnGap={6}>
                        <Stack display={{base: 'none', md: 'flex'}}>
                            <Refinements
                                isLoading={filtersLoading}
                                toggleFilter={toggleFilter}
                                filters={productSearchResult?.refinements}
                                selectedFilters={searchParams.refine}
                            />
                        </Stack>
                        <Box position="relative">
                            {validationResult && (
                                <Box
                                    transform="translate(0, -100%)"
                                    color="red"
                                    backgroundColor="white"
                                    padding="2px 8px"
                                    border="1px solid red"
                                    position="absolute"
                                    zIndex="2"
                                    maxW="100%"
                                >
                                    {validationResult}
                                </Box>
                            )}
                            <SimpleGrid
                                columns={[2, 2, 3, 3]}
                                spacingX={4}
                                spacingY={{base: 4, lg: 4}}
                            >
                                {isLoading || !productSearchResult
                                    ? new Array(searchParams.limit)
                                          .fill(0)
                                          .map((value, index) => (
                                              <ProductTileSkeleton key={index} />
                                          ))
                                    : results.map((item, index) => {
                                          if (item.isAmplience) {
                                              // Amplience content tile

                                              return (
                                                  <GridItem
                                                      key={index}
                                                      colEnd={{
                                                          base: `span 1`,
                                                          md: `span ${item.cols}`
                                                      }}
                                                      rowEnd={{
                                                          base: `span 1`,
                                                          md: `span ${item.rows}`
                                                      }}
                                                      display="flex"
                                                  >
                                                      {rtvActive && (
                                                          <Box {...indexStyle}>
                                                              {item.indices.join(', ')}
                                                          </Box>
                                                      )}
                                                      <AmplienceWrapper
                                                          fetch={{id: item.content?.id}}
                                                          components={inGridComponents}
                                                          cols={isMobile ? 1 : item.cols}
                                                          rows={isMobile ? 1 : item.rows}
                                                          gap={16}
                                                          skeleton={{display: 'flex', flex: 1}}
                                                      ></AmplienceWrapper>
                                                  </GridItem>
                                              )
                                          } else {
                                              const productSearchItem = item
                                              const productId = productSearchItem.productId
                                              const isInWishlist =
                                                  !!wishlist.findItemByProductId(productId)

                                              return (
                                                  <AmplienceProductTile
                                                      data-testid={`sf-product-tile-${productSearchItem.productId}`}
                                                      key={productSearchItem.productId}
                                                      product={productSearchItem}
                                                      enableFavourite={true}
                                                      isFavourite={isInWishlist}
                                                      onClick={() => {
                                                          if (searchQuery) {
                                                              einstein.sendClickSearch(
                                                                  searchQuery,
                                                                  productSearchItem
                                                              )
                                                          } else if (category) {
                                                              einstein.sendClickCategory(
                                                                  category,
                                                                  productSearchItem
                                                              )
                                                          }
                                                      }}
                                                      onFavouriteToggle={(isFavourite) => {
                                                          const action = isFavourite
                                                              ? addItemToWishlist
                                                              : removeItemFromWishlist
                                                          return action(productSearchItem)
                                                      }}
                                                      dynamicImageProps={{
                                                          widths: [
                                                              '50vw',
                                                              '50vw',
                                                              '20vw',
                                                              '20vw',
                                                              '25vw'
                                                          ]
                                                      }}
                                                  >
                                                      {rtvActive && (
                                                          <Box {...indexStyle}>
                                                              {item.indices.join(', ')}
                                                          </Box>
                                                      )}
                                                  </AmplienceProductTile>
                                              )
                                          }
                                      })}
                            </SimpleGrid>
                            {/* Footer */}
                            <Flex
                                justifyContent={['center', 'center', 'flex-start']}
                                paddingTop={8}
                            >
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
                    <Spacer height={6} />
                    {/* Amplience - Bottom Content CSR */}
                    {ampBottomContent &&
                        _.compact(ampBottomContent).map((content, ind) => (
                            <AmplienceWrapper key={ind} fetch={{id: content.id}}></AmplienceWrapper>
                        ))}
                </>
            )}
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                size="full"
                motionPreset="slideInBottom"
                scrollBehavior="inside"
            >
                <ModalOverlay />
                <ModalContent top={0} marginTop={0}>
                    <ModalHeader>
                        <Text fontWeight="bold" fontSize="2xl">
                            <FormattedMessage
                                defaultMessage="Filter"
                                id="product_list.modal.title.filter"
                            />
                        </Text>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody py={4}>
                        {filtersLoading && <LoadingSpinner />}
                        <Refinements
                            toggleFilter={toggleFilter}
                            filters={productSearchResult?.refinements}
                            selectedFilters={productSearchResult?.selectedRefinements}
                        />
                    </ModalBody>

                    <ModalFooter
                        // justify="space-between"
                        display="block"
                        width="full"
                        borderTop="1px solid"
                        borderColor="gray.100"
                        paddingBottom={10}
                    >
                        <Stack>
                            <Button width="full" onClick={onClose}>
                                {formatMessage(
                                    {
                                        id: 'product_list.modal.button.view_items',
                                        defaultMessage: 'View {prroductCount} items'
                                    },
                                    {
                                        prroductCount: productSearchResult?.total
                                    }
                                )}
                            </Button>
                            <Button width="full" variant="outline" onClick={() => resetFilters()}>
                                <FormattedMessage
                                    defaultMessage="Clear Filters"
                                    id="product_list.modal.button.clear_filters"
                                />
                            </Button>
                        </Stack>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            <Drawer
                placement="bottom"
                isOpen={sortOpen}
                onClose={() => setSortOpen(false)}
                size="sm"
                motionPreset="slideInBottom"
                scrollBehavior="inside"
                isFullHeight={false}
                height="50%"
            >
                <DrawerOverlay />
                <DrawerContent marginTop={0}>
                    <DrawerHeader boxShadow="none">
                        <Text fontWeight="bold" fontSize="2xl">
                            <FormattedMessage
                                defaultMessage="Sort By"
                                id="product_list.drawer.title.sort_by"
                            />
                        </Text>
                    </DrawerHeader>
                    <DrawerCloseButton />
                    <DrawerBody>
                        {sortUrls.map((href, idx) => (
                            <Button
                                width="full"
                                onClick={() => {
                                    setSortOpen(false)
                                    history.push(href)
                                }}
                                fontSize={'md'}
                                key={idx}
                                marginTop={0}
                                variant="menu-link"
                            >
                                <Text
                                    as={
                                        selectedSortingOptionLabel?.label ===
                                            productSearchResult?.sortingOptions[idx]?.label && 'u'
                                    }
                                >
                                    {productSearchResult?.sortingOptions[idx]?.label}
                                </Text>
                            </Button>
                        ))}
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </Box>
    )
}

ProductList.getTemplateName = () => 'product-list'

ProductList.shouldGetProps = ({previousLocation, location}) =>
    !previousLocation ||
    previousLocation.pathname !== location.pathname ||
    previousLocation.search !== location.search ||
    personalisationChanged(true)

ProductList.getProps = async ({res, params, location, api, ampClient}) => {
    const {categoryId} = params
    const urlParams = new URLSearchParams(location.search)
    const searchQuery = urlParams.get('q')
    const isSearch = !!searchQuery

    // Set the `cache-control` header values to align with the Commerce API settings.
    if (res) {
        res.set('Cache-Control', `max-age=${MAX_CACHE_AGE}`)
    }

    // In case somebody navigates to /search without a param
    if (!categoryId && !isSearch) {
        // We will simulate search for empty string
        return {searchQuery: ' ', productSearchResult: {}}
    }

    // Amplience in-grid content.

    const site = resolveSiteFromUrl(location.pathname)
    const l10nConfig = site.l10n
    const targetLocale = getTargetLocale({
        getUserPreferredLocales: () => {
            const {locale} = api.getConfig()
            return [locale]
        },
        l10nConfig
    })

    // Try fetch grid slots for this category from Amplience.
    const ampCategory = (
        await ampClient.fetchContent([{key: `category/${categoryId}`}], {locale: targetLocale})
    ).pop()

    const rawTopContent = ampCategory?.topContent || []
    const ids = rawTopContent.map(getIdsForContent)
    const ampTopContent =
        ids && ids.length ? await ampClient.fetchContent(ids, {locale: targetLocale}) : []

    let ampSlots = []

    if (ampCategory.type !== 'CONTENT_NOT_FOUND') {
        ampSlots = ampCategory.gridItem ?? []

        processSlots(ampSlots, () => {
            /* Validation result ignored */
        })
    }

    const searchParams = parseSearchParams(location.search, false)

    if (categoryId && !searchParams.refine.includes(`cgid=${categoryId}`)) {
        searchParams.refine.push(`cgid=${categoryId}`)
    }

    const [category, productSearchResult] = await Promise.all([
        isSearch
            ? Promise.resolve()
            : api.shopperProducts.getCategory({
                  parameters: {id: categoryId, levels: 0}
              }),
        api.shopperSearch.productSearch({
            parameters: searchParams
        })
    ])

    // Apply disallow list to refinements.
    productSearchResult.refinements = productSearchResult?.refinements?.filter(
        ({attributeId}) => !REFINEMENT_DISALLOW_LIST.includes(attributeId)
    )

    // The `isomorphic-sdk` returns error objects when they occur, so we
    // need to check the category type and throw if required.
    if (category?.type?.endsWith('category-not-found')) {
        throw new HTTPNotFound(category.detail)
    }

    return {
        searchQuery,
        productSearchResult,
        category,
        ampSlots,
        ampTopContent,
        ampBottomContent: ampCategory?.bottomContent || []
    }
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
    onRemoveWishlistClick: PropTypes.func,
    category: PropTypes.object,

    /**
     * Amplience specific - in-grid content positions and ids.
     */
    ampSlots: PropTypes.array,
    /**
     * Amplience specific - Top and bottom Slots.
     */
    ampTopContent: PropTypes.array,
    ampBottomContent: PropTypes.array
}

export default ProductList

const Sort = ({sortUrls, productSearchResult, basePath, ...otherProps}) => {
    const intl = useIntl()
    const history = useHistory()

    return (
        <FormControl data-testid="sf-product-list-sort" id="page_sort" width="auto" {...otherProps}>
            <Select
                value={basePath.replace(/(offset)=(\d+)/i, '$1=0')}
                onChange={({target}) => {
                    history.push(target.value)
                }}
                height={11}
                width="240px"
            >
                {sortUrls.map((href, index) => (
                    <option key={href} value={href}>
                        {intl.formatMessage(
                            {
                                id: 'product_list.select.sort_by',
                                defaultMessage: 'Sort By: {sortOption}'
                            },
                            {
                                sortOption: productSearchResult?.sortingOptions[index]?.label
                            }
                        )}
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
