/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import {Link as RouteLink} from 'react-router-dom'

// Components
import {
    AspectRatio,
    Box,
    Img,
    Image,
    Link,
    Skeleton as ChakraSkeleton,
    SkeletonText as ChakraSkeletonText,
    Text,

    // Hooks
    useMultiStyleConfig
} from '@chakra-ui/react'

// Hooks
import {useIntl} from 'react-intl'

// Other
import {productUrlBuilder} from '../../utils/url'
import {isServer} from '../../utils/utils'

// Component Skeleton
export const Skeleton = () => (
    <Box data-testid="sf-product-tile-skeleton">
        <AspectRatio ratio={1}>
            <ChakraSkeleton />
        </AspectRatio>
        <ChakraSkeletonText noOfLines={2} marginTop="4" spacing="4" />
    </Box>
)

/**
 * The ProductTile is a simple visual representation of a product search hit
 * object. It will show it's default image, name and price.
 */
const ProductTile = (props) => {
    const intl = useIntl()
    const styles = useMultiStyleConfig('ProductTile')

    // eslint-disable-next-line react/prop-types
    const {productSearchItem, staticContext, ...rest} = props
    const {currency, image, price, productName} = productSearchItem

    return (
        <Link
            {...styles.container}
            {...rest}
            as={RouteLink}
            to={productUrlBuilder({id: productSearchItem?.productId}, intl.local)}
        >
            {/* Server Image */}
            <AspectRatio {...styles.image} ratio={1} display={isServer ? 'block' : 'none'}>
                <Img alt={image.alt} src={image.disBaseLink} />
            </AspectRatio>

            {/* Client Image */}
            <AspectRatio {...styles.image} ratio={1} display={isServer ? 'none' : 'block'}>
                <Image alt={image.alt} src={image.disBaseLink} ignoreFallback={true} />
            </AspectRatio>

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
    productSearchItem: PropTypes.object.isRequired
}

export default ProductTile
