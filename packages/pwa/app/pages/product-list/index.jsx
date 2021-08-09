/* eslint-disable import/namespace */
/* eslint-disable import/named */
import React, {Fragment} from 'react'
import {connect} from 'react-redux'
import {createPropsSelector} from 'reselect-immutable-helpers'
import MediaQuery from 'react-responsive'
import PropTypes from 'prop-types'
import stringify from 'fast-json-stable-stringify'
import Helmet from 'react-helmet'

import * as actions from './actions'
import * as selectors from './selectors'
import {trackPageLoad} from '../../page-actions'
import {getBreakpoints} from 'progressive-web-sdk/dist/utils/universal-utils'
import {VIEWPORT_SIZE_NAMES as sizes} from 'progressive-web-sdk/dist/ssr/constants'

import Breadcrumbs from 'progressive-web-sdk/dist/components/breadcrumbs'
import Divider from 'progressive-web-sdk/dist/components/divider'
import Link from 'progressive-web-sdk/dist/components/link'
import ListTile from 'progressive-web-sdk/dist/components/list-tile'
import Tile from 'progressive-web-sdk/dist/components/tile'
import SkeletonBlock from 'progressive-web-sdk/dist/components/skeleton-block'
import SkeletonText from 'progressive-web-sdk/dist/components/skeleton-text'

const breakpoints = getBreakpoints()
const PRODUCT_SKELETON_COUNT = 6

class ProductList extends React.Component {
    constructor(props) {
        super(props)
        this.pageType = 'productList'
    }

    componentDidMount() {
        this.fetch(undefined, this.queryFromProps(this.props))
    }

    componentDidUpdate(previousProps) {
        const previousQuery = this.queryFromProps(previousProps)
        const query = this.queryFromProps(this.props)
        this.fetch(previousQuery, query)
    }

    fetch(previousQuery, currentQuery) {
        const {trackPageLoad, initialize} = this.props
        if (stringify(previousQuery) !== stringify(currentQuery)) {
            trackPageLoad(initialize(currentQuery), this.pageType, (result) => {
                const responseOpts = {statusCode: result.statusCode}
                if (responseOpts.statusCode === 200) {
                    responseOpts.headers = {
                        'Cache-Control': 'max-age=0, s-maxage=3600'
                    }
                }
                return responseOpts
            })
        }
    }

    /**
     * Derive the search query and lookup key from the URL.
     */
    queryFromProps(props) {
        if (props === null) {
            return {}
        } else {
            const {categoryId} = props.params || {}
            return {filters: {categoryId}, query: ''}
        }
    }

    render() {
        const {breadcrumb, category, errorMessage, productSearch} = this.props

        const productPriceState = (price) => {
            return price % 1 === 0 ? (price = `$${price}.00`) : `$${price}`
        }

        const contentsLoaded = !!productSearch

        return (
            <div className="t-product-list">
                <Breadcrumbs
                    className="u-margin-top-lg u-margin-bottom-lg"
                    items={breadcrumb}
                    includeMicroData
                />
                {category ? (
                    <Fragment>
                        <h1 className="u-margin-bottom-lg">{category.name}</h1>
                        <Helmet>
                            {/* PLACE META DATA INFORMATION HERE */}
                            <meta name="description" content={category.description} />
                        </Helmet>
                    </Fragment>
                ) : (
                    <SkeletonText type="h1" width="50%" />
                )}
                <MediaQuery minWidth={breakpoints[sizes.LARGE]}>
                    <Divider className="u-margin-bottom-md" />
                </MediaQuery>
                <div className="t-product-list__container">
                    {errorMessage && (
                        <h1 className="u-margin-top-lg u-margin-center t-product-list__error-msg">
                            {errorMessage}
                        </h1>
                    )}
                    <div className="t-product-list__container-items">
                        {contentsLoaded ? (
                            <Fragment>
                                {productSearch.results.length > 0 &&
                                    productSearch.results.map((productSearchResult) => (
                                        <div
                                            className="t-product-list__products-items"
                                            key={productSearchResult.productId}
                                        >
                                            <Tile
                                                isColumn
                                                imageProps={{
                                                    src: productSearchResult.defaultImage.src,
                                                    alt: productSearchResult.defaultImage.alt,
                                                    width: '250px',
                                                    ratio: {
                                                        aspect: '1:1'
                                                    },
                                                    loadingIndicator: (
                                                        <SkeletonBlock height="250px" />
                                                    ),
                                                    hidePlaceholder: false,
                                                    className: 'u-display-block',
                                                    useLoaderDuringTransitions: false
                                                }}
                                                title={productSearchResult.productName}
                                                price={productPriceState(productSearchResult.price)}
                                                href={`/products/${productSearchResult.productId}`}
                                                className="t-product-list__tile"
                                            />
                                            {/* PLACE META DATA INFORMATION HERE */}
                                            {/* Examples are "url", "availability", "productId" etc. */}
                                            <meta
                                                itemProp="productID"
                                                content={productSearchResult.productId}
                                            />
                                            <meta
                                                itemProp="url"
                                                content={`/products/${productSearchResult.productId}`}
                                            />
                                        </div>
                                    ))}
                                {productSearch.results.length <= 0 && (
                                    <h2 className="u-margin-top-lg">No results found.</h2>
                                )}
                            </Fragment>
                        ) : (
                            <Fragment>
                                {[...new Array(PRODUCT_SKELETON_COUNT)].map((_, idx) => (
                                    <div key={idx} className="t-product-list__products-items">
                                        <SkeletonBlock height="300px" />
                                    </div>
                                ))}
                            </Fragment>
                        )}
                    </div>
                    <div className="u-margin-top-lg u-margin-bottom-lg">
                        Tips for getting started on this page:
                    </div>
                    <ListTile className="pw--instructional-block">
                        <div>
                            Replace dummy products with real data using Commerce Integrations.&nbsp;
                            <Link
                                className="pw--underline"
                                openInNewTab
                                href="https://dev.mobify.com/v1.x/apis-and-sdks/commerce-integrations/overview"
                            >
                                Read the guide
                            </Link>
                        </div>
                    </ListTile>
                    <div className="u-margin-bottom-lg">
                        View more guides on&nbsp;
                        <Link
                            className="pw--underline"
                            openInNewTab
                            href="https://dev.mobify.com/v1.x/how-to-guides"
                        >
                            dev.mobify.com
                        </Link>
                    </div>
                </div>
            </div>
        )
    }
}

ProductList.propTypes = {
    breadcrumb: PropTypes.array,
    category: PropTypes.object,
    errorMessage: PropTypes.string,
    initialize: PropTypes.func,
    productSearch: PropTypes.object,
    trackPageLoad: PropTypes.func
}

const mapStateToProps = createPropsSelector({
    breadcrumb: selectors.getCategoryBreadcrumb,
    category: selectors.getCategory,
    errorMessage: selectors.getErrorMessage,
    productSearch: selectors.getProductSearch
})

const mapDispatchToProps = {
    initialize: actions.initialize,
    trackPageLoad
}

export {ProductList as UnconnectedProductList}
export default connect(mapStateToProps, mapDispatchToProps)(ProductList)
