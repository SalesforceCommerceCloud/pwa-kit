/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import RatingIcon from './partials/rating-icon'

/**
 * Commonly used to display user satisfaction of products or services.
 */
const Rating = ({className, count, total, name, src}) => {
    const ratingPercentage = (count / total) * 100
    const classes = classNames('pw-rating', className)

    return (
        <div className={classes}>
            <div className="pw-rating__label">
                Rating is {count} out of {total}
            </div>

            <div className="pw-rating__icon-wrapper" role="presentation" aria-hidden="true">
                <div className="pw-rating__filled-icons" style={{width: `${ratingPercentage}%`}}>
                    {Array(total)
                        .fill()
                        .map((item, i) => (
                            <RatingIcon key={i} name={name} src={src} modifierClass="pw--filled" />
                        ))}
                </div>

                {Array(total)
                    .fill()
                    .map((item, i) => (
                        <RatingIcon key={i} name={name} src={src} />
                    ))}
            </div>
        </div>
    )
}

Rating.defaultProps = {
    count: 0,
    total: 5,
    name: 'star'
}

Rating.propTypes = {
    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * The number of filled stars to render (can be a fraction).
     */
    count: PropTypes.number,

    /**
     * Name of the SVG sprite you want to use for the rating star.
     * Not used if the src prop is set.
     */
    name: PropTypes.string,

    /**
     * URL for the image icon to use for the rating star.
     * If not provided, the SVG icon described by the `name` prop is used.
     */
    src: PropTypes.string,

    /**
     * The total number of stars to render.
     */
    total: PropTypes.number
}

export default Rating
