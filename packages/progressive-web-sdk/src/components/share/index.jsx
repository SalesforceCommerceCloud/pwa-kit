/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Sheet from '../sheet'
import ShareSheetContent from './partials/share-sheet-content'
import {noop} from '../../utils/utils'

// A function so that it is testable
const defaultTriggerElement = (
    <button>
        <span>Share…</span>
    </button>
)

const defaultShareContent = {
    title: null,
    text: null,
    url: null
}

const defaultShareSheetHeader = <h1 className="pw-share__sheet-header">Share via</h1>

/**
 * The `Share` component provides a way for Progressive Web Apps
 * to share the URL of the current page.
 *
 * It uses the WebShare API if supported on the current device and falls back
 * to a limited web implementation.
 *
 * @example ./DESIGN.md
 */
class Share extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            isMounted: false,
            webShareSupported: false,
            title: null,
            text: null,
            url: null
        }

        this.onShow = this.onShow.bind(this)
        this.onDismiss = this.onDismiss.bind(this)
    }

    static getDerivedStateFromProps(props, state) {
        const {isMounted} = state
        const {title, text, url} = props.shareContent || {}
        return {
            webShareSupported: isMounted ? navigator.share !== undefined : false,
            title: title || (isMounted ? document.title : null),
            url: url || (isMounted ? window.location.href : null),
            text: text || null
        }
    }

    componentDidMount() {
        this.setState({isMounted: true})
    }

    onShow() {
        const {title, text, url, webShareSupported} = this.state
        if (webShareSupported) {
            navigator
                .share({
                    title,
                    text,
                    url
                })
                .then(this.props.onSuccess)
                .catch((error) => {
                    this.props.onFail(error)
                    console.error('An error has occurred while attempting to share: ', error)
                })
        } else {
            this.props.onShow()
        }
    }

    onDismiss() {
        this.props.onDismiss()
    }

    render() {
        const {
            className,
            coverage,
            duration,
            headerContent,
            open,
            optionsPerCol,
            optionsPerRow,
            triggerElement,
            didDismiss,
            didShow,
            onFail,
            onSuccess,
            willDismiss,
            willShow
        } = this.props
        const {webShareSupported, title, text, url} = this.state

        const classes = classNames('pw-share', className)
        const triggerClasses = classNames('pw-share__trigger', triggerElement.props.className)
        // Bind click handler to the root trigger element
        const triggerComponent = React.cloneElement(triggerElement, {
            className: triggerClasses,
            onClick: this.onShow
        })

        return (
            <div className={classes}>
                {triggerComponent}

                {webShareSupported ? null : (
                    <Sheet
                        coverage={coverage}
                        duration={duration}
                        effect="slide-bottom"
                        headerContent={headerContent}
                        open={open}
                        onDismiss={this.onDismiss}
                        onOpen={didShow}
                        onClose={didDismiss}
                        onBeforeClose={willDismiss}
                        onBeforeOpen={willShow}
                    >
                        <ShareSheetContent
                            optionsPerCol={optionsPerCol}
                            optionsPerRow={optionsPerRow}
                            shareContent={{
                                title,
                                url,
                                text
                            }}
                            onDismiss={this.onDismiss}
                            onFail={onFail}
                            onSuccess={onSuccess}
                        />
                    </Sheet>
                )}
            </div>
        )
    }
}

Share.propTypes = {
    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * Coverage defines the amount of the current viewport taken up by the share
     * sheet content.
     */
    coverage: PropTypes.string,

    /**
     * User-defined function that is called after the `Share` sheet is dismissed.
     */
    didDismiss: PropTypes.func,

    /**
     * User-defined function that is called after the `Share` sheet is shown.
     */
    didShow: PropTypes.func,

    /**
     * Defines the time the show/dismiss animation takes to complete.
     */
    duration: PropTypes.number,

    /**
     * User-defined header of the sheet
     */
    headerContent: PropTypes.element,

    /**
     * Determines whether the Share Sheet is opened or closed.
     */
    open: PropTypes.bool,

    /**
     * Defines the number of share options displayed per column on the `Share` sheet.
     */
    optionsPerCol: PropTypes.number,

    /**
     * Defines the number of share options displayed per row on the `Share` sheet.
     */
    optionsPerRow: PropTypes.number,

    /**
     * Defines what is to be shared by the `Share` component. An object with the following
     * structure: `{title, text, url}`
     */
    shareContent: PropTypes.object,

    /**
     * User-defined element that is responsible for triggering the `Share` sheet.
     */
    triggerElement: PropTypes.element,

    /**
     * User-defined function that is called before the `Share` sheet is dismissed.
     */
    willDismiss: PropTypes.func,

    /**
     * User-defined function that is called before the `Share` sheet is shown.
     */
    willShow: PropTypes.func,

    // Callback Props

    /**
     * User-defined function that is called when the user clicks to dismiss the sheet.
     * Use this to change state and re-render the `Share` sheet through props.
     */
    onDismiss: PropTypes.func,

    /**
     * User-defined function that is called when the component fails to
     * copy or share the URL. `function(error) {...}`
     */
    onFail: PropTypes.func,

    /**
     * User-defined function that is used to trigger the rendering of the sheet.
     * Use this to change state and re-render the `Share` sheet through props.
     */
    onShow: PropTypes.func,

    /**
     * User-defined function that is called when the component successfully
     * triggers the share option that a user selected. `function(shareData) {...}`
     */
    onSuccess: PropTypes.func
}

Share.defaultProps = {
    coverage: '50%',
    duration: 200,
    open: false,
    optionsPerRow: 4,
    optionsPerCol: 2,
    headerContent: defaultShareSheetHeader,
    shareContent: defaultShareContent,
    triggerElement: defaultTriggerElement,
    didDismiss: noop,
    didShow: noop,
    onDismiss: noop,
    onShow: noop,
    onFail: noop,
    onSuccess: noop,
    willDismiss: noop,
    willShow: noop
}

export default Share
