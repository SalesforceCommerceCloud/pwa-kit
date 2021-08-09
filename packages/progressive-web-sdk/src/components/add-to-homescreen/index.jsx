/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {createPropsSelector} from 'reselect-immutable-helpers'

import {getDisplayName} from '../../utils/component-utils'
import {setStatus, promptEvent} from '../../store/add-to-homescreen/actions'
import {ACTIVE, INACTIVE, HIDDEN, UNSUPPORTED} from '../../store/add-to-homescreen/constants'
import {getStatus} from '../../store/add-to-homescreen/selectors'

// This is not a real component, this is just a placeholder used to ensure the
// README.md file gets auto-generated into our docs!
const AddToHomescreen = () => <div />

let installPromptPromise
const registerBeforeInstallPromptHandler = () => {
    /**
     * Register Event Handler
     *
     * This function is used to register the event listener that captures the
     * browser's "add to home screen" event.
     *
     * It is recommended that this function be called as early as possible to help
     * guarantee the browser's `beforeinstallprompt` event is caught.
     */

    if (!installPromptPromise) {
        installPromptPromise = new Promise((resolve) => {
            window.addEventListener(
                'beforeinstallprompt',
                (event) => {
                    event.preventDefault()
                    resolve(event)
                },
                {once: true}
            )
        })
    }

    return installPromptPromise
}

const addToHomescreenHOC = (WrappedComponent) => {
    const displayName = `AddToHomescreen(${getDisplayName(WrappedComponent)})`

    class AddToHomescreen extends React.PureComponent {
        constructor(props) {
            super(props)
            this.prompt = this.prompt.bind(this)
        }

        componentDidMount() {
            registerBeforeInstallPromptHandler().then((result) => {
                /* istanbul ignore next */
                if (!result) {
                    console.error(
                        `Error in <${displayName}>\n\n` +
                            `It was rendered before an event handler was ` +
                            `registered. Make sure to call \`registerBeforeInstallPromptHandler()\` ` +
                            `before the <${displayName}> component renders.`
                    )
                }
            })

            registerBeforeInstallPromptHandler().then(this.props._setStatus.bind(null, ACTIVE))
        }

        /**
         * Prompt
         *
         * This function is passed to the WrappedComponent as a prop to be used
         * as a callback. It will trigger the browser's native "add to
         * homescreen" prompt to appear.
         */
        prompt() {
            // `_promptEventPromise` will take a `beforeinstallprompt` instance
            registerBeforeInstallPromptHandler().then(this.props._promptEventPromise.bind(null))
        }

        render() {
            const props = {
                ...this.props,
                prompt: this.prompt
            }

            // Remove private functions
            delete props._promptEventPromise
            delete props._setStatus

            return <WrappedComponent {...props} />
        }
    }

    AddToHomescreen.displayName = displayName
    AddToHomescreen.propTypes = {
        /**
         * PRIVATE: This function is the promise trigger the "Add To Home
         * Screen" prompt
         */
        _promptEventPromise: PropTypes.func,

        /**
         * PRIVATE: This function will update the "addtoHomescreen" redux store
         * state. The possible values are identical to the values of the ACTIVE,
         * INACTIVE, UNSUPPORTED, and HIDDEN constants.
         */
        _setStatus: PropTypes.func,

        /**
         * Displays the current status of the addToHomescreenHOC component. Can be
         * HIDDEN, ACTIVE, INACTIVE or UNSUPPORTED. These constants are
         * available on the `addToHomescreenHOC` higher order component (i.e.
         * `addToHomescreenHOC.ACTIVE`)
         */
        status: PropTypes.string
    }

    const mapStateToProps = createPropsSelector({
        status: getStatus
    })

    const mapDispatchToProps = {
        _promptEventPromise: promptEvent,
        _setStatus: setStatus
    }

    return connect(
        mapStateToProps,
        mapDispatchToProps,
        null,
        {
            // Hide the `Connect()` part of the React component's display name
            getDisplayName: (name) => name
        }
    )(AddToHomescreen)
}

/**
 * Constants
 */
addToHomescreenHOC.ACTIVE = ACTIVE
addToHomescreenHOC.INACTIVE = INACTIVE
addToHomescreenHOC.HIDDEN = HIDDEN
addToHomescreenHOC.UNSUPPORTED = UNSUPPORTED

export {addToHomescreenHOC as default, registerBeforeInstallPromptHandler, AddToHomescreen}
