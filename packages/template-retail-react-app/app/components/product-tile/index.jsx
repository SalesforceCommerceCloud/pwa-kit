/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useRef} from 'react'
import PropTypes from 'prop-types'
import {HeartIcon, HeartSolidIcon} from '@salesforce/retail-react-app/app/components/icons'

// Components
import {
    AspectRatio,
    Box,
    Skeleton as ChakraSkeleton,
    Text,
    Stack,
    useMultiStyleConfig,
    IconButton
} from '@salesforce/retail-react-app/app/components/shared/ui'
import DynamicImage from '@salesforce/retail-react-app/app/components/dynamic-image'

// Hooks
import {useIntl} from 'react-intl'

// Other
import {productUrlBuilder} from '@salesforce/retail-react-app/app/utils/url'
import Link from '@salesforce/retail-react-app/app/components/link'
import withRegistration from '@salesforce/retail-react-app/app/components/with-registration'
import DisplayPrice from '@salesforce/retail-react-app/app/components/display-price'

const IconButtonWithRegistration = withRegistration(IconButton)

// Component Skeleton
export const Skeleton = () => {
    const styles = useMultiStyleConfig('ProductTile')
    return (
        <Box data-testid="sf-product-tile-skeleton">
            <Stack spacing={2}>
                <Box {...styles.imageWrapper}>
                    <AspectRatio ratio={1} {...styles.image}>
                        <ChakraSkeleton />
                    </AspectRatio>
                </Box>
                <ChakraSkeleton width="80px" height="20px" />
                <ChakraSkeleton width={{base: '120px', md: '220px'}} height="12px" />
            </Stack>
        </Box>
    )
}

/**
 * The ProductTile is a simple visual representation of a
 * product object. It will show it's default image, name and price.
 * It also supports favourite products, controlled by a heart icon.
 */
const ProductTile = (props) => {
    const intl = useIntl()
    const {
        product,
        enableFavourite = false,
        isFavourite,
        onFavouriteToggle,
        dynamicImageProps,
        ...rest
    } = props

    const {image, productId, hitType} = product
    // NOTE: swatches will implement later to set variant accordingly,
    // for now we use the first variant that has price book to set up discount price
    // Not all variants has set in a priceBook, a.k.a not having tieredPrices.
    const variant = product?.variants?.find((i) => !!i?.tieredPrices)
    let currentPrice = variant ? variant?.price : product?.price

    // ProductTile is used by two components, RecommendedProducts and ProductList.
    // RecommendedProducts provides a localized product name as `name` and non-localized product
    // name as `productName`. ProductList provides a localized name as `productName` and does not
    // use the `name` property.
    const localizedProductName = product.name ?? product.productName
    const isProductASet = hitType === 'set' || !!product?.type?.set

    // standard product will have tieredPrices directly under product object
    // product set does not have tierPieces, we go with priceRanges
    const tieredPrices = isProductASet
        ? product?.priceRanges
        : variant
        ? variant?.tieredPrices
        : product?.tieredPrices

    // we will choose the list price from the price book that contains the highest value to display strike through price
    const maxPriceTier = tieredPrices
        ? Math.max(...(tieredPrices || []).map((item) => item.price || item.maxPrice))
        : 0
    let listPrice = tieredPrices?.find(
        (tier) => tier.price === maxPriceTier || tier.maxPrice === maxPriceTier
    )

    const isFavouriteLoading = useRef(false)
    const styles = useMultiStyleConfig('ProductTile')

    return (
        <Box {...styles.container}>
            <Link
                data-testid="product-tile"
                to={productUrlBuilder({id: productId}, intl.local)}
                {...styles.link}
                {...rest}
            >
                <Box {...styles.imageWrapper}>
                    {image && (
                        <AspectRatio {...styles.image}>
                            <DynamicImage
                                src={`${image.disBaseLink || image.link}[?sw={width}&q=60]`}
                                widths={dynamicImageProps?.widths}
                                imageProps={{
                                    alt: image.alt,
                                    ...dynamicImageProps?.imageProps
                                }}
                            />
                        </AspectRatio>
                    )}
                </Box>

                {/* Title */}
                <Text {...styles.title}>{localizedProductName}</Text>

                {/*/!* Price *!/*/}
                {/*Price and discount price will show for first variant for now. We will implement the swatch into PLP later*/}
                <DisplayPrice
                    basePrice={isProductASet ? listPrice?.maxPrice : listPrice?.price}
                    isProductASet={isProductASet}
                    discountPriceProps={
                        listPrice?.maxPrice > currentPrice || listPrice?.price > currentPrice
                            ? {as: 'b'}
                            : {as: 'p'}
                    }
                    discountPrice={currentPrice}
                />
            </Link>
            {enableFavourite && (
                <Box
                    onClick={(e) => {
                        // stop click event from bubbling
                        // to avoid user from clicking the underlying
                        // product while the favourite icon is disabled
                        e.preventDefault()
                    }}
                >
                    <IconButtonWithRegistration
                        data-testid="wishlist-button"
                        aria-label={
                            isFavourite
                                ? intl.formatMessage(
                                      {
                                          id: 'product_tile.assistive_msg.remove_from_wishlist',
                                          defaultMessage: 'Remove {product} from wishlist'
                                      },
                                      {product: localizedProductName}
                                  )
                                : intl.formatMessage(
                                      {
                                          id: 'product_tile.assistive_msg.add_to_wishlist',
                                          defaultMessage: 'Add {product} to wishlist'
                                      },
                                      {product: localizedProductName}
                                  )
                        }
                        icon={isFavourite ? <HeartSolidIcon /> : <HeartIcon />}
                        {...styles.favIcon}
                        onClick={async () => {
                            if (!isFavouriteLoading.current) {
                                isFavouriteLoading.current = true
                                await onFavouriteToggle(!isFavourite)
                                isFavouriteLoading.current = false
                            }
                        }}
                    />
                </Box>
            )}
        </Box>
    )
}

