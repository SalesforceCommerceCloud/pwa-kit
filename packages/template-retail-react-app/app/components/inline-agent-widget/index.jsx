/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {Button} from '@salesforce/retail-react-app/app/components/shared/ui'
import useInlineAgentWidget, {
    isConfigured
} from '@salesforce/retail-react-app/app/hooks/use-inline-agent-widget'

const InlineAgentWidget = ({
    config,
    pdpQuestions,
    productName,
    cartContext,
    title,
    description,
    uiText
}) => {
    const {formatMessage} = useIntl()
    const {containerRef, loadError, retry} = useInlineAgentWidget(config, {
        pdpQuestions,
        productName,
        cartContext,
        title,
        description,
        uiText
    })

    if (!isConfigured(config)) return null

    return (
        <>
            <div ref={containerRef} />
            {loadError && (
                <div>
                    <p role="alert">
                        {uiText?.loaderError ||
                            formatMessage({
                                id: 'inline_agent_widget.loader_error',
                                defaultMessage: 'Assistant is unavailable. Please try again.'
                            })}
                    </p>
                    <Button type="button" onClick={retry}>
                        {uiText?.retryLabel ||
                            formatMessage({
                                id: 'inline_agent_widget.retry_label',
                                defaultMessage: 'Retry'
                            })}
                    </Button>
                </div>
            )}
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
    productName: PropTypes.string,
    cartContext: PropTypes.shape({
        currency: PropTypes.string,
        items: PropTypes.arrayOf(
            PropTypes.shape({
                productId: PropTypes.string,
                name: PropTypes.string,
                quantity: PropTypes.number,
                variationAttributes: PropTypes.arrayOf(
                    PropTypes.shape({
                        id: PropTypes.string,
                        name: PropTypes.string,
                        value: PropTypes.string,
                        valueName: PropTypes.string
                    })
                )
            })
        )
    }),
    title: PropTypes.string,
    description: PropTypes.string,
    uiText: PropTypes.objectOf(PropTypes.string)
}

export default InlineAgentWidget
