/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import {Helmet} from 'react-helmet'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Alert, Box, Button, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import useInlineAgentWidget, {
    isConfigured
} from '@salesforce/retail-react-app/app/hooks/use-inline-agent-widget'
import {handoffToShopperAgent} from '@salesforce/retail-react-app/app/utils/shopper-agent-handoff'

import {resolveEmbeddedWidgetSourceUrl} from '@salesforce/retail-react-app/app/utils/inline-agent-widget-utils'

const VALID_MODES = ['inline', 'shopper-agent', 'hybrid']
const HANDOFF_EVENT = 'inline-agent-widget:handoff'

const InlineAgentWidget = ({config, pdpQuestions, productName, productId}) => {
    const containerRef = useInlineAgentWidget(config, {pdpQuestions, productName})
    const [failedQuestions, setFailedQuestions] = useState([])
    const mode = config?.mode
    const configured = isConfigured(config)

    useEffect(() => {
        if (mode !== undefined && !VALID_MODES.includes(mode)) {
            console.warn(
                `InlineAgentWidget: unknown mode "${mode}". Expected one of ${VALID_MODES.join(
                    ', '
                )}. Falling back to 'inline'.`
            )
        }
    }, [mode])

    useEffect(() => {
        setFailedQuestions([])
        if (!configured || mode !== 'shopper-agent') return
        if (typeof window === 'undefined') return

        const controller = new AbortController()
        const onHandoff = async (ev) => {
            const question = ev.detail?.question
            if (typeof question !== 'string' || !question.trim()) return
            setFailedQuestions((previous) => previous.filter((item) => item.question !== question))
            let result
            try {
                result = await handoffToShopperAgent({
                    question,
                    signal: controller.signal,
                    productContext: {
                        productId,
                        productName,
                        pdpUrl: window.location.href
                    }
                })
            } catch (error) {
                console.error('Shopper Agent handoff failed', error)
            }
            if (!controller.signal.aborted && !result?.seeded) {
                setFailedQuestions((previous) => [
                    ...previous.filter((item) => item.question !== question),
                    {question, provider: result?.provider}
                ])
            }
        }

        document.addEventListener(HANDOFF_EVENT, onHandoff)
        return () => {
            controller.abort()
            document.removeEventListener(HANDOFF_EVENT, onHandoff)
        }
    }, [configured, mode, productId, productName])

    if (!isConfigured(config)) return null

    return (
        <>
            <Helmet>
                <link
                    rel="preconnect"
                    href={new URL(resolveEmbeddedWidgetSourceUrl(config)).origin}
                />
            </Helmet>
            <div ref={containerRef} />
            {failedQuestions.map(({question, provider}) => (
                <Alert key={question} status="error" role="alert" marginTop={2}>
                    <Box>
                        <Text>
                            {provider === 'miaw' ? (
                                <FormattedMessage
                                    id="inline_agent_widget.message.manual_handoff"
                                    defaultMessage="This chat cannot receive questions automatically. Copy your question below and send it in the chat."
                                />
                            ) : (
                                <FormattedMessage
                                    id="inline_agent_widget.message.handoff_failed"
                                    defaultMessage="We couldn't send your question to the assistant. Please try again."
                                />
                            )}
                        </Text>
                        <Text>{question}</Text>
                        {provider !== 'miaw' && (
                            <Button
                                onClick={() =>
                                    document.dispatchEvent(
                                        new CustomEvent(HANDOFF_EVENT, {detail: {question}})
                                    )
                                }
                            >
                                <FormattedMessage
                                    id="inline_agent_widget.button.retry"
                                    defaultMessage="Try again"
                                />
                            </Button>
                        )}
                    </Box>
                </Alert>
            ))}
        </>
    )
}

InlineAgentWidget.propTypes = {
    config: PropTypes.shape({
        enabled: PropTypes.bool,
        cc_embeddedWidgetCdnVersion: PropTypes.string,
        embeddedWidgetSourceUrl: PropTypes.string,
        scrt2Url: PropTypes.string,
        orgId: PropTypes.string,
        esDeveloperName: PropTypes.string,
        placeholder: PropTypes.string,
        mode: PropTypes.oneOf(['inline', 'shopper-agent', 'hybrid'])
    }),
    pdpQuestions: PropTypes.arrayOf(PropTypes.string),
    productName: PropTypes.string,
    productId: PropTypes.string
}

export default InlineAgentWidget
