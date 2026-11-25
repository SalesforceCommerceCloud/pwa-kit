/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import {createRoot} from 'react-dom/client'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {IntlProvider} from 'react-intl'
import {ChakraProvider} from '@salesforce/retail-react-app/app/components/shared/ui'
import InlineAgentWidget from '@salesforce/retail-react-app/app/components/inline-agent-widget'
import {parsePdpQuestions} from '@salesforce/retail-react-app/app/utils/inline-agent-widget-utils'
import {useCommerceClientPdpContext} from '@salesforce/retail-react-app/app/hooks/use-commerce-client-page-context'
import useCommerceClientMessaging from '@salesforce/retail-react-app/app/hooks/use-commerce-client-messaging'
import asset from './asset.json'

const products = [
    {id: 'a', name: 'Trail Jacket', questions: '["Is this waterproof?"]'},
    {id: 'b', name: 'Hiking Boots', questions: '["Are these insulated?"]'}
]
const settings = new URLSearchParams(window.location.search)
const managedContext = settings.has('managedContext')
const queryClient = new QueryClient()
const scriptStatus = {loaded: true}
const drawerOptions = {enablePageContext: true}
const fixtureConfig = {
    enabled: settings.get('config') !== 'disabled',
    mode: 'shopper-agent',
    cc_embeddedWidgetCdnVersion: asset.version
}

const state = {opens: 0, sends: [], contexts: [], fallbackSends: 0}
window.fixtureDrawer = state

function ManagedPdpContext({product}) {
    useCommerceClientPdpContext({enabled: true, product})
    useCommerceClientMessaging(scriptStatus, drawerOptions)
    return null
}

function Fixture() {
    const [product, setProduct] = useState(products[0])
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [messages, setMessages] = useState([])
    const [drawerReady, setDrawerReady] = useState(false)

    useEffect(() => {
        window.CimulateMessaging = {
            injectMessagingWidget() {},
            eventHandlers: {
                components: {
                    toggleWidgetOpen(open) {
                        state.opens += 1
                        setDrawerOpen(open)
                    }
                },
                pageContext: {
                    set(context) {
                        state.contexts.push(context)
                    },
                    clear() {
                        state.contexts.push(null)
                    }
                },
                session: {
                    async sendMessage(question) {
                        state.sends.push(question)
                        if (settings.has('rejectFirst') && state.sends.length === 1) {
                            throw new Error('Controlled SDK rejection')
                        }
                        setMessages((previous) => [...previous, question])
                    },
                    sendUserMessage() {
                        state.fallbackSends += 1
                    }
                }
            }
        }
        setDrawerReady(true)
    }, [])

    return (
        <main style={{maxWidth: '42rem', padding: '1rem', margin: 'auto'}}>
            <h1>{product.name}</h1>
            <button
                onClick={() => {
                    window.history.pushState({}, '', '/product/b' + window.location.search)
                    setProduct(products[1])
                }}
            >
                Go to Hiking Boots
            </button>
            {drawerReady && managedContext && <ManagedPdpContext product={product} />}
            <section
                data-testid={drawerReady ? 'pdp-fixture-ready' : undefined}
                aria-label="Product actions"
                style={{marginBlock: '1rem'}}
            >
                <button>Add to Cart</button>
                {drawerReady && (
                    <InlineAgentWidget
                        config={settings.get('config') === 'omitted' ? undefined : fixtureConfig}
                        pdpQuestions={parsePdpQuestions(product.questions)}
                        productName={product.name}
                        productId={product.id}
                        pageContextManaged={managedContext}
                    />
                )}
            </section>
            {drawerOpen && (
                <aside aria-label="Controlled Shopper Agent drawer">
                    <p>Welcome to the fixture drawer</p>
                    {messages.map((message, index) => (
                        <p key={index}>{message}</p>
                    ))}
                </aside>
            )}
        </main>
    )
}

createRoot(document.getElementById('root')).render(
    <IntlProvider locale="en-US">
        <ChakraProvider>
            <QueryClientProvider client={queryClient}>
                <Fixture />
            </QueryClientProvider>
        </ChakraProvider>
    </IntlProvider>
)
