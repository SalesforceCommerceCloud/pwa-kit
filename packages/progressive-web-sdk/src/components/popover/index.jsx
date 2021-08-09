/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import classNames from 'classnames'
import onClickOutside from 'react-onclickoutside'
import PropTypes from 'prop-types'
import {onKeyUpWrapper} from '../../utils/a11y'

const getChromeVersion = (userAgent) => {
    const versionMatch = userAgent.match(/(Chrome|CriOS)\/(\d+)/i)
    const version = versionMatch && parseInt(versionMatch[2])
    return version || 0
}

const isSamsungBrowser = (userAgent) => {
    const samsungRegex = /SamsungBrowser/i

    const chromeVersion = getChromeVersion(userAgent)

    // Some older Samsung devices have a default browser that's stuck on an old version of Chrome
    // We want to default to the responsive site for these devices
    // We know for sure that Chrome 28 doesn't work so we're using that as the cutoff for now
    const unsupportedChrome = chromeVersion && chromeVersion <= 28

    // Page speed insights uses a chrome 27 user agent, so we need to explicitly support it
    const isPageSpeed = /Google Page Speed Insights/i.test(userAgent)

    return !isPageSpeed && (samsungRegex.test(userAgent) || unsupportedChrome)
}

const iOSBrowser = (userAgent) => /(iPad|iPhone|iPod)/g.test(userAgent)

const isAndroidBrowser = (userAgent) => /(Android|Nexus)/g.test(userAgent)

/**
 * A popover is a transient view that appears above other content onscreen
 * when you tap a control. Typically, popovers are only displayed as a result of
 * user initiated action, and persist until dismissed. Common uses for popovers
 * include, but are not limited to: config screens, mini-views and navigation.
 * They are most appropriate for larger screens.
 *
 */
class Popover extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            open: false
        }

        this.togglePopover = this.togglePopover.bind(this)
        this.onMouseEvent = this.onMouseEvent.bind(this)
        this.onClick = this.onClick.bind(this)
        this.onFocus = this.onFocus.bind(this)
        this.onBlur = this.onBlur.bind(this)
    }

    handleClickOutside() {
        if (this.props.closeOnOutsideClick) {
            this.setState({open: false})
        }
    }

    togglePopover() {
        this.setState({open: !this.state.open})
    }

    onClick(event) {
        // Default isMobile to true incase isHover is true on a mobile device
        // the mobile user should be able to click and see the popover
        let isMobile = true
        if (event && event.view && event.view.navigator) {
            isMobile = this.isMobile(event.view.navigator.userAgent)
        }
        if (isMobile || !this.props.isHover) {
            this.togglePopover()
        }
    }

    onFocus() {
        this.setState({open: true})
    }

    onBlur() {
        this.setState({open: false})
    }

    // Event handler for mouseEnter & mouseLeave for Hover effect
    onMouseEvent(event) {
        // Default isMobile to false so if the userAgent fails
        // the user can still access the popover
        let isMobile = false
        if (event && event.view && event.view.navigator) {
            isMobile = this.isMobile(event.view.navigator.userAgent)
        }
        if (!isMobile && this.props.isHover) {
            this.togglePopover()
        }
    }

    isMobile(userAgent = '') {
        return isSamsungBrowser(userAgent) || iOSBrowser(userAgent) || isAndroidBrowser(userAgent)
    }

    render() {
        const {
            caretPosition,
            children,
            className,
            innerClassName,
            trigger,
            triggerClassName,
            triggerElement
        } = this.props
        const {open} = this.state

        const popoverClasses = classNames('pw-popover', className)
        const popoverInnerClasses = classNames('pw-popover__inner', innerClassName)
        const popoverTriggerClasses = triggerClassName ? triggerClassName : ''

        return (
            <div className={popoverClasses}>
                {triggerElement ? (
                    React.cloneElement(triggerElement, {
                        onMouseEnter: this.onMouseEvent,
                        onMouseLeave: this.onMouseEvent,
                        onFocus: this.onFocus,
                        onBlur: this.onBlur,
                        onMouseDown: this.onClick,
                        onTouchStart: this.onClick,
                        onKeyUp: onKeyUpWrapper(this.togglePopover)
                    })
                ) : (
                    <button
                        type="button"
                        className={popoverTriggerClasses}
                        onClick={this.onClick}
                        onMouseEnter={this.onMouseEvent}
                        onMouseLeave={this.onMouseEvent}
                        onKeyUp={onKeyUpWrapper(this.togglePopover)}
                    >
                        {trigger}
                    </button>
                )}

                {open && (
                    <div className={popoverInnerClasses} role="tooltip">
                        <div
                            className={`pw-popover__caret pw--${caretPosition}`}
                            role="presentation"
                        />
                        <div className="pw-popover__content">{children}</div>
                    </div>
                )}
            </div>
        )
    }
}

Popover.propTypes = {
    /**
     * User-defined content of the Popover trigger, can be a combination of markup
     * and/or React components.
     */
    trigger: PropTypes.node.isRequired,

    /**
     * Adds classes that style where the caret should sit on the top of the Popover.
     */
    caretPosition: PropTypes.oneOf(['left', 'center', 'right']),

    /**
     * User-defined content of the Popover, can be a combination of markup and/or
     * React components.
     */
    children: PropTypes.node,

    /**
     * Adds values to the `class` attribute of the Popover for more customization.
     */
    className: PropTypes.string,

    /**
     * Whether an outside click should close the popover
     */
    closeOnOutsideClick: PropTypes.bool,

    /**
     * Adds values to the `class` attribute of the inner Popover wrapper for more
     * customization.
     */
    innerClassName: PropTypes.string,

    /**
     * Whether the Popover should appear on hover
     */
    isHover: PropTypes.bool,

    /**
     * Adds values to the `class` attribute of the Popover trigger, to style the
     * supplied trigger element or the default `<button>`.
     */
    triggerClassName: PropTypes.string,

    /**
     * An HTML element or React component that is used to trigger the popover. Defaults to a button if none is supplied.
     *
     * Note: React components need to have elements with onClick, onMouseEnter, and onMouseLeave
     * event handlers in order to use the popover.
     */
    triggerElement: PropTypes.node
}

/* istanbul ignore next */
Popover.defaultProps = {
    caretPosition: 'left',
    closeOnOutsideClick: true,
    isHover: false
}

export {Popover as UnwrappedPopover}
export default onClickOutside(Popover)
