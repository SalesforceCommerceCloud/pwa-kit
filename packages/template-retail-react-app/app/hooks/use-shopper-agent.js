/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useCallback} from 'react'
import {
    useSearchSummaryConfig,
    useCommerceAgentConfig
} from '@salesforce/retail-react-app/app/hooks/use-storefront-config'
import {openShopperAgentWidget} from '@salesforce/retail-react-app/app/utils/shopper-agent-utils'

import {useSearchAssistantSession} from '@salesforce/retail-react-app/app/contexts/search-assistant-session'

/**
 * React hook that returns shopper agent actions.
 *
 * The `open` action is provider-aware: it opens the Commerce Client widget when
 * present, otherwise falls back to the Salesforce Embedded Messaging (MIAW)
 * chat. Structured for future extension (e.g. close, sendMessage).
 */
export function useShopperAgent() {
    const shared = useSearchAssistantSession()
    const settings = useSearchSummaryConfig()
    const agent = useCommerceAgentConfig()
    const canHandoff =
        settings.enabled &&
        settings.agentHandoff &&
        agent.enabled === 'true' &&
        agent.provider === 'commerce-client'
    const open = useCallback(() => {
        if (!canHandoff || !shared?.session.current.active) return openShopperAgentWidget()
        shared.setHandoffState({busy: true, error: null})
        return import('@salesforce/retail-react-app/app/utils/search-agent-handoff')
            .then(({openSearchConversation}) => openSearchConversation(shared.session.current))
            .then(
                () => shared.setHandoffState({busy: false, error: null}),
                (error) =>
                    shared.setHandoffState({
                        busy: false,
                        error:
                            error.message === 'search_not_ready'
                                ? 'Wait for the current answer, then open full agent mode.'
                                : error.message === 'context_expired'
                                ? 'Search again to refresh your conversation before opening the agent.'
                                : 'The handoff could not be confirmed. Check the agent before sending your query again.'
                    })
            )
    }, [shared, canHandoff])

    return {actions: {open}}
}
