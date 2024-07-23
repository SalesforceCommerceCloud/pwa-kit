/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// This page is here along witht the `callback` route to handle the redirect
// after a user logs in using the SLAS Implementation

import React, {useEffect} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import useGoogleSignInCallback from '../../hooks/use-google-signin-callback'
import {useCurrentCustomer} from '../../hooks/use-current-customer'
import useNavigation from '../../hooks/use-navigation'
import {useLocation } from 'react-router-dom'
// Chakra
import {
    Box,
    VStack,
    Text
} from '@salesforce/retail-react-app/app/components/shared/ui'

const IDPRedirect = () => {
    const navigate = useNavigation()
    const location = useLocation()
    const {data: customer} = useCurrentCustomer()
    const {formatMessage} = useIntl()
    const {authenticationError} = useGoogleSignInCallback({
        labels: {
            missingParameters: formatMessage({
                defaultMessage: 'Missing parameters',
                id: 'idp.redirect.error.missing_parameters'
            })
        }
    })

    useEffect(() => {
        if (customer?.isRegistered) {
            if (location?.state?.directedFrom) {
                navigate(location.state.directedFrom)
            } else {
                navigate('/account')
            }
        }
    }, [customer?.isRegistered])

    return (
        <Box data-testid="IDP-redirect">
            <h1>IDP Redirect</h1>
            {authenticationError && (
                <FormattedMessage
                    defaultMessage="Error logging in with identity provider"
                    id="idp.redirect.error"
                />
            )}
            {!authenticationError && (
                <VStack>
                    <Text>
                        <FormattedMessage
                            defaultMessage="Authenticating"
                            id="idp.redirect.title"
                        />
                    </Text>
                    <Text>
                        <FormattedMessage
                            defaultMessage="Please hold..."
                            id="idp.redirect.loading"
                        />
                    </Text>
                </VStack>
            )}
        </Box>
    )
}

IDPRedirect.getTemplateName = () => 'IDP-redirect'

export default IDPRedirect
