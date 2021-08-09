/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import throttle from 'lodash.throttle'

/**
 * `Scroller` component is used to display content(items) side by side.
 * It allows user to scroll the overflowing content horizontally.
 *
 * @example ./DESIGN.md
 */

class Scroller extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            overflowLeft: false,
            overflowRight: false,
            overflowWidth: 0
        }

        this.checkOverflow = throttle(this.checkOverflow.bind(this), 200)
        this.handleScroll = this.handleScroll.bind(this)
    }

    componentDidMount() {
        // Check if scroller items are overflowing and apply styling classes
        this.checkOverflow()

        // Re-calculate scroller content width when viewport changes size
        window.addEventListener('resize', this.checkOverflow)

        // `this._scroller` is sometimes undefined in unit tests
        if (this._scroller) {
            this._scroller.addEventListener('scroll', this.handleScroll, false)
        }
    }

    componentWillUnmount() {
        // Remove eventListeners if component gets removed
        window.removeEventListener('resize', this.checkOverflow)

        this._scroller.removeEventListener('scroll', this.handleScroll, false)
    }

    checkOverflow() {
        // `this._scroller` is sometimes undefined in unit tests
        const scrollWidth = this._scroller && this._scroller.scrollWidth
        const containerWidth = this._scroller && this._scroller.clientWidth

        if (scrollWidth > containerWidth) {
            this.setState({
                overflowRight: true,
                overflowWidth: scrollWidth - containerWidth
            })
        } else {
            this.setState({
                overflowLeft: false,
                overflowRight: false
            })
        }
    }

    handleScroll() {
        const container = this._scroller

        // If scroll position is not at the initial position, set overflowLeft to true
        if (container.scrollLeft > 0 && !this.state.overflowLeft) {
            this.setState({
                overflowLeft: true
            })
        } else if (container.scrollLeft === 0) {
            this.setState({
                overflowLeft: false
            })
        }

        // If scroll position reached all the way to the right, set overflowRight to false
        if (container.scrollLeft < this.state.overflowWidth && !this.state.overflowRight) {
            this.setState({
                overflowRight: true
            })
        } else if (container.scrollLeft === this.state.overflowWidth) {
            this.setState({
                overflowRight: false
            })
        }
    }

    render() {
        const {children, className} = this.props

        const classes = classNames(
            'pw-scroller',
            {
                'pw--overflow-left': this.state.overflowLeft,
                'pw--overflow-right': this.state.overflowRight
            },
            className
        )

        return (
            <div className={classes}>
                <div>
                    <div
                        className="pw-scroller__content"
                        ref={(el) => {
                            this._scroller = el
                        }}
                    >
                        {children &&
                            React.Children.map(children, (child, index) => (
                                <div key={index} className="pw-scroller__item">
                                    {child}
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        )
    }
}

Scroller.propTypes = {
    /**
     * Each children will be placed inside a `pw-scroller__item` container
     */
    children: PropTypes.node.isRequired,

    /**
     * Adds values to the `class` attribute of the root element
     */
    className: PropTypes.string
}

export default Scroller
