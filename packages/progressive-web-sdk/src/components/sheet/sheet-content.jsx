/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import classNames from 'classnames'
import prefixAll from 'inline-style-prefixer/static'
import {onKeyUpWrapper} from '../../a11y-utils'

const WRAPPER_CLASSES = 'pw-sheet__wrapper'

const nextInt = (() => {
    let i = 0
    return () => {
        return i++
    }
})()

/**
 * Return the (possibly prefixed) name of the 'transitionend' event
 * on the current browser or null if unsupported.
 *
 * @example ./DESIGN.md
 */
const getTransitionEndEventName = () => {
    if (typeof document === 'undefined') {
        return null
    }

    const body = document.body
    const transitions = {
        transition: 'transitionend',
        WebkitTransition: 'webkitTransitionEnd',
        MozTransition: 'transitionend',
        OTransition: 'oTransitionEnd otransitionend'
    }

    for (const t in transitions) {
        /* We can't really test this in jest */
        /* istanbul ignore if */
        if (body.style[t] !== undefined) {
            return transitions[t]
        }
    }
    return null
}

/* Lookup tables for styling */

const STYLE_PARAMETERS = {
    'slide-right': {
        gutter: 'left',
        axis: 'X',
        extreme: 100
    },
    'slide-left': {
        gutter: 'right',
        axis: 'X',
        extreme: -100
    },
    'slide-top': {
        gutter: 'bottom',
        axis: 'Y',
        extreme: -100
    },
    'slide-bottom': {
        gutter: 'top',
        axis: 'Y',
        extreme: 100
    }
}

const IS_OPEN = {
    enter: false,
    enterActive: true,
    leave: true,
    leaveActive: false
}

const IS_ANIMATING = {
    enter: false,
    enterActive: true,
    leave: false,
    leaveActive: true
}

const MASK_OPACITY_MULTIPLIER = {
    enter: 0,
    enterActive: 1,
    leave: 1,
    leaveActive: 0
}

// The props from the Sheet component pass directly to SheetContent,
// making propType validation redundant.
/* eslint-disable react/prop-types */
// All props inherited from parent on this private component.

class SheetContent extends React.Component {
    constructor(props) {
        super(props)

        // Unique ids for ARIA attributes
        const baseId = this.props.id || nextInt()
        this.id = this.props.id || `pw-sheet-${baseId}`
        this.headerId = `sheet__header-${baseId}`
        this.footerId = `sheet__footer-${baseId}`

        // Determine if we are in mobile safari, we need this to apply a scroll fix.
        this.isIOS =
            typeof navigator !== 'undefined' &&
            !!navigator.userAgent.match(
                /Version\/([\d.]+)([^S](Safari)|[^M]*(Mobile)[^S]*(Safari))/
            )

        // Bind functions to this components scope.
        this.onWrapperClick = this.onWrapperClick.bind(this)
        this.triggerDismiss = this.triggerDismiss.bind(this)
        this.onMaskMountOrUnmount = this.onMaskMountOrUnmount.bind(this)
        this.onInnerMountOrUnmount = this.onInnerMountOrUnmount.bind(this)
        this.onTouchStart = this.onTouchStart.bind(this)
        this.callbackOnTransitionEnd = this.callbackOnTransitionEnd.bind(this)
        this.onWrapperMountOrUnmount = this.onWrapperMountOrUnmount.bind(this)
        this.state = {phase: 'enter'}
        this.transitionEndEventName = getTransitionEndEventName()
        this.wrapperEl = null
    }

    onMaskMountOrUnmount(el) {
        this.maskEl = el

        if (el) {
            el.addEventListener(
                'touchmove',
                (e) => {
                    e.preventDefault()
                },
                {passive: !this.isIOS}
            )
        }
    }

    onWrapperMountOrUnmount(el) {
        this.wrapperEl = el
    }

    onInnerMountOrUnmount(el) {
        this.innerEl = el

        if (el) {
            el.addEventListener('touchstart', this.onTouchStart, {passive: !this.isIOS})
        }
    }

    onTouchStart(e) {
        if (!this.isIOS) {
            return
        }

        const scrollingContainer = e.target.closest('.pw-sheet__inner')
        const {scrollTop, scrollHeight, offsetHeight} = this.innerEl

        // Prevent scroll chaining (the bubbling of the scrolling context out
        // of the container) by guaranteeing iOS' rubber band overscroll behavior
        if (scrollTop <= 0) {
            scrollingContainer.scrollTop = 1
        } else if (scrollTop + offsetHeight >= scrollHeight) {
            scrollingContainer.scrollTop -= 1
        }
    }

    getWrapperStyle() {
        const {coverage, duration, effect, easing} = this.props
        const {phase} = this.state

        // This is a sanity test that is difficult to test.
        /* istanbul ignore if */
        if (!phase) {
            return {}
        }
        const open = IS_OPEN[phase]
        const style = {}
        const gutterCoverage = 100 - parseFloat(coverage)

        if (effect === 'modal-center') {
            const modalCoverage = `${gutterCoverage / 2}%`

            style.transform = `scale(${open ? '1' : '0'})`
            style.top = modalCoverage
            style.right = modalCoverage
            style.bottom = modalCoverage
            style.left = modalCoverage
        } else {
            const {gutter, axis, extreme} = STYLE_PARAMETERS[effect]

            style[gutter] = `${gutterCoverage}%`
            style.transform = `translate${axis}(${open ? 0 : extreme}%)`
        }

        if (IS_ANIMATING[phase]) {
            style.transition = `transform ${duration}ms ${easing}`
        }

        return prefixAll(style)
    }

