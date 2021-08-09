/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import Image from '../image'
import Rating from '../rating'

/**
 * `ReviewSummary` component is used to show overall rating and summary.
 * It uses rating and image components.
 *
 * @example ./DESIGN.md
 */

const ReviewSummary = ({className, imageProps, ratingProps, summary, text}) => {
    const classes = classNames('pw-review-summary', className)
    const ratingStarsClasses = classNames(`pw-review-summary__rating-stars`, ratingProps.className)

    // alt is in imageProps
    /* eslint-disable jsx-a11y/img-has-alt */
    return (
        <div className={classes}>
            <div className="pw-review-summary__image">
                <Image {...imageProps} />
            </div>

            <div className="pw-review-summary__rating">
                <div className="pw-review-summary__rating-inner">
                    <Rating {...ratingProps} className={ratingStarsClasses} />

                    <div className="pw-review-summary__rating-info">{summary}</div>
                </div>

                <div className="pw-review-summary__recommended">{text}</div>
            </div>
        </div>
    )
}

ReviewSummary.defaultProps = {
    ratingProps: {
        className: 'pw--solid'
    }
}

ReviewSummary.propTypes = {
    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * The properties for Image.
     */
    imageProps: PropTypes.object,

    /**
     * The properties for Rating.
     */
    ratingProps: PropTypes.object,

    /**
     * Summary of the review that displays the number of given stars over total stars.
     */
    summary: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

    /**
     * Content of the review summary.
     */
    text: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
}

export default ReviewSummary
