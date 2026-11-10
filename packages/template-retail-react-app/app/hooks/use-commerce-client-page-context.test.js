/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {StrictMode} from 'react'
import PropTypes from 'prop-types'
import {act, render, waitFor} from '@testing-library/react'
import {QueryClient, QueryClientProvider, useQuery} from '@tanstack/react-query'
import {
    getCommerceClientPageContext,
    useCommerceClientPdpContext
} from '@salesforce/retail-react-app/app/hooks/use-commerce-client-page-context'
import useCommerceClientMessaging, {
    injectCommerceClientWidget
} from '@salesforce/retail-react-app/app/hooks/use-commerce-client-messaging'

const productA = {id: 'A', name: 'Product A', imageGroups: [{images: [{link: '/A.jpg'}]}]}
const productB = {id: 'B', name: 'Product B'}
const options = {enablePageContext: true, scrt2Url: 'scrt', orgId: 'org', esDeveloperName: 'agent'}
const ready = {loaded: true, error: false}
const loading = {loaded: false, error: false}

const Pdp = (props) => {
    useCommerceClientPdpContext(props)
    return null
}
const Messaging = ({status = ready, enabled = true}) => {
    useCommerceClientMessaging(status, {...options, enablePageContext: enabled})
    return null
}

Messaging.propTypes = {status: PropTypes.object, enabled: PropTypes.bool}

