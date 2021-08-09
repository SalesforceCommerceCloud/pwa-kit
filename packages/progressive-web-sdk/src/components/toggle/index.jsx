/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Button from '../button'
import throttle from 'lodash.throttle'

const OVERFLOW_CHECK_INTERVAL = 200

/**
 * `Toggle` component is commonly used to visually 'truncate' its contents
 * if it crosses a preset height threshold.
 * It will show/hide the toggle button if the contents doesn't overflow pass the threshold.
 *
 * @example ./DESIGN.md
 */

class Toggle extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            expanded: false,
            overflowing: true
        }

        this.toggleContent = this.toggleContent.bind(this)
        this.checkContentHeight = throttle(
            this.checkContentHeight.bind(this),
            OVERFLOW_CHECK_INTERVAL
        )
        this.removeMaxHeight = this.removeMaxHeight.bind(this)
    }

    componentDidMount() {
        // Check if content's height is greater than the heightThreshold
        this.checkContentHeight()

        // Re-calculate content height when viewport changes size
        window.addEventListener('resize', this.checkContentHeight)
    }

    componentWillUnmount() {
        // Remove eventListener if component gets removed
        window.removeEventListener('resize', this.checkContentHeight)
    }

    componentDidUpdate() {
        // Recalc height after component gets updated (For example: image loaded)
        this.checkContentHeight()
    }

    checkContentHeight() {
        const {heightThreshold} = this.props

        // Avoid infinite loop with componentDidUpdate
        if (!this._content || this.state.contentHeight === this._content.clientHeight) {
            return
        }

        this.setState({
            contentHeight: this._content.clientHeight,
            overflowing: this._content.clientHeight > heightThreshold
        })
    }

    toggleContent() {
        if (this.state.expanded) {
            this.setState({
                expanded: false,
                overflowing: true
            })
        } else {
            this.setState({
                expanded: true
            })
        }
    }

    removeMaxHeight(e) {
        if (this.state.expanded && e.target === this._inner) {
            this.setState({
                overflowing: false
            })
        }
    }

    render() {
        const {children, className, heightThreshold, expandLabel, collapseLabel} = this.props

        const classes = classNames('pw-toggle', className)

        const innerClasses = classNames(`pw-toggle__inner`, {
            // Adds fade overlay to indicate content overflow
            'pw--overflow': this.state.overflowing
        })

        const innerStyle = {
            maxHeight: this.state.expanded
                ? // Expand contents to content height
                  this.state.contentHeight
                : // Cap height to threshold when component is not expanded
                  heightThreshold
        }

        const buttonLabel = this.state.expanded ? collapseLabel : expandLabel

        return (
            <div className={classes}>
                <div
                    className={innerClasses}
                    style={innerStyle}
                    onTransitionEnd={this.removeMaxHeight}
                    ref={(el) => {
                        this._inner = el
                    }}
                >
                    <div
                        className="pw-toggle__content"
                        ref={(el) => {
                            this._content = el
                        }}
                    >
                        {children}
                    </div>
                </div>

                {(this.state.overflowing || this.state.expanded) && (
                    <div className="pw-toggle__action">
                        <Button
                            className="pw-toggle__toggler"
                            children={buttonLabel}
                            onClick={this.toggleContent}
                        />
                    </div>
                )}
            </div>
        )
    }
}

Toggle.defaultProps = {
    expandLabel: 'View More',
    collapseLabel: 'View Less',
    heightThreshold: 100
}

Toggle.propTypes = {
    /**
     * Contents that will be wrapped by the Toggle component.
     */
    children: PropTypes.node.isRequired,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * Label for collapse button.
     */
    collapseLabel: PropTypes.node,

    /**
     * Label for expand button.
     */
    expandLabel: PropTypes.node,

    /**
     * Max height of the content before it needs to be 'truncated' visually.
     */
    heightThreshold: PropTypes.number
}

export default Toggle
