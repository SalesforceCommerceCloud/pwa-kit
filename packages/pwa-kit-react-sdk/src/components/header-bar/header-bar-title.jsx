/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import Link from '../link'

/**
 * Related components:
 *
 * * [HeaderBarActions](#!/HeaderBarActions)
 * * [HeaderBar](#!/HeaderBar)
 *
 * This contains the title in `HeaderBar`. It can render as plain text or link.
 * It gives developers the flexibility of adding other components as its content.
 *
 * @example ./DESIGN.md
 */

const HeaderBarTitle = ({href, children, className}) => {
    const classes = classNames('pw-header-bar__title', className)

    if (href) {
        return (
            <Link href={href} className={classes}>
                {children}
            </Link>
        )
    } else {
        return <div className={classes}>{children}</div>
    }
}

HeaderBarTitle.propTypes = {
    /**
     * The contents of the header bar.
     */
    children: PropTypes.node.isRequired,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * If provided, the title will be wrapped in a link.
     */
    href: PropTypes.string
}

export default HeaderBarTitle
