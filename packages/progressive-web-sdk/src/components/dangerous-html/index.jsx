/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import {withRouter} from 'react-router-dom'

import {isInternalLink} from '../../utils/assets'
import {onKeyUpWrapper} from '../../utils/a11y'

export const getClosestAnchor = (el, container) => {
    let currentEl = el

    while (currentEl) {
        if (currentEl.tagName === 'A') {
            return currentEl
        }

        // Stop searching when we get to
        // the DangerousHTML container itself
        if (currentEl === container) {
            return null
        }

        currentEl = currentEl.parentElement
    }

    return null
}

// The `DangerousHTML` component isn't intended to be something the user interacts with directly
// It should just act as an invisible wrapped that catches clicks that bubble up from its children
// As a result, it doesn't make sense for the DangerousHTML component to have semantics
/* eslint-disable jsx-a11y/onclick-has-focus, jsx-a11y/onclick-has-role */

/**
 * `DangerousHTML` is a wrapper for the `dangerouslySetInnerHTML` prop on React
 * components. The purpose of that is to include markup from another source within
 * the React tree. That source can be a string, an AJAX response, etc.
 *
 * A feature of `DangerousHTML` is that it prevents successive re-rendering of
 * elements that use dangerouslySetInnerHTML. Check that the html string has
 * changed before attempting to render.
 *
 * It is worth noting that we recommend you avoid using `DangerousHTML` if at all
 * possible. It's named this way for a reason, so **use with caution**.
 *
 * For example usecases where `DangerousHTML` can be used, see the
 * [Parsing HTML guide](/progressive-web/latest/guides/parsing-html).
 */
export class DangerousHTML extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            processHTML: false
        }

        this.processHTML = this.processHTML.bind(this)
        this.handleClick = this.handleClick.bind(this)
    }

    componentDidMount() {
        const {enableExternalResources} = this.props

        // Only enable external resources (process html) if the option is checked and
        // we have a capture object
        this.setState({
            processHTML:
                enableExternalResources &&
                typeof window !== 'undefined' &&
                typeof window.Capture !== 'undefined' &&
                typeof window.Capture.enable !== 'undefined'
        })
    }

    shouldComponentUpdate(nextProps, nextState) {
        // Only update if we are getting new html, or if our state indicates
        // that we are ready to process the html (e.g. we are in the broswer
        // and now have access to the Capture document to accomplish processing)
        return (
            nextProps.html !== this.props.html ||
            (nextState.processHTML && nextState.processHTML !== this.state.processHTML)
        )
    }

    handleClick(e) {
        if (this.props.enableBrowserHistoryForLinks) {
            const anchor = getClosestAnchor(e.target, this.container)
            const href = anchor && anchor.href

            // i.e. _blank, _self, _top, etc.
            const target = (anchor && anchor.target) || ''

            // We only want to control the brower history if the anchor is
            // targetting the current tab or window. Otherwise the anchor may
            // be trying to control some other browsing context
            /* istanbul ignore next */
            const isTargettingSelfContext = target === '' || target === '_self'

            /* istanbul ignore else */
            if (href && isInternalLink(href) && isTargettingSelfContext) {
                e.preventDefault()
                // Strip the origin so we don't get a warning from browserHistory
                // TODO: Re-implement logic for anchor clicks
                this.props.history.push(href)
            }
        }
    }

    render() {
        const {children, className} = this.props
        const {processHTML} = this.state

        const classes = classNames('pw-dangerous-html', className)
        let {html} = this.props

        html = processHTML ? this.processHTML(html) : html

        /* Disable this eslint a11y rule, because it's meant to catch bubbled
         * click events */
        /* eslint-disable jsx-a11y/no-static-element-interactions */
        return (
            <div
                className={classes}
                onClick={this.handleClick}
                onKeyUp={onKeyUpWrapper(this.handleClick)}
                ref={(el) => {
                    this.container = el
                }}
            >
                {children({__html: html})}
            </div>
        )
        /* eslint-enable jsx-a11y/no-static-element-interactions */
    }

    /**
     * HTML transformations, current steps:
     * - enable external resources if specified
     */
    processHTML(html) {
        const {externalResourcesPrefix} = this.props

        return window.Capture.enable(html, externalResourcesPrefix)
    }
}

DangerousHTML.propTypes = {
    /**
     * A function callback with an argument of `htmlObj` that returns a React
     * element. Example: `(htmlObj) => <div dangerouslySetInnerHTML={htmlObj} />`
     */
    children: PropTypes.func.isRequired,

    /**
     * PROVIDED INTERNALLY. History object passed down by the router.
     */
    history: PropTypes.string.isRequired,

    /**
     * A string representation of some HTML. Example: `<strong>A string of HTML</strong>`
     */
    html: PropTypes.string.isRequired,

    /**
     * Adds values to the `class` attribute of the root element
     */
    className: PropTypes.string,

    /**
     * Enable using browserHistory for links that are React routes
     */
    enableBrowserHistoryForLinks: PropTypes.bool,

    /**
     * Enable external resources (like images), that were previously disabled by capture.js
     */
    enableExternalResources: PropTypes.bool,

    /**
     * Prefix used for external resources. Look at capture.js for more details
     */
    externalResourcesPrefix: PropTypes.string
}

DangerousHTML.defaultProps = {
    enableBrowserHistoryForLinks: true,
    enableExternalResources: false,
    externalResourcesPrefix: 'x-'
}

export default withRouter(DangerousHTML)
