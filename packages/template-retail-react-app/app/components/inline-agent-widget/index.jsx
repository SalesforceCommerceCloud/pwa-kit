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

const VALID_MODES = ['inline', 'agent-redirect', 'hybrid']

const InlineAgentWidget = ({config, pdpQuestions, productName, productId}) => {
    const containerRef = useInlineAgentWidget(config, {pdpQuestions, productName})

    useEffect(() => {
        if (config.mode !== undefined && !VALID_MODES.includes(config.mode)) {
            console.warn(
                `InlineAgentWidget: unknown mode "${config.mode}". Expected one of ${VALID_MODES.join(', ')}. Falling back to 'inline'.`
            )
        }
    }, [config.mode])

    if (!isConfigured(config)) return null

    // Agent-redirect: no local SCRT2 session — the shim hands the question
    // (pill or typed) off to the main Shopper Agent drawer.
    if (config.mode === 'agent-redirect') {
        return (
            <InlineAgentRedirectShim
                pdpQuestions={pdpQuestions}
                productName={productName}
                productId={productId}
            />
        )
    }

    // 'hybrid' is reserved — PDP-scoped questions stay inline, non-PDP routes
    // to the main drawer. Until that split lands, hybrid renders the inline UMD.
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
         * `'hybrid'` is reserved for future per-pill routing (PDP questions inline,
         * discovery/comparison to the main drawer); currently falls back to inline.
         */
        mode: PropTypes.oneOf(['inline', 'agent-redirect', 'hybrid'])
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
