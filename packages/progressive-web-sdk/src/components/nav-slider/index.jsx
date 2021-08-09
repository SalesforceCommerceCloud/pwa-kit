/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Nav from '../nav'
import prefixAll from 'inline-style-prefixer/static'
import {noop} from '../../utils/utils'

/**
 * Related components:
 *
 * * [Nav](#!/Nav)
 * * [NavHeader](#!/NavHeader)
 * * [NavItem](#!/NavItem)
 * * [NavMenu](#!/NavMenu)
 * * [NavSlider](#!/NavSlider)
 *
 * `NavSlider` is a helper component for customizing the slide-in and slide-out
 * animations used when traversing items in the [`Nav`](#!/Nav) component.
 * In particular, `NavSlider` can be used to create fully custom versions of the
 * [`NavHeader`](#!/NavHeader) and [`NavMenu`](#!/NavMenu) components.
 *
 * To take full advantage of the `NavSlider`, it should be used with the
 * [`TransitionGroup`](https://github.com/reactjs/react-transition-group)
 * component. See examples of this below.
 */
class NavSlider extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            style: {}
        }
    }

    componentWillEnter(callback) {
        const {action} = this.context
        const [start, end] = action === 'descending' ? ['100%', '0'] : ['-100%', '0']

        this.animate(start, end, this.props.onEnterComplete).then(callback)
    }

    componentWillLeave(callback) {
        const {action} = this.context
        const [start, end] = action === 'descending' ? ['0', '-100%'] : ['0', '100%']

        this.animate(start, end, this.props.onLeaveComplete).then(callback)
    }

    animate(start, end, callback) {
        const {duration, easing} = this.props

        const frame = () =>
            new Promise((resolve) => {
                requestAnimationFrame(resolve)
            })

        const setStartState = () =>
            new Promise((resolve) => {
                const state = {
                    style: prefixAll({
                        transform: `translate(${start}, 0)`,
                        transition: `none`,
                        position: 'absolute',
                        width: '100%'
                    }),
                    isSliding: true
                }
                this.setState(state, resolve)
            })

        const setEndState = () =>
            new Promise((resolve) => {
                const state = {
                    style: prefixAll({
                        transform: `translate(${end}, 0)`,
                        transition: `transform ${duration / 1000}s ${easing}`,
                        position: 'absolute',
                        width: '100%'
                    })
                }
                this.setState(state, resolve)
            })

        const waitForAnimation = () =>
            new Promise((resolve) => {
                setTimeout(() => {
                    callback()
                    resolve()
                }, duration)
            })

        const cleanup = () => {
            this.setState({isSliding: false, style: {}})
        }

        return frame()
            .then(setStartState)
            .then(frame)
            .then(setEndState)
            .then(waitForAnimation)
            .then(cleanup)
    }

    render() {
        const {id, children, className} = this.props
        const {style, isSliding} = this.state
        const classes = classNames('pw-nav-slider', {'pw--sliding': isSliding}, className)

        return (
            <div className={classes} id={id} style={style}>
                {children}
            </div>
        )
    }
}

NavSlider.propTypes = {
    /**
     * Child nodes of the `NavSlider`.
     */
    children: PropTypes.node,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * Duration of the animation in milliseconds.
     */
    duration: PropTypes.number,

    /**
     * Easing function for the animation as a string whose value
     * can be anything the [CSS `transition-timing-function`](https://developer.mozilla.org/en/docs/Web/CSS/transition-timing-function)
     * can take in.
     */
    easing: PropTypes.string,

    /**
     * Id given to the root element.
     */
    id: PropTypes.string,

    /**
     * Determines if slider is sliding (animating)
     */
    isSliding: PropTypes.bool,

    /**
     * This function is called once the enter animation is complete
     */
    onEnterComplete: PropTypes.func,

    /**
     * This function is called once the leave animation is complete
     */
    onLeaveComplete: PropTypes.func
}

NavSlider.defaultProps = {
    duration: 500,
    easing: 'ease-out',
    onEnterComplete: noop,
    onLeaveComplete: noop
}

NavSlider.contextTypes = Nav.childContextTypes

export default NavSlider
