/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React, {Component} from 'react'
import PropTypes from 'prop-types'
import cookieManager from '../../utils/cookie-manager'

const cloneChildren = (children, props = {}) => {
    return React.Children.map(children, (child) => {
        if (typeof child.type === 'function') {
            return React.cloneElement(child, props)
        } else {
            return React.cloneElement(child)
        }
    })
}

/**
 * A component that maintains the split variant value in state
 * when given a cookie name
 */
class Split extends Component {
    constructor(props) {
        super(props)

        this.state = {
            splitValue: null
        }
    }

    componentDidMount() {
        this.setState({splitValue: this.getCookieValue()}, () => {
            if (this.props.splitCookieName) {
                this.cookieSubscriber = cookieManager.subscribe(
                    this.props.splitCookieName,
                    (splitValue) => {
                        if (this.state.splitValue !== splitValue) {
                            this.setState({splitValue})
                        }
                    }
                )
            }
        })
    }

    componentWillUnmount() {
        if (this.props.splitCookieName) {
            this.cookieSubscriber.unsubscribe()
        }
    }

    getCookieValue() {
        return cookieManager.get(this.props.splitCookieName, this.props.defaultSplitValue)
    }

    render() {
        const {children, splitCookieName, showOnVariant} = this.props

        if (splitCookieName) {
            if (showOnVariant) {
                if (
                    showOnVariant === this.state.splitValue ||
                    (showOnVariant === 'null' && !this.state.splitValue)
                ) {
                    return <div>{cloneChildren(children)}</div>
                } else {
                    return null
                }
            } else {
                return <div>{cloneChildren(children, {splitValue: this.state.splitValue})}</div>
            }
        } else {
            return children
        }
    }
}

Split.propTypes = {
    /**
     * Node children
     */
    children: PropTypes.node,
    /**
     * Default value of split cookie
     */
    defaultSplitValue: PropTypes.string,
    /**
     * Show children only if the split value matches this value or "null"
     */
    showOnVariant: PropTypes.string,
    /**
     * Name of split cookie
     */
    splitCookieName: PropTypes.string
}

Split.defaultProps = {
    defaultSplitValue: null,
    splitCookieName: null,
    showOnVariant: null
}

export default Split
