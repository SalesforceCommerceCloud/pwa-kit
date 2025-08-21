/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable no-import-assign */
import React from 'react'
import {act, render, screen, cleanup} from '@testing-library/react'
import {renderToString} from 'react-dom/server'
import Island from '@salesforce/retail-react-app/app/components/island'
import {isServer} from '@salesforce/retail-react-app/app/components/island/utils'
import * as constants from '@salesforce/retail-react-app/app/constants'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

jest.mock('@salesforce/retail-react-app/app/components/island/utils', () => ({
    ...jest.requireActual('@salesforce/retail-react-app/app/components/island/utils'),
    isServer: jest.fn()
}))

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn()
}))

// Setup global mocks
const mockRequestIdleCallback = jest.fn()
const mockCancelIdleCallback = jest.fn()
const mockIntersectionObserver = jest.fn()

/**
 * Helper function to simulate SSR-to-CSR handover.
 */
function renderServerComponent(component) {
    // Mock server environment
    isServer.mockReturnValue(true)

    // Create a container element and populate it with "server-rendered" HTML
    const div = document.createElement('div')
    div.innerHTML = renderToString(component)
    const containerServer = div.cloneNode(true)

    // Mock client environment
    isServer.mockReturnValue(false)

    const {container, ...rest} = render(component, {hydrate: true, container: div})
    return {
        container: container.firstElementChild,
        containerServer: containerServer.firstElementChild,
        ...rest
    }
}

