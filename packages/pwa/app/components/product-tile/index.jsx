/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {WishlistIcon, WishlistSolidIcon} from '../icons'

// Components
import {
    AspectRatio,
    Box,
    Img,
    Skeleton as ChakraSkeleton,
    Text,
    Stack,
    useMultiStyleConfig,
    IconButton
} from '@chakra-ui/react'

// Hooks
import {useIntl} from 'react-intl'

// Other
import {productUrlBuilder} from '../../utils/url'
import Link from '../link'
import withRegistration from '../../hoc/with-registration'

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
 * The ProductTile is a simple visual representation of a product search hit
 * object. It will show it's default image, name and price.
 */
const ProductTile = (props) => {
    const intl = useIntl()

    const {
        product,
        enableFavourite = true,
        isFavourite = true,
        onFavouriteToggle,
        ...rest
    } = props
    const {currency, image, price, productName, productId} = product
    const styles = useMultiStyleConfig('ProductTile')

    return (
        <Link
            data-testid="product-tile"
            {...styles.container}
            to={productUrlBuilder({id: productId}, intl.local)}
            {...rest}
        >
            <Box {...styles.imageWrapper}>
                <AspectRatio {...styles.image} ratio={1}>
                    <Img alt={image.alt} src={image.disBaseLink} />
                </AspectRatio>

                {enableFavourite && (
                    <IconButtonWithRegistration
                        aria-label={intl.formatMessage({
                            defaultMessage: 'add to wishlist'
                        })}
                        icon={isFavourite ? <WishlistSolidIcon /> : <WishlistIcon />}
                        variant="unstyled"
                        {...styles.iconButton}
                        onClick={() => {
                            console.log('icon click')
                            onFavouriteToggle(!isFavourite)
                        }}
                    />
                )}
            </Box>

            {/* Title */}
            <Text {...styles.title} aria-label="product name">
                {productName}
            </Text>

            {/* Price */}
            <Text {...styles.price} aria-label="price">
                {intl.formatNumber(price, {style: 'currency', currency})}
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
    productSearchItem: PropTypes.object.isRequired,
    /**
     * Types of lists the product/variant is added to. (eg: wishlist)
     */
    isInWishlist: PropTypes.bool,
    /**
     * Callback function to be invoked when the user add item to wishlist
     */
    onAddToWishlistClick: PropTypes.func,
    /**
     * Callback function to be invoked when the user removes item to wishlist
     */
    onRemoveWishlistClick: PropTypes.func,
    isWishlistLoading: PropTypes.bool
}

export default ProductTile
