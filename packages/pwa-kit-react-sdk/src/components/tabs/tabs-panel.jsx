/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

/**
 * Related component:
 *
 * * [Tabs](#!/Tabs)
 *
 * This component is used inside `Tabs` component as its children.
 *
 * @example ./DESIGN.md
 */

const TabsPanel = ({isActive, children, className}) => {
    const classes = classNames(
        'pw-tabs__panel',
        {
            'pw--is-active': isActive
        },
        className
    )

    const a11y = !isActive && {'aria-hidden': 'true', tabIndex: '-1'}

    return (
        <div className={classes} {...a11y} role="tabpanel">
            {children}
        </div>
    )
}

TabsPanel.defaultProps = {
    isActive: false
}

TabsPanel.propTypes = {
    /**
     * PROVIDED INTERNALLY: Indicates whether this panel is active.
     */
    isActive: PropTypes.bool.isRequired,

    /**
     * The contents of this panel.
     */
    children: PropTypes.node,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string
}

export default TabsPanel
