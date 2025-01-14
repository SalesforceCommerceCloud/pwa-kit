/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import {defineMessage, useIntl} from 'react-intl'
import {Button} from '@salesforce/retail-react-app/app/components/shared/ui'
import logger from '@salesforce/retail-react-app/app/utils/logger-instance'
import {useAuthHelper, AuthHelpers} from '@salesforce/commerce-sdk-react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useAppOrigin} from '@salesforce/retail-react-app/app/hooks/use-app-origin'
import {setSessionJSONItem, buildRedirectURI} from '@salesforce/retail-react-app/app/utils/utils'

// Icons
import {AppleIcon, GoogleIcon} from '@salesforce/retail-react-app/app/components/icons'

import {
    API_ERROR_MESSAGE,
    FEATURE_UNAVAILABLE_ERROR_MESSAGE
} from '@salesforce/retail-react-app/app/constants'

const IDP_CONFIG = {
    apple: {
        icon: AppleIcon,
        message: defineMessage({
            id: 'login_form.button.apple',
            defaultMessage: 'Apple'
        })
    },
    google: {
        icon: GoogleIcon,
        message: defineMessage({
            id: 'login_form.button.google',
            defaultMessage: 'Google'
        })
    }
}

/**
 * Create a stack of button for social login links
 * @param {array} idps - array of known IDPs to show buttons for
 * @returns
 */
const SocialLogin = ({form, idps = []}) => {
    const {formatMessage} = useIntl()
    const authorizeIDP = useAuthHelper(AuthHelpers.AuthorizeIDP)

    // Build redirectURI from config values
    const appOrigin = useAppOrigin()
    const redirectPath = getConfig()?.app?.login?.social?.redirectURI || ''
    const redirectURI = buildRedirectURI(appOrigin, redirectPath)

    const isIdpValid = (name) => {
        const idp = name.toLowerCase()
        return idp in IDP_CONFIG && IDP_CONFIG[idp]
    }

    useEffect(() => {
        idps.map((name) => {
            if (!isIdpValid(name)) {
                logger.error(
                    `IDP "${name}" is missing or has an invalid configuration in IDP_CONFIG. Valid IDPs are [${Object.keys(
                        IDP_CONFIG
                    ).join(', ')}].`
                )
            }
        })
    }, [idps])

    const onSocialLoginClick = async (name) => {
        try {
            // Save the path where the user logged in
            setSessionJSONItem('returnToPage', window.location.pathname)
            await authorizeIDP.mutateAsync({
                hint: name,
                redirectURI: redirectURI
            })
        } catch (error) {
            const message = /redirect_uri doesn't match/.test(error.message)
                ? formatMessage(FEATURE_UNAVAILABLE_ERROR_MESSAGE)
                : formatMessage(API_ERROR_MESSAGE)
            form.setError('global', {type: 'manual', message})
        }
    }

    return (
        idps && (
            <>
                {idps
                    .filter((name) => isIdpValid(name))
                    .map((name) => {
                        const config = IDP_CONFIG[name.toLowerCase()]
                        const Icon = config?.icon
                        const message = formatMessage(config?.message)
                        return (
                            config && (
                                <Button
                                    onClick={() => {
                                        onSocialLoginClick(name)
                                    }}
                                    borderColor="gray.500"
                                    color="blue.600"
                                    variant="outline"
                                >
                                    <Icon sx={{marginRight: 2}} />
                                    {message}
                                </Button>
                            )
                        )
                    })}
            </>
        )
    )
}

SocialLogin.propTypes = {
    form: PropTypes.object,
    idps: PropTypes.arrayOf(PropTypes.string)
}

export default SocialLogin
