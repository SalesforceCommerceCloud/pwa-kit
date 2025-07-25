/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useCallback, useMemo, useState} from 'react'
import {useAccessToken} from '@salesforce/commerce-sdk-react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import useMultiSite from './use-multi-site'
import logger from '../utils/logger-instance'
import {CONSENT_CHANNELS, CONSENT_STATUS, CONSENT_TAGS} from '../constants/marketing-consent'

export const useMarketingConsent = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const {getTokenWhenReady} = useAccessToken()
    const {site, locale} = useMultiSite()
    const {commerceAPI: config} = getConfig()
    const {organizationId} = config.parameters

    // Fallback stub data for development/testing when API is not available
    // TODO: remove these stubs once SCAPI APIs are functional on test instances.
    const fetchStubData = useMemo(
        () => ({
            data: [
                {
                    subscriptionId: 'weekly-newsletter',
                    contactPointValue: 'test@test.com',
                    channel: CONSENT_CHANNELS.EMAIL,
                    status: CONSENT_STATUS.OPT_IN,
                    title: 'Weekly Newsletter',
                    subtitle: 'Get our weekly newsletter with the latest updates.',
                    tags: [CONSENT_TAGS.HOMEPAGE_BANNER, CONSENT_TAGS.USER_PROFILE]
                },
                {
                    subscriptionId: 'weekly-newsletter',
                    contactPointValue: '+1 555 321 7654',
                    channel: CONSENT_CHANNELS.WHATSAPP,
                    status: CONSENT_STATUS.OPT_IN,
                    title: 'Weekly Newsletter',
                    subtitle: 'Get our weekly newsletter with the latest updates.',
                    tags: [CONSENT_TAGS.USER_PROFILE]
                },
                {
                    subscriptionId: 'promotional-offers',
                    contactPointValue: '+1 555 123 4567',
                    channel: CONSENT_CHANNELS.SMS,
                    status: CONSENT_STATUS.OPT_OUT,
                    title: 'Promotional Offers',
                    subtitle: 'Receive special promotional offers.',
                    tags: [CONSENT_TAGS.CHECKOUT_PAGE]
                }
            ]
        }),
        []
    )
    const submitStubData = useMemo(
        () => ({
            subscriptionId: 'weekly-newsletter',
            contactPointValue: 'test@test.com',
            channel: CONSENT_CHANNELS.EMAIL,
            status: CONSENT_STATUS.OPT_IN,
            title: 'Weekly Newsletter',
            subtitle: 'Get our weekly newsletter with the latest updates.',
            tags: [CONSENT_TAGS.HOMEPAGE_BANNER, CONSENT_TAGS.USER_PROFILE]
        }),
        []
    )

    const fetchConsentItems = useCallback(
        async (tags) => {
            setIsLoading(true)
            setError(null)

            try {
                const token = await getTokenWhenReady()
                const queryParams = new URLSearchParams({
                    siteId: site.id,
                    locale: locale.id,
                    ...(tags && {tags})
                })
                const url = `/mobify/proxy/api/marketing/shopper-consents/v1/organizationId/${organizationId}/subscriptions?${queryParams}`

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })

                if (!response.ok) {
                    // TODO: remove this stub when we have a real API
                    return fetchStubData
                    //throw new Error(`HTTP error! status: ${response.status}`)
                }

                return await response.json()
            } catch (err) {
                logger.error('Failed to fetch consent items', {
                    namespace: 'useMarketingConsent.fetchConsentItems',
                    additionalProperties: {
                        error: err.message,
                        tags,
                        siteId: site.id,
                        locale: locale.id
                    }
                })
                setError(err.message || 'Failed to fetch consent items')
                throw err
            } finally {
                setIsLoading(false)
            }
        },
        [getTokenWhenReady, site.id, locale.id, organizationId]
    )

    const submitConsent = useCallback(
        async (consentItem) => {
            setIsLoading(true)
            setError(null)

            try {
                const token = await getTokenWhenReady()
                const url = `/mobify/proxy/api/marketing/shopper-consents/v1/organizationId/${organizationId}/subscriptions`

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(consentItem)
                })

                if (!response.ok) {
                    // TODO: remove this stub when we have a real API
                    return submitStubData
                    // throw new Error(`HTTP error! status: ${response.status}`)
                }

                return await response.json()
            } catch (err) {
                logger.error('Failed to submit consent', {
                    namespace: 'useMarketingConsent.submitConsent',
                    additionalProperties: {
                        error: err.message,
                        subscriptionId: consentItem?.subscriptionId
                    }
                })
                setError(err.message || 'Failed to submit consent')
                throw err
            } finally {
                setIsLoading(false)
            }
        },
        [getTokenWhenReady, organizationId]
    )

    return {
        isLoading,
        error,
        fetchConsentItems,
        submitConsent
    }
}
