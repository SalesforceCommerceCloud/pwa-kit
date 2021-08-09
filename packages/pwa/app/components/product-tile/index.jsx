/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'

// Components
import {
    AspectRatio,
    Box,
    Img,
    Image,
    Skeleton as ChakraSkeleton,
    Text,
    Stack,
    useMultiStyleConfig
} from '@chakra-ui/react'

// Hooks
import {useIntl} from 'react-intl'

// Other
import {productUrlBuilder} from '../../utils/url'
import {isServer} from '../../utils/utils'
import Link from '../link'

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
        ...rest
    } = props
    const {currency, image, price, productName} = productSearchItem

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
    productSearchItem: PropTypes.object.isRequired
}

export default ProductTile
