/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    useSubscriptions,
    useConfigurations,
    useShopperConsentsMutation,
    ShopperConsentsMutations
} from '@salesforce/commerce-sdk-react'
import {useEffect} from 'react'
import {ENABLE_CONSENT_WITH_MARKETING_CLOUD} from '@salesforce/retail-react-app/app/constants/marketing-consent'

/**
 * A hook for managing customer marketing consent subscriptions.
 * Provides functionality to retrieve consent preferences and update them individually or in bulk.
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether to enable the subscriptions query (defaults to true)
 * @param {Array<string>} options.tags - Optional array of tags to filter subscriptions (all included)
 * @param {string} options.expand - Optional expand parameter (e.g., 'consentStatus' for logged-in user status on profile page)
 * @returns {Object} Object containing:
 *   - data: The consent subscription data
 *   - isLoading: Whether the initial query is loading (only true when enabled=true on mount)
 *   - isFetching: Whether the query is fetching (true during refetch() calls)
 *   - error: Any error from the query
 *   - refetch: Function to manually fetch subscriptions (for use with enabled=false)
 *   - updateSubscription: Function to update a single subscription
 *   - updateSubscriptions: Function to update multiple subscriptions
 *   - isUpdating: Whether any operation is in progress (fetching OR updating)
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
export const useMarketingConsent = ({enabled = true, tags = [], expand} = {}) => {
    // Check if the feature is enabled via Shopper Configurations.
    // Client-only: skip during SSR to avoid adding an API call to every page render.
    const {data: configurations} = useConfigurations({}, {enabled: typeof window !== 'undefined'})
    const isFeatureEnabled =
        configurations?.configurations?.find(
            (config) => config.id === ENABLE_CONSENT_WITH_MARKETING_CLOUD
        )?.value === true

    // Query hook to get current subscriptions
    const subscriptionsQuery = useSubscriptions(
        {
            parameters: {
                ...(tags.length > 0 && {tags: tags.join(',')}),
                ...(expand && {expand})
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
                    `[useMarketingConsent] Marketing Consent feature was enabled, but no subscriptions were found${tagFilter}.`
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

    const subscriptions = subscriptionsQuery.data?.data || []

    /**
     * Get the opt-in/opt-out status for a specific subscription and channel
     * @param {string} subscriptionId - The subscription ID
     * @param {string} channel - The channel type ('email', 'sms', etc.)
     * @param {string} contactPointValue - Optional contact point (email/phone) to check status for specific contact
     * @returns {string|null} The consent status ('opt_in', 'opt_out') or null if not found
     */
    const getSubscriptionStatus = (subscriptionId, channel, contactPointValue) => {
        const subscription = subscriptions.find((sub) => sub.subscriptionId === subscriptionId)
        if (!subscription) return null

        // If expanded with status data and contactPointValue is provided, use the actual status
        if (subscription.status && contactPointValue) {
            const statusEntry = subscription.status.find(
                (s) => s.channel === channel && s.contactPointValue === contactPointValue
            )
            if (statusEntry) {
                return statusEntry.status
            }
        }

        // Fall back to defaultStatus if available (for logged-in users without explicit status)
        if (subscription.defaultStatus) {
            return subscription.defaultStatus
        }

        // Legacy fallback: check if channel exists in channels array
        const hasChannelInArray = subscription.channels && subscription.channels.includes(channel)
        return hasChannelInArray ? 'opt_in' : 'opt_out'
    }

    /**
     * Check if a subscription includes a specific channel
     * @param {string} subscriptionId - The subscription ID
     * @param {string} channel - The channel type ('email', 'sms', etc.)
     * @returns {boolean} True if the subscription includes the channel
     */
    const hasChannel = (subscriptionId, channel) => {
        const subscription = subscriptions.find((sub) => sub.subscriptionId === subscriptionId)
        return subscription?.channels?.includes(channel) || false
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
            const hasTag = sub.tags && sub.tags.includes(tag)
            const hasChannelMatch = sub.channels && sub.channels.includes(channel)
            return hasTag && hasChannelMatch
        })
    }

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
     * Update multiple consent subscriptions in bulk.
     * The bulk endpoint may return HTTP 207 Multi-Status where individual items can fail
     * even though the HTTP request itself succeeds. This function inspects the response
     * and throws if any item has success === false, so callers get standard error semantics.
     *
     * @param {Array<Object>} subscriptionsData - Array of subscription data objects
     * @returns {Promise} Promise resolving to the mutation result
     * @throws {Error} If any item in the bulk response has success === false.
     *   The error includes `response` (full API response) and `failures` (failed items).
     */
    const updateSubscriptions = async (subscriptionsData) => {
        const response = await updateSubscriptionsMutation.mutateAsync({
            parameters: {},
            body: {
                subscriptions: subscriptionsData
            }
        })

        const results = response?.results || []
        const failures = results.filter((r) => r.success === false)

        if (failures.length > 0) {
            failures.forEach((failure) => {
                console.error(
                    '[useMarketingConsent] Bulk update item failed:',
                    failure.error || failure
                )
            })

            const error = new Error(
                `${failures.length} of ${results.length} subscription update(s) failed.`
            )
            error.response = response
            error.failures = failures
            throw error
        }

        return response
    }

    return {
        // Feature flag from Shopper Configurations
        isFeatureEnabled,

        // Query data and status
        data: subscriptionsQuery.data,
        isLoading: subscriptionsQuery.isLoading,
        isFetching: subscriptionsQuery.isFetching,
        error: subscriptionsQuery.error,
        refetch: subscriptionsQuery.refetch,

        // Mutation functions
        updateSubscription,
        updateSubscriptions,

        // Combined loading state - tracks ANY async operation (fetch or mutation)
        // Use this for showing spinners/disabled states during form submission
        isUpdating:
            subscriptionsQuery.isFetching ||
            updateSubscriptionMutation.isLoading ||
            updateSubscriptionsMutation.isLoading,
        isUpdateSuccess:
            updateSubscriptionMutation.isSuccess || updateSubscriptionsMutation.isSuccess,
        updateError: updateSubscriptionMutation.error || updateSubscriptionsMutation.error,

        // Helper functions
        getSubscriptionStatus,
        hasChannel,
        getSubscriptionsByContact,
        getSubscriptionsByTagAndChannel
    }
}
