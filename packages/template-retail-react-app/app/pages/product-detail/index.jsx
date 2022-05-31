/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {Helmet} from 'react-helmet'
import {FormattedMessage, useIntl} from 'react-intl'

// Components
import {
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Box,
    Button,
    Stack,
    Heading,
    Divider
} from '@chakra-ui/react'

// Hooks
import useBasket from '../../commerce-api/hooks/useBasket'
import {useVariant} from '../../hooks'
import useWishlist from '../../hooks/use-wishlist'
import useNavigation from '../../hooks/use-navigation'
import useEinstein from '../../commerce-api/hooks/useEinstein'

// Project Components
// import RecommendedProducts from '../../components/recommended-products'
// Others/Utils
import {HTTPNotFound} from 'pwa-kit-react-sdk/ssr/universal/errors'
import ProductView from 'pwa-kit-ecom/components/product-view'
// constant
import {API_ERROR_MESSAGE, MAX_CACHE_AGE} from '../../constants'
import {rebuildPathWithParams} from '../../utils/url'
import {useHistory} from 'react-router-dom'
import {useToast} from '../../hooks/use-toast'

const CustomGallery = ({product}) => {
    const heroGroup = product?.imageGroups?.find((group) => group.viewType === 'large')

    return (
        <Box minWidth={'680px'}>
            <img src={heroGroup?.images[0].link} />
        </Box>
    )
}

const ProductDetail = ({category, product, isLoading}) => {
    // const {formatMessage} = useIntl()
    // const basket = useBasket()
    // const history = useHistory()
    // const einstein = useEinstein()
    // const variant = useVariant(product)
    // const toast = useToast()
    // const navigate = useNavigation()
    // const [primaryCategory, setPrimaryCategory] = useState(category)

    // Omitting wish list and add to cart for the sake of demo

    console.log('retail app product ', product)
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

            <Heading size={'md'}>No customisation</Heading>
            <Stack mt={8}>
                <ProductView product={product} />
            </Stack>

            <Divider height="10px" />

            <Heading mt={16} size={'md'}>
                Partial customisation by replace some components in ProductView
            </Heading>

            <Stack>
                <ProductView
                    product={product}
                    imageGallery={<CustomGallery product={product} />}
                    productTitle={
                        <Box bg={'red'}>
                            <Box>Customised Product Title</Box>
                            <Box><Heading size={'2xl'}>{product?.name}</Heading></Box>
                        </Box>
                    }
                />
            </Stack>

            <Divider height="10px" />

            <Heading size={'md'} mt={16}>
                Fully customisation by no using default ProductView
            </Heading>
            <Stack mt={8}>
                <Box bg={'aqua'} minWidth={'680px'}>
                    Customised Product View
                    <Box>{product?.name}</Box>
                    <Box>{product?.longDescription}</Box>
                    <Box>{product?.price}</Box>
                </Box>
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

ProductDetail.getProps = async ({res, params, location, api}) => {
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

    // Set the `cache-control` header values similar to those on the product-list.
    if (res) {
        res.set('Cache-Control', `max-age=${MAX_CACHE_AGE}`)
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
