/* eslint-disable import/namespace */
/* eslint-disable import/named */
import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import Helmet from 'react-helmet'
import {Desktop} from '../../components/media-queries'

import Breadcrumbs from 'progressive-web-sdk/dist/components/breadcrumbs'
import Divider from 'progressive-web-sdk/dist/components/divider'
import Link from 'progressive-web-sdk/dist/components/link'
import ListTile from 'progressive-web-sdk/dist/components/list-tile'
import Tile from 'progressive-web-sdk/dist/components/tile'
import SkeletonBlock from 'progressive-web-sdk/dist/components/skeleton-block'
import SkeletonText from 'progressive-web-sdk/dist/components/skeleton-text'

const PRODUCT_SKELETON_COUNT = 6

const ProductList = (props) => {
    const {errorMessage, productSearch, category} = props

    const getBreadcrumbs = (category) => {
        const breadcrumb = [{text: 'Home', href: '/'}]
        if (category) breadcrumb.push({text: category['name']})
        return breadcrumb
    }

    const formatPrice = (price) => {
        return price % 1 === 0 ? (price = `$${price}.00`) : `$${price}`
    }

    return (
        <div className="t-product-list">
            <Breadcrumbs
                className="u-margin-top-lg u-margin-bottom-lg"
                items={getBreadcrumbs(category)}
                includeMicroData
            />
            {productSearch && (
                <Helmet>
                    <title>{`${productSearch.results.length} results for "${productSearch.query}"`}</title>
                    <meta name="keywords" content={productSearch.query} />
                    <meta
                        name="description"
                        content={productSearch.query || 'Default page description.'}
                    />
                </Helmet>
            )}
            {category ? (
                <Fragment>
                    <h1 className="u-margin-bottom-lg">{category.name}</h1>
                </Fragment>
            ) : (
                <SkeletonText type="h1" width="50%" />
            )}
            <Desktop>
                <Divider className="u-margin-bottom-md" />
            </Desktop>
            <div className="t-product-list__container">
                {errorMessage && (
                    <h1 className="u-margin-top-lg u-margin-center t-product-list__error-msg">
                        {errorMessage}
                    </h1>
                )}
                <div className="t-product-list__container-items">
                    {productSearch ? (
                        <Fragment>
                            {productSearch.results.length > 0 &&
                                productSearch.results.map((productSearchResult) => (
                                    <div
                                        className="t-product-list__products-items"
                                        key={productSearchResult.productId}
                                    >
                                        <Link href={`/products/${productSearchResult.productId}`}>
                                            <Tile
                                                isColumn
                                                imageProps={{
                                                    src: productSearchResult.defaultImage.src,
                                                    alt: productSearchResult.defaultImage.alt,
                                                    width: '250',
                                                    ratio: {
                                                        aspect: '1:1'
                                                    },
                                                    loadingIndicator: (
                                                        <SkeletonBlock height="250" />
                                                    ),
                                                    hidePlaceholder: false,
                                                    className: 'u-display-block',
                                                    useLoaderDuringTransitions: false
                                                }}
                                                title={productSearchResult.productName}
                                                price={formatPrice(productSearchResult.price)}
                                            />
                                        </Link>
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
                            href="https://dev.mobify.com/v2.x/apis-and-sdks/commerce-integrations/overview"
                        >
                            Read the guide
                        </Link>
                    </div>
                </ListTile>
                <div className="u-margin-bottom-lg">
                    View more guides on&nbsp;
                    <Link className="pw--underline" openInNewTab href="https://dev.mobify.com">
                        dev.mobify.com
                    </Link>
                </div>
            </div>
        </div>
    )
}

ProductList.getTemplateName = () => {
    return 'product-list'
}

ProductList.shouldGetProps = ({previousParams, params}) => {
    return !previousParams || previousParams.categoryId !== params.categoryId
}

ProductList.getProps = async ({params, connector}) => {
    const {categoryId} = params
    const [category, productSearch] = await Promise.all([
        connector.getCategory(categoryId),
        connector.searchProducts({
            filters: {
                categoryId
            },
            query: ''
        })
    ])
    return {category, productSearch}
}

ProductList.propTypes = {
    errorMessage: PropTypes.string,
    productSearch: PropTypes.object,
    category: PropTypes.object,
    match: PropTypes.object
}

export default ProductList
