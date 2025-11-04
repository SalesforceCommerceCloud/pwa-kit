/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    useSubscriptions,
    useShopperConsentsMutation,
    ShopperConsentsMutations
} from '@salesforce/commerce-sdk-react'
import {useMemo, useEffect} from 'react'

/**
 * A hook for managing customer marketing consent subscriptions.
 * Provides functionality to retrieve consent preferences and update them individually or in bulk.
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether to enable the subscriptions query (defaults to true)
 * @param {Array<string>} options.tags - Optional array of tags to filter subscriptions (all included)
 * @returns {Object} Object containing:
 *   - data: The consent subscription data
 *   - isLoading: Whether the query is loading
 *   - error: Any error from the query
 *   - updateSubscription: Function to update a single subscription
 *   - updateSubscriptions: Function to update multiple subscriptions
 *   - isUpdating: Whether any update mutation is in progress
 *   - updateError: Any error from update mutations
 *   - getSubscriptionStatus: Helper to get status for a specific subscription and channel
 *   - hasChannel: Helper to check if a subscription has a specific channel
 *   - getSubscriptionsByTagAndChannel: Helper to filter subscriptions by tag and channel
 *
 * @example
 * // Basic usage
 * const {
 *   data,
 *   updateSubscription,
 *   updateSubscriptions,
 *   getSubscriptionStatus,
 *   hasChannel
 * } = useMarketingConsent()
 *
 * // Update single subscription
 * await updateSubscription({
 *   subscriptionId: 'marketing-email',
 *   channel: 'email',
 *   status: 'opt_in',
 *   contactPointValue: 'customer@example.com'
 * })
 *
 * // Update multiple subscriptions
 * await updateSubscriptions([
 *   {
 *     subscriptionId: 'marketing-email',
 *     channel: 'email',
 *     status: 'opt_in',
 *     contactPointValue: 'customer@example.com'
 *   },
 *   {
 *     subscriptionId: 'marketing-sms',
 *     channel: 'sms',
 *     status: 'opt_out',
 *     contactPointValue: '+15551234567'
 *   }
 * ])
 *
 * // Check subscription status
 * const isOptedIn = getSubscriptionStatus('marketing-email', 'email') === 'opt_in'
 *
 * // Check if subscription has a channel
 * const hasEmailChannel = hasChannel('marketing-email', 'email')
 */