describe('Commerce Client PDP adapter', () => {
    let queryClient, api, inject, reset

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {queries: {retry: false}},
            logger: {log: jest.fn(), warn: jest.fn(), error: jest.fn()}
        })
        api = {set: jest.fn(), clear: jest.fn()}
        inject = jest.fn()
        reset = jest.fn()
        window.CimulateMessaging = {
            injectMessagingWidget: inject,
            eventHandlers: {pageContext: api, reset, sendMessage: jest.fn()}
        }
    })

    afterEach(() => {
        queryClient.clear()
        delete window.CimulateMessaging
        jest.restoreAllMocks()
    })

    const tree = ({
        product = productA,
        requestedProductId = product.id,
        status = ready,
        showPdp = true,
        enabled = true,
        ...queryState
    } = {}) => (
        <QueryClientProvider client={queryClient}>
            <Messaging status={status} enabled={enabled} />
            {showPdp && (
                <Pdp product={product} requestedProductId={requestedProductId} {...queryState} />
            )}
        </QueryClientProvider>
    )

    test('seeds resolved context before injection, even with the widget rendered first', () => {
        render(tree())
        expect(api.set).toHaveBeenCalledWith({
            type: 'pdp',
            id: 'A',
            name: 'Product A',
            imageUrl: '/A.jpg'
        })
        expect(api.set.mock.invocationCallOrder[0]).toBeLessThan(inject.mock.invocationCallOrder[0])
        expect(inject.mock.calls[0][0].messagingConfig.enablePageContext).toBe(true)
        expect(inject.mock.calls[0][0].messagingConfig.initialPageContext).toBeUndefined()
    })

    test('late bundle loading seeds the latest product rather than the initial product', () => {
        delete window.CimulateMessaging
        const view = render(tree({status: loading}))
        view.rerender(tree({product: productB, status: loading}))
        window.CimulateMessaging = {
            injectMessagingWidget: inject,
            eventHandlers: {pageContext: api}
        }
        view.rerender(tree({product: productB}))
        expect(inject).toHaveBeenCalledTimes(1)
        expect(api.set).toHaveBeenCalledTimes(1)
        expect(api.set).toHaveBeenLastCalledWith({type: 'pdp', id: 'B', name: 'Product B'})
    })

    test('a delayed widget mount cannot restore a stale initial snapshot', () => {
        let activeContext = null
        let mount
        api.set.mockImplementation((context) => {
            activeContext = context
        })
        api.clear.mockImplementation(() => {
            activeContext = null
        })
        inject.mockImplementation(({messagingConfig}) => {
            // Matches the widget's deferred, once-at-mount initial-context behavior.
            mount = () => {
                if (messagingConfig.initialPageContext) api.set(messagingConfig.initialPageContext)
            }
        })
        const view = render(tree())
        view.rerender(tree({requestedProductId: 'B', isPreviousData: true}))
        mount()
        expect(activeContext).toBeNull()
        view.rerender(tree({product: productB}))
        expect(activeContext.id).toBe('B')
    })

    test('an old PDP cleanup cannot clear a newer publisher', () => {
        const pages = (oldPage) => (
            <QueryClientProvider client={queryClient}>
                <Messaging />
                {oldPage && <Pdp key="old" product={productA} requestedProductId="A" />}
                <Pdp key="new" product={productB} requestedProductId="B" />
            </QueryClientProvider>
        )
        const view = render(pages(true))
        expect(getCommerceClientPageContext(queryClient).id).toBe('B')
        view.rerender(pages(false))
        expect(getCommerceClientPageContext(queryClient).id).toBe('B')
        expect(api.clear).not.toHaveBeenCalled()
    })

    test('bundle-first load applies the product through the public API once resolved', () => {
        const view = render(tree({product: undefined, requestedProductId: 'A', isLoading: true}))
        view.rerender(tree())
        expect(api.set).toHaveBeenLastCalledWith(expect.objectContaining({id: 'A'}))
        expect(inject).toHaveBeenCalledTimes(1)
    })

    test('A → B clears A while previous data is rendered, then publishes B', () => {
        const view = render(tree())
        view.rerender(tree({requestedProductId: 'B', isPreviousData: true}))
        expect(getCommerceClientPageContext(queryClient)).toBeNull()
        expect(api.clear).toHaveBeenCalledTimes(1)
        view.rerender(tree({product: productB}))
        expect(api.set).toHaveBeenLastCalledWith({type: 'pdp', id: 'B', name: 'Product B'})
        expect(inject).toHaveBeenCalledTimes(1)
    })

    test('failure or a stale completion cannot restore a different requested product', () => {
        const view = render(tree())
        api.set.mockClear()
        view.rerender(tree({requestedProductId: 'B', isError: true}))
        expect(getCommerceClientPageContext(queryClient)).toBeNull()
        view.rerender(tree({requestedProductId: 'B'}))
        expect(getCommerceClientPageContext(queryClient)).toBeNull()
        expect(api.set).not.toHaveBeenCalled()
    })

    test('leaving PDP clears context without a reset, reinjection, or automatic message', () => {
        const view = render(tree())
        view.rerender(tree({showPdp: false}))
        expect(api.clear).toHaveBeenCalledTimes(1)
        expect(reset).not.toHaveBeenCalled()
        expect(window.CimulateMessaging.eventHandlers.sendMessage).not.toHaveBeenCalled()
        expect(inject).toHaveBeenCalledTimes(1)
        expect(getCommerceClientPageContext(queryClient)).toBeNull()
    })

    test('an authoritative variant selection uses the existing id field', () => {
        const view = render(tree())
        api.set.mockClear()
        view.rerender(tree({variant: {productId: 'A-black'}}))
        expect(api.set).toHaveBeenLastCalledWith({
            type: 'pdp',
            id: 'A-black',
            name: 'Product A',
            imageUrl: '/A.jpg'
        })
        view.rerender(tree({product: {...productA, id: 'A-black'}, requestedProductId: 'A-black'}))
        expect(api.set).toHaveBeenCalledTimes(1)
    })

    test('replayed effects and repeated identical renders do not duplicate injection or restore A', () => {
        const view = render(<StrictMode>{tree()}</StrictMode>)
        expect(inject).toHaveBeenCalledTimes(1)
        view.rerender(<StrictMode>{tree({product: productB})}</StrictMode>)
        api.set.mockClear()
        view.rerender(<StrictMode>{tree({product: {...productB}})}</StrictMode>)
        expect(api.set).not.toHaveBeenCalled()
        expect(getCommerceClientPageContext(queryClient).id).toBe('B')
    })

    test('disabled context neither seeds nor calls the public context API', () => {
        const view = render(tree({enabled: false}))
        view.rerender(tree({product: productB, enabled: false}))
        view.rerender(tree({showPdp: false, enabled: false}))
        expect(inject.mock.calls[0][0].messagingConfig).toEqual(
            expect.objectContaining({enablePageContext: false})
        )
        expect(inject.mock.calls[0][0].messagingConfig.initialPageContext).toBeUndefined()
        expect(api.set).not.toHaveBeenCalled()
        expect(api.clear).not.toHaveBeenCalled()
    })

    test('identifies a missing widget API instead of adding a different transport', () => {
        delete window.CimulateMessaging.eventHandlers.pageContext
        jest.spyOn(console, 'error').mockImplementation(() => {})
        expect(injectCommerceClientWidget(options)).toBe(false)
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('>= 1.52.0'))
        expect(inject).not.toHaveBeenCalled()
    })

    test('SSR without browser globals neither publishes context nor injects the widget', () => {
        const originalWindow = global.window
        delete global.window
        try {
            jest.isolateModules(() => {
                /* eslint-disable @typescript-eslint/no-var-requires */
                const ReactSSR = require('react')
                const {renderToString} = require('react-dom/server.node')
                const {
                    QueryClient: Client,
                    QueryClientProvider: Provider
                } = require('@tanstack/react-query')
                const {
                    useCommerceClientPdpContext: usePdp
                } = require('@salesforce/retail-react-app/app/hooks/use-commerce-client-page-context')
                const {
                    default: useMessaging
                } = require('@salesforce/retail-react-app/app/hooks/use-commerce-client-messaging')
                /* eslint-enable @typescript-eslint/no-var-requires */
                const client = new Client()
                const ServerPage = () => {
                    usePdp({product: productA, requestedProductId: 'A'})
                    useMessaging(ready, options)
                    return null
                }
                const page = ReactSSR.createElement(
                    Provider,
                    {client},
                    ReactSSR.createElement(ServerPage)
                )
                expect(renderToString(page)).toBe('')
                expect(renderToString(page)).toBe('')
                expect(client.getQueryCache().getAll()).toHaveLength(0)
            })
        } finally {
            global.window = originalWindow
        }
        expect(inject).not.toHaveBeenCalled()
        expect(api.set).not.toHaveBeenCalled()
    })

    test('React Query ignores an old request completing after navigation', async () => {
        const resolve = {}
        const Loader = ({id}) => {
            const state = useQuery(
                ['test-product', id],
                () =>
                    new Promise((done) => {
                        resolve[id] = done
                    }),
                {keepPreviousData: true}
            )
            return <Pdp product={state.data} requestedProductId={id} {...state} />
        }
        Loader.propTypes = {id: PropTypes.string}
        const renderRoute = (id) => (
            <QueryClientProvider client={queryClient}>
                <Messaging />
                <Loader id={id} />
            </QueryClientProvider>
        )
        const view = render(renderRoute('A'))
        view.rerender(renderRoute('B'))
        await act(async () => {
            resolve.B(productB)
        })
        await waitFor(() =>
            expect(api.set).toHaveBeenLastCalledWith(expect.objectContaining({id: 'B'}))
        )
        api.set.mockClear()
        await act(async () => {
            resolve.A(productA)
        })
        expect(api.set).not.toHaveBeenCalled()
        expect(getCommerceClientPageContext(queryClient).id).toBe('B')
    })
})
