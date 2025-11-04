/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {forwardRef, useEffect, useMemo, useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {
    Alert,
    Box,
    Skeleton as ChakraSkeleton,
    Stack,
    Text,
    Checkbox,
    FormControl,
    Button,
    Heading,
    useToast
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {AlertIcon} from '@salesforce/retail-react-app/app/components/icons'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useMarketingConsent} from '@salesforce/retail-react-app/app/hooks/use-marketing-consent'
import {
    CONSENT_STATUS,
    CONSENT_CHANNELS,
    CONSENT_TAGS
} from '@salesforce/retail-react-app/app/constants/marketing-consent'

/**
 * Skeleton component that uses customer loading state
 */
// eslint-disable-next-line react/prop-types
const Skeleton = forwardRef(({children, height, width, ...rest}, ref) => {
    const {data: customer} = useCurrentCustomer()
    const {isRegistered} = customer
    const size = !isRegistered
        ? {
              height,
              width
          }
        : {}
    return (
        <ChakraSkeleton ref={ref} isLoaded={!customer.isLoading} {...rest} {...size}>
            {children}
        </ChakraSkeleton>
    )
})

Skeleton.displayName = 'Skeleton'

/**
 * Marketing Consent Card Component
 * Dynamically displays all subscriptions configured with the USER_PROFILE tag in Business Manager.
 * Automatically detects which channels (email/SMS) each subscription supports and uses the
 * customer's registered contact information.
 */
const MarketingConsentCard = () => {
    const {formatMessage} = useIntl()
    const {data: customer} = useCurrentCustomer()
    const toast = useToast()

    const {
        data: subscriptionsData,
        updateSubscriptions,
        isUpdating,
        isFetching,
        getSubscriptionStatus,
        error: consentError
    } = useMarketingConsent()

    const [error, setError] = useState(null)
    const [localPreferences, setLocalPreferences] = useState({})

    // Get all subscriptions matching USER_PROFILE tag
    const profileSubscriptions = useMemo(() => {
        const allSubscriptions = subscriptionsData?.data || []
        return allSubscriptions.filter((sub) => sub.tags?.has(CONSENT_TAGS.USER_PROFILE))
    }, [subscriptionsData])

    // Initialize local preferences from fetched subscription statuses
    useEffect(() => {
        if (!profileSubscriptions.length || !customer?.email) return

        const initialPreferences = {}
        profileSubscriptions.forEach((sub) => {
            // Check if opted in for EMAIL channel
            if (sub.channels?.has(CONSENT_CHANNELS.EMAIL)) {
                const emailStatus = getSubscriptionStatus(
                    sub.subscriptionId,
                    CONSENT_CHANNELS.EMAIL
                )
                initialPreferences[`${sub.subscriptionId}_${CONSENT_CHANNELS.EMAIL}`] =
                    emailStatus === CONSENT_STATUS.OPT_IN
            }

            // Check if opted in for SMS channel (only if customer has phone)
            const customerPhone = customer.phoneMobile || customer.phoneHome
            if (customerPhone && sub.channels?.has(CONSENT_CHANNELS.SMS)) {
                const smsStatus = getSubscriptionStatus(sub.subscriptionId, CONSENT_CHANNELS.SMS)
                initialPreferences[`${sub.subscriptionId}_${CONSENT_CHANNELS.SMS}`] =
                    smsStatus === CONSENT_STATUS.OPT_IN
            }
        })

        setLocalPreferences(initialPreferences)
    }, [
        profileSubscriptions,
        customer?.email,
        customer?.phoneMobile,
        customer?.phoneHome,
        getSubscriptionStatus
    ])

    const handleSubmit = async () => {
        if (!customer?.email) {
            setError(
                formatMessage({
                    defaultMessage: 'Email address is required to manage subscriptions.',
                    id: 'consent_card.error.email_required'
                })
            )
            return
        }

        try {
            setError(null)

            const customerPhone = customer.phoneMobile || customer.phoneHome
            const subscriptionsToUpdate = []

            // Build updates for all profile subscriptions based on their supported channels
            profileSubscriptions.forEach((sub) => {
                // Handle EMAIL channel if subscription supports it
                if (sub.channels?.has(CONSENT_CHANNELS.EMAIL)) {
                    const prefKey = `${sub.subscriptionId}_${CONSENT_CHANNELS.EMAIL}`
                    subscriptionsToUpdate.push({
                        subscriptionId: sub.subscriptionId,
                        channel: CONSENT_CHANNELS.EMAIL,
                        status: localPreferences[prefKey]
                            ? CONSENT_STATUS.OPT_IN
                            : CONSENT_STATUS.OPT_OUT,
                        contactPointValue: customer.email
                    })
                }

                // Handle SMS channel if subscription supports it AND customer has phone
                if (customerPhone && sub.channels?.has(CONSENT_CHANNELS.SMS)) {
                    const prefKey = `${sub.subscriptionId}_${CONSENT_CHANNELS.SMS}`
                    subscriptionsToUpdate.push({
                        subscriptionId: sub.subscriptionId,
                        channel: CONSENT_CHANNELS.SMS,
                        status: localPreferences[prefKey]
                            ? CONSENT_STATUS.OPT_IN
                            : CONSENT_STATUS.OPT_OUT,
                        contactPointValue: customerPhone
                    })
                }
            })

            if (subscriptionsToUpdate.length === 0) {
                console.warn(
                    '[MarketingConsentCard] No subscriptions found to update. Check Business Manager configuration for tag:',
                    CONSENT_TAGS.USER_PROFILE
                )
                setError(
                    formatMessage({
                        defaultMessage: 'No subscriptions available to update.',
                        id: 'consent_card.error.no_subscriptions'
                    })
                )
                return
            }

            await updateSubscriptions(subscriptionsToUpdate)

            toast({
                title: formatMessage({
                    defaultMessage: 'Communication preferences updated',
                    id: 'consent_card.info.preferences_updated'
                }),
                status: 'success',
                isClosable: true
            })
        } catch (err) {
            console.error('[MarketingConsentCard] Failed to update consent preferences:', err)
            setError(
                formatMessage({
                    defaultMessage: 'Failed to update preferences. Please try again.',
                    id: 'consent_card.error.update_failed'
                })
            )
        }
    }

    return (
        <Box
            layerStyle="cardBordered"
            data-testid="marketing-consent-card"
            paddingTop={[6, 6, 8]}
            paddingBottom={8}
            paddingLeft={[4, 4, 6]}
            paddingRight={[4, 4, 6]}
        >
            <Stack spacing={6}>
                <Skeleton height="30px" width="200px">
                    <Heading as="h2" fontSize="lg">
                        <FormattedMessage
                            defaultMessage="Marketing Preferences"
                            id="consent_card.title.marketing_preferences"
                        />
                    </Heading>
                </Skeleton>

                {(error || consentError) && (
                    <Alert status="error">
                        <AlertIcon color="red.500" boxSize={4} />
                        <Text fontSize="sm" ml={3}>
                            {error || consentError?.message}
                        </Text>
                    </Alert>
                )}

                <Text fontSize="sm" color="gray.700">
                    <FormattedMessage
                        defaultMessage="Choose how you'd like to hear from us about products, services, and special offers."
                        id="consent_card.description"
                    />
                </Text>

                {isFetching ? (
                    <Stack spacing={4}>
                        <Skeleton height="48px" />
                        <Skeleton height="48px" />
                    </Stack>
                ) : profileSubscriptions.length === 0 ? (
                    <Alert status="info">
                        <AlertIcon color="blue.500" boxSize={4} />
                        <Text fontSize="sm" ml={3}>
                            <FormattedMessage
                                defaultMessage="No marketing preferences are currently available."
                                id="consent_card.message.no_subscriptions"
                            />
                        </Text>
                    </Alert>
                ) : (
                    <Stack spacing={4}>
                        {profileSubscriptions.map((sub) => {
                            const customerPhone = customer.phoneMobile || customer.phoneHome
                            const supportsEmail = sub.channels?.has(CONSENT_CHANNELS.EMAIL)
                            const supportsSms = sub.channels?.has(CONSENT_CHANNELS.SMS)

                            // Determine which channel to show
                            // Prefer EMAIL if available, otherwise SMS (if customer has phone)
                            const showEmailOption = supportsEmail && customer?.email
                            const showSmsOption = supportsSms && customerPhone && !showEmailOption

                            if (!showEmailOption && !showSmsOption) {
                                // Skip subscriptions where customer doesn't have required contact info
                                return null
                            }

                            const channel = showEmailOption
                                ? CONSENT_CHANNELS.EMAIL
                                : CONSENT_CHANNELS.SMS
                            const prefKey = `${sub.subscriptionId}_${channel}`
                            const isChecked = localPreferences[prefKey] || false

                            return (
                                <FormControl key={`${sub.subscriptionId}-${channel}`}>
                                    <Checkbox
                                        id={`${sub.subscriptionId}-${channel}`}
                                        isChecked={isChecked}
                                        onChange={(e) =>
                                            setLocalPreferences({
                                                ...localPreferences,
                                                [prefKey]: e.target.checked
                                            })
                                        }
                                    >
                                        <Box>
                                            <Text fontWeight="medium">
                                                {sub.name || sub.subscriptionId}
                                            </Text>
                                            {sub.description && (
                                                <Text fontSize="sm" color="gray.600">
                                                    {sub.description}
                                                </Text>
                                            )}
                                        </Box>
                                    </Checkbox>
                                </FormControl>
                            )
                        })}
                    </Stack>
                )}

                <Text fontSize="xs" color="gray.600">
                    <FormattedMessage
                        defaultMessage="You can update these preferences at any time. Message and data rates may apply for SMS."
                        id="consent_card.disclaimer"
                    />
                </Text>

                <Box>
                    <Button
                        variant="solid"
                        colorScheme="blue"
                        onClick={handleSubmit}
                        isLoading={isUpdating}
                        loadingText={formatMessage({
                            defaultMessage: 'Saving...',
                            id: 'consent_card.button.saving'
                        })}
                    >
                        <FormattedMessage
                            defaultMessage="Save Preferences"
                            id="consent_card.button.save_preferences"
                        />
                    </Button>
                </Box>
            </Stack>
        </Box>
    )
}

export default MarketingConsentCard
