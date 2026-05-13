/*
 * Copyright (c) 2025, salesforce.com, inc.
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
import Cookies from 'js-cookie'

import {useAuthHelper, AuthHelpers, useAccessToken, useConfig} from '@salesforce/commerce-sdk-react'
import {useSearchParams} from '@salesforce/retail-react-app/app/hooks'
import {API_ERROR_MESSAGE} from '@salesforce/retail-react-app/app/constants'

const UcpContinue = () => {
    const {formatMessage} = useIntl()
    const [searchParams] = useSearchParams()
    const loginGuestUser = useAuthHelper(AuthHelpers.LoginGuestUser)
    const {getTokenWhenReady} = useAccessToken()
    const config = useConfig()
    const {proxy, organizationId, siteId} = config

    const {basketId, usid, merge, overrideExisting} = searchParams
    const [error, setError] = useState('')

    const hasMissingParams = !basketId || !usid
    useEffect(() => {
        if (hasMissingParams) {
            setError(
                formatMessage({
                    id: 'ucp_continue.error.missing_params',
                    defaultMessage:
                        'Missing required parameters. A valid basket ID and shopper ID are required.'
                })
            )
            return
        }

        const continueCheckout = async () => {
            try {
                // Set the usid cookie so loginGuestUser picks it up and
                // establishes a session for the same anonymous shopper.
                Cookies.set(`usid_${siteId}`, usid)
                await loginGuestUser.mutateAsync()
            } catch {
                setError(formatMessage(API_ERROR_MESSAGE))
                return
            }

            try {
                const accessToken = await getTokenWhenReady()
                const params = new URLSearchParams({siteId})
                if (merge) params.set('merge', merge)
                if (overrideExisting) params.set('overrideExisting', overrideExisting)
                const promoteUrl = `${proxy}/checkout/shopper-baskets/v2/organizations/${organizationId}/baskets/${basketId}/actions/promote?${params}`

                const res = await fetch(promoteUrl, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                })

                if (!res.ok) {
                    if (res.status === 409) {
                        setError(
                            formatMessage({
                                id: 'ucp_continue.error.conflict',
                                defaultMessage:
                                    'A basket already exists for this session. Please specify how to resolve the conflict.'
                            })
                        )
                    } else if (res.status === 404) {
                        setError(
                            formatMessage({
                                id: 'ucp_continue.error.basket_not_found',
                                defaultMessage:
                                    'The basket was not found or is no longer available.'
                            })
                        )
                    } else {
                        setError(formatMessage(API_ERROR_MESSAGE))
                    }
                    return
                }
            } catch {
                setError(formatMessage(API_ERROR_MESSAGE))
                return
            }

            window.location.replace('/checkout')
        }

        continueCheckout()
    }, [])

    return (
        <Box data-testid="ucp-continue-page" bg="gray.50" py={[8, 16]}>
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
                {!error && (
                    <Stack justify="center" align="center" spacing={8} marginBottom={8}>
                        <Spinner
                            opacity={0.85}
                            color="blue.600"
                            animationDuration="0.8s"
                            size="lg"
                        />
                        <Text align="center" fontSize="xl" fontWeight="semibold">
                            <FormattedMessage
                                id="ucp_continue.message.loading"
                                defaultMessage="Preparing your checkout..."
                            />
                        </Text>
                    </Stack>
                )}
            </Container>
        </Box>
    )
}

UcpContinue.getTemplateName = () => 'continue'

export default UcpContinue
