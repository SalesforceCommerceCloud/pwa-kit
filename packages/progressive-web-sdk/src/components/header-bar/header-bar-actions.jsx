/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

/**
 * Related components:
 *
 * * [HeaderBar](#!/HeaderBar)
 * * [HeaderBarTitle](#!/HeaderBarTitle)
 *
 * This contains the actions in `HeaderBar` (menu, search, etc).
 * It gives developers the flexibility of adding other components as its content.
 * Common components used inside `HeaderBarActions` are `Button` and `Icon`.
 *
 * @example ./DESIGN.md
 */

const HeaderBarActions = ({children, className}) => {
    const classes = classNames('pw-header-bar__actions', className)

    return <div className={classes}>{children}</div>
}

HeaderBarActions.propTypes = {
    /**
     * The contents of the header bar.
     */
    children: PropTypes.node.isRequired,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string
}

export default HeaderBarActions
