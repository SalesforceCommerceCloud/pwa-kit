/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

/**
 * An inline loader component with accessible title for screen readers. Can customize
 * the number of loading dots and animation offset between dots.
 *
 * @example ./DESIGN.md
 */

const InlineLoader = ({animationDelayOffset, className, dotCount, title}) => {
    const classes = classNames('pw-inline-loader', className)

    let animationDelay = 0

    // Generate loading dots
    const loadingDots = []
    for (let i = 0; i < dotCount; i++) {
        loadingDots.push(
            <div
                key={i}
                className={`pw-inline-loader__loading-dot`}
                role="presentation"
                style={{
                    animationDelay: `${animationDelay}s`
                }}
            />
        )

        // Calculate delay offset for next iteration
        animationDelay += animationDelayOffset
    }

    return (
        <div className={classes}>
            <span className="u-visually-hidden">{title}</span>

            {loadingDots}
        </div>
    )
}

InlineLoader.defaultProps = {
    animationDelayOffset: 0.2,
    dotCount: 3,
    title: 'Loading'
}

InlineLoader.propTypes = {
    /**
     * Amount of time before the next loading dot animates in. Time unit is in seconds.
     */
    animationDelayOffset: PropTypes.number,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * The amount of loading dots.
     */
    dotCount: PropTypes.number,

    /**
     * Screen reader text to indicate loading state.
     */
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
}

export default InlineLoader
