/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

/**
 * Related components:
 *
 * * [HeaderBarActions](#!/HeaderBarActions)
 * * [HeaderBarTitle](#!/HeaderBarTitle)
 *
 * `HeaderBar` is a component that can contain actions (`HeaderBarActions`)
 * and a title (`HeaderBarTitle`)
 *
 * @example ./DESIGN.md
 */
const HeaderBar = ({children, className}) => {
    const classes = classNames('pw-header-bar', className)

    return <div className={classes}>{children}</div>
}

HeaderBar.propTypes = {
    /**
     * The contents of the header bar.
     */
    children: PropTypes.node.isRequired,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string
}

export default HeaderBar
