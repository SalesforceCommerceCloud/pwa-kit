/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useCallback, useMemo} from 'react'
import {
    useShopperConsent,
    useShopperConsentMutation
} from '@salesforce/commerce-sdk-react/hooks/ShopperConsents'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import useMultiSite from './use-multi-site'
import logger from '../utils/logger-instance'
import {CONSENT_CHANNELS, CONSENT_STATUS, CONSENT_TAGS} from '../constants/marketing-consent'

export const useMarketingConsent = SFDC_EXT_MARKETING_CONSENT_ENABLED
    ? () => {
          const {site, locale} = useMultiSite()
          const {commerceAPI: config} = getConfig()
          const {organizationId} = config.parameters

          // Configure the ShopperConsents hooks
          const apiParams = {
              organizationId,
              siteId: site.id,
              locale: locale.id
          }

          const getShopperConsentHook = useShopperConsent(apiParams)
          const submitShopperConsentHook = useShopperConsentMutation(apiParams)

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
                          channel: CONSENT_CHANNELS.SMS,
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
                  try {
                      return await getShopperConsentHook.fetchConsentItems(tags)
                  } catch (err) {
                      logger.error('Failed to fetch consent items', {
                          namespace: 'useMarketingConsent.fetchConsentItems',
                          additionalProperties: {
                              error: err.message,
                              tags
                          }
                      })

                      // TODO: remove this stub when we have a real API
                      return fetchStubData
                  }
              },
              [getShopperConsentHook, fetchStubData]
          )

          const submitConsent = useCallback(
              async (consentItem) => {
                  try {
                      return await submitShopperConsentHook.submitConsent(consentItem)
                  } catch (err) {
                      logger.error('Failed to submit consent', {
                          namespace: 'useMarketingConsent.submitConsent',
                          additionalProperties: {
                              error: err.message,
                              subscriptionId: consentItem?.subscriptionId
                          }
                      })

                      // TODO: remove this stub when we have a real API
                      return submitStubData
                  }
              },
              [submitShopperConsentHook, submitStubData]
          )

          return {
              isLoading: getShopperConsentHook.isLoading || submitShopperConsentHook.isLoading,
              error: getShopperConsentHook.error || submitShopperConsentHook.error,
              fetchConsentItems,
              submitConsent
          }
      }
    : null
