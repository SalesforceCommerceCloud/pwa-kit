/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import Rating from '../rating'

/**
 * `Review` component is used to show title, author's info and descripton.
 * It also uses rating component to display user's satisfaction.
 *
 * @example ./DESIGN.md
 */

const Review = ({text, className, ratingProps, info, title}) => {
    const classes = classNames('pw-review', className)
    const ratingClasses = classNames(`pw-review__rating`, ratingProps.className)

    return (
        <article className={classes}>
            <header className="pw-review__header">
                <h1 className="pw-review__heading">{title}</h1>

                <Rating {...ratingProps} className={ratingClasses} />
            </header>

            {info && (
                <div className="pw-review__author">
                    {info.map((info, idx) => (
                        <p className="pw-review__author-info" key={idx}>
                            {info}
                        </p>
                    ))}
                </div>
            )}

            <p className="pw-review__content">{text}</p>
        </article>
    )
}

Review.defaultProps = {
    ratingProps: {
        className: 'pw--solid'
    }
}

Review.propTypes = {
    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * An array of information related to the author.
     */
    info: PropTypes.array,

    /**
     * The properties for Rating.
     */
    ratingProps: PropTypes.object,

    /**
     * Content of the review.
     */
    text: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

    /**
     * Title of the review.
     */
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
}

export default Review
