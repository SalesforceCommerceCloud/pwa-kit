/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {createPropsSelector} from 'reselect-immutable-helpers'
import classNames from 'classnames'

import Icon from '../icon'
import Button from '../button'
import * as selectors from '../../store/push-messaging/selectors'
import {channelOfferShown, subscribe} from '../../store/push-messaging/actions'

import * as actions from './actions'

/**
 * The Inline Ask component is designed to group together the prompts to sign up
 * to the newsletter and for push notifications.
 *
 * @example ./DESIGN.md
 */

export class InlineAsk extends React.Component {
    constructor(props) {
        super(props)

        this.onOptIn = this.onOptIn.bind(this)
    }

    componentDidMount() {
        // Let analytics know that we've shown an offer to opt in to push messaging
        this.props.channelOfferShown(this.props.channelName) // eslint-disable-line react/prop-types
    }

    onOptIn() {
        if (this.props.canSubscribe) {
            // eslint-disable-line react/prop-types
            // Subscribe!
            this.props.subscribe(this.props.channelName) // eslint-disable-line react/prop-types
        } else {
            // We allow users to click the opt in button, but we'll show an in-
            // app notification letting them know it's currently blocked
            this.props.notSupportedNotification(this.props.notificationText) // eslint-disable-line react/prop-types
        }
    }

    render() {
        const {
            descriptionText,
            isSubscribed, // eslint-disable-line react/prop-types
            successText,
            buttonText,
            className
        } = this.props

        const classes = classNames('pw-inline-ask', className)

        return (
            <div className={classes}>
                <p className="pw-inline-ask__description">{descriptionText}</p>
                {isSubscribed ? (
                    <div className="pw-inline-ask__success">
                        <Icon
                            name="check"
                            title="Successfully subscribed"
                            className="pw-inline-ask__success-icon"
                        />
                        <p className="pw-inline-ask__success-text">{successText}</p>
                    </div>
                ) : (
                    <Button className="pw-inline-ask__button" onClick={this.onOptIn}>
                        {buttonText}
                    </Button>
                )}
            </div>
        )
    }
}

InlineAsk.displayName = 'InlineAsk'

InlineAsk.defaultProps = {
    buttonText: 'Opt In',
    descriptionText: 'Get notified on all the latest deals, promotions and new products.',
    successText: 'Successfully subscribed',
    notificationText:
        'Notifications are currently blocked for this site. Open "Settings" to allow notifications.'
}

InlineAsk.propTypes = {
    /**
     * The text on the button the visitor taps to subscribe
     */
    buttonText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    /**
     * Adds values to the `class` attribute of the root element
     */
    className: PropTypes.string,
    /**
     * PROVIDED INTERNALLY: Whether the visitor has blocked notifications or not
     */
    canSubscribe: PropTypes.bool.isRequired,
    /**
     * Custom channel name to use for subscription
     */
    // channelName: PropTypes.func.isRequired, ignored for now
    /**
     * The method to call when we display the component to the visitor
     */
    // channelOfferShown: PropTypes.func.isRequired, ignored - internal property
    /**
     * The text that describes what the visitor is subscribing to
     */
    descriptionText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    /**
     * Text to display in the notification shown to visitors when tapping the
     * opt in button after having blocked push notifications
     */
    notificationText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    /**
     * Whether the visitor is already subscribed
     */
    // isSubscribed: PropTypes.bool.isRequired, ignored - internal property
    /**
     * A dispatch that will display a notification informing the visitor they
     * have blocked notifications, and how to unblock them
     */
    // notSupportedNotification: PropTypes.func.isRequired, ignored - internal property
    /**
     * The method to call when the visitor has indicated they want to subscribe
     */
    // subscribe: PropTypes.func.isRequired, ignored - internal property
    /**
     * The text to show if the visitor successfully subscribes, or if the visitor
     * is already subscribed
     */
    successText: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
}

const mapStateToProps = createPropsSelector({
    canSubscribe: selectors.canSubscribe,
    isSubscribed: selectors.isSubscribed
})

const mapDispatchToProps = {
    notSupportedNotification: actions.messagingNotSupportedNotification,
    channelOfferShown,
    subscribe
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(InlineAsk)
