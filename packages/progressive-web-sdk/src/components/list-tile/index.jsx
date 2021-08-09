/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'
import ListTilePrimary from './partials/list-tile-primary'

/**
 * The `ListTile` component is a container to display text or/and links.
 * ListTile can have actions that can be displayed before or/and after the text.
 * Commonly used in the `List` component
 *
 * @example ./DESIGN.md
 */

class ListTile extends React.PureComponent {
    render() {
        const {
            className,
            startAction,
            endAction,
            children,
            href,
            includeEndActionInPrimary,
            tabIndex,
            onBlur,
            onClick,
            onFocus,
            onMouseEnter,
            onMouseLeave
        } = this.props

        const classes = classNames(
            'pw-list-tile',
            {
                'pw--is-anchor': !!href
            },
            className
        )

        return (
            <div className={classes}>
                <ListTilePrimary
                    href={href}
                    onBlur={onBlur}
                    onClick={onClick}
                    onFocus={onFocus}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    tabIndex={tabIndex}
                >
                    {startAction && <div className="pw-list-tile__action">{startAction}</div>}

                    <div className="pw-list-tile__content">{children}</div>

                    {includeEndActionInPrimary && endAction && (
                        <div className="pw-list-tile__action">{endAction}</div>
                    )}
                </ListTilePrimary>

                {!includeEndActionInPrimary && endAction && (
                    <div className="pw-list-tile__action">{endAction}</div>
                )}
            </div>
        )
    }
}

ListTile.defaultProps = {
    includeEndActionInPrimary: true
}

ListTile.propTypes = {
    /**
     * The content that should be rendered within the ListTile primary
     * section, excluding the action.
     */
    children: PropTypes.node,

    /**
     * Adds values to the `class` attribute of the root element
     */
    className: PropTypes.string,

    /**
     * The content that appears at the end of the list tile.
     * Can be a supplementary action
     */
    endAction: PropTypes.node,

    /**
     * If provided, the primary part of the ListTile will be rendered
     * as a Link to this URL.
     */
    href: PropTypes.string,

    /**
     * Indicates if the endAction should be included inside the primary part.
     * If true, clicking endAction will perform the same action as the primary content
     */
    includeEndActionInPrimary: PropTypes.bool,

    /**
     * The content that appears at the start of the list tile. Generally supplementary icon or text
     */
    startAction: PropTypes.node,

    /**
     * PROVIDED INTERNALLY: The tabIndex value for this component
     */
    tabIndex: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),

    /**
     * User-defined method for hooking into blur events. Use with
     * onMouseLeave as a keyboard substitute for hover events.
     */
    onBlur: PropTypes.func,

    /**
     * Callback for when the primary is clicked. Not called if an href is passed.
     */
    onClick: PropTypes.func,

    /**
     * User-defined method for hooking into focus events. Use with
     * onMouseEnter as a keyboard substitute for hover events.
     */
    onFocus: PropTypes.func,

    /**
     * User-defined method for hooking into mouseEnter events. Use with the onFocus prop for keyboard a11y purposes.
     */
    onMouseEnter: PropTypes.func,

    /**
     * User-defined method for hooking into mouseLeave events. Use with the onBlur prop for keyboard a11y purposes.
     */
    onMouseLeave: PropTypes.func
}

export default ListTile
