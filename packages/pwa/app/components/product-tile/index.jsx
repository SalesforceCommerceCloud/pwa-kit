/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import {WishlistIcon, WishlistSolidIcon} from '../icons'

// Components
import {
    AspectRatio,
    Box,
    Img,
    Image,
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
import {isServer, noop} from '../../utils/utils'
import Link from '../link'
import withRegistration from '../../hoc/with-registration'
import {customerProductListTypes} from '../../constants'

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

    const styles = useMultiStyleConfig('ProductTile')
    // eslint-disable-next-line react/prop-types
    const {
        productSearchItem,
        // eslint-disable-next-line react/prop-types
        staticContext,
        onWishlistItemToggled = noop,
        existsInListTypes = {},
        ...rest
    } = props
    const {currency, image, price, productName, productId} = productSearchItem
    const isProductInWishlist = existsInListTypes[customerProductListTypes.WISHLIST]?.includes(
        productId
    )

    return (
        <Link
            data-testid="product-tile"
            {...styles.container}
            to={productUrlBuilder({id: productSearchItem?.productId}, intl.local)}
            {...rest}
        >
            <Box {...styles.imageWrapper}>
                {/* Server Image */}
                <AspectRatio {...styles.image} ratio={1} display={isServer ? 'block' : 'none'}>
                    <Img alt={image.alt} src={image.disBaseLink} />
                </AspectRatio>
                {/* Client Image */}
                <AspectRatio {...styles.image} ratio={1} display={isServer ? 'none' : 'block'}>
                    <Image alt={image.alt} src={image.disBaseLink} ignoreFallback={true} />
                </AspectRatio>
                {isProductInWishlist ? (
                    <IconButton
                        aria-label={intl.formatMessage({
                            defaultMessage: 'Wishlist'
                        })}
                        icon={<WishlistSolidIcon />}
                        variant="unstyled"
                        {...styles.iconButton}
                        onClick={(e) => {
                            e.preventDefault()
                            onWishlistItemToggled()
                        }}
                    />
                ) : (
                    <IconButtonWithRegistration
                        aria-label={intl.formatMessage({
                            defaultMessage: 'Wishlist'
                        })}
                        icon={<WishlistIcon />}
                        variant="unstyled"
                        {...styles.iconButton}
                        onClick={onWishlistItemToggled}
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
    existsInListTypes: PropTypes.object,
    /**
     * Callback function to be invoked when user toggles item from wishlist
     */
    onWishlistItemToggled: PropTypes.func
}

export default ProductTile
