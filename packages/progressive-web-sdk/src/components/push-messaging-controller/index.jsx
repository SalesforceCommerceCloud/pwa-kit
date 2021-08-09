/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {createPropsSelector} from 'reselect-immutable-helpers'

import * as messagingActions from '../../store/push-messaging/actions'
import {canSubscribe, isSubscribed, isSystemAskShown} from '../../store/push-messaging/selectors'
import {MESSAGING_STATUS} from '../../store/push-messaging/constants'
import Logger from '../../utils/logger'
const logger = new Logger('[Messaging UI]')

import Sheet from '../sheet'

const logMessagingInitError = (e) =>
    console.error(
        '[Messaging UI] Could not initialize the Messaging Client.',
        /* istanbul ignore next */ e ? e.message : null
    )

/**
 * Non-UI component to register with the Messaging Client for state updates, as
 * well as handle the rehydration of the Redux store of persisted values important
 * to the Push Messaging components.
 * Also dims the screen when the browser is asking for notification permission,
 * if the setting is enabled.
 */
export class PushMessagingController extends React.Component {
    constructor(props) {
        super(props)

        this.handleStateUpdate = this.handleStateUpdate.bind(this)
        this.handleNotificationClick = this.handleNotificationClick.bind(this)
    }

    componentWillMount() {
        // Recover visit countdown and page count from local storage
        this.props.rehydrateVisitCountdowns()
        this.props.rehydratePageCount()
        this.props.setVisitEndTimestamp()
    }

    componentDidMount() {
        if (
            typeof window.Progressive === 'undefined' ||
            typeof window.Progressive.MessagingClientInitPromise === 'undefined'
        ) {
            logMessagingInitError()

            // Promise returned for ease of testing
            return Promise.resolve()
        }

        // Promise returned for ease of testing
        return window.Progressive.MessagingClientInitPromise.then(() => {
            logger.log('Init start')

            window.Progressive.MessagingClient.register(
                this.handleNotificationClick,
                window.Progressive.MessagingClient.Events.notificationClick
            )

            // Need to return the initial state from registering for state updates
            return window.Progressive.MessagingClient.register(
                this.handleStateUpdate,
                window.Progressive.MessagingClient.Events.messagingStateChange
            )
        })
            .then((state) => {
                logger.log('Init finish')

                const finalState = Object.assign({}, state, {
                    isReady: true, // Deprecated
                    status: MESSAGING_STATUS.READY
                })

                this.props.stateUpdate(finalState)
            })
            .catch((e) => {
                this.props.stateUpdate({
                    status: MESSAGING_STATUS.FAILED
                })

                logMessagingInitError(e)
            })
    }

    // Handler for state update events fired from Messaging Client
    handleStateUpdate(event) {
        logger.log('State update from Messaging Client', event.detail)
        this.props.stateUpdate(event.detail)
    }

    // Handler for notification clicks on push notifications - ultimately these
    // point to a URL we should navigate the app to
    handleNotificationClick(event) {
        const url = event.detail && event.detail.url

        if (typeof url === 'string' && url.length > 0) {
            this.props.notificationClick(url)
        }
    }

    shouldComponentUpdate(nextProps) {
        if (!nextProps.canSubscribe) {
            return false
        }

        // The only time render needs to run is if we're showing or hiding the
        // overlay when the system-ask is being shown/hidden - and only if
        // we want to actually dim the screen
        return (
            nextProps.dimScreenOnSystemAsk &&
            nextProps.isSystemAskShown !== this.props.isSystemAskShown
        )
    }

    render() {
        return (
            // An empty sheet will allow us to easily display the translucent
            // scroll-and-click blocking mask that comes with it when we display
            // the soft-ask
            <Sheet
                open={
                    this.props.dimScreenOnSystemAsk &&
                    !this.props.isSubscribed &&
                    this.props.isSystemAskShown
                }
                effect="modal-center"
                coverage="1%"
                shrinkToContent
            />
        )
    }
}

PushMessagingController.displayName = 'PushMessagingController'

PushMessagingController.defaultProps = {
    dimScreenOnSystemAsk: true
}

PushMessagingController.propTypes = {
    /**
     * PROVIDED INTERNALLY.
     * Whether we can even ask the visitor to subscribe: i.e. they have not
     * blocked notification permissions, and Messaging Client is ready.
     */
    canSubscribe: PropTypes.bool.isRequired,
    /**
     * PROVIDED INTERNALLY.
     * Whether the visitor is subscribed
     *
     */
    isSubscribed: PropTypes.bool.isRequired,
    /**
     * PROVIDED INTERNALLY.
     * Set to true when the browser's native notification permission ask is being
     * presented to the user; false otherwise
     */
    isSystemAskShown: PropTypes.bool.isRequired,
    /**
     * PROVIDED INTERNALLY.
     * Navigates the app to the provided url - using browserHistory.push if it is
     * a detected valid URL - or by setting window.location.href otherwise
     */
    notificationClick: PropTypes.func.isRequired,
    /**
     * PROVIDED INTERNALLY.
     * Rehydrates the Redux store with the persisted page count in local storage,
     * if present
     */
    rehydratePageCount: PropTypes.func.isRequired,
    /**
     * PROVIDED INTERNALLY.
     * Rehydrates the Redux store with persisted visit countdowns in local
     * storage, if present
     */
    rehydrateVisitCountdowns: PropTypes.func.isRequired,
    /**
     * PROVIDED INTERNALLY.
     * Sets a local timestamp 6 hours in the future - which is checked within an
     * app lifetime to determine if a visit has elapsed.
     */
    setVisitEndTimestamp: PropTypes.func.isRequired,
    /**
     * PROVIDED INTERNALLY.
     * Dispatches an action to update Redux representation of Messaging state:
     * - {boolean} subscribed - whether the user is subscribed to Messaging
     * - {boolean} canSubscribe - whether it's possible to ask the user to subscribe
     * - {array} channels - array of subscribed channels
     */
    stateUpdate: PropTypes.func.isRequired,
    /**
     * Whether to dim the screen and block scroll and clicking when the system ask
     * is being shown
     */
    dimScreenOnSystemAsk: PropTypes.bool
}

const mapStateToProps = createPropsSelector({
    canSubscribe,
    isSubscribed,
    isSystemAskShown
})

const mapDispatchToProps = {
    stateUpdate: messagingActions.stateUpdate,
    rehydratePageCount: messagingActions.rehydratePageCount,
    rehydrateVisitCountdowns: messagingActions.rehydrateVisitCountdowns,
    notificationClick: messagingActions.notificationClick,
    setVisitEndTimestamp: messagingActions.setVisitEndTimestamp
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(PushMessagingController)
