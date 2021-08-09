/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import throttle from 'lodash.throttle'

/**
 * Lazy load image: content will render immediately
 * if its in view or will show when scrolled to it
 */

class LazyLoadContent extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            visible: false
        }

        this.handleScroll = throttle(this.handleScroll.bind(this), this.props.scrollCheckInterval)
    }

    componentDidMount() {
        window.addEventListener('scroll', this.handleScroll)
        this.checkVisible()
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.handleScroll)
    }

    checkVisible() {
        const topPosition = this.el.getBoundingClientRect().top

        // Use pageYOffset here instead of scrollY because it has better browser compatibility (ex. IE11)
        if (topPosition <= window.innerHeight + window.pageYOffset - this.props.threshold) {
            this.setState({
                visible: true
            })

            window.removeEventListener('scroll', this.handleScroll)
        }
    }

    handleScroll() {
        if (!this.state.visible) {
            this.checkVisible()
        }
    }

    render() {
        const {className, children, placeholder} = this.props

        const classes = classNames('pw-lazy-load-content', className)

        return (
            <div
                className={classes}
                ref={(el) => {
                    this.el = el
                }}
            >
                {this.state.visible ? children : placeholder}
            </div>
        )
    }
}

LazyLoadContent.defaultProps = {
    scrollCheckInterval: 200,
    threshold: 0
}

LazyLoadContent.propTypes = {
    /**
     * Content that will be revealed when scrolled to
     */
    children: PropTypes.node.isRequired,

    /**
     * Adds values to the `class` attribute of the root element
     */
    className: PropTypes.string,

    /**
     * Placeholder content when actual content is not revealed
     */
    placeholder: PropTypes.node,

    /**
     * In milliseconds that delays invoking the function
     */
    scrollCheckInterval: PropTypes.number,

    /**
     * Number of pixels out the viewport before loading the content
     */
    threshold: PropTypes.number
}

export default LazyLoadContent
