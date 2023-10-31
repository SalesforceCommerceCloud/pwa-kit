/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {withRouter} from 'react-router-dom'
import {Button} from '@salesforce/retail-react-app/app/components/shared/ui'
import {AlertIcon} from '@salesforce/retail-react-app/app/components/icons'

// import Button from '@salesforce/pwa-kit-react-sdk/components/button'
// import Icon from '@salesforce/pwa-kit-react-sdk/components/icon'

/**
 * OfflineBoundary is a React Error boundary that catches errors thrown when
 * dynamically loading pages and renders a fallback.
 */
class OfflineBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            chunkLoadError: false
        }
    }

    componentDidCatch(e) {
        // Only catch errors loading components with @loadable/components. Everything
        // else should bubble up the component tree to the built-in root error boundary.
        if (e.name !== 'ChunkLoadError') {
            throw e
        }
    }

    static getDerivedStateFromError() {
        return {chunkLoadError: true}
    }

    componentDidUpdate(previousProps) {
        const {location: previousLocation, isOnline: wasOnline} = previousProps
        const {location, isOnline} = this.props

        const cameOnline = !wasOnline && isOnline

        const locationChanged = ['pathname', 'search'].some(
            (k) => (previousLocation || {})[k] !== (location || {})[k]
        )

        const shouldClear = cameOnline || locationChanged

        if (shouldClear) {
            this.clearError()
        }
    }

    clearError() {
        // Use an updater in order to only re-render if the state needs to change
        this.setState((prevState) => {
            return prevState.chunkLoadError ? {chunkLoadError: false} : null
        })
    }

    render() {
        const {children} = this.props
        const {chunkLoadError} = this.state

        return (
            <React.Fragment>
                {chunkLoadError ? (
                    <div className="c-offline-boundary u-direction-column u-text-align-center u-padding-top u-padding-bottom">
                        <AlertIcon />

                        <h1 className="u-margin-bottom-md u-text-family">
                            You are currently offline
                        </h1>

                        <p className="u-margin-bottom-lg">
                            {"We couldn't load the next page on this connection. Please try again."}
                        </p>

                        <Button
                            className="u-width-block-full pw--primary qa-retry-button"
                            onClick={() => this.clearError()}
                        >
                            Retry Connection
                        </Button>
                    </div>
                ) : (
                    children
                )}
            </React.Fragment>
        )
    }
}

OfflineBoundary.propTypes = {
    isOnline: PropTypes.bool.isRequired,
    location: PropTypes.object,
    children: PropTypes.node
}

export {OfflineBoundary as UnwrappedOfflineBoundary}
export default withRouter(OfflineBoundary)
