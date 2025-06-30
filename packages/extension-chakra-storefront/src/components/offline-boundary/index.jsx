/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {withRouter} from 'react-router-dom'
import {Button, Box, Heading, Text} from '@chakra-ui/react'
import {AlertIcon} from '../../components/icons'

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
                    <Box>
                        <AlertIcon />
                        <Heading>You are currently offline</Heading>
                        <Text>
                            {"We couldn't load the next page on this connection. Please try again."}
                        </Text>
                        <Button onClick={() => this.clearError()}>Retry Connection</Button>
                    </Box>
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