describe('Island Component', () => {
    let originalFlagValue

    beforeAll(() => (originalFlagValue = constants.PARTIAL_HYDRATION_ENABLED))

    afterAll(() => Reflect.set(constants, 'PARTIAL_HYDRATION_ENABLED', originalFlagValue))

    beforeEach(() => {
        jest.clearAllMocks()
        // Set default config to enable partial hydration
        getConfig.mockReturnValue({
            app: {
                partialHydrationEnabled: true
            }
        })
        // Keep the constant as fallback for backward compatibility tests
        Reflect.set(constants, 'PARTIAL_HYDRATION_ENABLED', true)
        global.requestIdleCallback = mockRequestIdleCallback
        global.cancelIdleCallback = mockCancelIdleCallback
        global.IntersectionObserver = mockIntersectionObserver
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe('Server-Side Rendering (SSR)', () => {
        beforeEach(() => {
            // Mock server environment
            isServer.mockReturnValue(true)
        })

        test('should not render an island at all if config "partialHydrationEnabled" is false', () => {
            getConfig.mockReturnValue({
                app: {
                    partialHydrationEnabled: false
                }
            })

            const {container} = render(
                <Island>
                    <div data-testid="server-content">Server Content</div>
                </Island>
            )
            expect(screen.getByTestId('server-content')).toBeInTheDocument()
            expect(screen.getByText('Server Content')).toBeInTheDocument()
            expect(screen.getByTestId('server-content')).toBe(container.firstElementChild)
        })

        test('should render children immediately', () => {
            const {container} = render(
                <Island>
                    <div data-testid="server-content">Server Content</div>
                </Island>
            )

            expect(container.firstElementChild?.dataset?.sfdcIslandOrigin).toBe('server')
            expect(screen.getByTestId('server-content')).toBeInTheDocument()
            expect(screen.getByText('Server Content')).toBeInTheDocument()
        })

        test('should handle clientOnly prop', () => {
            const {container} = render(
                <Island clientOnly={true}>
                    <div data-testid="client-content">Client Content</div>
                </Island>
            )

            expect(container.firstElementChild?.dataset?.sfdcIslandOrigin).toBe('server')
            expect(screen.queryByTestId('client-content')).not.toBeInTheDocument()
        })

        test('should apply correct styles and attributes', () => {
            const {container} = render(
                <Island>
                    <div>Server Content</div>
                </Island>
            )

            const wrapper = container.firstElementChild
            expect(wrapper?.dataset?.sfdcIslandOrigin).toBe('server')
            expect(wrapper).toHaveStyle({display: 'contents'})
        })
    })

    describe('Client-Side Rendering (CSR)', () => {
        test('should not render an island at all if config "partialHydrationEnabled" is false', () => {
            getConfig.mockReturnValue({
                app: {
                    partialHydrationEnabled: false
                }
            })

            const {container} = render(
                <Island>
                    <div data-testid="server-content">Server Content</div>
                </Island>
            )
            expect(screen.getByTestId('server-content')).toBeInTheDocument()
            expect(screen.getByText('Server Content')).toBeInTheDocument()
            expect(screen.getByTestId('server-content')).toBe(container.firstElementChild)
        })

        test('should hydrate immediately if no SSR content exists', () => {
            const {container} = renderServerComponent(<Island hydrateOn={'visible'}></Island>)

            expect(container?.dataset?.sfdcIslandOrigin).toBe('client')
            expect(container).toHaveStyle({display: 'contents'})
            expect(container.firstElementChild).toBeNull()
        })

        describe('Hydration Strategy: load', () => {
            test('should hydrate immediately when strategy is undefined', async () => {
                const {container, getByTestId, getByText} = renderServerComponent(
                    <Island>
                        <div data-testid="load-content">Load Content</div>
                    </Island>
                )

                expect(container?.dataset?.sfdcIslandOrigin).toBe('client')
                expect(container).toHaveStyle({display: 'contents'})
                expect(getByTestId('load-content')).toBeDefined()
                expect(getByText('Load Content')).toBeDefined()
            })

            test('should hydrate immediately when strategy is "load"', async () => {
                const {container, getByTestId, getByText} = renderServerComponent(
                    <Island hydrateOn={'load'}>
                        <div data-testid="load-content">Load Content</div>
                    </Island>
                )

                expect(container?.dataset?.sfdcIslandOrigin).toBe('client')
                expect(container).toHaveStyle({display: 'contents'})
                expect(getByTestId('load-content')).toBeDefined()
                expect(getByText('Load Content')).toBeDefined()
            })

            test('should handle clientOnly prop', async () => {
                const {container, containerServer, getByTestId, getByText} = renderServerComponent(
                    <Island hydrateOn={'load'} clientOnly={true}>
                        <div data-testid="load-content">Load Content</div>
                    </Island>
                )

                expect(containerServer?.firstElementChild).toBeNull()
                expect(container?.dataset?.sfdcIslandOrigin).toBe('client')
                expect(container).toHaveStyle({display: 'contents'})
                expect(getByTestId('load-content')).toBeDefined()
                expect(getByText('Load Content')).toBeDefined()
            })
        })

        describe('Hydration Strategy: idle', () => {
            let mockIdleCallback

            beforeEach(() => {
                mockRequestIdleCallback.mockImplementation((callback) => {
                    mockIdleCallback = callback
                    return 123
                })
            })

            test('should use requestIdleCallback when available', async () => {
                const {container, getByTestId, getByText} = renderServerComponent(
                    <Island hydrateOn={'idle'}>
                        <div data-testid="idle-content">Idle Content</div>
                    </Island>
                )

                // Initially should show server-rendered content
                jest.spyOn(global, 'cancelIdleCallback')
                expect(container?.dataset?.sfdcIslandOrigin).toBe('server')
                expect(container).toHaveStyle({display: 'contents'})
                expect(getByTestId('idle-content')).toBeDefined()
                expect(getByText('Idle Content')).toBeDefined()

                // Should call requestIdleCallback but not hydrate yet
                expect(mockRequestIdleCallback).toHaveBeenCalledTimes(1)
                expect(mockRequestIdleCallback).toHaveBeenCalledWith(
                    expect.any(Function),
                    undefined
                )
                expect(mockIdleCallback).toBeDefined()

                // Call the idle callback to trigger hydration
                await act(() => mockIdleCallback())

                // Should seamlessly transition to show hydrated content
                expect(container?.dataset?.sfdcIslandOrigin).toBe('client')
                expect(container).toHaveStyle({display: 'contents'})
                expect(getByTestId('idle-content')).toBeDefined()
                expect(getByText('Idle Content')).toBeDefined()

                expect(global.cancelIdleCallback).toHaveBeenCalledTimes(1)
                expect(global.cancelIdleCallback).toHaveBeenCalledWith(123)
            })

            test('should use custom options when provided', async () => {
                const customOptions = {timeout: 500}
                renderServerComponent(
                    <Island hydrateOn={'idle'} options={customOptions}>
                        <div data-testid="idle-content">Idle Content</div>
                    </Island>
                )

                expect(mockRequestIdleCallback).toHaveBeenCalledTimes(1)
                expect(mockRequestIdleCallback).toHaveBeenCalledWith(
                    expect.any(Function),
                    customOptions
                )
                expect(mockCancelIdleCallback).not.toHaveBeenCalled()
            })

            test('should fall back to setTimeout when requestIdleCallback unavailable', async () => {
                delete global.requestIdleCallback

                jest.useFakeTimers()

                const {container, getByTestId, getByText} = renderServerComponent(
                    <Island hydrateOn={'idle'}>
                        <div data-testid="idle-content">Idle Content</div>
                    </Island>
                )

                // Initially should show server-rendered content
                expect(container?.dataset?.sfdcIslandOrigin).toBe('server')
                expect(container).toHaveStyle({display: 'contents'})
                expect(getByTestId('idle-content')).toBeDefined()
                expect(getByText('Idle Content')).toBeDefined()
                expect(global.setTimeout).toHaveBeenCalledTimes(1)
                expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 200)

                await act(() => jest.advanceTimersByTime(200))

                // Should seamlessly transition to show hydrated content
                expect(container?.dataset?.sfdcIslandOrigin).toBe('client')
                expect(container).toHaveStyle({display: 'contents'})
                expect(getByTestId('idle-content')).toBeDefined()
                expect(getByText('Idle Content')).toBeDefined()

                expect(global.clearTimeout).toHaveBeenCalledTimes(1)
                expect(global.clearTimeout).toHaveBeenCalledWith(expect.any(Number))
                jest.useRealTimers()
            })

            test('should fall back to setTimeout when requestIdleCallback unavailable and ignore custom options when provided', async () => {
                delete global.requestIdleCallback

                jest.useFakeTimers()

                const customOptions = {timeout: 500}
                renderServerComponent(
                    <Island hydrateOn={'idle'} options={customOptions}>
                        <div data-testid="idle-content">Idle Content</div>
                    </Island>
                )

                expect(global.setTimeout).toHaveBeenCalledTimes(1)
                expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 500)
                expect(global.clearTimeout).not.toHaveBeenCalled()

                jest.useRealTimers()
            })

            test('should handle clientOnly prop', async () => {
                const {container, containerServer, getByTestId, getByText} = renderServerComponent(
                    <Island hydrateOn={'idle'} clientOnly={true}>
                        <div data-testid="idle-content">Idle Content</div>
                    </Island>
                )

                // Initially should show server-rendered content
                expect(containerServer?.firstElementChild).toBeNull()
                expect(container?.dataset?.sfdcIslandOrigin).toBe('server')
                expect(container).toHaveStyle({display: 'contents'})

                // Should call requestIdleCallback but not hydrate yet
                expect(mockRequestIdleCallback).toHaveBeenCalledTimes(1)
                expect(mockRequestIdleCallback).toHaveBeenCalledWith(
                    expect.any(Function),
                    undefined
                )
                expect(mockIdleCallback).toBeDefined()

                // Call the idle callback to trigger hydration
                await act(() => mockIdleCallback())

                // Should seamlessly transition to show hydrated content
                expect(container?.dataset?.sfdcIslandOrigin).toBe('client')
                expect(container).toHaveStyle({display: 'contents'})
                expect(getByTestId('idle-content')).toBeDefined()
                expect(getByText('Idle Content')).toBeDefined()
            })
        })

        describe('Hydration Strategy: visible', () => {
            let mockObserverCallback
            let mockObserve
            let mockDisconnect
            let mockUnobserve

            beforeEach(() => {
                mockObserve = jest.fn()
                mockDisconnect = jest.fn()
                mockUnobserve = jest.fn()
                mockIntersectionObserver.mockImplementation((callback) => {
                    mockObserverCallback = callback
                    return {
                        observe: mockObserve,
                        disconnect: mockDisconnect,
                        unobserve: mockUnobserve
                    }
                })
            })

            test.each([
                {config: [{isIntersecting: true}]},
                {config: [{isIntersecting: false}, {intersectionRatio: 0.5}]},
                {config: [{isIntersecting: true}, {intersectionRatio: 0.3}]}
            ])(
                'should set up IntersectionObserver when available and hydrate when element becomes visible (%j)',
                async ({config}) => {
                    const {container, getByTestId, getByText} = renderServerComponent(
                        <Island hydrateOn={'visible'}>
                            <div data-testid="visible-content">Visible Content</div>
                        </Island>
                    )

                    // Initially should show server-rendered content
                    expect(container?.dataset?.sfdcIslandOrigin).toBe('server')
                    expect(container).toHaveStyle({display: 'contents'})
                    expect(getByTestId('visible-content')).toBeDefined()
                    expect(getByText('Visible Content')).toBeDefined()

                    // Should create IntersectionObserver
                    expect(mockIntersectionObserver).toHaveBeenCalledTimes(1)
                    expect(mockIntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {
                        rootMargin: '250px'
                    })
                    expect(mockObserve).toHaveBeenCalledTimes(1)
                    expect(mockObserve).toHaveBeenCalledWith(container.firstElementChild)

                    // Simulate intersection to trigger hydration
                    await act(() => mockObserverCallback(config))

                    // Should seamlessly transition to show hydrated content
                    expect(container?.dataset?.sfdcIslandOrigin).toBe('client')
                    expect(container).toHaveStyle({display: 'contents'})
                    expect(getByTestId('visible-content')).toBeDefined()
                    expect(getByText('Visible Content')).toBeDefined()

                    expect(mockUnobserve).toHaveBeenCalledTimes(1)
                    expect(mockUnobserve).toHaveBeenCalledWith(container.firstElementChild)
                    expect(mockDisconnect).toHaveBeenCalledTimes(1)
                    expect(mockDisconnect).toHaveBeenCalledWith()
                }
            )

            test('should use custom options when provided', async () => {
                const customOptions = {rootMargin: '100px', threshold: 0.5}
                const {container} = renderServerComponent(
                    <Island hydrateOn={'visible'} options={customOptions}>
                        <div data-testid="visible-content">Visible Content</div>
                    </Island>
                )

                expect(mockIntersectionObserver).toHaveBeenCalledTimes(1)
                expect(mockIntersectionObserver).toHaveBeenCalledWith(
                    expect.any(Function),
                    customOptions
                )
                expect(mockObserve).toHaveBeenCalledTimes(1)
                expect(mockObserve).toHaveBeenCalledWith(container.firstElementChild)
                expect(mockUnobserve).not.toHaveBeenCalled()
                expect(mockDisconnect).not.toHaveBeenCalled()
            })

            test.each([undefined, null, 'invalid', true])(
                'should ignore non-Object custom options (%j)',
                async (customOptions) => {
                    const {container} = renderServerComponent(
                        <Island hydrateOn={'visible'} options={customOptions}>
                            <div data-testid="visible-content">Visible Content</div>
                        </Island>
                    )

                    expect(mockIntersectionObserver).toHaveBeenCalledTimes(1)
                    expect(mockIntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {
                        rootMargin: '250px'
                    })
                    expect(mockObserve).toHaveBeenCalledTimes(1)
                    expect(mockObserve).toHaveBeenCalledWith(container.firstElementChild)
                    expect(mockUnobserve).not.toHaveBeenCalled()
                    expect(mockDisconnect).not.toHaveBeenCalled()
                }
            )

            test('should hydrate immediately when IntersectionObserver unavailable', async () => {
                delete global.IntersectionObserver

                const {container, getByTestId, getByText} = renderServerComponent(
                    <Island hydrateOn={'visible'}>
                        <div data-testid="visible-content">Visible Content</div>
                    </Island>
                )

                expect(container?.dataset?.sfdcIslandOrigin).toBe('client')
                expect(container).toHaveStyle({display: 'contents'})
                expect(getByTestId('visible-content')).toBeDefined()
                expect(getByText('Visible Content')).toBeDefined()

                expect(mockIntersectionObserver).not.toHaveBeenCalled()
                expect(mockObserve).not.toHaveBeenCalled()
                expect(mockUnobserve).not.toHaveBeenCalled()
                expect(mockDisconnect).not.toHaveBeenCalled()
            })

            test.each([{isIntersecting: true}, {intersectionRatio: 0.5}])(
                'should handle clientOnly prop and hydrate when element becomes visible (%j)',
                async (config) => {
                    const {container, containerServer, getByTestId, getByText} =
                        renderServerComponent(
                            <Island hydrateOn={'visible'} clientOnly={true}>
                                <div data-testid="visible-content">Visible Content</div>
                            </Island>
                        )

                    // Initially should show server-rendered content
                    expect(containerServer?.firstElementChild).toBeNull()
                    expect(container?.dataset?.sfdcIslandOrigin).toBe('server')
                    expect(container).toHaveStyle({display: 'inline-block'})

                    // Should create IntersectionObserver
                    expect(mockIntersectionObserver).toHaveBeenCalledTimes(1)
                    expect(mockIntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {
                        rootMargin: '250px'
                    })
                    expect(mockObserve).toHaveBeenCalledTimes(1)
                    expect(mockObserve).toHaveBeenCalledWith(container)

                    // Simulate intersection to trigger hydration
                    await act(() => mockObserverCallback([config]))

                    // Should seamlessly transition to show hydrated content
                    expect(container?.dataset?.sfdcIslandOrigin).toBe('client')
                    expect(container).toHaveStyle({display: 'contents'})
                    expect(getByTestId('visible-content')).toBeDefined()
                    expect(getByText('Visible Content')).toBeDefined()

                    expect(mockUnobserve).toHaveBeenCalledTimes(1)
                    expect(mockUnobserve).toHaveBeenCalledWith(container)
                    expect(mockDisconnect).toHaveBeenCalledTimes(1)
                    expect(mockDisconnect).toHaveBeenCalledWith()
                }
            )
        })

        describe('Hydration Strategy: off', () => {
            test('should not hydrate', async () => {
                const {container, getByTestId, getByText} = renderServerComponent(
                    <Island hydrateOn={'off'}>
                        <div data-testid="server-content">Server Content</div>
                    </Island>
                )

                expect(container?.dataset?.sfdcIslandOrigin).toBe('server')
                expect(container).toHaveStyle({display: 'contents'})
                expect(getByTestId('server-content')).toBeDefined()
                expect(getByText('Server Content')).toBeDefined()
            })

            test('should not hydrate if no SSR content exists', () => {
                const {container} = renderServerComponent(<Island hydrateOn={'off'}></Island>)

                expect(container?.dataset?.sfdcIslandOrigin).toBe('server')
                expect(container).toHaveStyle({display: 'contents'})
                expect(container.firstElementChild).toBeNull()
            })

            test('should hydrate when switching the strategy to load', () => {
                const {container, rerender, getByTestId, getByText} = renderServerComponent(
                    <Island hydrateOn={'off'}>
                        <div data-testid="server-content">Server Content</div>
                    </Island>
                )
                expect(container?.dataset?.sfdcIslandOrigin).toBe('server')
                expect(container).toHaveStyle({display: 'contents'})
                expect(getByTestId('server-content')).toBeDefined()
                expect(getByText('Server Content')).toBeDefined()

                rerender(
                    <Island hydrateOn={'load'}>
                        <div data-testid="server-content">Server Content</div>
                    </Island>
                )
                expect(container?.dataset?.sfdcIslandOrigin).toBe('client')
                expect(container).toHaveStyle({display: 'contents'})
                expect(getByTestId('server-content')).toBeDefined()
                expect(getByText('Server Content')).toBeDefined()
            })
        })
    })

    describe('Nested Islands', () => {
        describe('outer off', () => {
            test('should work with nested Islands [load, load]', async () => {
                const {container, rerender, getByTestId, getByText} = renderServerComponent(
                    <Island hydrateOn={'off'}>
                        <div data-testid="content-1">Content 1</div>

                        <Island hydrateOn={'load'}>
                            <div data-testid="content-2">Content 2</div>

                            <Island hydrateOn={'load'}>
                                <div data-testid="content-3">Content 3</div>
                            </Island>
                        </Island>
                    </Island>
                )

                expect(container?.dataset?.sfdcIslandOrigin).toBe('server')
                expect(container).toHaveStyle({display: 'contents'})
                expect(getByTestId('content-1')).toBeDefined()
                expect(getByTestId('content-2')).toBeDefined()
                expect(getByTestId('content-3')).toBeDefined()
                expect(getByText('Content 1')).toBeDefined()
                expect(getByText('Content 2')).toBeDefined()
                expect(getByText('Content 3')).toBeDefined()

                let islands = Array.from(container.querySelectorAll('[data-sfdc-island]'))
                expect(islands).toHaveLength(2)
                expect(islands.map((island) => island.dataset?.sfdcIslandOrigin)).toStrictEqual([
                    'server',
                    'server'
                ])

                rerender(
                    <Island hydrateOn={'load'}>
                        <div data-testid="content-1">Content 1</div>

                        <Island hydrateOn={'load'}>
                            <div data-testid="content-2">Content 2</div>

                            <Island hydrateOn={'load'}>
                                <div data-testid="content-3">Content 3</div>
                            </Island>
                        </Island>
                    </Island>
                )

                expect(container?.dataset?.sfdcIslandOrigin).toBe('client')
                expect(container).toHaveStyle({display: 'contents'})
                expect(getByTestId('content-1')).toBeDefined()
                expect(getByTestId('content-2')).toBeDefined()
                expect(getByTestId('content-3')).toBeDefined()
                expect(getByText('Content 1')).toBeDefined()
                expect(getByText('Content 2')).toBeDefined()
                expect(getByText('Content 3')).toBeDefined()

                islands = Array.from(container.querySelectorAll('[data-sfdc-island]'))
                expect(islands).toHaveLength(2)
                expect(islands.map((island) => island.dataset?.sfdcIslandOrigin)).toStrictEqual([
                    'client',
                    'client'
                ])
            })

            test('should work with nested Islands [idle, load]', async () => {
                const {container, rerender, getByTestId, getByText} = renderServerComponent(
                    <Island hydrateOn={'off'}>
                        <div data-testid="content-1">Content 1</div>

                        <Island hydrateOn={'idle'}>
                            <div data-testid="content-2">Content 2</div>

                            <Island hydrateOn={'load'}>
                                <div data-testid="content-3">Content 3</div>
                            </Island>
                        </Island>
                    </Island>
                )

                expect(container?.dataset?.sfdcIslandOrigin).toBe('server')
                expect(container).toHaveStyle({display: 'contents'})
                expect(getByTestId('content-1')).toBeDefined()
                expect(getByTestId('content-2')).toBeDefined()
                expect(getByTestId('content-3')).toBeDefined()
                expect(getByText('Content 1')).toBeDefined()
                expect(getByText('Content 2')).toBeDefined()
                expect(getByText('Content 3')).toBeDefined()

                let islands = Array.from(container.querySelectorAll('[data-sfdc-island]'))
                expect(islands).toHaveLength(2)
                expect(islands.map((island) => island.dataset?.sfdcIslandOrigin)).toStrictEqual([
                    'server',
                    'server'
                ])

                rerender(
                    <Island hydrateOn={'load'}>
                        <div data-testid="content-1">Content 1</div>

                        <Island hydrateOn={'idle'}>
                            <div data-testid="content-2">Content 2</div>

                            <Island hydrateOn={'load'}>
                                <div data-testid="content-3">Content 3</div>
                            </Island>
                        </Island>
                    </Island>
                )

                expect(container?.dataset?.sfdcIslandOrigin).toBe('client')
                expect(container).toHaveStyle({display: 'contents'})
                expect(getByTestId('content-1')).toBeDefined()
                expect(getByTestId('content-2')).toBeDefined()
                expect(getByTestId('content-3')).toBeDefined()
                expect(getByText('Content 1')).toBeDefined()
                expect(getByText('Content 2')).toBeDefined()
                expect(getByText('Content 3')).toBeDefined()

                islands = Array.from(container.querySelectorAll('[data-sfdc-island]'))
                expect(islands).toHaveLength(2)
                expect(islands.map((island) => island.dataset?.sfdcIslandOrigin)).toStrictEqual([
                    'server',
                    'server'
                ])
            })

            test('should work with nested Islands [load, idle]', async () => {
                const {container, rerender, getByTestId, getByText} = renderServerComponent(
                    <Island hydrateOn={'off'}>
                        <div data-testid="content-1">Content 1</div>

                        <Island hydrateOn={'load'}>
                            <div data-testid="content-2">Content 2</div>

                            <Island hydrateOn={'idle'}>
                                <div data-testid="content-3">Content 3</div>
                            </Island>
                        </Island>
                    </Island>
                )

                expect(container?.dataset?.sfdcIslandOrigin).toBe('server')
                expect(container).toHaveStyle({display: 'contents'})
                expect(getByTestId('content-1')).toBeDefined()
                expect(getByTestId('content-2')).toBeDefined()
                expect(getByTestId('content-3')).toBeDefined()
                expect(getByText('Content 1')).toBeDefined()
                expect(getByText('Content 2')).toBeDefined()
                expect(getByText('Content 3')).toBeDefined()

                let islands = Array.from(container.querySelectorAll('[data-sfdc-island]'))
                expect(islands).toHaveLength(2)
                expect(islands.map((island) => island.dataset?.sfdcIslandOrigin)).toStrictEqual([
                    'server',
                    'server'
                ])

                rerender(
                    <Island hydrateOn={'load'}>
                        <div data-testid="content-1">Content 1</div>

                        <Island hydrateOn={'load'}>
                            <div data-testid="content-2">Content 2</div>

                            <Island hydrateOn={'idle'}>
                                <div data-testid="content-3">Content 3</div>
                            </Island>
                        </Island>
                    </Island>
                )

                expect(container?.dataset?.sfdcIslandOrigin).toBe('client')
                expect(container).toHaveStyle({display: 'contents'})
                expect(getByTestId('content-1')).toBeDefined()
                expect(getByTestId('content-2')).toBeDefined()
                expect(getByTestId('content-3')).toBeDefined()
                expect(getByText('Content 1')).toBeDefined()
                expect(getByText('Content 2')).toBeDefined()
                expect(getByText('Content 3')).toBeDefined()

                islands = Array.from(container.querySelectorAll('[data-sfdc-island]'))
                expect(islands).toHaveLength(2)
                expect(islands.map((island) => island.dataset?.sfdcIslandOrigin)).toStrictEqual([
                    'client',
                    'server'
                ])
            })
        })

        describe('outer idle', () => {
            const mockIdleCallbacks = []

            beforeEach(() => {
                mockIdleCallbacks.length = 0
                mockRequestIdleCallback.mockImplementation((callback) => {
                    mockIdleCallbacks.push(callback)
                    return 123
                })
            })

            test('should work with nested Islands [load, load]', async () => {
                const {container, getByTestId, getByText} = renderServerComponent(
                    <Island hydrateOn={'idle'}>
                        <div data-testid="content-1">Content 1</div>

                        <Island hydrateOn={'load'}>
                            <div data-testid="content-2">Content 2</div>

                            <Island hydrateOn={'load'}>
                                <div data-testid="content-3">Content 3</div>
                            </Island>
                        </Island>
                    </Island>
                )

                expect(container?.dataset?.sfdcIslandOrigin).toBe('server')
                expect(container).toHaveStyle({display: 'contents'})
                expect(getByTestId('content-1')).toBeDefined()
                expect(getByTestId('content-2')).toBeDefined()
                expect(getByTestId('content-3')).toBeDefined()
                expect(getByText('Content 1')).toBeDefined()
                expect(getByText('Content 2')).toBeDefined()
                expect(getByText('Content 3')).toBeDefined()

                let islands = Array.from(container.querySelectorAll('[data-sfdc-island]'))
                expect(islands).toHaveLength(2)
                expect(islands.map((island) => island.dataset?.sfdcIslandOrigin)).toStrictEqual([
                    'server',
                    'server'
                ])

                // Call the idle callback to trigger hydration
                expect(mockIdleCallbacks).toHaveLength(1)
                await act(() => mockIdleCallbacks[0]())

                expect(container?.dataset?.sfdcIslandOrigin).toBe('client')
                expect(container).toHaveStyle({display: 'contents'})
                expect(getByTestId('content-1')).toBeDefined()
                expect(getByTestId('content-2')).toBeDefined()
                expect(getByTestId('content-3')).toBeDefined()
                expect(getByText('Content 1')).toBeDefined()
                expect(getByText('Content 2')).toBeDefined()
                expect(getByText('Content 3')).toBeDefined()

                islands = Array.from(container.querySelectorAll('[data-sfdc-island]'))
                expect(islands).toHaveLength(2)
                expect(islands.map((island) => island.dataset?.sfdcIslandOrigin)).toStrictEqual([
                    'client',
                    'client'
                ])
            })

            test('should work with nested Islands [idle, load]', async () => {
                const {container, getByTestId, getByText} = renderServerComponent(
                    <Island hydrateOn={'idle'}>
                        <div data-testid="content-1">Content 1</div>

                        <Island hydrateOn={'idle'}>
                            <div data-testid="content-2">Content 2</div>

                            <Island hydrateOn={'load'}>
                                <div data-testid="content-3">Content 3</div>
                            </Island>
                        </Island>
                    </Island>
                )

                expect(container?.dataset?.sfdcIslandOrigin).toBe('server')
                expect(container).toHaveStyle({display: 'contents'})
                expect(getByTestId('content-1')).toBeDefined()
                expect(getByTestId('content-2')).toBeDefined()
                expect(getByTestId('content-3')).toBeDefined()
                expect(getByText('Content 1')).toBeDefined()
                expect(getByText('Content 2')).toBeDefined()
                expect(getByText('Content 3')).toBeDefined()

                let islands = Array.from(container.querySelectorAll('[data-sfdc-island]'))
                expect(islands).toHaveLength(2)
                expect(islands.map((island) => island.dataset?.sfdcIslandOrigin)).toStrictEqual([
                    'server',
                    'server'
                ])

                // Call the idle callback to trigger hydration
                expect(mockIdleCallbacks).toHaveLength(1)
                await act(() => mockIdleCallbacks[0]())

                expect(container?.dataset?.sfdcIslandOrigin).toBe('client')
                expect(container).toHaveStyle({display: 'contents'})
                expect(getByTestId('content-1')).toBeDefined()
                expect(getByTestId('content-2')).toBeDefined()
                expect(getByTestId('content-3')).toBeDefined()
                expect(getByText('Content 1')).toBeDefined()
                expect(getByText('Content 2')).toBeDefined()
                expect(getByText('Content 3')).toBeDefined()

                islands = Array.from(container.querySelectorAll('[data-sfdc-island]'))
                expect(islands).toHaveLength(2)
                expect(islands.map((island) => island.dataset?.sfdcIslandOrigin)).toStrictEqual([
                    'server',
                    'server'
                ])

                // Call the idle callback again
                expect(mockIdleCallbacks).toHaveLength(2)
                await act(() => mockIdleCallbacks[1]())

                expect(container?.dataset?.sfdcIslandOrigin).toBe('client')
                expect(container).toHaveStyle({display: 'contents'})
                expect(getByTestId('content-1')).toBeDefined()
                expect(getByTestId('content-2')).toBeDefined()
                expect(getByTestId('content-3')).toBeDefined()
                expect(getByText('Content 1')).toBeDefined()
                expect(getByText('Content 2')).toBeDefined()
                expect(getByText('Content 3')).toBeDefined()

                islands = Array.from(container.querySelectorAll('[data-sfdc-island]'))
                expect(islands).toHaveLength(2)
                expect(islands.map((island) => island.dataset?.sfdcIslandOrigin)).toStrictEqual([
                    'client',
                    'client'
                ])
            })

            test('should work with nested Islands [load, idle]', async () => {
                const {container, getByTestId, getByText} = renderServerComponent(
                    <Island hydrateOn={'idle'}>
                        <div data-testid="content-1">Content 1</div>

                        <Island hydrateOn={'load'}>
                            <div data-testid="content-2">Content 2</div>

                            <Island hydrateOn={'idle'}>
                                <div data-testid="content-3">Content 3</div>
                            </Island>
                        </Island>
                    </Island>
                )

                expect(container?.dataset?.sfdcIslandOrigin).toBe('server')
                expect(container).toHaveStyle({display: 'contents'})
                expect(getByTestId('content-1')).toBeDefined()
                expect(getByTestId('content-2')).toBeDefined()
                expect(getByTestId('content-3')).toBeDefined()
                expect(getByText('Content 1')).toBeDefined()
                expect(getByText('Content 2')).toBeDefined()
                expect(getByText('Content 3')).toBeDefined()

                let islands = Array.from(container.querySelectorAll('[data-sfdc-island]'))
                expect(islands).toHaveLength(2)
                expect(islands.map((island) => island.dataset?.sfdcIslandOrigin)).toStrictEqual([
                    'server',
                    'server'
                ])

                // Call the idle callback to trigger hydration
                expect(mockIdleCallbacks).toHaveLength(1)
                await act(() => mockIdleCallbacks[0]())

                expect(container?.dataset?.sfdcIslandOrigin).toBe('client')
                expect(container).toHaveStyle({display: 'contents'})
                expect(getByTestId('content-1')).toBeDefined()
                expect(getByTestId('content-2')).toBeDefined()
                expect(getByTestId('content-3')).toBeDefined()
                expect(getByText('Content 1')).toBeDefined()
                expect(getByText('Content 2')).toBeDefined()
                expect(getByText('Content 3')).toBeDefined()

                islands = Array.from(container.querySelectorAll('[data-sfdc-island]'))
                expect(islands).toHaveLength(2)
                expect(islands.map((island) => island.dataset?.sfdcIslandOrigin)).toStrictEqual([
                    'client',
                    'server'
                ])
            })
        })
    })

    describe('Backward Compatibility', () => {
        test('should fall back to PARTIAL_HYDRATION_ENABLED constant when config.app.partialHydrationEnabled is not available', () => {
            // Mock getConfig to return config without partialHydrationEnabled property
            getConfig.mockReturnValue({
                app: {}
            })
            Reflect.set(constants, 'PARTIAL_HYDRATION_ENABLED', true)

            // Test SSR behavior first
            isServer.mockReturnValue(true)
            const {container: serverContainer, getByTestId: getByTestIdServer} = render(
                <Island>
                    <div data-testid="server-content">Server Content</div>
                </Island>
            )
            expect(serverContainer.firstElementChild?.dataset?.sfdcIslandOrigin).toBe('server')
            expect(getByTestIdServer('server-content')).toBeInTheDocument()

            // Clean up and test CSR behavior
            cleanup()
            isServer.mockReturnValue(false)
            const {container: clientContainer, getByTestId: getByTestIdClient} = render(
                <Island>
                    <div data-testid="server-content">Server Content</div>
                </Island>
            )
            expect(clientContainer.firstElementChild?.dataset?.sfdcIslandOrigin).toBe('client')
            expect(getByTestIdClient('server-content')).toBeInTheDocument()
        })

        test('should disable islands when both config and constant are false', () => {
            getConfig.mockReturnValue({
                app: {
                    partialHydrationEnabled: false
                }
            })
            Reflect.set(constants, 'PARTIAL_HYDRATION_ENABLED', false)

            const {container} = render(
                <Island>
                    <div data-testid="server-content">Server Content</div>
                </Island>
            )

            // Should render children directly without island wrapper
            expect(screen.getByTestId('server-content')).toBeInTheDocument()
            expect(screen.getByTestId('server-content')).toBe(container.firstElementChild)
        })

        test('should disable islands when config is false even if constant is true', () => {
            getConfig.mockReturnValue({
                app: {
                    partialHydrationEnabled: false
                }
            })
            Reflect.set(constants, 'PARTIAL_HYDRATION_ENABLED', true)

            const {container} = render(
                <Island>
                    <div data-testid="server-content">Server Content</div>
                </Island>
            )

            // Config should take precedence over constant
            expect(screen.getByTestId('server-content')).toBeInTheDocument()
            expect(screen.getByTestId('server-content')).toBe(container.firstElementChild)
        })
    })
})
