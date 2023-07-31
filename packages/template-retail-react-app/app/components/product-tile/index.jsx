/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'

// Components
import {Box, Text, useMultiStyleConfig} from '@salesforce/retail-react-app/app/components/shared/ui'
import Image from '@salesforce/retail-react-app/app/components/product-tile/image'

// Hooks
import {useIntl} from 'react-intl'

// Other
import {productUrlBuilder} from '@salesforce/retail-react-app/app/utils/url'
import Link from '@salesforce/retail-react-app/app/components/link'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks'
// TODO: do we need to sort by sections for these imports?
import FavouriteButton from '@salesforce/retail-react-app/app/components/product-tile/favourite-button'
import Title from '@salesforce/retail-react-app/app/components/product-tile/title'

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
        // NOTE: this is good for allowing Chakra style props
        ...rest
    } = props

    const {currency, image, price, productId, hitType} = product

    const {currency: activeCurrency} = useCurrency()
    const styles = useMultiStyleConfig('ProductTile')

    return (
        <Link
            data-testid="product-tile"
            {...styles.container}
            to={productUrlBuilder({id: productId}, intl.local)}
            {...rest}
        >
            <Box {...styles.imageWrapper}>
                {image && <Image image={image} dynamicImageProps={dynamicImageProps} />}

                {enableFavourite && (
                    <FavouriteButton
                        isFavourite={isFavourite}
                        onFavouriteToggle={onFavouriteToggle}
                    />
                )}
            </Box>

            <Title product={product} />

            {/* TODO: extract price */}
            {/* Price */}
            <Text {...styles.price} data-testid="product-tile-price">
                {hitType === 'set' &&
                    intl.formatMessage({
                        id: 'product_tile.label.starting_at_price',
                        defaultMessage: 'Starting at'
                    })}{' '}
                {intl.formatNumber(price, {
                    style: 'currency',
                    currency: currency || activeCurrency
                })}
            </Text>
        </Link>
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
        name: PropTypes.string,
        productName: PropTypes.string,
        productId: PropTypes.string,
        hitType: PropTypes.string
    }),
    /**
     * Enable adding/removing product as a favourite.
     * Use case: wishlist.
     */
    enableFavourite: PropTypes.bool,
    /**
     * Display the product as a faviourite.
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
