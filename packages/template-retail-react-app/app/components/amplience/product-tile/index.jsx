import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {HeartIcon, HeartSolidIcon} from '../../icons'
import styled from '@emotion/styled'

// Components
import {
    AspectRatio,
    Box,
    Skeleton as ChakraSkeleton,
    Text,
    Stack,
    useMultiStyleConfig,
    IconButton
} from '@chakra-ui/react'
import DynamicImage from '../../dynamic-image'

// Hooks
import {useIntl} from 'react-intl'

// Other
import {productUrlBuilderAndQuery} from '../../../utils/url'
import Link from '../link'
import withRegistration from '../../../hoc/with-registration'
import {useLocation} from 'react-router-dom'
import DisplayPrice from '../../display-price'

const IconButtonWithRegistration = withRegistration(IconButton)

const Contain = styled(Link)`
    img {
        height: 100%;
    }
    @media (min-width: 961px) and (max-width: 1024px) {
        .ptile-hover-pane {
            font-size: 12px !important;
            margin: 0 4px 4px !important;
        }
    }
    @media (min-width: 769px) and (max-width: 960px) {
        .ptile-hover-pane {
            font-size: 11px !important;
            margin: 0 4px 4px !important;
        }
    }
    @media (min-width: 461px) and (max-width: 769px) {
        .ptile-hover-pane {
            font-size: 11px !important;
            margin: 0 4px 4px !important;
            background: rgba(255, 255, 255, 0.75) !important;
        }
    }
    @media (max-width: 460px) {
        .ptile-hover-pane {
            font-size: 11px !important;
            margin: 0 4px 4px !important;
            background: rgba(255, 255, 255, 0.75) !important;
        }
    }
    &:hover .chakra-aspect-ratio {
        filter: grayscale(70%) !important;
        opacity: 0.8;
    }
    &:hover .ptile-hover-pane {
        background: rgba(255, 255, 255, 0.9) !important;
    }
`

// Component Skeleton
export const Skeleton = () => {
    const styles = useMultiStyleConfig('AmplienceProductTile')
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
 * The AmplienceProductTile is a simple visual representation of a
 * product object. It will show it's default image, name and price.
 * It also supports favourite products, controlled by a heart icon.
 */
const AmplienceProductTile = (props) => {
    const intl = useIntl()
    const {
        product,
        enableFavourite = false,
        isFavourite,
        onFavouriteToggle,
        dynamicImageProps,
        children,
        ...rest
    } = props
    const {image, productId} = product
    // AmplienceProductTile is used by two components, RecommendedProducts and ProductList.
    // RecommendedProducts provides a localized product name as `name` and non-localized product
    // name as `productName`. ProductList provides a localized name as `productName` and does not
    // use the `name` property.
    const localizedProductName = product.name ?? product.productName

    const [isFavouriteLoading, setFavouriteLoading] = useState(false)
    const styles = useMultiStyleConfig('AmplienceProductTile')
    const location = useLocation()

    return (
        <Contain
            data-testid="product-tile"
            {...styles.container}
            to={productUrlBuilderAndQuery({id: productId}, intl.local, location)}
            {...rest}
        >
            {children}
            <Box {...styles.imageWrapper}>
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
                            aria-label={intl.formatMessage({
                                id: 'product_tile.assistive_msg.wishlist',
                                defaultMessage: 'Wishlist'
                            })}
                            icon={isFavourite ? <HeartSolidIcon /> : <HeartIcon />}
                            {...styles.favIcon}
                            disabled={isFavouriteLoading}
                            onClick={async () => {
                                setFavouriteLoading(true)
                                await onFavouriteToggle(!isFavourite)
                                setFavouriteLoading(false)
                            }}
                        />
                    </Box>
                )}
            </Box>

            <div className="ptile-hover-pane" style={{...styles.ptileHoverPane}}>
                {/* Title */}
                <Text {...styles.title}>{localizedProductName}</Text>

                {/* Price */}
                <DisplayPrice product={product} scope="tile" />
            </div>
        </Contain>
    )
}

AmplienceProductTile.displayName = 'AmplienceProductTile'

AmplienceProductTile.propTypes = {
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
        productId: PropTypes.string
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
    dynamicImageProps: PropTypes.object,
    /**
     * Content to inject before card
     */
    children: PropTypes.node
}

export default AmplienceProductTile
