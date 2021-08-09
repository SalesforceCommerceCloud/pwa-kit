/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'

/**
 * Related components:
 *
 * * [AccordionItem](#!/AccordionItem)
 * * [Accordion](#!/Accordion)
 *
 * This component is for internal use only within the AccordionItem.
 *
 * @example ./DESIGN.md
 */

class AccordionItemContent extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            fullHeight: 0,
            style: {
                maxHeight: '0px',
                transition: 'none'
            }
        }

        this.animate = this.animate.bind(this)
        this.getFullHeight = this.getFullHeight.bind(this)
    }

    componentDidAppear() {
        this.triggerAnimate()
    }

    componentDidEnter() {
        this.triggerAnimate()
    }

    componentWillLeave(callback) {
        const complete = () => {
            this.props.onAnimationComplete()
            callback()
        }

        this.animate(this.getFullHeight(), 0, complete)
    }

    triggerAnimate() {
        const complete = () => {
            // After the content has fully opened,
            // remove the set height so the content can grow as needed
            this.setState({
                style: {
                    maxHeight: 'initial',
                    transition: 'none'
                }
            })

            this.props.onAnimationComplete()
        }

        this.animate(0, this.getFullHeight(), complete)
    }

    animate(start, end, callback) {
        const {duration, easing} = this.props

        const frame = () => {
            return new Promise((resolve) => {
                requestAnimationFrame(resolve)
            })
        }

        const setStartState = () => {
            return new Promise((resolve) => {
                const state = {
                    style: {
                        maxHeight: `${start}px`,
                        transition: `none`
                    }
                }
                this.setState(state, resolve)
            })
        }

        const setEndState = () => {
            return new Promise((resolve) => {
                const state = {
                    style: {
                        maxHeight: `${end}px`,
                        transition: `max-height ${duration / 1000}s ${easing}`
                    }
                }
                this.setState(state, resolve)
            })
        }

        const waitForAnimation = () => {
            setTimeout(callback, duration)
        }

        frame()
            .then(setStartState)
            .then(frame)
            .then(setEndState)
            .then(waitForAnimation)
    }

    getFullHeight() {
        return this._content.children[0].offsetHeight
    }

    render() {
        const {children} = this.props

        return (
            <div
                className="pw-accordion__content-wrapper"
                ref={(el) => {
                    this._content = el
                }}
                style={this.state.style}
            >
                <div className="pw-accordion__content" role="presentation">
                    {children}
                </div>
            </div>
        )
    }
}

AccordionItemContent.propTypes = {
    /**
     * PROVIDED INTERNALLY. Whatever you'd like this AccordionItem to display.
     */
    children: PropTypes.node,

    /**
     * PROVIDED INTERNALLY. Duration of the animation in millis.
     */
    duration: PropTypes.number,

    /**
     * PROVIDED INTERNALLY. Easing function for the animation.
     */
    easing: PropTypes.string,

    /**
     * PROVIDED INTERNALLY. Triggered every time the content has finished animating.
     */
    onAnimationComplete: PropTypes.func
}

export default AccordionItemContent
