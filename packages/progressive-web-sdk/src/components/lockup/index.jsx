/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import {detectBrowser} from '../../utils/browser-detection'

// Determine if we are in mobile safari, we need this to apply a scroll fix.
const isIOS = () => {
    const currentBrowser = detectBrowser(navigator)
    return currentBrowser.mobile && currentBrowser.name === 'safari'
}

/**
 * `Lockup` is used to stop the user from being able to scroll the page.
 * Normally, it should wrap around your main app container.
 * To lock the page, set the `locked` prop to true.
 * To unlock the page, set `locked` to false.
 *
 * @example ./DESIGN.md
 */
class Lockup extends React.Component {
    constructor(props) {
        super(props)

        this.state = {}

        this.lock = this.lock.bind(this)

        this.body = null
    }

    componentDidMount() {
        this.isIOS = isIOS()
        this.body = document.body
        if (this.props.locked) {
            this.lock()
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.locked && !prevProps.locked) {
            this.lock()
        } else if (!this.props.locked && prevProps.locked) {
            this.unlock()
        }
    }

    lock() {
        const scrollPosition = window.scrollY

        let lockStyles

        if (this.isIOS) {
            // On iOS, we lock the height of the element's body wrapping div as well
            // as do some scrolling magic to make sure forms don't jump the page
            // around when they're focused.

            this.body.style.marginTop = '0'
            this.body.style.marginBottom = '0'

            lockStyles = {
                position: 'relative',
                height: `${window.innerHeight}px`
            }

            this.container.scrollTop = scrollPosition
        } else {
            // On Chrome, we can get away with fixing the position of the html
            // and moving it up to the equivalent of the scroll position
            // to lock scrolling.

            lockStyles = {
                position: 'fixed',
                top: scrollPosition * -1
            }
        }

        this.setState({
            scrollPosition,
            style: lockStyles
        })
    }

    unlock() {
        if (this.isIOS) {
            this.body.style.marginTop = ''
            this.body.style.marginBottom = ''
        }

        this.setState({style: {}}, () => {
            window.scrollTo(0, this.state.scrollPosition)
        })
    }

    render() {
        const {children, className, locked} = this.props

        const {style} = this.state

        const classes = classNames(
            'pw-lockup',
            {
                'pw--is-locked': locked
            },
            className
        )

        return (
            <div
                className={classes}
                style={style}
                ref={(el) => {
                    this.container = el
                }}
            >
                {children}
            </div>
        )
    }
}

Lockup.propTypes = {
    /**
     * The children to be locked. Usually, you'll wrap Lockup around your app container
     */
    children: PropTypes.node.isRequired,

    /**
     * Adds values to the `class` attribute of the root element
     */
    className: PropTypes.string,

    /**
     * Indicates whether the children should be locked
     */
    locked: PropTypes.bool
}

export default Lockup
