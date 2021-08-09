/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import ListTile from '../list-tile'

/**
 * Related components:
 *
 * * [Nav](#!/Nav)
 * * [NavHeader](#!/NavHeader)
 * * [NavItem](#!/NavItem)
 * * [NavMenu](#!/NavMenu)
 * * [NavSlider](#!/NavSlider)
 *
 * By itself, the `NavItem` renders a simple block link that is meant for use
 * in other components. In fact, it is the default component used when the
 * `NavMenu` component renders its list of navigation items.
 *
 * @example ./DESIGN.md
 */

const NavItem = (props) => {
    const {
        navigate,
        selected,
        title,
        className,
        childIcon,
        beforeContent: beforeContentProp,
        content: contentProp,
        hasChild,
        href
    } = props

    const onClick = (e) => {
        e.preventDefault()
        navigate()
    }

    const before = beforeContentProp
    const content = contentProp || title
    const after = hasChild ? childIcon : null
    const classes = classNames(
        'pw-nav-item',
        {
            'pw--has-child': hasChild,
            'pw--selected': selected
        },
        className
    )

    return (
        <div>
            <ListTile
                className={classes}
                onClick={onClick}
                href={href}
                startAction={before}
                endAction={after}
                includeEndActionInPrimary
            >
                {content}
            </ListTile>
        </div>
    )
}

NavItem.defaultProps = {
    navigate: /* istanbul ignore next */ () => null,
    childIcon: '>'
}

NavItem.propTypes = {
    /**
     * Content to go before the main label on the nav item.
     */
    beforeContent: PropTypes.node,

    /**
     * Override the default icon for the has-child indicator.
     */
    childIcon: PropTypes.node,

    /**
     * Extra classes for the element.
     */
    className: PropTypes.string,

    /**
     * Override the main label content on the nav item (default is its title).
     */
    content: PropTypes.node,

    /**
     * Indicates whether the item has children.
     */
    hasChild: PropTypes.bool,

    /**
     * If provided, element will render as a link.
     */
    href: PropTypes.string,

    /**
     * PROVIDED INTERNALLY. A callback that is intended to invoke a parent `Nav`
     * component's `onPathChange` (user defined) callback. It can be
     * thought of as an event emitter listened to by the `Nav` component.
     *
     * By itself, `navigate()` does nothing. It is up to the user to
     * define and pass in an `onPathChange` callback to `Nav` that determines
     * what happens when a `MegaMenuItem` is clicked.
     */
    navigate: PropTypes.func,

    /**
     * PROVIDED INTERNALLY. Indicates whether the item is currently selected.
     */
    selected: PropTypes.bool,

    /**
     * The title of the navigation item.
     */
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
}

export default NavItem
