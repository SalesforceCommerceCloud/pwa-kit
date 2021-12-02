/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import {AuthModal, useAuthModal} from '../../hooks/use-auth-modal'
import PropTypes from 'prop-types'
import {noop} from '../../utils/utils'
import {useIntl} from 'react-intl'
import {useLocation} from 'react-router-dom'
import {useToast} from '../../hooks/use-toast'

const withRegistration = (Component) => {
    const WrappedComponent = ({onClick = noop, ...passThroughProps}) => {
        const customer = useCustomer()
        const authModal = useAuthModal()
        const location = useLocation()
        const {formatMessage, locale} = useIntl()
        const isLoginPage = new RegExp(`^/${locale}/login$`).test(location.pathname)
        const showToast = useToast()

        const handleClick = (e) => {
            e.preventDefault()
            if (!customer.isRegistered) {
                // Do not show auth modal if users is already on the login page
                if (isLoginPage) {
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
