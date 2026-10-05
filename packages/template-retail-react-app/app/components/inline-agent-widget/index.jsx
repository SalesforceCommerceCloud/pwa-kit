/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Helmet} from 'react-helmet'
import PropTypes from 'prop-types'
import useInlineAgentWidget, {
    isConfigured
} from '@salesforce/retail-react-app/app/hooks/use-inline-agent-widget'

const InlineAgentWidget = ({config, pdpQuestions, productName}) => {
    const containerRef = useInlineAgentWidget(config, {pdpQuestions, productName})

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
        placeholder: PropTypes.string
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
    productName: PropTypes.string
}

export default InlineAgentWidget
