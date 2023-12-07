/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import React, {useEffect} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {Box, Text, VStack, Spinner} from '@salesforce/retail-react-app/app/components/shared/ui'
import Seo from '@salesforce/retail-react-app/app/components/seo'
import {AlertIcon} from '@salesforce/retail-react-app/app/components/icons'
import {useIdpCallback} from '@salesforce/retail-react-app/app/hooks/use-idp-callback'
import {useLocation} from 'react-router-dom'

const IDPCallback = () => {
    const navigate = useNavigation()
    const location = useLocation()
    const {formatMessage} = useIntl()
    const {customer, error} = useIdpCallback({
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
        <Box data-testid="idp-callback" layerStyle="page">
            <Seo
                title={formatMessage({defaultMessage: 'Redirecting...', id: 'idp.redirect.title'})}
            />
            {error && (
                <VStack>
                    <AlertIcon boxSize={12} color="red.500" />
                    <Text
                        fontSize={{base: 'xx-large', md: 'xxx-large'}}
                        fontWeight="bold"
                        textAlign="center"
                    >
                        <FormattedMessage
                            defaultMessage="Error logging in with identity provider"
                            id="idp.redirect.error"
                        />
                    </Text>
                    <Text fontSize="x-large">{error}</Text>
                </VStack>
            )}
            {!error && (
                <VStack>
                    <Spinner boxSize={12} />
                    <Text
                        fontSize={{base: 'xx-large', md: 'xxx-large'}}
                        fontWeight="bold"
                        textAlign="center"
                    >
                        <FormattedMessage defaultMessage="Authenticating" id="idp.redirect.title" />
                    </Text>
                    <Text fontSize="x-large">
                        <FormattedMessage
                            defaultMessage="Please hold..."
                            id="idp.redirect.message"
                        />
                    </Text>
                </VStack>
            )}
        </Box>
    )
}

IDPCallback.getTemplateName = () => 'idp-callback'

export default IDPCallback
