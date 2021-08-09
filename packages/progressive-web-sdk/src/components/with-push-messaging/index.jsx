/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {createPropsSelector} from 'reselect-immutable-helpers'

import Logger from '../../utils/logger'
const logger = new Logger('[Messaging UI]')
import {shouldAsk} from '../../utils/messaging'

import {VISIT_COUNTDOWNS} from '../../store/push-messaging/constants'
import * as messagingActions from '../../store/push-messaging/actions'
import * as messagingSelectors from '../../store/push-messaging/selectors'

import {getDisplayName} from '../../utils/component-utils'

/**
 * Higher order component that provides props and methods for displaying "ask"
 * components to users before triggering the system-ask for enabling push messaging
 * on a given website.
 */
export const withPushMessaging = (WrappedComponent) => {
    class WithPushMessaging extends React.Component {
        constructor(props) {
            super(props)

            this.state = {
                shouldAsk: false
            }

            this.dismissed = this.dismissed.bind(this)
            this.accepted = this.accepted.bind(this)
        }

        componentWillReceiveProps(nextProps) {
            // If we're unable to subscribe (Messaging Client not initialized,
            // visitor blocked permissions, etc.) then don't bother doing anything
            if (!nextProps.canSubscribe && !this.props.canSubscribe) {
                return false
            }

            const shouldAskResult = shouldAsk(logger, nextProps, this.state.shouldAsk)

            if (this.state.shouldAsk !== shouldAskResult) {
                // We only want to trigger a state update if the ask is now eligible
                // or no longer eligible to be shown
                this.setState({
                    shouldAsk: shouldAskResult
                })

                // We only want to trigger analytics for a shown channel offer
                // if it is (ostensibly) now shown to the visitor
                if (shouldAskResult) {
                    this.props.channelOfferShown(this.props.channelName)
                }
            }

            // Return value for testing
            return true
        }

        /**
         * This method should be called upon dismissal of the ask (e.g. a visitor
         * clicking the "Dismiss" button on a prompt). It will change the value
         * of the state variable 'shouldAsk' to false.
         *
         * Visit countdown is started, if not disabled
         */
        dismissed() {
            this.setState({
                shouldAsk: false
            })

            // TODO: Send softask-dismissed analytics event

            this.startVisitCountdown()
            return Promise.resolve()
        }

        startVisitCountdown() {
            if (this.props.deferOnDismissal > 0) {
                logger.forceLog(
                    `Visit countdown started ${
                        this.props.channelName ? `for channel ${this.props.channelName}` : ''
                    }`
                )
                this.props.startVisitCountdown(this.props.deferOnDismissal, this.props.channelName)
            }
        }

        /**
         * This method should be called upon acceptance of the ask (e.g. a visitor
         * clicking the "Accept" button on a prompt)
         *
         * Dismissal of the system ask will start a visit countdown, if not disabled
         */
        accepted() {
            let channels

            if (this.props.channelName) {
                channels = {
                    [this.props.channelName]: true
                }
            }

            return this.props.subscribe(channels).then((messagingState) => {
                if (messagingState.subscribed) {
                    logger.forceLog(
                        `Subscribed ${
                            this.props.channelName ? `to channel ${this.props.channelName}` : ''
                        }`
                    )
                } else if (!messagingState.canSubscribe) {
                    logger.forceLog('Permissions blocked by user; can no longer subscribe.')
                } else {
                    // The user dismissed the system-ask - back-off from asking again
                    this.startVisitCountdown()
                    logger.forceLog('System ask was dismissed')
                }

                return messagingState
            })
        }

        render() {
            return (
                <WrappedComponent
                    // Wrapped components should use `shouldAsk` to toggle final
                    // visibility of the component
                    shouldAsk={this.state.shouldAsk}
                    accepted={this.accepted}
                    dismissed={this.dismissed}
                    // All other props if you'd like to handle it yourself, as
                    // well as those passed through to the wrapped component
                    {...this.props}
                />
            )
        }
    }

    WithPushMessaging.displayName = `WithPushMessaging(${getDisplayName(WrappedComponent)})`
    WithPushMessaging.defaultProps = {
        showOnPageCount: 3,
        deferOnDismissal: 3
    }
    WithPushMessaging.propTypes = {
        /**
         * PROVIDED INTERNALLY.
         * The remaining number of visits to wait for before being eligible to
         * display to the visitor
         */
        [VISIT_COUNTDOWNS]: PropTypes.object.isRequired,
        /**
         * PROVIDED INTERNALLY.
         * Whether we can even ask the visitor to subscribe: i.e. they have not
         * blocked notification permissions, and Messaging Client is ready.
         */
        canSubscribe: PropTypes.bool.isRequired,
        /**
         * PROVIDED INTERNALLY.
         * Provided by Push Messaging, this is called to track opt-in rates via
         * analytics for the given channel name (if provided)
         */
        channelOfferShown: PropTypes.func.isRequired,
        /**
         * An array of subscribed channel names
         */
        channels: PropTypes.array.isRequired,
        /**
         * Whether the visitor is subscribed to Mobify Push Messaging
         */
        isSubscribed: PropTypes.bool.isRequired,
        /**
         * PROVIDED INTERNALLY.
         * The current page count, for use in determining if soft-ask should be shown
         */
        pageCount: PropTypes.number.isRequired,
        /**
         * PROVIDED INTERNALLY.
         * Redux action that sets how many visits to wait for until we show soft-ask again
         */
        startVisitCountdown: PropTypes.func.isRequired,
        /**
         * PROVIDED INTERNALLY.
         * The action that will trigger the browser hard-ask dialog
         */
        subscribe: PropTypes.func.isRequired,
        /**
         * A custom channel name e.g. Asking the visitor to sign up for "New Deals"
         * might have a channel name of "new-deals". Typically, this should be
         * coordinated with Connection Center campaigns
         *
         * Not defining this will subscribe the visitor to all messages
         */
        channelName: PropTypes.string,
        /**
         * The number of visits to a site (visit: a 6 hour period without any
         * page views) needed before asking again
         *
         * Can be set to false to disable entirely
         */
        deferOnDismissal: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
        /**
         * Display the ask every `showOnPageCount` page visits
         */
        showOnPageCount: PropTypes.oneOfType([PropTypes.number, PropTypes.bool])
    }

    return WithPushMessaging
}

const mapStateToProps = createPropsSelector({
    isSubscribed: messagingSelectors.isSubscribed,
    canSubscribe: messagingSelectors.canSubscribe,
    channels: messagingSelectors.getChannels,
    pageCount: messagingSelectors.getPageCount,
    [VISIT_COUNTDOWNS]: messagingSelectors.getVisitCountdowns
})

const mapDispatchToProps = {
    startVisitCountdown: messagingActions.startVisitCountdown,
    subscribe: messagingActions.subscribe,
    channelOfferShown: messagingActions.channelOfferShown
}

const _withPushMessaging = (WrappedComponent) => {
    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(withPushMessaging(WrappedComponent))
}

export default _withPushMessaging
