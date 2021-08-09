/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import TransitionGroup from 'react-transition-group/TransitionGroup'
import classNames from 'classnames'

import NavSlider from '../nav-slider'
import Nav from '../nav'

import {noop} from '../../utils/utils'
import {onKeyUpWrapper} from '../../a11y-utils'

import {DefaultStartContent, DefaultEndContent} from './nav-header-default-content'

/**
 * Related components:
 *
 * * [Nav](#!/Nav)
 * * [NavHeader](#!/NavHeader)
 * * [NavItem](#!/NavItem)
 * * [NavMenu](#!/NavMenu)
 * * [NavSlider](#!/NavSlider)
 *
 * The `NavHeader` component is responsible for rendering a "header bar" inside a
 * `Nav` component, automatically displaying meta information about the
 * navigation tree such as which navigation node is presently active, as well
 * as displaying UI that can be, for example, used to navigate the tree
 * backwards, or to display buttons that can be used to close a navigation
 * modal.
 *
 * `NavHeader` cannot be used by itself. It must be inserted into a `Nav`
 * component.
 *
 * @example ./DESIGN.md
 */
const NavHeader = (props, context) => {
    const {goBack, expanded, expandedPath} = context
    const {startContent, endContent, onClose, className, animationProperties, onTitleClick} = props
    const classes = classNames('pw-nav-header', className)
    const sliderClasses = classNames('pw-nav-header__slider', {
        'pw--has-custom-header-animation': Object.keys(animationProperties).length > 0,
        [animationProperties.className]: animationProperties.className
    })
    const atRoot = expandedPath === '/'

    const onBackClick = (e) => {
        e.preventDefault()
        goBack()
    }

    const onCloseClick = (e) => {
        e.preventDefault()
        onClose()
    }

    const start = React.isValidElement(startContent)
        ? React.cloneElement(startContent, {atRoot, onClick: onBackClick})
        : startContent

    const end = React.isValidElement(endContent)
        ? React.cloneElement(endContent, {onClick: onCloseClick})
        : endContent

    let titleProps = {className: 'pw-nav-header__title'}

    if (onTitleClick) {
        const wrapTitleClick = () => onTitleClick(expanded.title, expanded.path)

        titleProps = Object.assign(titleProps, {
            onClick: wrapTitleClick,
            onKeyUp: onKeyUpWrapper(wrapTitleClick),
            role: 'button',
            tabIndex: '0'
        })
    }

    return (
        <div className={classes}>
            <div className="pw-nav-header__actions-start">{start}</div>

            <TransitionGroup component="div" className="pw-nav-header__slider-container">
                <NavSlider {...animationProperties} className={sliderClasses} key={expandedPath}>
                    <span {...titleProps}>{(expanded && expanded.title) || ''}</span>
                </NavSlider>
            </TransitionGroup>

            <div className="pw-nav-header__actions-end">{end}</div>
        </div>
    )
}

NavHeader.defaultProps = {
    onClose: noop,
    startContent: <DefaultStartContent />,
    animationProperties: {},
    endContent: <DefaultEndContent />
}

NavHeader.propTypes = {
    /**
     * Animation properties for customizing the NavHeader's animation.
     * These properties are passed down to the internal NavSlider
     * component as props.
     */
    animationProperties: PropTypes.shape({
        /**
         * Adds values to the `class` attribute to the
         * internal NavSlider.
         */
        className: PropTypes.string,
        /**
         * Duration of the animation in millis.
         */
        duration: PropTypes.number,
        /**
         * Easing function for the animation.
         */
        easing: PropTypes.string,
        /**
         * Id given to the internal NavSlider.
         */
        id: PropTypes.string
    }),

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * Overrides the content displayed at the end of the header.
     * Defaults to a 'close' button.
     */
    endContent: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),

    /**
     * Overrides the content displayed at the start of the header.
     * Defaults to a 'back' button.
     */
    startContent: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),

    /**
     * A callback invoked when the default close button is pressed.
     */
    onClose: PropTypes.func,

    /**
     * A callback invoked when the title is clicked.
     */
    onTitleClick: PropTypes.func
}

NavHeader.contextTypes = Nav.childContextTypes

export default NavHeader
