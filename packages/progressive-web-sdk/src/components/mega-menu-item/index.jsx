/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import ListTile from '../list-tile'
import {noop} from '../../utils/utils'
import Nav from '../nav'

const getClosestMegaMenuElement = (target) => {
    let currentEl = target

    while (currentEl) {
        if (currentEl.className.indexOf('pw-mega-menu-item') >= 0) {
            // This breaks out of the while loop, returning the current element
            // we received in previous iteration of the loop.
            return currentEl
        }

        // There's no match, so keep the loop going by replacing currentEl with
        // the current element's parent element. Eventually we'll either hit
        // a match, or run ot of elements to traverse.
        currentEl = currentEl.parentElement
    }

    // No matches found!
    return null
}

/**
 * Related components:
 *
 * * [Nav](#!/Nav)
 * * [MegaMenu](#!/MegaMenu)
 *
 * By itself, the `MegaMenuItem` renders a simple block link (and possible an
 * additional block of children links) that is meant for use in other
 * components. In fact, it is the default component used when the `MegaMenu`
 * component renders its list of navigation items.
 *
 * This component may seem similar to the [`NavItem`](/#!/NavItem) component used in `NavMenu`.
 * However, this `MegaMenuItem` component is different in two important ways:
 *
 * 1. `MegaMenuItem` can have `content` as well as nested children.
 * 2. `MegaMenuItem` tracks its active state in its internal state, rather than
 *    with props. The active state is triggered by mouse hovers, touch taps, or
 *    keyboard focus.
 */

class MegaMenuItem extends React.PureComponent {
    constructor(props) {
        super(props)

        // There are onTouchEnd events that we only want to trigger when we
        // are not dragging. This is used to detect when the user is dragging
        this.dragging = false

        // `this.wrapper` represents the current component instance's outter
        // most container. The _handleBlur function needs it while tracking of
        // its blur target, without being overridden by the targets of other
        // blur events
        this.wrapper = null

        this._activate = this._activate.bind(this)
        this._deactivate = this._deactivate.bind(this)

        // Event Handlers
        this._handleMouseEnter = this._handleMouseEnter.bind(this)
        this._handleMouseLeave = this._handleMouseLeave.bind(this)
        this._handleTouchMove = this._handleTouchMove.bind(this)
        this._handleTouchEnd = this._handleTouchEnd.bind(this)
        this._handleFocus = this._handleFocus.bind(this)
        this._handleBlur = this._handleBlur.bind(this)
    }

    // State Change Methods
    // ---

    _activate(trigger) {
        // Only add these touch handlers when menu children are actually
        // active and visible
        window.addEventListener('touchmove', this._handleTouchMove)
        window.addEventListener('touchend', this._handleTouchEnd)

        // Let the `Nav` component know that we're selecting the current item
        this.props.navigate(trigger)
    }

    _deactivate(trigger) {
        window.removeEventListener('touchmove', this._handleTouchMove)
        window.removeEventListener('touchend', this._handleTouchEnd)

        // Let the 'Nav' component know that we're returning to the root of the
        // navigation tree, effectively returning to the original state.
        this.props.navigate(trigger, '/')
    }

    // Event Handler Methods
    // ---

    _handleMouseEnter() {
        this._activate('mouseEnter')
    }

    _handleMouseLeave() {
        this._deactivate('mouseLeave')
    }

    _handleTouchMove() {
        // Set dragging _only_ if we actually trigger touchMove. We use this
        // drag value in onTouchEnd to determine whether it was a tap or
        // drag action.
        this.dragging = true
    }

    _handleTouchEnd(e) {
        if (!this.dragging) {
            const notFocusedOnMegaMenu = !getClosestMegaMenuElement(e.target)
            if (notFocusedOnMegaMenu) {
                this._deactivate('touchEnd')
            }
        }

        this.dragging = false
    }

    _handleFocus(e) {
        e.preventDefault()

        // This `setTimeout()` is necessary in order to guarantee that this runs
        // after any `_handleBlur()` calls. Otherwise, the focus handler would
        // get overridden by the blur handler.
        setTimeout(() => this._activate('focus'), 1)
    }

