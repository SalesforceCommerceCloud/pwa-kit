/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import Link from '../../link'
import {onKeyUpWrapper} from '../../../a11y-utils'

const ListTilePrimary = ({
    children,
    href,
    tabIndex,
    onBlur,
    onClick,
    onFocus,
    onMouseEnter,
    onMouseLeave
}) => {
    const listTileProps = {
        className: 'pw-list-tile__primary',
        tabIndex
    }

    const actionProps = {onBlur, onClick, onFocus, onMouseEnter, onMouseLeave}

    Object.keys(actionProps).forEach((action) => {
        if (actionProps[action] !== undefined) {
            listTileProps[action] = actionProps[action]
        }
    })

    if (href) {
        return (
            <Link href={href} {...listTileProps}>
                {children}
            </Link>
        )
    } else {
        // Disabling the jsx-a11y/no-static-element-interactions rule because
        // there are some cases where we want the this container to behave as a
        // button, but it also contains a button. Nesting buttons inside buttons
        // in not valid markup.
        //
        // @url: https://developer.mozilla.org/en/docs/Web/HTML/Element/button
        /* eslint-disable jsx-a11y/no-static-element-interactions */
        return (
            <div role="button" onKeyUp={onKeyUpWrapper(onClick)} {...listTileProps}>
                {children}
            </div>
        )
        /* eslint-enable jsx-a11y/no-static-element-interactions */
    }
}

ListTilePrimary.defaultProps = {
    tabIndex: 0
}

ListTilePrimary.propTypes = {
    /**
     * PROVIDED INTERNALLY: the contents of the primary part of the ListTile
     */
    children: PropTypes.node,

    /**
     * PROVIDED INTERNALLY: The URL to link to from the primary part
     */
    href: PropTypes.string,

    /**
     * PROVIDED INTERNALLY: The tabIndex value for this component
     */
    tabIndex: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),

    /**
     * PROVIDED INTERNALLY: User-defined method for hooking into onBlur events. Use with
     * onMouseLeave as a keyboard substitute for hover events.
     */
    onBlur: PropTypes.func,

    /**
     * PROVIDED INTERNALLY: A callback for when the primary part is clicked.
     */
    onClick: PropTypes.func,

    /**
     * PROVIDED INTERNALLY: A user-defined method for hooking into focus events.
     * Use with onMouseEnter as a keyboard substitute for hover events.
     */
    onFocus: PropTypes.func,

    /**
     * PROVIDED INTERNALLY: A user-defined method for hooking into onMouseEnter events.
     * Use with the onFocus prop for keyboard a11y purposes.
     */
    onMouseEnter: PropTypes.func,

    /**
     * PROVIDED INTERNALLY: A user-defined method for hooking into onMouseLeave events.
     * Use with the onBlur prop for keyboard a11y purposes.
     */
    onMouseLeave: PropTypes.func
}

export default ListTilePrimary
