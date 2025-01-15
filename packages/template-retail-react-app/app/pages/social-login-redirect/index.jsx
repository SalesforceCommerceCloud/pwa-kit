/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {
    Alert,
    Box,
    Container,
    Stack,
    Text,
    Spinner
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {AlertIcon} from '@salesforce/retail-react-app/app/components/icons'

// Hooks
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useAuthHelper, AuthHelpers, useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {useSearchParams} from '@salesforce/retail-react-app/app/hooks'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useAppOrigin} from '@salesforce/retail-react-app/app/hooks/use-app-origin'
import {
    getSessionJSONItem,
    clearSessionJSONItem,
    buildRedirectURI
} from '@salesforce/retail-react-app/app/utils/utils'
import {API_ERROR_MESSAGE} from '@salesforce/retail-react-app/app/constants'

const SocialLoginRedirect = () => {
    const {formatMessage} = useIntl()
    const navigate = useNavigation()
    const [searchParams] = useSearchParams()
    const loginIDPUser = useAuthHelper(AuthHelpers.LoginIDPUser)
    const {data: customer} = useCurrentCustomer()
    // Build redirectURI from config values
    const appOrigin = useAppOrigin()
    const redirectPath = getConfig().app.login.social?.redirectURI || ''
    const redirectURI = buildRedirectURI(appOrigin, redirectPath)

    const locatedFrom = getSessionJSONItem('returnToPage')
    const mergeBasket = useShopperBasketsMutation('mergeBasket')
    const [error, setError] = useState('')

    // Runs after successful 3rd-party IDP authorization, processing query parameters
    useEffect(() => {
        if (!searchParams.code) {
            return
        }
        const socialLogin = async () => {
            try {
                await loginIDPUser.mutateAsync({
                    code: searchParams.code,
                    redirectURI: redirectURI,
                    ...(searchParams.usid && {usid: searchParams.usid})
                })
            } catch (error) {
                const message = formatMessage(API_ERROR_MESSAGE)
                setError(message)
            }
        }
        socialLogin()
    }, [])

    // If customer is registered, push to secure account page
    useEffect(() => {
        if (!customer?.isRegistered) {
            return
        }
        clearSessionJSONItem('returnToPage')
        mergeBasket.mutate({
            headers: {
                // This is not required since the request has no body
                // but CommerceAPI throws a '419 - Unsupported Media Type' error if this header is removed.
                'Content-Type': 'application/json'
            },
            parameters: {
                createDestinationBasket: true
            }
        })
        if (locatedFrom) {
            navigate(locatedFrom)
        } else {
            navigate('/account')
        }
    }, [customer?.isRegistered])

    return (
        <Box data-testid="login-redirect-page" bg="gray.50" py={[8, 16]}>
            <Container
                paddingTop={16}
                width={['100%', '407px']}
                bg="white"
                paddingBottom={14}
                marginTop={8}
                marginBottom={8}
                borderRadius="base"
            >
                {error && (
                    <Alert status="error" marginBottom={8}>
                        <AlertIcon color="red.500" boxSize={4} />
                        <Text fontSize="sm" ml={3}>
                            {error}
                        </Text>
                    </Alert>
                )}
                <Stack justify="center" align="center" spacing={8} marginBottom={8}>
                    <Spinner opacity={0.85} color="blue.600" animationDuration="0.8s" size="lg" />
                    <Text align="center" fontSize="xl" fontWeight="semibold">
                        <FormattedMessage
                            id="social_login_redirect.message.authenticating"
                            defaultMessage="Authenticating..."
                        />
                    </Text>
                    <Text align="center" fontSize="m">
                        <FormattedMessage
                            id="social_login_redirect.message.redirect_link"
                            defaultMessage="If you are not automatically redirected, click <link>this link</link> to proceed."
                            values={{
                                link: (chunks) => (
                                    <a
                                        href="/account"
                                        style={{color: '#0176D3', textDecoration: 'underline'}}
                                    >
                                        {chunks}
                                    </a>
                                )
                            }}
                        />
                    </Text>
                </Stack>
            </Container>
        </Box>
    )
}

SocialLoginRedirect.getTemplateName = () => 'social-login-redirect'

export default SocialLoginRedirect
