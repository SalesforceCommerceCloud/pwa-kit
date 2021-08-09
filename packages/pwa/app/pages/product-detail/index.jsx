/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React, {useEffect, useState} from 'react'
import {useLocation, useHistory} from 'react-router-dom'
import PropTypes from 'prop-types'
import {Helmet} from 'react-helmet'
import {FormattedMessage, useIntl} from 'react-intl'
import useNavigation from '../../hooks/use-navigation'

// Components
import {
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Box,
    Button,
    Fade,
    Heading,
    Select,
    Stack,
    Skeleton,
    Text
} from '@chakra-ui/react'

// Project Components
import Breadcrumb from '../../components/breadcrumb'
import ImageGallery from '../../components/image-gallery'
import SwatchGroup from '../../components/swatch-group'
import Swatch from '../../components/swatch-group/swatch'
import RecommendedProducts from '../../components/recommended-products'

// Hooks
import {useVariationAttributes, useVariant, useVariationParams} from '../../hooks'
import useBasket from '../../commerce-api/hooks/useBasket'

// Others/Utils
import useEinstein from '../../commerce-api/hooks/useEinstein'
import {HTTPNotFound} from 'pwa-kit-react-sdk/dist/ssr/universal/errors'
import {rebuildPathWithParams} from '../../utils/url'
import withRegistration from '../../hoc/with-registration'
import useCustomerProductLists, {
    eventActions
} from '../../commerce-api/hooks/useCustomerProductLists'
import {customerProductListTypes} from '../../constants'
import {useToast} from '../../hooks/use-toast'
import {API_ERROR_MESSAGE} from '../account/constant'

const MAX_ORDER_QUANTITY = 10
const OUT_OF_STOCK = 'OUT_OF_STOCK'
const UNFULFILLABLE = 'UNFULFILLABLE'
const ButtonWithRegistration = withRegistration(Button)