    _handleBlur(e) {
        this.wrapper = this.wrapper || e.target.closest('.pw-mega-menu-item')

        // This `setTimeout()` is necessary in order to guarantee that this
        // captures the correct post-blur focus target
        setTimeout(() => {
            const newTarget = document.activeElement
            const isTraversing = this.wrapper.contains(newTarget)

            // if we ARE traversing, that means the blur target is INSIDE our
            // current MegaMenuItem component, which means we haven't _really_
            // blurred.
            //
            // if we are NOT traversing, that means the blur taget is OUTSIDE
            // ur currentMegaMenuItem component, which means we ARE actually
            // blurred, for realz.
            if (!isTraversing) {
                this._deactivate('blur')
            }
        }, 1)
    }

    // Main Render Method
    // ---

    render() {
        const {afterContent, beforeContent, children, className, content, depth, href} = this.props

        const isActive = this.props.selected || this.props.hasSelected

        // Convert the depth value into a classnames object
        const sharedClasses = {[`pw--depth-${depth}`]: depth >= 0, 'pw--active': isActive}
        const hasChildren = {'pw--has-children': children && children.length > 0}

        const rootClasses = classNames('pw-mega-menu-item', hasChildren, sharedClasses, className)
        const contentClasses = classNames('pw-mega-menu-item__content', hasChildren, sharedClasses)
        const childrenClasses = classNames('pw-mega-menu-item__children', sharedClasses)

        const onClick = (e) => {
            e.preventDefault()

            /* istanbul ignore else */
            if (!this.dragging) {
                this._activate('click')
            }
        }

        return (
            <div
                aria-level={depth}
                role="listitem"
                className={rootClasses}
                ref={(el) => {
                    this.ref = el
                }}
                onMouseEnter={this._handleMouseEnter}
                onMouseLeave={this._handleMouseLeave}
                onBlur={this._handleBlur}
            >
                <ListTile
                    className={contentClasses}
                    onClick={onClick}
                    onFocus={this._handleFocus}
                    href={href}
                    startAction={beforeContent}
                    tabIndex={depth > 0 ? 0 : -1}
                    endAction={afterContent}
                    includeEndActionInPrimary
                >
                    {content}
                </ListTile>

                {children && (
                    <div
                        role="list"
                        className={childrenClasses}
                        aria-hidden={!isActive}
                        aria-expanded={isActive}
                    >
                        {children}
                    </div>
                )}
            </div>
        )
    }
}

MegaMenuItem.contextTypes = Nav.childContextTypes

MegaMenuItem.defaultProps = {
    navigate: noop
}

MegaMenuItem.propTypes = {
    /**
     * Content to go after the main label on the mega menu item.
     */
    afterContent: PropTypes.node,

    /**
     * Content to go before the main label on the mega menu item.
     */
    beforeContent: PropTypes.node,

    /**
     * A list of `MegaMenuItem` components, or other arbitrary content
     */
    children: PropTypes.node,

    /**
     * Adds values to the `class` attribute of the root element
     */
    className: PropTypes.string,

    /**
     * The value to be inserted into the current mega menu item
     */
    content: PropTypes.node,

    /**
     * PROVIDED INTERNALLY. Indicates the depth this menu item is in the
     * navigation. Adds a class to the item in the format of `pw--depth-${depth}`
     */
    depth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),

    /**
     * PROVIDED INTERNALLY. Indicates whether this item contains a child that is
     * the selected navigation node.
     */
    hasSelected: PropTypes.bool,

    /**
     * If provided, element will render as a link.
     */
    href: PropTypes.string,

    /**
     * PROVIDED INTERNALLY. Indicates whether the item is the tip of a
     * navigation branch. When clicked, a leaf typically navigates the user to a
     * specific `href`.
     */
    isLeaf: PropTypes.bool,

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
     * PROVIDED INTERNALLY. Indicates whether this item is the selected
     * navigation node.
     */
    selected: PropTypes.bool
}

export default MegaMenuItem
