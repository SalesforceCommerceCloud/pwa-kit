/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState, useMemo} from 'react'
import {useIntl} from 'react-intl'
import {Alert, Box, Container, Stack, Text, Spinner} from '@chakra-ui/react'

// Hooks
import useNavigation from '../../hooks/use-navigation'
import {useAuthHelper, AuthHelpers, useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {useSearchParams} from '../../hooks'
import {useCurrentCustomer} from '../../hooks'
import {useAppOrigin} from '../../hooks/use-app-origin'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {getSessionJSONItem, clearSessionJSONItem, buildRedirectURI} from '../../utils/utils'
import {API_ERROR_MESSAGE} from '../../../config/constants'
import {AlertIcon} from '../../components/icons'

const SocialLoginRedirect = () => {
    const intl = useIntl()
    const {formatMessage} = intl
    const navigate = useNavigation()
    const [searchParams] = useSearchParams()
    const loginIDPUser = useAuthHelper(AuthHelpers.LoginIDPUser)
    const {data: customer} = useCurrentCustomer()
    // Build redirectURI from config values
    const appOrigin = useAppOrigin()
    const {login} = getConfig()
    const redirectPath = login?.social?.redirectURI || ''
    const redirectURI = buildRedirectURI(appOrigin, redirectPath)

    const locatedFrom = getSessionJSONItem('returnToPage')
    const mergeBasket = useShopperBasketsMutation('mergeBasket')
    const [error, setError] = useState('')

    const messages = useMemo(
        () => ({
            apiError: formatMessage(API_ERROR_MESSAGE),
            authenticating: formatMessage({
                id: 'social_login_redirect.message.authenticating',
                defaultMessage: 'Authenticating...'
            }),
            redirectLink: formatMessage(
                {
                    id: 'social_login_redirect.message.redirect_link',
                    defaultMessage:
                        'If you are not automatically redirected, click <link>this link</link> to proceed.'
                },
                {
                    link: (chunks) => (
                        <a href="/account" style={{color: '#0176D3', textDecoration: 'underline'}}>
                            {chunks}
                        </a>
                    )
                }
            )
        }),
        [intl]
    )

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
                const message = messages.apiError
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
                    <Alert.Root status="error" marginBottom={8}>
                        <Alert.Indicator>
                            <AlertIcon color="red.500" boxSize={4} />
                        </Alert.Indicator>
                        <Text fontSize="sm" ml={3}>
                            {error}
                        </Text>
                    </Alert.Root>
                )}
                <Stack justify="center" align="center" gap={8} marginBottom={8}>
                    <Spinner opacity={0.85} color="blue.600" animationDuration="0.8s" size="lg" />
                    <Text textAlign="center" fontSize="xl" fontWeight="semibold">
                        {messages.authenticating}
                    </Text>
                    <Text textAlign="center" fontSize="m">
                        {messages.redirectLink}
                    </Text>
                </Stack>
            </Container>
        </Box>
    )
}

SocialLoginRedirect.getTemplateName = () => 'social-login-redirect'

export default SocialLoginRedirect