    getMaskStyle() {
        const {duration, maskOpacity, easing} = this.props
        const {phase} = this.state

        // This is a sanity test that is difficult to test.
        /* istanbul ignore if */
        if (!phase) {
            return {}
        }
        const style = {}

        // MASK_OPACITY_MULTIPLIER is 0 or 1 depending whether the
        // mask should be transparent
        style.opacity = maskOpacity * MASK_OPACITY_MULTIPLIER[phase]

        if (IS_ANIMATING[phase]) {
            style.transition = `opacity ${duration}ms ${easing}`
        }
        return style
    }

    componentWillAppear(callback) {
        this.componentWillEnter(callback)
    }

    componentDidAppear() {
        this.componentDidEnter()
    }

    componentWillEnter(callback) {
        this.props.onBeforeOpen()

        requestAnimationFrame(() => {
            this.setState({phase: 'enter'}, () => {
                requestAnimationFrame(() => {
                    this.setState({phase: 'enterActive'})
                    this.callbackOnTransitionEnd(this.wrapperEl, this.props.duration, callback)
                })
            })
        })
    }

    componentDidEnter() {
        this.props.onOpen()
    }

    componentWillLeave(callback) {
        this.props.onBeforeClose()

        requestAnimationFrame(() => {
            this.setState({phase: 'leave'}, () => {
                requestAnimationFrame(() => {
                    this.setState({phase: 'leaveActive'})
                    this.callbackOnTransitionEnd(this.wrapperEl, this.props.duration, callback)
                })
            })
        })
    }

    componentDidLeave() {
        this.props.onClose()
    }

    callbackOnTransitionEnd(el, duration, callback) {
        // Can't really test the if here in Jest
        /* istanbul ignore if */
        if (this.transitionEndEventName) {
            const onTransitionEnd = (event) => {
                if (event.target === el) {
                    callback()
                    el.removeEventListener(this.transitionEndEventName, onTransitionEnd)
                }
            }
            el.addEventListener(this.transitionEndEventName, onTransitionEnd)
        } else {
            // Fallback to setTimeout if event not supported (JsDOM, for example)
            setTimeout(callback, duration)
        }
    }

    onWrapperClick(e) {
        // Only close if the WRAPPER was clicked. This is necessary for when the
        // sheet's `shrinkToContent` prop is set to true and the INNER container
        // is smaller than the wrapper which can create the situation where the
        // wrapper is indistinguishable from the mask element. As such, when the
        // user BELIEVES they clicked the mask, the modal should close...
        if (e.target.className === WRAPPER_CLASSES) {
            this.triggerDismiss()
        }
    }

    triggerDismiss() {
        this.props.onDismiss()
    }

    render() {
        const {
            shrinkToContent,
            title,
            headerContent,
            footerContent,
            children,
            effect,
            className
        } = this.props

        const classes = classNames('pw-sheet', `pw--${effect}`, className)
        const maskClasses = classNames('pw-sheet__mask', 'pw--is-visible')
        const innerClasses = classNames('pw-sheet__inner', {
            'pw--shrink-to-content': shrinkToContent
        })

        const header = (headerContent || title) && (
            <div className="pw-sheet__header" id={this.headerId} role="heading">
                {title && <h1>{title}</h1>}

                {headerContent}
            </div>
        )

        const footer = footerContent && (
            <div className="pw-sheet__footer" id={this.footerId}>
                {footerContent}
            </div>
        )

        return (
            <div className={classes} id={this.id}>
                <div
                    className={maskClasses}
                    tabIndex="-1"
                    style={this.getMaskStyle()}
                    aria-hidden="true"
                    onKeyUp={onKeyUpWrapper(this.triggerDismiss)}
                    role="presentation"
                    onClick={this.triggerDismiss}
                    ref={this.onMaskMountOrUnmount}
                />

                {/*
                    Disabling the jsx-a11y/no-static-element-interactions because
                    it's necessary to have here for very specific mouse-only
                    circumstances. See the comments in the `onWrapperClick`
                    function above.
                  */}

                {/* eslint-disable jsx-a11y/no-static-element-interactions */}
                <div
                    className={WRAPPER_CLASSES}
                    tabIndex="-1"
                    onClick={this.onWrapperClick}
                    onKeyUp={onKeyUpWrapper(this.onWrapperClick)}
                    style={this.getWrapperStyle()}
                    role="presentation"
                    ref={this.onWrapperMountOrUnmount}
                >
                    {/* eslint-enable jsx-a11y/no-static-element-interactions */}
                    {/* eslint-disable jsx-a11y/aria-props*/}
                    <div
                        className={innerClasses}
                        tabIndex="0"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={this.headerId}
                        ref={this.onInnerMountOrUnmount}
                    >
                        {/* eslint-enable jsx-a11y/aria-props*/}
                        {header}

                        <div className="pw-sheet__content">{children}</div>

                        {footer}
                    </div>
                </div>
            </div>
        )
    }
}

/* eslint-enable react/prop-types */

export default SheetContent
