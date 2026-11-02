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
import {handoffToShopperAgent} from '@salesforce/retail-react-app/app/utils/shopper-agent-handoff'

const VALID_MODES = ['inline', 'main-agent', 'hybrid']
const HANDOFF_EVENT = 'inline-agent-widget:handoff'

const InlineAgentWidget = ({config, pdpQuestions, productName, productId}) => {
    const containerRef = useInlineAgentWidget(config, {pdpQuestions, productName})

    useEffect(() => {
        if (config.mode !== undefined && !VALID_MODES.includes(config.mode)) {
            console.warn(
                `InlineAgentWidget: unknown mode "${config.mode}". Expected one of ${VALID_MODES.join(', ')}. Falling back to 'inline'.`
            )
        }
    }, [config.mode])

    // Main-agent: the UMD paints a non-conversational shim and emits a
    // bubbling `inline-agent-widget:handoff` CustomEvent whenever the shopper
    // clicks a pill or submits the input. The host owns the handoff — opens
    // the main Shopper Agent drawer with the question seeded + PDP context.
    useEffect(() => {
        if (config.mode !== 'main-agent') return
        if (typeof window === 'undefined') return

        const onHandoff = (ev) => {
            const question = ev.detail?.question
            if (!question) return
            handoffToShopperAgent({
                question,
                productContext: {
                    productId,
                    productName,
                    pdpUrl: window.location.href
                }
            })
        }

        document.addEventListener(HANDOFF_EVENT, onHandoff)
        return () => {
            document.removeEventListener(HANDOFF_EVENT, onHandoff)
        }
    }, [config.mode, productId, productName])

    if (!isConfigured(config)) return null

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
         * `'main-agent'` renders a non-conversational shim (owned by the UMD)
         * that dispatches an `inline-agent-widget:handoff` CustomEvent on pill
         * click / submit; this component catches it and hands off to the main
         * Shopper Agent drawer.
         * `'hybrid'` is reserved for future per-pill routing (PDP questions inline,
         * discovery/comparison to the main drawer); currently falls back to inline.
         */
        mode: PropTypes.oneOf(['inline', 'main-agent', 'hybrid'])
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
     * Current product id. Attached to `productContext.productId` in the
     * handoff payload so the main drawer can prime its page context and
     * agent routing attributes with the PDP the shopper is on.
     */
    productId: PropTypes.string
}

export default InlineAgentWidget
