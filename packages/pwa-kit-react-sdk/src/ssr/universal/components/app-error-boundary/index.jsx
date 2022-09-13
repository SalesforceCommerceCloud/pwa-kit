/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {withRouter} from 'react-router-dom'
import PropTypes from 'prop-types'
import Error from '../../components/_error'
import {HTTPError} from '../../errors'
import {withCorrelationId} from '../with-correlation-id'

export const AppErrorContext = React.createContext()

const isProduction = process.env.NODE_ENV === 'production'

/**
 * @private
 */
class AppErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        console.log('props', props)
        this.state = {
            error: props.error
        }
        this.onGetPropsError = this.onGetPropsError.bind(this)
    }

    componentDidMount() {
        const {history} = this.props

        if (history) {
            this.unlisten = history.listen(() => {
                // Clear error state on location change. This is used when a user
                // clicks the back button after encountering a page with an error.
                if (this.state.error) {
                    this.setState({error: undefined})
                }
            })
        }
    }

    componentWillUnmount() {
        if (this.unlisten) {
            this.unlisten()
        }
    }

    // React's client side error boundaries
    static getDerivedStateFromError(err) {
        console.log('err', err)
        // Update state so the next render will show the fallback UI
        return {error: {message: err.toString(), stack: err.stack}}
    }

    onGetPropsError(err) {
        console.log('err', err)
        if (err instanceof HTTPError) {
            this.setState({
                error: {
                    message: err.message,
                    status: err.status,
                    stack: err.stack
                }
            })
        } else {
            this.setState({
                error: {
                    message: err ? err.toString() : '',
                    status: 500,
                    stack: err ? err.stack : ''
                }
            })
        }
    }

    render() {
        const {children} = this.props
        console.log('render===', this.props)
        console.log('this.state', this.state)
        const error = this.state.error
            ? {
                  message: this.state.error.message,
                  status: this.state.error.status,
                  stack: isProduction ? undefined : this.state.error.stack
              }
            : undefined
        console.log('error', error)
        return (
            <AppErrorContext.Provider value={{onGetPropsError: this.onGetPropsError}}>
                {error ? <Error {...error} correlationId={this.props.correlationId} /> : children}
            </AppErrorContext.Provider>
        )
    }
}

AppErrorBoundary.propTypes = {
    children: PropTypes.node,
    error: PropTypes.shape({
        message: PropTypes.string.isRequired,
        status: PropTypes.number.isRequired
    }),
    history: PropTypes.object
}

export {AppErrorBoundary as AppErrorBoundaryWithoutRouter}
export default withRouter(withCorrelationId(AppErrorBoundary))
