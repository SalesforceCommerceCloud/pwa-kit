/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {forwardRef, useEffect, useState} from 'react'
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
    CONSENT_CHANNELS
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
 * Allows customers to manage their marketing communication preferences
 */
const MarketingConsentCard = () => {
    const {formatMessage} = useIntl()
    const {data: customer} = useCurrentCustomer()
    const toast = useToast()

    const {
        data: subscriptionsData,
        updateSubscriptions,
        isUpdating,
        getSubscriptionStatus,
        error: consentError
    } = useMarketingConsent()

    const [error, setError] = useState(null)

    // Local state for managing subscription preferences during editing
    const [localPreferences, setLocalPreferences] = useState({
        emailNewsletter: false,
        emailPromotions: false,
        smsAlerts: false
    })

    // Subscription IDs - these should match your Business Manager configuration
    const SUBSCRIPTION_IDS = {
        EMAIL_NEWSLETTER: 'newsletter',
        EMAIL_PROMOTIONS: 'promotional-offers',
        SMS_ALERTS: 'sms-alerts'
    }

    // Update local preferences when data loads
    useEffect(() => {
        if (subscriptionsData && customer?.email) {
            setLocalPreferences({
                emailNewsletter:
                    getSubscriptionStatus(
                        SUBSCRIPTION_IDS.EMAIL_NEWSLETTER,
                        CONSENT_CHANNELS.EMAIL
                    ) === CONSENT_STATUS.OPT_IN,
                emailPromotions:
                    getSubscriptionStatus(
                        SUBSCRIPTION_IDS.EMAIL_PROMOTIONS,
                        CONSENT_CHANNELS.EMAIL
                    ) === CONSENT_STATUS.OPT_IN,
                smsAlerts:
                    getSubscriptionStatus(SUBSCRIPTION_IDS.SMS_ALERTS, CONSENT_CHANNELS.SMS) ===
                    CONSENT_STATUS.OPT_IN
            })
        }
    }, [subscriptionsData, customer?.email])

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

            // Build the subscriptions array to update
            const subscriptions = [
                {
                    subscriptionId: SUBSCRIPTION_IDS.EMAIL_NEWSLETTER,
                    channel: CONSENT_CHANNELS.EMAIL,
                    status: localPreferences.emailNewsletter
                        ? CONSENT_STATUS.OPT_IN
                        : CONSENT_STATUS.OPT_OUT,
                    contactPointValue: customer.email
                },
                {
                    subscriptionId: SUBSCRIPTION_IDS.EMAIL_PROMOTIONS,
                    channel: CONSENT_CHANNELS.EMAIL,
                    status: localPreferences.emailPromotions
                        ? CONSENT_STATUS.OPT_IN
                        : CONSENT_STATUS.OPT_OUT,
                    contactPointValue: customer.email
                }
            ]

            // Only add SMS if customer has a phone number
            if (customer.phoneHome) {
                subscriptions.push({
                    subscriptionId: SUBSCRIPTION_IDS.SMS_ALERTS,
                    channel: CONSENT_CHANNELS.SMS,
                    status: localPreferences.smsAlerts
                        ? CONSENT_STATUS.OPT_IN
                        : CONSENT_STATUS.OPT_OUT,
                    contactPointValue: customer.phoneHome
                })
            }

            await updateSubscriptions(subscriptions)

            toast({
                title: formatMessage({
                    defaultMessage: 'Communication preferences updated',
                    id: 'consent_card.info.preferences_updated'
                }),
                status: 'success',
                isClosable: true
            })
        } catch (err) {
            console.error('Failed to update consent preferences:', err)
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

                <Stack spacing={4}>
                    <FormControl>
                        <Checkbox
                            id="email-newsletter"
                            isChecked={localPreferences.emailNewsletter}
                            onChange={(e) =>
                                setLocalPreferences({
                                    ...localPreferences,
                                    emailNewsletter: e.target.checked
                                })
                            }
                        >
                            <Box>
                                <Text fontWeight="medium">
                                    <FormattedMessage
                                        defaultMessage="Email Newsletter"
                                        id="consent_card.label.email_newsletter"
                                    />
                                </Text>
                                <Text fontSize="sm" color="gray.600">
                                    <FormattedMessage
                                        defaultMessage="Receive our weekly newsletter with product updates and tips"
                                        id="consent_card.description.email_newsletter"
                                    />
                                </Text>
                            </Box>
                        </Checkbox>
                    </FormControl>

                    <FormControl>
                        <Checkbox
                            id="email-promotions"
                            isChecked={localPreferences.emailPromotions}
                            onChange={(e) =>
                                setLocalPreferences({
                                    ...localPreferences,
                                    emailPromotions: e.target.checked
                                })
                            }
                        >
                            <Box>
                                <Text fontWeight="medium">
                                    <FormattedMessage
                                        defaultMessage="Promotional Offers"
                                        id="consent_card.label.promotional_offers"
                                    />
                                </Text>
                                <Text fontSize="sm" color="gray.600">
                                    <FormattedMessage
                                        defaultMessage="Get exclusive deals and special promotions via email"
                                        id="consent_card.description.promotional_offers"
                                    />
                                </Text>
                            </Box>
                        </Checkbox>
                    </FormControl>

                    {customer.phoneHome && (
                        <FormControl>
                            <Checkbox
                                id="sms-alerts"
                                isChecked={localPreferences.smsAlerts}
                                onChange={(e) =>
                                    setLocalPreferences({
                                        ...localPreferences,
                                        smsAlerts: e.target.checked
                                    })
                                }
                            >
                                <Box>
                                    <Text fontWeight="medium">
                                        <FormattedMessage
                                            defaultMessage="SMS Alerts"
                                            id="consent_card.label.sms_alerts"
                                        />
                                    </Text>
                                    <Text fontSize="sm" color="gray.600">
                                        <FormattedMessage
                                            defaultMessage="Receive order updates and important alerts via SMS"
                                            id="consent_card.description.sms_alerts"
                                        />
                                    </Text>
                                </Box>
                            </Checkbox>
                        </FormControl>
                    )}
                </Stack>

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
