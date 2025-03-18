/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {AuthModal, useAuthModal} from '@salesforce/retail-react-app/app/hooks/use-auth-modal'
import PropTypes from 'prop-types'
import {noop} from '@salesforce/retail-react-app/app/utils/utils'
import {useIntl} from 'react-intl'
import {useLocation} from 'react-router-dom'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'

/**
 * Higher-order component that modifies the given component's `onClick` to show the login form if
 * the user is not logged in.
 * @param {React.Component} component Component to wrap.
 * @param {(location: Location, locale: string) => boolean} [options.isLoginPage] Function that
 * determines whether the current page is the "login" page, to avoid showing a duplicate modal.
 * Defaults to all paths ending with "/login".
 * @returns {React.Component} wrapped component
 */
const withRegistration = (
    Component,
    {isLoginPage = (loc) => loc.pathname.endsWith('/login')} = {}
) => {
    const WrappedComponent = ({onClick = noop, ...passThroughProps}) => {
        const {data: customer} = useCurrentCustomer()
        const authModal = useAuthModal()
        const showToast = useToast()
        const location = useLocation()
        const {formatMessage, locale} = useIntl()

        const handleClick = (e) => {
            e.preventDefault()
            if (!customer.isRegistered) {
                // Do not show auth modal if users is already on the login page
                if (isLoginPage(location, locale)) {
                    showToast({
                        title: formatMessage({
                            defaultMessage: 'Please sign in to continue!',
                            id: 'with_registration.info.please_sign_in'
                        }),
                        status: 'info'
                    })
                } else {
                    authModal.onOpen()
                }
            } else {
                onClick()
            }
        }

        return (
            <React.Fragment>
                <Component {...passThroughProps} onClick={handleClick} />
                <AuthModal {...authModal} onLoginSuccess={onClick} />
            </React.Fragment>
        )
    }
    WrappedComponent.propTypes = {
        onClick: PropTypes.func
    }
    return WrappedComponent
}

export default withRegistration