ProductTile.displayName = 'ProductTile'

ProductTile.propTypes = {
    /**
     * The product search hit that will be represented in this
     * component.
     */
    product: PropTypes.shape({
        currency: PropTypes.string,
        image: PropTypes.shape({
            alt: PropTypes.string,
            disBaseLink: PropTypes.string,
            link: PropTypes.string
        }),
        price: PropTypes.number,
        priceRanges: PropTypes.array,
        tieredPrices: PropTypes.array,

        // `name` is present and localized when `product` is provided by a RecommendedProducts component
        // (from Shopper Products `getProducts` endpoint), but is not present when `product` is
        // provided by a ProductList component.
        // See: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-products?meta=getProducts
        name: PropTypes.string,
        // `productName` is localized when provided by a ProductList component (from Shopper Search
        // `productSearch` endpoint), but is NOT localized when provided by a RecommendedProducts
        // component (from Einstein Recommendations `getRecommendations` endpoint).
        // See: https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-search?meta=productSearch
        // See: https://developer.salesforce.com/docs/commerce/einstein-api/references/einstein-api-quick-start-guide?meta=getRecommendations
        // Note: useEinstein() transforms snake_case property names from the API response to camelCase
        productName: PropTypes.string,
        productId: PropTypes.string,
        hitType: PropTypes.string,
        variants: PropTypes.array,
        type: PropTypes.shape({
            set: PropTypes.bool
        })
    }),
    /**
     * Enable adding/removing product as a favourite.
     * Use case: wishlist.
     */
    enableFavourite: PropTypes.bool,
    /**
     * Display the product as a favourite.
     */
    isFavourite: PropTypes.bool,
    /**
     * Callback function to be invoked when the user
     * interacts with favourite icon/button.
     */
    onFavouriteToggle: PropTypes.func,
    dynamicImageProps: PropTypes.object
}

export default ProductTile
