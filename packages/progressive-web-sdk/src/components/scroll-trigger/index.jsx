/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import throttle from 'lodash.throttle'
import {noop} from '../../utils/utils'

/**
 * The ScrollTrigger component allows you to register callbacks for when it is scrolled into or out of view
 */

class ScrollTrigger extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            inView: false
        }

        this.handleScroll = throttle(this.handleScroll.bind(this), props.throttle)
    }

    componentDidMount() {
        window.addEventListener('scroll', this.handleScroll)
        window.addEventListener('resize', this.handleScroll)

        // Check if the component has mounted in view
        this.handleScroll()
    }

    handleScroll() {
        const {offsetTop, offsetBottom, onEnter, onLeave} = this.props

        let top = 0
        let bottom = 0
        let boundingClientRect

        // When using enzyme's `shallow`, then `this.element` will be undefined!
        // Check that it exists, before using it...
        if (this.element && this.element.getBoundingClientRect) {
            boundingClientRect = this.element.getBoundingClientRect()
            top = boundingClientRect.top
            bottom = boundingClientRect.bottom
        }

        const boundingBoxTop = top + offsetTop
        const boundingBoxBottom = bottom + offsetBottom

        const innerHeight = window.innerHeight

        const inView =
            (boundingBoxTop <= innerHeight && boundingBoxTop >= 0) ||
            (boundingBoxBottom <= innerHeight && boundingBoxBottom >= 0)

        const hasChanged = inView !== this.state.inView

        if (hasChanged) {
            this.setState({
                inView
            })

            if (inView) {
                onEnter()
            } else {
                onLeave()
            }
        }
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.handleScroll)
        window.removeEventListener('resize', this.handleScroll)
    }

    render() {
        const {children, className} = this.props

        const classes = classNames('pw-scroll-trigger', className)

        return (
            <div
                className={classes}
                ref={(el) => {
                    this.element = el
                }}
            >
                {children}
            </div>
        )
    }
}

ScrollTrigger.defaultProps = {
    offsetBottom: 0,
    offsetTop: 0,
    throttle: 50,
    onEnter: noop,
    onLeave: noop
}

ScrollTrigger.propTypes = {
    /**
     * This children of this component.
     * ScrollTrigger will take their height into account when determining if the component is in view
     */
    children: PropTypes.node,

    /**
     * Adds values to the `class` attribute of the root element
     */
    className: PropTypes.string,

    /**
     * Offsets the "bottom" position of the component.
     * A negative value offsets the bottom above its real position,
     * while a positive value offsets the bottom below its real position
     */
    offsetBottom: PropTypes.number,

    /**
     * Offsets the "top" position of the component.
     * A negative value offsets the top above its real position,
     * while a positive value offsets the top below its real position
     */
    offsetTop: PropTypes.number,

    /**
     * Determines how frequently the component checks if it has been scrolled into view
     */
    throttle: PropTypes.number,

    /**
     * This function is called when the element is scrolled into view
     */
    onEnter: PropTypes.func,

    /**
     * This function is called when the element is scrolled out of view
     */
    onLeave: PropTypes.func
}

export default ScrollTrigger
