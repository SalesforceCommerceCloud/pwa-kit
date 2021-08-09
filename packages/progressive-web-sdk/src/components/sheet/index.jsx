/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import TransitionGroup from 'react-transition-group/TransitionGroup'
import SheetContent from './sheet-content'
import {percentage} from '../../utils/prop-types'

const noop = () => undefined

const TRANSITION_GROUP_STYLE = {
    zIndex: 1000,
    position: 'fixed',
    top: 0,
    left: 0,
    // In certain circumstances (see https://github.com/mobify/progressive-web-sdk/pull/1187)
    // we found that the sheet didn't render correctly
    // To fix this, we want to push it onto a new compositing layer
    // Setting willChange pushes it onto the new layer
    willChange: 'transform',
    // Setting the width and height allows the sheet to render inside this new layer
    width: '100%',
    height: '100%',
    // This element is always visible, and it will cover the entire viewport
    // so, disable pointer events on it
    pointerEvents: 'none'
}

/**
 * Sheets are modal containers that animate into view from one side of the screen
 * to reveal more content. Typically, sheets are only displayed as a result of
 * user initiated action, and persist until dismissed. Common uses for sheet
 * include, but not limited to, dialog modals and sidebar navigations.
 *
 * @example ./DESIGN.md
 */
class Sheet extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            portalEl: null
        }
    }

    componentDidMount() {
        const {portalId} = this.props

        this.setState({
            portalEl:
                portalId && typeof document !== 'undefined'
                    ? document.getElementById(portalId)
                    : null
        })
    }

    render() {
        const {portalEl} = this.state
        const {open, prerender, children, className} = this.props

        const wrapper = (
            <div className="pw-sheet__outer-wrapper">
                <TransitionGroup component="div" style={TRANSITION_GROUP_STYLE}>
                    {open ? <SheetContent {...this.props} /> : null}
                </TransitionGroup>

                {!open && prerender && (
                    <div
                        className={`pw-sheet__prerendered-children u-visually-hidden ${className}`}
                        aria-hidden="true"
                    >
                        {children}
                    </div>
                )}
            </div>
        )

        return portalEl ? ReactDOM.createPortal([wrapper], portalEl) : wrapper
    }
}

Sheet.propTypes = {
    /**
     * User-defined content of the sheet, can be a combination of markup and/or
     * React components.
     */
    children: PropTypes.node,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * Coverage defines the amount of the current viewport taken up by the
     * sheet content.
     */
    coverage: percentage,

    /**
     * Duration will define the time the animation takes to complete.
     */
    duration: PropTypes.number,

    /**
     * Easing function for the animation as a string whose value
     * can be anything the [CSS `transition-timing-function`](https://developer.mozilla.org/en/docs/Web/CSS/transition-timing-function)
     * can take in.
     */
    easing: PropTypes.string,

    /**
     * Type will define the entry point of the sheet. See below for details.
     */
    effect: PropTypes.oneOf([
        'slide-top',
        'slide-right',
        'slide-bottom',
        'slide-left',
        'modal-center'
    ]),

    /**
     * User-defined footer of the sheet.
     */
    footerContent: PropTypes.element,

    /**
     * User-defined header of the sheet.
     */
    headerContent: PropTypes.element,

    /**
     * Set ID of root element. Generally used to backtrace the source of a
     * sheet.
     */
    id: PropTypes.string,

    /**
     * Level of opacity on sheet mask.
     */
    maskOpacity: PropTypes.number,

    /**
     * Determines whether the Sheet is opened or closed.
     */
    open: PropTypes.bool,

    /**
     * Specifies the id of the DOM element in which the  Sheet will be rendered to.
     * If left undefined, the sheet will be rendered inline.
     */
    portalId: PropTypes.string,

    /**
     * This is used by Sheet to prerender the content before openning it.
     */
    prerender: PropTypes.bool,

    /**
     * Dictate whether the height of the modal grows to the maximum height as
     * declared by the `coverage` prop, or to shrink down to the height of the
     * modal's content.
     */
    shrinkToContent: PropTypes.bool,

    /**
     * User-defined title of the sheet.
     */
    title: PropTypes.string,

    // Callback props

    /**
     * User-defined function that is called before the sheet is closed.
     */
    onBeforeClose: PropTypes.func,

    /**
     * User-defined function that is called before the sheet is opened.
     */
    onBeforeOpen: PropTypes.func,

    /**
     * User-defined function that is called after the sheet is closed.
     */
    onClose: PropTypes.func,

    /**
     * User-defined function that is called when the user clicks to dismiss the
     * sheet. Use this to change state and re-render the Sheet through props.
     */
    onDismiss: PropTypes.func,

    /**
     * User-defined function that is called after the sheet is opened.
     */
    onOpen: PropTypes.func
}

/* istanbul ignore next */

Sheet.defaultProps = {
    coverage: '80%',
    duration: 200,
    onBeforeClose: noop,
    onBeforeOpen: noop,
    onClose: noop,
    onOpen: noop,
    onDismiss: noop,
    maskOpacity: 0.5,
    open: false,
    easing: 'ease-in-out',
    effect: 'slide-left',
    shrinkToContent: false
}

export default Sheet
