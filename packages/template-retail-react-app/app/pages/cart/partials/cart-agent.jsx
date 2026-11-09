/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {Box} from '@salesforce/retail-react-app/app/components/shared/ui'
import InlineAgentWidget from '@salesforce/retail-react-app/app/components/inline-agent-widget'
import {isConfigured} from '@salesforce/retail-react-app/app/hooks/use-inline-agent-widget'

const CartAgent = ({basket, productsByItemId = {}, customerId}) => {
    const {formatMessage} = useIntl()
    const config = getConfig()?.app?.embeddedAgent
    if (
        config?.cartEnabled !== true ||
        config?.enabled !== true ||
        !isConfigured(config) ||
        !basket?.basketId ||
        basket.temporaryBasket ||
        !basket.productItems?.length
    ) {
        return null
    }

    const cartContext = {
        currency: basket.currency,
        items: basket.productItems.map((item) => {
            const product = productsByItemId[item.itemId]
            return {
                productId: item.productId,
                name: product?.name || item.productName,
                quantity: item.quantity,
                variationAttributes: (product?.variationAttributes || [])
                    .filter((attribute) => product.variationValues?.[attribute.id] !== undefined)
                    .map((attribute) => {
                        const value = product.variationValues[attribute.id]
                        return {
                            id: attribute.id,
                            name: attribute.name,
                            value,
                            valueName: attribute.values?.find((option) => option.value === value)
                                ?.name
                        }
                    })
            }
        })
    }

    return (
        <Box mt={6}>
            <InlineAgentWidget
                key={JSON.stringify([basket.basketId, customerId])}
                config={config}
                cartContext={cartContext}
                title={formatMessage({
                    id: 'cart_agent.title',
                    defaultMessage: 'Need help before checkout?'
                })}
                description={formatMessage({
                    id: 'cart_agent.description',
                    defaultMessage: 'Ask about sizing, delivery, returns, or items in your cart.'
                })}
                uiText={{
                    inputLabel: formatMessage({
                        id: 'cart_agent.input_label',
                        defaultMessage: 'Ask a question about your cart'
                    }),
                    placeholder: formatMessage({
                        id: 'cart_agent.placeholder',
                        defaultMessage: 'Ask about your cart'
                    }),
                    sendLabel: formatMessage({
                        id: 'cart_agent.send_label',
                        defaultMessage: 'Send question'
                    }),
                    suggestionsLabel: formatMessage({
                        id: 'cart_agent.suggestions_label',
                        defaultMessage: 'Suggested questions'
                    }),
                    thinkingLabel: formatMessage({
                        id: 'cart_agent.thinking_label',
                        defaultMessage: 'Thinking'
                    }),
                    questionTooLongError: formatMessage({
                        id: 'cart_agent.question_too_long_error',
                        defaultMessage: 'Use 1,500 characters or fewer for your question.'
                    }),
                    connectionError: formatMessage({
                        id: 'cart_agent.connection_error',
                        defaultMessage: 'Unable to reach the server. Please try again.'
                    }),
                    genericError: formatMessage({
                        id: 'cart_agent.generic_error',
                        defaultMessage: 'Something went wrong. Please try again.'
                    }),
                    loaderError: formatMessage({
                        id: 'cart_agent.loader_error',
                        defaultMessage: 'Cart assistance is unavailable. You can still check out.'
                    }),
                    retryLabel: formatMessage({
                        id: 'cart_agent.retry_label',
                        defaultMessage: 'Retry'
                    })
                }}
                pdpQuestions={[
                    formatMessage({
                        id: 'cart_agent.chip.delivery_date',
                        defaultMessage: 'Delivery date'
                    }),
                    formatMessage({
                        id: 'cart_agent.chip.return_policy',
                        defaultMessage: 'Return policy'
                    }),
                    formatMessage({
                        id: 'cart_agent.chip.compare_items',
                        defaultMessage: 'Compare items'
                    })
                ]}
            />
        </Box>
    )
}

CartAgent.propTypes = {
    basket: PropTypes.object,
    productsByItemId: PropTypes.object,
    customerId: PropTypes.string
}
export default CartAgent
