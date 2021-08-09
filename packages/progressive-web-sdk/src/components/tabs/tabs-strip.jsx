/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import throttle from 'lodash.throttle'
import {onKeyUpWrapper} from '../../a11y-utils'

const OVERFLOW_CHECK_INTERVAL = 200

/**
 * This component is internally used inside `Tab` compoent.
 *
 * @example ./DESIGN.md
 */

class TabsStrip extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            overflowLeft: false,
            overflowRight: false,
            overflowWidth: 0
        }

        this.checkOverflow = throttle(this.checkOverflow.bind(this), OVERFLOW_CHECK_INTERVAL)
        this.handleScroll = throttle(this.handleScroll.bind(this), OVERFLOW_CHECK_INTERVAL)
    }

    componentDidMount() {
        if (this.props.isScrollable) {
            // Check if tab links are overflowing and apply styling classes
            this.checkOverflow()

            // Re-calculate tab list content width when viewport changes size
            window.addEventListener('resize', this.checkOverflow)

            this._tabStrip.addEventListener('scroll', this.handleScroll, false)
        }
    }

    componentWillUnmount() {
        /* istanbul ignore else */
        if (this.props.isScrollable) {
            // Remove eventListeners if component gets removed
            window.removeEventListener('resize', this.checkOverflow)

            this._tabStrip.removeEventListener('scroll', this.handleScroll, false)
        }
    }

    checkOverflow() {
        const scrollWidth = this._tabStrip.scrollWidth
        const containerWidth = this._tabStrip.clientWidth

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
        const container = this._tabStrip

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
        const {children, activeIndex, setIndex, isScrollable} = this.props

        const classes = classNames('pw-tabs__strip-container', {
            'pw--is-scrollable': isScrollable,
            'pw--overflow-left': this.state.overflowLeft,
            'pw--overflow-right': this.state.overflowRight
        })

        return (
            <div className={classes}>
                <ol
                    role="tablist"
                    className="pw-tabs__strip"
                    ref={(el) => {
                        this._tabStrip = el
                    }}
                >
                    {React.Children.map(children, (item, idx) => {
                        const isActive = idx === activeIndex
                        const onClick = () => setIndex(idx)
                        const tabClasses = classNames('pw-tabs__tab', {
                            'pw--is-active': isActive
                        })

                        return (
                            <li className={tabClasses} role="presentation" key={idx}>
                                <a
                                    className="pw-tabs__link"
                                    role="tab"
                                    tabIndex="0"
                                    aria-selected={isActive}
                                    onClick={onClick}
                                    onKeyUp={onKeyUpWrapper(onClick)}
                                >
                                    {item.props.title}
                                </a>
                            </li>
                        )
                    })}
                </ol>
            </div>
        )
    }
}

TabsStrip.propTypes = {
    /**
     * ActiveIndex defines the active tab.
     */
    activeIndex: PropTypes.number,

    /**
     * The content of the TabStrip.
     */
    children: PropTypes.node,

    /**
     * Indicates whether the strip is scrollable or not.
     */
    isScrollable: PropTypes.bool,

    /**
     * This function is called wto change the active tab.
     */
    setIndex: PropTypes.func
}

export default TabsStrip
