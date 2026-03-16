/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useMemo, useRef} from 'react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {FormattedMessage, useIntl} from 'react-intl'
import {
    Alert,
    AlertIcon,
    Box,
    Button,
    Flex,
    Heading,
    Skeleton,
    Stack,
    Text
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {usePasskeyUser} from '@salesforce/commerce-sdk-react'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {usePasskeyRegistration} from '@salesforce/retail-react-app/app/hooks/use-passkey-registration'

const AccountPasskeys = () => {
    const {formatMessage} = useIntl()
    const headingRef = useRef(null)

    const config = getConfig()
    const isPasskeyEnabled = config?.app?.login?.passkey?.enabled

    const {data: customer} = useCurrentCustomer()
    const {passkeyModal} = usePasskeyRegistration()

    const loginId = useMemo(
        () => customer?.login || customer?.email || '',
        [customer?.login, customer?.email]
    )

    const {
        data: passkeyUser,
        error,
        isLoading,
        refetch
    } = usePasskeyUser({loginId}, {enabled: !!customer?.isRegistered && !!loginId})

    useEffect(() => {
        headingRef?.current?.focus()
    }, [])

    useEffect(() => {
        passkeyModal?.setOnSuccess?.(() => refetch())
    }, [passkeyModal?.setOnSuccess, refetch])

    if (!isPasskeyEnabled) {
        return null
    }

    const credentials = [...(passkeyUser?.credentials || [])].sort((a, b) => {
        const nameA = (a.nickName || '').toLowerCase()
        const nameB = (b.nickName || '').toLowerCase()
        return nameA.localeCompare(nameB)
    })
    const showSkeleton = isLoading && !passkeyUser

    return (
        <Stack data-testid="account-passkeys-page" spacing={6}>
            <Flex align="center" justify="space-between" gap={4} wrap="wrap">
                <Heading as="h1" fontSize="24px" tabIndex="0" ref={headingRef}>
                    <FormattedMessage
                        defaultMessage="Your Registered Passkeys"
                        id="account_passkeys.title.your_registered_passkeys"
                    />
                </Heading>

                <Button onClick={passkeyModal?.onOpen}>
                    <FormattedMessage
                        defaultMessage="Register New Passkey"
                        id="account_passkeys.button.register_new_passkey"
                    />
                </Button>
            </Flex>

            {error && (
                <Alert status="error">
                    <AlertIcon color="red.600" boxSize={4} />
                    <Flex ml={3} align="center" gap={3} wrap="wrap">
                        <Text fontSize="sm">
                            {formatMessage({
                                defaultMessage: 'Unable to load passkeys. Please try again.',
                                id: 'account_passkeys.error.unable_to_load'
                            })}{' '}
                            {process.env.NODE_ENV !== 'production' && error?.message && (
                                <Text as="span" fontFamily="mono" color="red.800">
                                    {error.message}
                                </Text>
                            )}
                        </Text>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => refetch()}
                            isLoading={isLoading}
                        >
                            <FormattedMessage
                                defaultMessage="Retry"
                                id="account_passkeys.button.retry"
                            />
                        </Button>
                    </Flex>
                </Alert>
            )}

            {showSkeleton ? (
                <Stack spacing={4}>
                    <Skeleton height="92px" borderRadius="base" />
                    <Skeleton height="92px" borderRadius="base" />
                </Stack>
            ) : credentials.length === 0 ? (
                <Box layerStyle="cardBordered" padding={6}>
                    <Text>
                        <FormattedMessage
                            defaultMessage="You don't have any registered passkeys yet."
                            id="account_passkeys.message.no_registered_passkeys"
                        />
                    </Text>
                </Box>
            ) : (
                <Stack spacing={4}>
                    {credentials.map((credential) => {
                        const nickname =
                            credential.nickName ||
                            formatMessage({
                                defaultMessage: 'Unnamed passkey',
                                id: 'account_passkeys.label.unnamed_passkey'
                            })

                        return (
                            <Box
                                key={credential.credentialId || credential.id}
                                layerStyle="cardBordered"
                                padding={6}
                            >
                                <Flex align="flex-start" justify="space-between" gap={6}>
                                    <Box minWidth={0}>
                                        <Heading as="h3" size="sm" noOfLines={1}>
                                            {nickname}
                                        </Heading>
                                        <Stack spacing={1} marginTop={2}>
                                            {credential.createdAt && (
                                                <Text fontSize="sm" color="gray.600">
                                                    <FormattedMessage
                                                        defaultMessage="Created: {createdAt}"
                                                        id="account_passkeys.label.created"
                                                        values={{createdAt: credential.createdAt}}
                                                    />
                                                </Text>
                                            )}
                                            {credential.lastUsedAt && (
                                                <Text fontSize="sm" color="gray.600">
                                                    <FormattedMessage
                                                        defaultMessage="Last used: {lastUsedAt}"
                                                        id="account_passkeys.label.last_used"
                                                        values={{lastUsedAt: credential.lastUsedAt}}
                                                    />
                                                </Text>
                                            )}
                                        </Stack>
                                    </Box>

                                    <Button
                                        colorScheme="red"
                                        size="sm"
                                        isDisabled={true}
                                        title={formatMessage({
                                            defaultMessage: 'Delete isn’t available yet.',
                                            id: 'account_passkeys.button.delete_not_available'
                                        })}
                                    >
                                        <FormattedMessage
                                            defaultMessage="Delete"
                                            id="account_passkeys.button.delete"
                                        />
                                    </Button>
                                </Flex>
                            </Box>
                        )
                    })}
                </Stack>
            )}
        </Stack>
    )
}

AccountPasskeys.getTemplateName = () => 'account-passkeys'

export default AccountPasskeys
