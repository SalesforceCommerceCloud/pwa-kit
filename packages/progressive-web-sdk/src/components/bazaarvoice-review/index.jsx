/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import bazaarvoiceWrapper from '../bazaarvoice-wrapper'

/**
 * This component makes it easier to integrate Bazaarvoice reviews into your PWA.
 *  This component allows you to render the reviews for a product based on a product ID.
 */

class BazaarvoiceReview extends React.Component {
    componentDidMount() {
        const {apiVersion, productId} = this.props

        if (apiVersion === '1') {
            this.apiVersionOneLoadReviews(productId)
        }
    }

    apiVersionOneLoadReviews(productId) {
        const $BV = window.$BV

        // We can't really test that a function that doesn't exist wasn't called
        /* istanbul ignore else */
        if ($BV) {
            $BV.ui('rr', 'show_reviews', {
                productId
            })
        }
    }

    render() {
        const {apiVersion, className, containerId, productId} = this.props

        const classes = classNames('pw-bazaarvoice-review', className)

        return (
            <div className={classes}>
                {apiVersion === '1' && <div id={containerId} />}
                {apiVersion === '2' && (
                    <div data-bv-show="reviews" data-bv-product-id={productId} />
                )}
            </div>
        )
    }
}

BazaarvoiceReview.defaultProps = {
    apiVersion: '1',
    containerId: 'BVRRContainer'
}

BazaarvoiceReview.propTypes = {
    /**
     * The src for the Bazaarvoice API script
     */
    apiSrc: PropTypes.string.isRequired,

    /**
     * The product ID the reviews should be shown for
     */
    productId: PropTypes.string.isRequired,

    /**
     * Version of the BazaarVoice API defaults to '1'
     */
    apiVersion: PropTypes.string,

    /**
     * Adds values to the `class` attribute of the root element
     */
    className: PropTypes.string,

    /**
     * This id is added to the element Bazaarvoice should render the
     * review content in. The containerId will only be used for version 1 of the BazaarVoice API.
     */
    containerId: PropTypes.string
}

export default bazaarvoiceWrapper(BazaarvoiceReview)
