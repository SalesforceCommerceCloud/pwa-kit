/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import {UIDReset, UIDFork, UIDConsumer} from 'react-uid'

// This is not a real component, this is just a placeholder used to ensure the
// README.md file gets auto-generated into our docs!
export const withUniqueIdWrapper = () => <div />

/**
 * Higher order component that provides a unique id prop that is safe for
 * use with client and server-side rendered components.
 */

const withUniqueId = (WrappedComponent) => {
    // eslint-disable-next-line react/prefer-stateless-function
    class WithUniqueIdWrapper extends React.Component {
        render() {
            return (
                <UIDReset>
                    <UIDFork>
                        <UIDConsumer>
                            {(uid) => (
                                <WrappedComponent id={uid} {...this.props}>
                                    {this.props.children}
                                </WrappedComponent>
                            )}
                        </UIDConsumer>
                    </UIDFork>
                </UIDReset>
            )
        }
    }

    WithUniqueIdWrapper.propTypes = {
        children: PropTypes.node
    }

    return WithUniqueIdWrapper
}

export default withUniqueId
