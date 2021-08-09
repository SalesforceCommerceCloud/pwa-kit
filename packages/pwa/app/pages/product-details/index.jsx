import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import Helmet from 'react-helmet'

import Breadcrumbs from 'progressive-web-sdk/dist/components/breadcrumbs'
import Button from 'progressive-web-sdk/dist/components/button'
import Carousel from 'progressive-web-sdk/dist/components/carousel'
import CarouselItem from 'progressive-web-sdk/dist/components/carousel/carousel-item'
import {
    HeaderBar,
    HeaderBarActions,
    HeaderBarTitle
} from 'progressive-web-sdk/dist/components/header-bar'
import Image from 'progressive-web-sdk/dist/components/image'
import Link from 'progressive-web-sdk/dist/components/link'
import ListTile from 'progressive-web-sdk/dist/components/list-tile'
import Price from 'progressive-web-sdk/dist/components/price'
import Ratio from 'progressive-web-sdk/dist/components/ratio'
import Sheet from 'progressive-web-sdk/dist/components/sheet'
import SkeletonBlock from 'progressive-web-sdk/dist/components/skeleton-block'
import {Swatch, SwatchItem} from 'progressive-web-sdk/dist/components/swatch'

import EmailSubscribe from '../../components/email-subscribe'
import {Mobile, Tablet, Desktop} from '../../components/media-queries'

import {parseProduct, getCarouselImages} from './helpers'

import {getAnalyticsManager} from '../../analytics'

const analyticsManager = getAnalyticsManager()

const imgProps = {
    className: 'u-display-block',
    hidePlaceholder: true,
    ratio: {aspect: '1:1'},
    loadingIndicator: <SkeletonBlock height="100%" />,
    useLoaderDuringTransitions: false
}

const ADD_TO_CART_FORM_NAME = 'product-add-to-cart'

const VariationPropertySwatchGroup = ({
    variationProperties = [],
    selectedVariationPropertyValue,
    label,
    error,
    id,
    onChange = () => {}
}) => {
    const selectedProperty = variationProperties.find(
        ({value}) => value === selectedVariationPropertyValue
    )
    const selectedPropertyName = selectedProperty ? selectedProperty.name : ''

    const swatchClasses = classNames({
        'pw-swatch__error': error && !selectedVariationPropertyValue
    })

    return (
        <Swatch
            className={swatchClasses}
            label={`${label}: ${selectedPropertyName}`}
            onChange={(selectedVariationPropertyValue) => {
                onChange(id, selectedVariationPropertyValue)
            }}
            value={selectedVariationPropertyValue}
        >
            {variationProperties.map(({name, value, swatches, orderable}) => {
                const swatchStyle = {
                    backgroundImage: swatches ? `url(${swatches[0].src})` : ''
                }

                return (
                    <SwatchItem
                        className="t-product-details__swatch"
                        key={value}
                        value={value}
                        disabled={!orderable}
                        analyticsName={id}
                        analyticsContent={value}
                    >
                        {swatches ? (
                            <span
                                className="t-product-details__swatch-background"
                                style={swatchStyle}
                            >
                                <span className="u-visually-hidden">{name}</span>
                            </span>
                        ) : (
                            name
                        )}
                    </SwatchItem>
                )
            })}
        </Swatch>
    )
}

VariationPropertySwatchGroup.propTypes = {
    variationProperties: PropTypes.array,
    selectedVariationPropertyValue: PropTypes.string,
    label: PropTypes.string,
    error: PropTypes.string,
    id: PropTypes.string,
    onChange: PropTypes.func
}