const ProductDetail = ({category, product, isLoading}) => {
    const intl = useIntl()
    const basket = useBasket()
    const history = useHistory()
    const navigate = useNavigation()
    const location = useLocation()
    const customerProductLists = useCustomerProductLists()
    const showToast = useToast()

    const einstein = useEinstein()

    const [quantity, setQuantity] = useState(1)
    const [primaryCategory, setPrimaryCategory] = useState(category)

    const variationAttributes = useVariationAttributes(product)
    const variationParams = useVariationParams(product)
    const variant = useVariant(product)

    const stepQuantity = product?.stepQuantity || 1
    const stockLevel = product?.inventory?.stockLevel || 0
    const canOrder = !isLoading && variant?.orderable && quantity <= stockLevel
    const showLoading = !product

    const canAddToWishlist = !isLoading

    // A product is considered out of stock if the stock level is 0 or if we have all our
    // variation attributes selected, but don't have a variant. We do this because the API
    // will sometimes return all the variants even if they are out of stock, but for other
    // products it won't.
    const isOutOfStock =
        !stockLevel ||
        (!variant && Object.keys(variationParams).length === variationAttributes.length)
    const unfulfillable = stockLevel < quantity

    const inventoryMessages = {
        [OUT_OF_STOCK]: intl.formatMessage({
            defaultMessage: 'Out of stock'
        }),
        [UNFULFILLABLE]: intl.formatMessage(
            {
                defaultMessage: 'Only {stockLevel} Left!'
            },
            {stockLevel}
        )
    }

    const showInventoryMessage = !isLoading && (isOutOfStock || unfulfillable)
    const inventoryMessage =
        (isOutOfStock && inventoryMessages[OUT_OF_STOCK]) ||
        (unfulfillable && inventoryMessages[UNFULFILLABLE])

    const handleAddToCart = async () => {
        // The basket accepts an array of `ProductItems`, so lets create a single
        // item array to add to the basket.
        const productItems = [
            {
                productId: variant.productId,
                quantity,
                price: variant.price
            }
        ]

        basket.addItemToBasket(productItems)
    }

    const onViewWishlistClick = () => {
        navigate('/account/wishlist')
    }

    const addItemToWishlist = async () => {
        try {
            // If product-lists have not loaded we push "Add to wishlist" event to eventQueue to be
            // processed once the product-lists have loaded.
            if (!customerProductLists?.loaded) {
                const event = {
                    item: {...product, quantity},
                    action: eventActions.ADD,
                    listType: customerProductListTypes.WISHLIST
                }

                customerProductLists.addActionToEventQueue(event)
            } else {
                const wishlist = customerProductLists.data.find(
                    (list) => list.type === customerProductListTypes.WISHLIST
                )
                const requestBody = {
                    productId: product.id,
                    priority: 1,
                    quantity,
                    public: false,
                    type: 'product'
                }

                const wishlistItem = await customerProductLists.createCustomerProductListItem(
                    requestBody,
                    wishlist.id
                )

                if (wishlistItem?.id) {
                    const toastAction = (
                        <Button variant="link" onClick={onViewWishlistClick}>
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
        } catch (error) {
            console.error(error)
            showToast({
                title: intl.formatMessage(
                    {defaultMessage: '{errorMessage}'},
                    {errorMessage: API_ERROR_MESSAGE}
                ),
                status: 'error'
            })
        }
    }

    // If the user has selected all required attributes as we now have the single product
    // variant, load that variant by updating the `pid` param in the location. This will
    // trigger a run of `getProps`. We do this because we need to get updated inventory
    // information.
    useEffect(() => {
        history.replace(
            rebuildPathWithParams(`${location.pathname}${location.search}`, {
                pid: variant?.productId
            })
        )
    }, [variant])

    // This page uses the `primaryCategoryId` to retrieve the category data. This attribute
    // is only available on `master` products. Since a variation will be loaded once all the
    // attributes are selected (to get the correct inventory values), the category information
    // is overridden. This will allow us to keep the initial category around until a different
    // master product is loaded.
    useEffect(() => {
        if (category) {
            setPrimaryCategory(category)
        }
    }, [category])

    useEffect(() => {
        if (product) {
            einstein.sendViewProduct(product)
        }
    }, [product])

    return (
        <Box
            className="sf-product-detail-page"
            layerStyle="page"
            data-testid="product-details-page"
        >
            <Helmet>
                <title>{product?.pageTitle}</title>
                <meta name="description" content={product?.pageDescription} />
            </Helmet>

            <Stack spacing={16}>
                <Stack spacing={4}>
                    <Stack direction="row" alignItems="stretch" spacing={[0, 0, 0, 16]}>
                        <Box display={['none', 'none', 'none', 'block']} flex={5}>
                            {/* Image Gallery */}
                            {product && (
                                <ImageGallery
                                    data-testid="product-details-gallery"
                                    imageGroups={product.imageGroups}
                                    selectedVariationAttributes={variationParams}
                                />
                            )}
                        </Box>

                        <Box flex={4}>
                            {/* Header */}
                            <Stack align="stretch" marginBottom={8} spacing={2}>
                                {/* Breadcrumb */}
                                <Skeleton isLoaded={!showLoading} width={64}>
                                    <Breadcrumb
                                        marginBottom={2}
                                        categories={primaryCategory?.parentCategoryTree || []}
                                    />
                                </Skeleton>

                                {/* Title */}
                                <Skeleton isLoaded={!showLoading}>
                                    <Heading as="h2" size="lg">
                                        {`${product?.name}`}
                                    </Heading>
                                </Skeleton>

                                {/* Price */}
                                <Skeleton isLoaded={!showLoading} width={32}>
                                    <Text fontWeight="bold" fontSize="md" aria-label="price">
                                        {intl.formatNumber(variant?.price || product?.price, {
                                            style: 'currency',
                                            currency: product?.currency || 'USD'
                                        })}
                                    </Text>
                                </Skeleton>
                            </Stack>

                            {/* Image Gallery */}
                            <Box align="stretch" display={['block', 'block', 'block', 'none']}>
                                {product && (
                                    <ImageGallery
                                        imageGroups={product.imageGroups}
                                        selectedVariationAttributes={variationParams}
                                    />
                                )}
                            </Box>

                            {/* Variations & Quantity Selector */}
                            <Stack align="stretch" spacing={8}>
                                <Stack align="stretch" spacing={4}>
                                    {/* 
                                Customize the skeletons shown for attributes to suit your needs. At the point
                                that we show the skeleton we do not know how many variations are selectable. So choose
                                a a skeleton that will meet most of your needs. 
                            */}
                                    {showLoading ? (
                                        <>
                                            {/* First Attribute Skeleton */}
                                            <Skeleton height={6} width={32} />
                                            <Skeleton height={20} width={64} />

                                            {/* Second Attribute Skeleton */}
                                            <Skeleton height={6} width={32} />
                                            <Skeleton height={20} width={64} />
                                        </>
                                    ) : (
                                        <>
                                            {/* Attribute Swatches */}
                                            {variationAttributes.map((variationAttribute) => {
                                                const {
                                                    id,
                                                    name,
                                                    selectedValue,
                                                    values = []
                                                } = variationAttribute

                                                return (
                                                    <SwatchGroup
                                                        key={id}
                                                        onChange={(_, href) =>
                                                            history.replace(href)
                                                        }
                                                        variant={
                                                            id === 'color' ? 'circle' : 'square'
                                                        }
                                                        value={selectedValue?.value}
                                                        displayName={selectedValue?.name || ''}
                                                        label={name}
                                                    >
                                                        {values.map(
                                                            ({
                                                                href,
                                                                name,
                                                                image,
                                                                value,
                                                                orderable
                                                            }) => (
                                                                <Swatch
                                                                    key={value}
                                                                    href={href}
                                                                    disabled={!orderable}
                                                                    value={value}
                                                                    name={name}
                                                                >
                                                                    {image ? (
                                                                        <Box
                                                                            height="100%"
                                                                            width="100%"
                                                                            minWidth="32px"
                                                                            backgroundRepeat="no-repeat"
                                                                            backgroundSize="cover"
                                                                            backgroundColor={name.toLowerCase()}
                                                                            backgroundImage={
                                                                                image
                                                                                    ? `url(${image.disBaseLink})`
                                                                                    : ''
                                                                            }
                                                                        />
                                                                    ) : (
                                                                        name
                                                                    )}
                                                                </Swatch>
                                                            )
                                                        )}
                                                    </SwatchGroup>
                                                )
                                            })}
                                        </>
                                    )}

                                    {/* Quantity Selector */}
                                    <Stack align="stretch" maxWidth={'125px'}>
                                        <Box fontWeight="bold">
                                            {intl.formatMessage({
                                                defaultMessage: 'Quantity'
                                            })}
                                            :
                                        </Box>
                                        <Select
                                            value={quantity}
                                            onChange={({target}) => {
                                                setQuantity(parseInt(target.value))
                                            }}
                                        >
                                            {new Array(MAX_ORDER_QUANTITY)
                                                .fill(0)
                                                .map((_, index) => (
                                                    <option
                                                        key={index}
                                                        value={index + stepQuantity}
                                                    >
                                                        {index + stepQuantity}
                                                    </option>
                                                ))}
                                        </Select>
                                    </Stack>
                                </Stack>

                                <Box width="100%">
                                    {showInventoryMessage && (
                                        <Fade in={true}>
                                            <Text
                                                color="orange.600"
                                                fontWeight={600}
                                                marginBottom={8}
                                            >
                                                {inventoryMessage}
                                            </Text>
                                        </Fade>
                                    )}

                                    <Stack spacing={4} display={{base: 'none', lg: 'block'}}>
                                        <Button
                                            disabled={!canOrder}
                                            onClick={handleAddToCart}
                                            width="100%"
                                            variant="solid"
                                        >
                                            {intl.formatMessage({
                                                defaultMessage: 'Add to Cart'
                                            })}
                                        </Button>

                                        <Box>
                                            <ButtonWithRegistration
                                                disabled={
                                                    customerProductLists.showLoader ||
                                                    !canAddToWishlist
                                                }
                                                onClick={addItemToWishlist}
                                                width={'100%'}
                                                variant="outline"
                                                isLoading={customerProductLists.showLoader}
                                            >
                                                {intl.formatMessage({
                                                    defaultMessage: 'Add to Wishlist'
                                                })}
                                            </ButtonWithRegistration>
                                        </Box>
                                    </Stack>
                                </Box>
                            </Stack>
                        </Box>
                    </Stack>

                    {/* Information Accordion */}
                    <Stack direction="row" spacing={[0, 0, 0, 16]}>
                        <Accordion allowMultiple allowToggle maxWidth={'896px'} flex={[1, 1, 1, 5]}>
                            {/* Details */}
                            <AccordionItem>
                                <h2>
                                    <AccordionButton height="64px">
                                        <Box
                                            flex="1"
                                            textAlign="left"
                                            fontWeight="bold"
                                            fontSize="lg"
                                        >
                                            {intl.formatMessage({
                                                defaultMessage: 'Product Detail'
                                            })}
                                        </Box>
                                        <AccordionIcon />
                                    </AccordionButton>
                                </h2>
                                <AccordionPanel mb={6} mt={4}>
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: product?.longDescription
                                        }}
                                    />
                                </AccordionPanel>
                            </AccordionItem>

                            {/* Size & Fit */}
                            <AccordionItem>
                                <h2>
                                    <AccordionButton height="64px">
                                        <Box
                                            flex="1"
                                            textAlign="left"
                                            fontWeight="bold"
                                            fontSize="lg"
                                        >
                                            {intl.formatMessage({
                                                defaultMessage: 'Size & Fit'
                                            })}
                                        </Box>
                                        <AccordionIcon />
                                    </AccordionButton>
                                </h2>
                                <AccordionPanel mb={6} mt={4}>
                                    Coming Soon
                                </AccordionPanel>
                            </AccordionItem>

                            {/* Reviews */}
                            <AccordionItem>
                                <h2>
                                    <AccordionButton height="64px">
                                        <Box
                                            flex="1"
                                            textAlign="left"
                                            fontWeight="bold"
                                            fontSize="lg"
                                        >
                                            {intl.formatMessage({
                                                defaultMessage: 'Reviews'
                                            })}
                                        </Box>
                                        <AccordionIcon />
                                    </AccordionButton>
                                </h2>
                                <AccordionPanel mb={6} mt={4}>
                                    Coming Soon
                                </AccordionPanel>
                            </AccordionItem>

                            {/* Questions */}
                            <AccordionItem>
                                <h2>
                                    <AccordionButton height="64px">
                                        <Box
                                            flex="1"
                                            textAlign="left"
                                            fontWeight="bold"
                                            fontSize="lg"
                                        >
                                            {intl.formatMessage({
                                                defaultMessage: 'Questions'
                                            })}
                                        </Box>
                                        <AccordionIcon />
                                    </AccordionButton>
                                </h2>
                                <AccordionPanel mb={6} mt={4}>
                                    Coming Soon
                                </AccordionPanel>
                            </AccordionItem>
                        </Accordion>
                        <Box display={['none', 'none', 'none', 'block']} flex={4}></Box>
                    </Stack>

                    {/* Add to Cart Button */}
                    <Box
                        position="sticky"
                        bottom="0"
                        pt={4}
                        pb={11}
                        px={4}
                        display={{base: 'block', lg: 'none'}}
                        width="full"
                        backgroundColor="white"
                    >
                        <Box marginLeft="-16px" marginRight="-16px">
                            <Stack spacing={4}>
                                <Button width="full" disabled={!canOrder} onClick={handleAddToCart}>
                                    <FormattedMessage defaultMessage="Add to Cart" />
                                </Button>

                                {/* Adding display styles to button instead of Box breaks spinner when isLoading is true */}
                                <ButtonWithRegistration
                                    disabled={customerProductLists.showLoader || !canAddToWishlist}
                                    onClick={addItemToWishlist}
                                    width={'100%'}
                                    variant="outline"
                                    isLoading={customerProductLists.showLoader}
                                >
                                    {intl.formatMessage({
                                        defaultMessage: 'Add to Wishlist'
                                    })}
                                </ButtonWithRegistration>
                            </Stack>
                        </Box>
                    </Box>
                </Stack>

                {/* Product Recommendations */}
                <Stack spacing={16}>
                    <RecommendedProducts
                        title={<FormattedMessage defaultMessage="Complete The Set" />}
                        recommender={'complete-the-set'}
                        products={product && [product.id]}
                        mx={{base: -4, md: -8, lg: 0}}
                        shouldFetch={() => product?.id}
                    />

                    <RecommendedProducts
                        title={<FormattedMessage defaultMessage="You Might Also Like" />}
                        recommender={'pdp-similar-items'}
                        products={product && [product.id]}
                        mx={{base: -4, md: -8, lg: 0}}
                        shouldFetch={() => product?.id}
                    />

                    <RecommendedProducts
                        title={<FormattedMessage defaultMessage="Recently Viewed" />}
                        recommender={'viewed-recently-einstein'}
                        mx={{base: -4, md: -8, lg: 0}}
                    />
                </Stack>
            </Stack>
        </Box>
    )
}

ProductDetail.getTemplateName = () => 'product-detail'

ProductDetail.shouldGetProps = ({previousLocation, location}) => {
    const previousParams = new URLSearchParams(previousLocation?.search || '')
    const params = new URLSearchParams(location.search)

    // If the product changed via the pathname or `pid` param, allow updated
    // data to be retrieved.
    return (
        previousLocation?.pathname !== location.pathname ||
        previousParams.get('pid') !== params.get('pid')
    )
}

ProductDetail.getProps = async ({params, location, api}) => {
    const {productId} = params
    let category, product
    const urlParams = new URLSearchParams(location.search)

    product = await api.shopperProducts.getProduct({
        parameters: {
            id: urlParams.get('pid') || productId,
            allImages: true
        }
    })

    if (product?.primaryCategoryId) {
        category = await api.shopperProducts.getCategory({
            parameters: {id: product?.primaryCategoryId, levels: 1}
        })
    }

    // The `commerce-isomorphic-sdk` package does not throw errors, so
    // we have to check the returned object type to inconsistencies.
    if (typeof product?.type === 'string') {
        throw new HTTPNotFound(product.detail)
    }
    if (typeof category?.type === 'string') {
        throw new HTTPNotFound(category.detail)
    }

    return {category, product}
}

ProductDetail.propTypes = {
    /**
     * The category object used for breadcrumb construction.
     */
    category: PropTypes.object,
    /**
     * The product object to be shown on the page..
     */
    product: PropTypes.object,
    /**
     * The current state of `getProps` when running this value is `true`, otherwise it's
     * `false`. (Provided internally)
     */
    isLoading: PropTypes.bool,
    /**
     * The current react router match object. (Provided internally)
     */
    match: PropTypes.object
}

export default ProductDetail
