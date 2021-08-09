/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

/**
 * This component is used to show current and previous prices.
 * Prices can be displayed in a row or stacked.
 *
 * @example ./DESIGN.md
 */

const Price = ({current, previous, isStacked, className}) => {
    const classes = classNames(
        'pw-price',
        {
            'pw--stack': isStacked
        },
        className
    )
    const currentClass = classNames(`pw-price__current`, {
        'pw--reduced': previous
    })

    return (
        <div className={classes}>
            {current && <div className={currentClass}>{current}</div>}

            {previous && <div className="pw-price__previous">{previous}</div>}
        </div>
    )
}

Price.propTypes = {
    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * The current price.
     */
    current: PropTypes.node,

    /**
     * Defines if prices are stacked.
     */
    isStacked: PropTypes.bool,

    /**
     * The previous price.
     */
    previous: PropTypes.node
}

export default Price
