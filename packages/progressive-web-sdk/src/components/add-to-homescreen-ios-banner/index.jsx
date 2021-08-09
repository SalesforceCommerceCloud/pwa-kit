/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Icon from '../icon'

/**
 * This component is a banner with instructions of how to add the web app to the home screen on an ios device. It's only
 * visible on ios devices
 */

class AddToHomescreenIosBanner extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            isClosed: false
        }

        this.closePrompt = this.closePrompt.bind(this)
    }

    closePrompt() {
        this.props.closeBannerCallback()
        this.setState({isClosed: true})
    }

    render() {
        const {className, inlineDisplay} = this.props
        const classes = classNames(
            'pw-add-to-homescreen-ios-banner',
            {'pw-inline-display': inlineDisplay},
            className
        )
        const [instructionText1, instructionText2] = this.props.instructionText.split('&icon')
        return (
            !this.state.isClosed && (
                <div className={classes} aria-live="polite">
                    <div className="pw-add-to-homescreen-ios-banner__instructions">
                        <Icon
                            className="pw-add-to-homescreen-ios-banner__add-to-homescreen-button"
                            name="add-to-homescreen-ios"
                            size="large"
                            title="add to home screen"
                        />
                        <div className="pw-add-to-homescreen-ios-banner__instruction-content">
                            {instructionText1}
                            <Icon
                                className="pw-add-to-homescreen-ios-banner__safari-share-button"
                                name="safari-share"
                                size="size-20"
                                title="safari share button"
                            />
                            {instructionText2}
                        </div>
                    </div>
                    <button
                        className="pw-add-to-homescreen-ios-banner__close"
                        onClick={() => this.closePrompt()}
                    >
                        {this.props.closeButtonText}
                    </button>
                </div>
            )
        )
    }
}

AddToHomescreenIosBanner.defaultProps = {
    closeButtonText: 'Close',
    closeBannerCallback: /* istanbul ignore next */ () => {},
    instructionText: 'Install this app: tap &icon and then Add to Home Screen.'
}

AddToHomescreenIosBanner.propTypes = {
    /**
     * Adds values to the `class` attribute of the root element
     */
    className: PropTypes.string,
    /**
     * A callback function that will be called when the banner is closed.
     */
    closeBannerCallback: PropTypes.func,
    /**
     * The text for the close button. This prop is for i18n.
     */
    closeButtonText: PropTypes.string,
    /**
     * The banner is only supposed to show on the safari browser of an ios device and it's hidden on other browsers or
     * devices. Setting inlineDisplay to true will force the banner to show on any device and it will just show in the
     * place where it's inserted, instead of at the top or bottom.
     */
    inlineDisplay: PropTypes.bool,
    /**
     * This prop is for i18n. The default English instruction is "Install this app: tap [share icon] and then Add to
     * Home Screen". You can overwrite it by providing a new instruction text. Because there is a Safari share icon in
     * the instruction, in your new text, you need to substitute the icon with the string "&icon".
     */
    instructionText: PropTypes.string
}

export default AddToHomescreenIosBanner
