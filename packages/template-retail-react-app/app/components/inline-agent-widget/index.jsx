/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import {Helmet} from 'react-helmet'
import PropTypes from 'prop-types'
import useInlineAgentWidget, {
    isConfigured
} from '@salesforce/retail-react-app/app/hooks/use-inline-agent-widget'
import InlineAgentRedirectShim from '@salesforce/retail-react-app/app/components/inline-agent-widget/InlineAgentRedirectShim'

const VALID_MODES = ['inline', 'agent-redirect']

// Demo override: ?mode=inline / ?mode=agent-redirect flips the behavior for
// the current tab without a rebuild. Returns undefined on SSR and for any
// value outside VALID_MODES so the server-rendered default always wins.
const readUrlModeOverride = () => {
    if (typeof window === 'undefined') return undefined
    const override = new URLSearchParams(window.location.search).get('mode')
    return VALID_MODES.includes(override) ? override : undefined
}

const InlineAgentWidget = ({config, pdpQuestions, productName, productId}) => {
    const effectiveMode = readUrlModeOverride() || config.mode
    const effectiveConfig = effectiveMode === config.mode ? config : {...config, mode: effectiveMode}
    const containerRef = useInlineAgentWidget(effectiveConfig, {pdpQuestions, productName})

    useEffect(() => {
        if (config.mode !== undefined && !VALID_MODES.includes(config.mode)) {
            console.warn(
                `InlineAgentWidget: unknown mode "${config.mode}". Expected one of ${VALID_MODES.join(', ')}. Falling back to 'inline'.`
            )
        }
    }, [config.mode])

    if (!isConfigured(effectiveConfig)) return null

    // Agent-redirect mode: no local SCRT2 session. The shim hands the question
    // (pill or typed) off to the main Shopper Agent drawer.
    if (effectiveMode === 'agent-redirect') {
        return (
            <InlineAgentRedirectShim
                pdpQuestions={pdpQuestions}
                productName={productName}
                productId={productId}
            />
        )
    }

    return (
        <>
            <Helmet>
                <script src="/static/inline-agent-widget.umd.js" async></script>
            </Helmet>
            <div ref={containerRef} />
        </>
    )
}

InlineAgentWidget.propTypes = {
    config: PropTypes.shape({
        enabled: PropTypes.bool,
        scrt2Url: PropTypes.string,
        orgId: PropTypes.string,
        esDeveloperName: PropTypes.string,
        placeholder: PropTypes.string,
        /**
         * `'inline'` (default) runs the UMD custom element with its own SCRT2 session.
         * `'agent-redirect'` renders a non-conversational shim that hands shopper
         * questions off to the main Shopper Agent drawer.
         */
        mode: PropTypes.oneOf(['inline', 'agent-redirect'])
    }),
    /**
     * Opener questions for the current product — rendered as tappable pills
     * above the widget input. Typically sourced from the SCAPI
     * `c_pdpQuestions` custom attribute (parsed via `parsePdpQuestions`).
     */
    pdpQuestions: PropTypes.arrayOf(PropTypes.string),
    /**
     * Current product's display name. Templated into the InputBar
     * placeholder — "Ask me anything about <productName>" — so the shopper
     * sees product-grounded prompting on PDP load. Sourced from the SCAPI
     * `name` standard field. When absent, the widget falls back to the
     * generic "Ask me anything" string.
     */
    productName: PropTypes.string,
    /**
     * Current product id. Forwarded as `productContext.productId` when a
     * handoff fires in agent-redirect mode so the main drawer can attach it
     * to the Agentforce routing attributes.
     */
    productId: PropTypes.string
}

export default InlineAgentWidget
