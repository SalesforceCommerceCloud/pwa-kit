/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Button from '../button'
/**
 * A wrapper-component for `<Button\>` that allows you to scroll to different points on the page.
 * This component can be passed either a page height (in pixels) or an element selector
 * as its target. If multiple elements with the target selector are found, it will scroll
 * to the first one returned by querySelectorAll().
 */
class ScrollTo extends React.Component {
    constructor(props) {
        super(props)
        this.documentBodyElement = null
        this.animateScroll = this.animateScroll.bind(this)
        this.scrollToPosition = this.scrollToPosition.bind(this)
        this.calculateElementPos = this.calculateElementPos.bind(this)
    }

    componentDidMount() {
        this.documentBodyElement = document.scrollingElement || document.body
    }

    calculateElementPos(element) {
        if (!element) {
            // If the element doesn't exist, return the current scroll position
            return this.documentBodyElement.scrollTop
        } else {
            return element.getBoundingClientRect().top + window.pageYOffset
        }
    }

    animateScroll(targetPos, duration) {
        return new Promise((resolve) => {
            const startPos = this.documentBodyElement.scrollTop
            const posDelta = targetPos - startPos
            // Assumes 60 frames per second
            const totalFrames = duration * 0.06

            // Robert Penner's easeOutCubic function
            const easeOutCubic = (currentFrame) => {
                return posDelta * (Math.pow(currentFrame / totalFrames - 1, 3) + 1) + startPos
            }

            const handleAnimationFrame = (currentFrame) => {
                if (currentFrame > totalFrames) {
                    resolve()
                    return
                }

                window.requestAnimationFrame(() => {
                    this.documentBodyElement.scrollTop = easeOutCubic(currentFrame)
                    handleAnimationFrame(currentFrame + 1)
                })
            }

            handleAnimationFrame(0)
        })
    }

    scrollToPosition() {
        const {target, duration} = this.props
        let targetPos
        let element
        // Decide whether the target is a height or an element selector
        if (typeof target === 'number') {
            targetPos = target
        } else {
            element = document.querySelector(target)
            targetPos = this.calculateElementPos(element)
        }

        // If duration is zero, set the scroll position to the target's position
        if (duration === 0) {
            this.documentBodyElement.scrollTop = targetPos

            if (element) {
                element.focus()
            }
        } else {
            this.animateScroll(targetPos, duration).then(() => {
                // set focus on the element for a11y purposes
                if (element) {
                    element.focus()
                }
            })
        }
    }

    render() {
        const classes = classNames('pw-scroll-to', this.props.className)

        return <Button {...this.props} className={classes} onClick={this.scrollToPosition} />
    }
}

ScrollTo.defaultProps = {
    duration: 500
}

ScrollTo.propTypes = {
    /**
     * Any children to be nested within this component.
     */
    children: PropTypes.node.isRequired,

    /**
     * The target's height position from the top of the page, in pixels OR
     * the target's selector, such as it's ID or class name.
     */
    target: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * If specified, overrides the default scrolling speed.
     */
    duration: PropTypes.number
}

export default ScrollTo
