/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useMemo, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'

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

// Project Components
import {HeartIcon, HeartSolidIcon} from '@salesforce/retail-react-app/app/components/icons'
import Link from '@salesforce/retail-react-app/app/components/link'
import Swatch from '@salesforce/retail-react-app/app/components/swatch-group/swatch'
import SwatchGroup from '@salesforce/retail-react-app/app/components/swatch-group'
import withRegistration from '@salesforce/retail-react-app/app/components/with-registration'

// Hooks
import {useIntl} from 'react-intl'

// Other
import {productUrlBuilder, rebuildPathWithParams} from '@salesforce/retail-react-app/app/utils/url'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks'
import {filterImageGroups} from '../../utils/product-utils'

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
    const {
        dynamicImageProps,
        enableFavourite = false,
        imageViewType = 'large',
        isFavourite,
        onFavouriteToggle,
        product,
        selectableAttributeId = 'color',
        ...rest
    } = props
    const {currency, imageGroups, price, productId, hitType} = product

    const intl = useIntl()
    const {buildUrl} = useMultiSite()
    const {currency: activeCurrency} = useCurrency()
    const isFavouriteLoading = useRef(false)
    const styles = useMultiStyleConfig('ProductTile')

    const isMasterVariant = ['master', 'variant'].includes(hitType)
    const initialVariationValue = isMasterVariant
        ? product?.variants?.find((variant) => variant.productId == product.representedProduct.id)
              ?.variationValues?.[selectableAttributeId]
        : undefined

    const [selectableAttributeValue, setSelectableAttributeValue] = useState(initialVariationValue)

    const image = useMemo(() => {
        // NOTE: If the selectable variation attribute doesn't exist in the products variation attributes
        // array, lets not filter the image groups on it. This ensures we always return an image for non-variant
        // type products.
        const hasSelectableAttribute = product?.variationAttributes?.find(
            ({id}) => id === selectableAttributeId
        )

        const variationValues = {[selectableAttributeId]: selectableAttributeValue}
        const filteredImageGroups = filterImageGroups(imageGroups, {
            viewType: imageViewType,
            variationValues: hasSelectableAttribute ? variationValues : {}
        })

        // Return the first image of the first group.
        return filteredImageGroups?.[0]?.images[0]
    }, [product, selectableAttributeId, selectableAttributeValue, imageViewType])

    const productUrl = useMemo(() => {
        return rebuildPathWithParams(productUrlBuilder({id: productId}), {
            [selectableAttributeId]: selectableAttributeValue
        })
    }, [product, selectableAttributeId, selectableAttributeValue])

    // NOTE: variationAttributes are only defined for master/variant type products.
    const variationAttributes = useMemo(() => {
        // NOTE: Decorate the product variant attributes to easily access images and hrefs.
        return product?.variationAttributes?.map((variationAttribute) => ({
            ...variationAttribute,
            values: variationAttribute.values.map((value) => {
                const variationValues = {[selectableAttributeId]: value.value}
                const swatchImage = filterImageGroups(product.imageGroups, {
                    viewType: 'swatch',
                    variationValues
                })?.[0]?.images[0]
                const productHref = buildUrl(rebuildPathWithParams(productUrl, variationValues))

                return {
                    ...value,
                    image: swatchImage,
                    href: productHref
                }
            })
        }))
    }, [product])

    // ProductTile is used by two components, RecommendedProducts and ProductList.
    // RecommendedProducts provides a localized product name as `name` and non-localized product
    // name as `productName`. ProductList provides a localized name as `productName` and does not
    // use the `name` property.
    const localizedProductName = product.name ?? product.productName

    return (
        <Box {...styles.container}>
            <Link data-testid="product-tile" to={productUrl} {...styles.link} {...rest}>
                <Box {...styles.imageWrapper}>
                    {image && (
                        <AspectRatio {...styles.image}>
                            <DynamicImage
                                src={`${image.disBaseLink || image.link}[?sw={width}&q=60]`}
                                widths={dynamicImageProps?.widths}
                                imageProps={{
                                    // treat img as a decorative item, we don't need to pass `image.alt`
                                    // since it is the same as product name
                                    // which can cause confusion for individuals who uses screen readers
                                    alt: '',
                                    ...dynamicImageProps?.imageProps
                                }}
                            />
                        </AspectRatio>
                    )}
                </Box>

                {/* Swatches */}
                {variationAttributes
                    ?.filter(({id}) => selectableAttributeId == id)
                    ?.map(({id, values}) => {
                        const attributeId = id
                        return (
                            <SwatchGroup key={id}>
                                {values?.map(({href, name, image, value}) => {
                                    const content = image ? (
                                        <Box
                                            height="100%"
                                            width="100%"
                                            minWidth="32px"
                                            backgroundRepeat="no-repeat"
                                            backgroundSize="cover"
                                            backgroundColor={name.toLowerCase()}
                                            backgroundImage={`url(${
                                                image.disBaseLink || image.link
                                            })`}
                                        />
                                    ) : (
                                        name
                                    )

                                    return (
                                        <Swatch
                                            key={value}
                                            href={href}
                                            handleMouseEnter={(value) =>
                                                setSelectableAttributeValue(value)
                                            }
                                            value={value}
                                            name={name}
                                            variant={attributeId === 'color' ? 'circle' : 'square'}
                                            selected={value === selectableAttributeValue}
                                        >
                                            {content}
                                        </Swatch>
                                    )
                                })}
                            </SwatchGroup>
                        )
                    })}

                {/* Title */}
                <Text {...styles.title}>{localizedProductName}</Text>

                {/* Price */}
                <Text {...styles.price} data-testid="product-tile-price">
                    {hitType === 'set'
                        ? intl.formatMessage(
                              {
                                  id: 'product_tile.label.starting_at_price',
                                  defaultMessage: 'Starting at {price}'
                              },
                              {
                                  price: intl.formatNumber(price, {
                                      style: 'currency',
                                      currency: currency || activeCurrency
                                  })
                              }
                          )
                        : intl.formatNumber(price, {
                              style: 'currency',
                              currency: currency || activeCurrency
                          })}
                </Text>
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
        imageGroups: PropTypes.array,
        price: PropTypes.number,
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
        representedProduct: PropTypes.object,
        hitType: PropTypes.string,
        variationAttributes: PropTypes.array,
        variants: PropTypes.array
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
    /**
     * The `viewType` of the image component. This defaults to 'large'.
     */
    imageViewType: PropTypes.string,
    /**
     * When displaying a master/variant product, this value represents the variation attribute that is displayed
     * as a swatch below the main image. The default for this property is `color`.
     */
    selectableAttributeId: PropTypes.string,
    dynamicImageProps: PropTypes.object
}

export default ProductTile
