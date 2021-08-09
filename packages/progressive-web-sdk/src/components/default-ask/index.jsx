/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import {noop} from '../../utils/utils'
import withPushMessaging from '../with-push-messaging'

import Icon from '../icon'
import Button from '../button'
import Sheet from '../sheet'

/**
 * Asks the visitor whether they would like to subscribe to push messaging.
 * Selecting 'Accept' will display the browser push notification permission
 * modal, at which point the visitor will have an opportunity to dismiss, block,
 * or provide permission. Providing permission will then subscribe the visitor.
 *
 * Selecting the 'Dismiss' button will dismiss the DefaultAsk for a number of
 * visits to the site (default: 3 - see `deferOnDismissal`)
 */
export class DefaultAsk extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            // This prevents the Sheet from re-opening immediately if the visitor
            // dismisses the system ask and there's no deferOnDismissal and
            // showOnPageCount is 1
            didAccept: false
        }

        this._dismissed = this._dismissed.bind(this)
        this._accepted = this._accepted.bind(this)
    }

    _dismissed() {
        // Returned for ease of testing
        return this.props.dismissed().then(() => {
            this.props.onDismiss(this.props.channelName) // eslint-disable-line react/prop-types
        })
    }

    _accepted() {
        this.setState({
            didAccept: true
        })

        // Returned for ease of testing
        return this.props.accepted().then((messagingState) => {
            if (!messagingState.subscribed) {
                // Re-allow the ask to be shown in this session, but only if the
                // visitor didn't block push notifications entirely
                if (messagingState.canSubscribe) {
                    this.setState({
                        didAccept: false
                    })
                }

                this.props.onDismiss(this.props.channelName) // eslint-disable-line react/prop-types
            } else {
                this.props.onSuccess(this.props.channelName) // eslint-disable-line react/prop-types
            }
        })
    }

    render() {
        const {acceptText, className, contentText, dismissText, subscribeText} = this.props

        const classes = classNames('pw-push-messaging__default-ask', className)

        return (
            <Sheet
                open={this.props.shouldAsk && !this.state.didAccept}
                effect="slide-bottom"
                className={classes}
                coverage="22%"
                maskOpacity={0}
                shrinkToContent
            >
                <div className="pw-push-messaging__default-ask-title u-flexbox">
                    <Icon
                        name="alert"
                        title={subscribeText}
                        className="pw-push-messaging__default-ask-title-icon"
                    />
                    <p className="pw-push-messaging__default-ask-title-content u-flex u-direction-column">
                        {contentText}
                    </p>
                </div>
                <div className="pw-push-messaging__default-ask-actions">
                    <Button
                        className="pw-push-messaging__default-ask-actions-dismiss"
                        onClick={this._dismissed}
                    >
                        {dismissText}
                    </Button>
                    <Button
                        className="pw-push-messaging__default-ask-actions-accept"
                        onClick={this._accepted}
                    >
                        {acceptText}
                    </Button>
                </div>
            </Sheet>
        )
    }
}

DefaultAsk.displayName = 'DefaultAsk'

DefaultAsk.defaultProps = {
    acceptText: 'Yes Please',
    contentText: 'Enable push notifications to receive deals! No email address required.',
    dismissText: 'No Thanks',
    subscribeText: 'Subscribe to Notifications',
    onDismiss: noop,
    onSuccess: noop
}

DefaultAsk.propTypes = {
    /**
     * PROVIDED INTERNALLY. Triggered when the visitor accepts the ask
     */
    accepted: PropTypes.func.isRequired,

    /**
     * PROVIDED INTERNALLY. Triggered when the visitor dismisses the ask
     */
    dismissed: PropTypes.func.isRequired,

    /**
     * PROVIDED INTERNALLY. Whether the ask should be visible to the visitor or not
     */
    shouldAsk: PropTypes.bool.isRequired,

    /**
     * Text to display on the 'Accept' button
     */
    acceptText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    /**
     * A custom channel name e.g. Asking the visitor to sign up for "New Deals"
     * might have a channel name of "new-deals". Typically, this should be
     * coordinated with Connection Center campaigns. Not defining this will
     * subscribe the visitor to all messages, which is the standard behavior.
     */
    // channelName: PropTypes.string, Disabled for now

    /**
     * Adds values to the `class` attribute of the root element
     */
    className: PropTypes.string,

    /**
     * Text to describe what the visitor is signing up for
     */
    contentText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    /**
     * Sets the number of visits to the site that need to occur before the visitor
     * will be shown this ask again (default: 3)
     *
     * Can be set to `false` to disable entirely
     */
    deferOnDismissal: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),

    /**
     * Text to display on the 'Dismiss' button
     */
    dismissText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    /**
     * After how many page visits the ask should be shown (default: 3) - set to
     * `false` to display to the visitor as soon as the Messaging Client is ready
     */
    showOnPageCount: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),

    /**
     * Descriptive text for the icon shown inside the `DefaultAsk` notification
     * message.
     */
    subscribeText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

    /**
     * Triggered when the user either dismisses the ask, or chooses to dismiss or
     * block push notification permissions via the system ask
     */
    onDismiss: PropTypes.func,

    /**
     * Triggered when the user provides push notification permissions via the system ask
     */
    onSuccess: PropTypes.func
}

export default withPushMessaging(DefaultAsk)
