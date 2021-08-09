/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

/**
 * A badge is a simple, circular element used to display small amounts of
 * important information, such as the number of items in a cart.
 *
 * @example ./DESIGN.md
 */

const Badge = ({className, title, children}) => {
    const classes = classNames('pw-badge', className)

    return (
        <div className={classes}>
            <span aria-hidden="true">{children}</span>

            {title && <span className="u-visually-hidden">{title}</span>}
        </div>
    )
}

Badge.propTypes = {
    /**
     * The title provides text for user agents like screen readers.
     */
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,

    /**
     * Any children to be nested within this Badge. **WARNING!** This is
     * intentionally hidden from screen readers! Use the `title` to provide
     * meaningful text instead.
     */
    children: PropTypes.node,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string
}

export default Badge