class ProductDetails extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            isShippingSheetOpen: false,
            isSubscribed: false,
            variationValues: {}
        }
    }

    static getTemplateName() {
        return 'exampleProductDetails'
    }

    static shouldGetProps({previousParams, params}) {
        return !previousParams || previousParams.productId !== params.productId
    }

    static async getProps({params, connector}) {
        const product = await connector.getProduct(params.productId)
        return {product: parseProduct(product)}
    }

    toggleShippingSheet() {
        this.setState({isShippingSheetOpen: !this.state.isShippingSheetOpen})
    }

    render() {
        const {errorMessage} = this.props
        let product = this.props.product

        const {name, price, variationProperties} = product || {}

        const breadcrumb = [
            {
                text: 'Home',
                href: '/'
            },
            {
                text: product ? product.name : ''
            }
        ]

        const carouselImages = product ? getCarouselImages(product, this.state.variationValues) : []
        const showErrorMessage = !product && errorMessage // Only show the error message if there is on, and there is no product

        const ShippingDeliveryModal = ({width}) => (
            <Sheet
                className="pw--no-shadow t-product-details__shipping-delivery-info-modal"
                coverage={width}
                open={this.state.isShippingSheetOpen}
                effect="modal-center"
                shrinkToContent
                headerContent={
                    <HeaderBar>
                        <HeaderBarTitle className="u-flex u-padding-start-md u-text-align-start u-text-size-big">
                            Shipping & Delivery Info
                        </HeaderBarTitle>

                        <HeaderBarActions>
                            <Button
                                innerClassName="u-padding-0"
                                icon="close"
                                onClick={this.toggleShippingSheet.bind(this)}
                            />
                        </HeaderBarActions>
                    </HeaderBar>
                }
            >
                <div className="t-product-details__shipping-delivery-modal-content">
                    <span>
                        Receive free Standard Shipping within Canada for purchases of $150+,
                        excluding taxes, when signed into a Mobify.com account.
                    </span>
                </div>
            </Sheet>
        )

        return (
            <div className="t-product-details" itemScope itemType="http://schema.org/Product">
                <Breadcrumbs
                    className="u-margin-top-lg u-margin-bottom-lg"
                    items={breadcrumb}
                    includeMicroData
                />

                {product && (
                    <Helmet>
                        <title>{product.name}</title>
                        <meta name="description" content={product.name} />
                    </Helmet>
                )}

                {showErrorMessage ? (
                    <h2 className="u-margin-top-lg">{errorMessage}</h2>
                ) : (
                    <div className="t-product-details__overview">
                        {/* Images Carousel */}
                        <Carousel
                            previousIcon="chevron-left"
                            nextIcon="chevron-right"
                            iconSize="medium"
                            className="t-product-details__carousel"
                        >
                            {carouselImages.length > 0 ? (
                                carouselImages.map(({src, alt}) => (
                                    <CarouselItem key={src}>
                                        <Image {...imgProps} alt={alt} src={src} itemProp="image" />
                                    </CarouselItem>
                                ))
                            ) : (
                                <CarouselItem>
                                    <Ratio aspect="1:1">
                                        <SkeletonBlock
                                            height="100%"
                                            width="100%"
                                            className="u-padding-md"
                                        />
                                    </Ratio>
                                    <SkeletonBlock height="30px" />
                                </CarouselItem>
                            )}
                        </Carousel>

                        {/* Actions */}
                        <div className="t-product-details__info">
                            {/* Product Name and Price Information */}
                            <div className="u-position-relative u-z-index-1 u-padding-bottom-lg u-margin-bottom">
                                {name ? (
                                    <h1 itemProp="name">{name}</h1>
                                ) : (
                                    <SkeletonBlock width="50%" height="32px" />
                                )}

                                {price ? (
                                    <span className="t-product-details__price">
                                        <Price current={`$${price}`} />
                                    </span>
                                ) : (
                                    <SkeletonBlock width="25%" height="32px" />
                                )}
                            </div>

                            <form id={ADD_TO_CART_FORM_NAME}>
                                {/* Product Variations */}
                                <div className="t-product-details__variations">
                                    {variationProperties &&
                                        variationProperties.length > 0 &&
                                        variationProperties.map(({id, label, values = []}) => (
                                            <div
                                                className="t-product-details__form-field-row"
                                                key={id}
                                            >
                                                <VariationPropertySwatchGroup
                                                    variationProperties={values}
                                                    id={id}
                                                    label={label}
                                                    selectedVariationPropertyValue={
                                                        this.state.variationValues
                                                            ? this.state.variationValues[id]
                                                            : undefined
                                                    }
                                                    onChange={(
                                                        selectedPropertyName,
                                                        selectedPropertyValue
                                                    ) => {
                                                        this.setState({
                                                            variationValues: {
                                                                ...this.state.variationValues,
                                                                [selectedPropertyName]: selectedPropertyValue
                                                            }
                                                        })
                                                    }}
                                                ></VariationPropertySwatchGroup>
                                            </div>
                                        ))}
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Tutorial and Quick Tip Links */}
                <div className="u-margin-top-lg u-margin-bottom-lg">
                    Tips for getting started on this page:
                </div>
                <ListTile className="pw--instructional-block">
                    <div>
                        Replace dummy products with real data using Commerce Integrations.&nbsp;
                        <Link
                            className="pw--underline"
                            openInNewTab
                            href="https://dev.mobify.com/v2.x/apis-and-sdks/commerce-integrations/overview"
                        >
                            Read the guide
                        </Link>
                    </div>
                </ListTile>
                <ListTile className="pw--instructional-block">
                    <div className="u-margin-bottom-lg">Set up a modal with with example:</div>

                    <Button
                        className="t-product-details__modal-button pw--primary qa-modal-button"
                        onClick={this.toggleShippingSheet.bind(this)}
                    >
                        Modal Button
                    </Button>
                </ListTile>

                <ListTile className="pw--instructional-block">
                    <div className="u-margin-bottom-lg">
                        Set up forms like a Join Mailing List section using this example:
                    </div>

                    {!this.state.isSubscribed ? (
                        <EmailSubscribe
                            analyticsManager={analyticsManager}
                            onSubmit={() => {
                                this.setState({isSubscribed: true})
                            }}
                        />
                    ) : (
                        <span>Thank you for subscribing!</span>
                    )}
                </ListTile>

                <div className="u-padding-bottom-lg">
                    View more guides on&nbsp;
                    <Link className="pw--underline" openInNewTab href="https://dev.mobify.com">
                        dev.mobify.com
                    </Link>
                </div>

                {/* Floating element/components */}
                <Mobile>
                    <ShippingDeliveryModal width="80%" />
                </Mobile>

                <Tablet>
                    <ShippingDeliveryModal width="60%" />
                </Tablet>

                <Desktop>
                    <ShippingDeliveryModal width="40%" />
                </Desktop>
            </div>
        )
    }
}

ProductDetails.propTypes = {
    errorMessage: PropTypes.string,
    params: PropTypes.object,
    product: PropTypes.object,
    trackPageLoad: PropTypes.func
}

export default ProductDetails