export const useMarketingConsent = ({enabled = true, tags = []} = {}) => {
    // Query hook to get current subscriptions
    const subscriptionsQuery = useSubscriptions(
        {
            parameters: {
                ...(tags.length > 0 && {tags: tags.join(',')})
            }
        },
        {
            enabled
        }
    )

    // Mutation hooks for updating subscriptions
    const updateSubscriptionMutation = useShopperConsentsMutation(
        ShopperConsentsMutations.UpdateSubscription
    )
    const updateSubscriptionsMutation = useShopperConsentsMutation(
        ShopperConsentsMutations.UpdateSubscriptions
    )

    // Log warning if no subscriptions found after initial fetch
    useEffect(() => {
        // Only check after the query has completed loading
        if (!subscriptionsQuery.isLoading && enabled) {
            const subscriptions = subscriptionsQuery.data?.data || []
            const hasError = subscriptionsQuery.error

            // Warn if there's an error or no subscriptions found
            if (hasError || subscriptions.length === 0) {
                const tagFilter = tags.length > 0 ? ` (filtered by tags: ${tags.join(', ')})` : ''
                console.warn(
                    `[useMarketingConsent] Marketing Consent feature was enabled, but no subscriptions were found${tagFilter}. ` +
                        'Check that the prerequisite setup was completed in Business Manager.'
                )
                if (hasError) {
                    console.error('[useMarketingConsent] API Error:', subscriptionsQuery.error)
                }
            }
        }
    }, [
        subscriptionsQuery.isLoading,
        subscriptionsQuery.data,
        subscriptionsQuery.error,
        enabled,
        tags
    ])

    // Helper functions
    const helpers = useMemo(() => {
        const subscriptions = subscriptionsQuery.data?.data || []

        /**
         * Get the opt-in/opt-out status for a specific subscription and channel
         * @param {string} subscriptionId - The subscription ID
         * @param {string} channel - The channel type ('email', 'sms', etc.)
         * @returns {string|null} The consent status ('opt_in', 'opt_out') or null if not found
         */
        const getSubscriptionStatus = (subscriptionId, channel) => {
            const subscription = subscriptions.find((sub) => sub.subscriptionId === subscriptionId)
            if (!subscription) return null

            // If the subscription has the channel in its channels set, it's opted in
            // Otherwise, it's opted out or not set
            const hasChannelSet = subscription.channels && subscription.channels.has(channel)
            return hasChannelSet ? 'opt_in' : 'opt_out'
        }

        /**
         * Check if a subscription includes a specific channel
         * @param {string} subscriptionId - The subscription ID
         * @param {string} channel - The channel type ('email', 'sms', etc.)
         * @returns {boolean} True if the subscription includes the channel
         */
        const hasChannel = (subscriptionId, channel) => {
            const subscription = subscriptions.find((sub) => sub.subscriptionId === subscriptionId)
            return subscription?.channels?.has(channel) || false
        }

        /**
         * Get all subscriptions for a specific contact point value (email or phone)
         * @param {string} contactPointValue - The email or phone number
         * @returns {Array} Array of subscriptions matching the contact point
         */
        const getSubscriptionsByContact = (contactPointValue) => {
            return subscriptions.filter((sub) => sub.contactPointValue === contactPointValue)
        }

        /**
         * Get subscriptions filtered by tag and channel
         * Useful for finding all subscriptions that should be opted into for a specific UI location
         * @param {string} tag - The tag to filter by (e.g., 'homepage_banner', 'footer')
         * @param {string} channel - The channel type ('email', 'sms', etc.)
         * @returns {Array} Array of subscription objects matching the tag and channel
         */
        const getSubscriptionsByTagAndChannel = (tag, channel) => {
            return subscriptions.filter((sub) => {
                const hasTag = sub.tags && sub.tags.has(tag)
                const hasChannelMatch = sub.channels && sub.channels.has(channel)
                return hasTag && hasChannelMatch
            })
        }

        return {
            getSubscriptionStatus,
            hasChannel,
            getSubscriptionsByContact,
            getSubscriptionsByTagAndChannel
        }
    }, [subscriptionsQuery.data])

    /**
     * Update a single consent subscription
     * @param {Object} subscriptionData - The subscription data
     * @param {string} subscriptionData.subscriptionId - The subscription ID
     * @param {string} subscriptionData.channel - The channel type ('email', 'sms', etc.)
     * @param {string} subscriptionData.status - The consent status ('opt_in', 'opt_out')
     * @param {string} subscriptionData.contactPointValue - The email or phone number
     * @returns {Promise} Promise resolving to the mutation result
     */
    const updateSubscription = async (subscriptionData) => {
        return updateSubscriptionMutation.mutateAsync({
            parameters: {},
            body: subscriptionData
        })
    }

    /**
     * Update multiple consent subscriptions in bulk
     * @param {Array<Object>} subscriptionsData - Array of subscription data objects
     * @returns {Promise} Promise resolving to the mutation result
     */
    const updateSubscriptions = async (subscriptionsData) => {
        return updateSubscriptionsMutation.mutateAsync({
            parameters: {},
            body: {
                subscriptions: subscriptionsData
            }
        })
    }

    return {
        // Query data and status
        data: subscriptionsQuery.data,
        isLoading: subscriptionsQuery.isLoading,
        isFetching: subscriptionsQuery.isFetching,
        error: subscriptionsQuery.error,
        refetch: subscriptionsQuery.refetch,

        // Mutation functions
        updateSubscription,
        updateSubscriptions,

        // Mutation status
        isUpdating: updateSubscriptionMutation.isLoading || updateSubscriptionsMutation.isLoading,
        isUpdateSuccess:
            updateSubscriptionMutation.isSuccess || updateSubscriptionsMutation.isSuccess,
        updateError: updateSubscriptionMutation.error || updateSubscriptionsMutation.error,

        // Helper functions
        ...helpers
    }
}
