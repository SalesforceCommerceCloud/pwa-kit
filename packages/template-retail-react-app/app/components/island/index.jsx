/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable react-hooks/rules-of-hooks */
/* global globalThis */
import React, {
    Children,
    createContext,
    isValidElement,
    useContext,
    useEffect,
    useLayoutEffect,
    useRef,
    useState
} from 'react'
import PropTypes from 'prop-types'
import {isServer} from '@salesforce/retail-react-app/app/components/island/utils'
import {PARTIAL_HYDRATION_ENABLED} from '@salesforce/retail-react-app/app/constants'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

const IslandContext = createContext(null)

const useIslandContext = () => useContext(IslandContext)

function findChildren(children, componentType) {
    const matches = []

    Children.forEach(children, (child) => {
        if (!isValidElement(child)) {
            return
        }
        if (child.type === componentType) {
            matches.push(child)
        }
        child.props?.children && matches.push(...findChildren(child.props.children, componentType))
    })

    return matches
}

/**
 * This component is intended to give developers explicit and fine-granular control over the
 * hydration behavior of their experiences. The influence of the `<Island/>` components on the
 * hydration behavior can be activated or deactivated using the {@link PARTIAL_HYDRATION_ENABLED}
 * constant.
 * @param {Object} props
 * @param {ReactNode} [props.children] The child tree
 * @param {('load' | 'idle' | 'visible' | 'off')} [props.hydrateOn='load'] The island's hydration strategy
 * @param {{[key: string]: any}} [props.options] Optional strategy-specific options
 * @param {boolean} [props.clientOnly] Whether to only render the component on the client
 * @example Default hydration on load
 *  <Island>
 *      <MyContent />
 *  </Island>
 * @example Hydration on load
 *  <Island hydrateOn={'load'}>
 *      <MyContent />
 *  </Island>
 * @example Hydration on idle
 *  <Island hydrateOn={'idle'}>
 *      <MyContent />
 *  </Island>
 * @example Hydration on idle with custom `requestIdleCallback` options
 *  <Island hydrateOn={'idle'} options={{timeout: 500}}>
 *      <MyContent />
 *  </Island>
 * @example Hydration on visible (default `IntersectionObserver` options = `{rootMargin: '250px'}`)
 *  <Island hydrateOn={'visible'}>
 *      <MyContent />
 *  </Island>
 * @example Hydration on visible with custom `IntersectionObserver` options
 *  <Island hydrateOn={'visible'} options={{rootMargin: '100px'}}>
 *      <MyContent />
 *  </Island>
 * @example Hydration turned off
 *  <Island hydrateOn={'off'}>
 *      <MyContent />
 *  </Island>
 * @see {@link https://docs.astro.build/en/concepts/islands}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver}
 */
function Island(props) {
    const {children} = props
    const isEnabled = getConfig()?.app?.partialHydrationEnabled ?? PARTIAL_HYDRATION_ENABLED // in a backward compatible way
    if (!isEnabled) {
        return <>{children}</>
    }

    const {hydrateOn = 'load', options, clientOnly = false} = props
    const ssr = isServer()
    const [hydrated, setHydrated] = useState(ssr) // Ensure SSR immediately returns the generated HTML
    const context = useIslandContext()
    const data = context ? context.data : new WeakMap()
    const ref = useRef(null)
    const hydrate = () => {
        setHydrated(true)
    }

    if (!ssr) {
        useLayoutEffect(() => {
            if (
                !hydrated &&
                hydrateOn !== 'off' &&
                (!context || context?.hydrated) &&
                ref.current &&
                !ref.current?.firstElementChild &&
                !clientOnly
            ) {
                // No actual SSR Content or rendering after CSR navigation --> hydrate
                hydrate()
            }
        })

        useEffect(() => {
            if (
                hydrated ||
                hydrateOn === 'off' ||
                (context && !context?.hydrated) ||
                !ref.current ||
                (!ref.current?.firstElementChild && !ssr && !clientOnly)
            ) {
                return
            }

            if (hydrateOn === 'idle') {
                if ('requestIdleCallback' in globalThis) {
                    const callbackId = requestIdleCallback(
                        () => hydrate(),
                        typeof options === 'object' && options !== null ? options : undefined
                    )
                    return () => cancelIdleCallback(callbackId)
                }
                const timeout = typeof options?.timeout === 'number' ? options?.timeout : 200
                const timeoutId = setTimeout(() => hydrate(), timeout) // Fallback
                return () => clearTimeout(timeoutId)
            } else if (hydrateOn === 'visible' && 'IntersectionObserver' in globalThis) {
                let element = ref.current?.firstElementChild
                if (!element) {
                    // Special case where `clientOnly` is `true`. For this case the box suppression behavior of
                    // `display="contents"` is problematic. The workaround is to apply the `IntersectionObserver`
                    // to the so far empty container directly. But for this we need to change its `display`
                    // settings.
                    element = ref.current
                    element.style.display = 'inline-block'
                }
                const observer = new IntersectionObserver(
                    (entries) => {
                        for (const entry of entries) {
                            if (entry.isIntersecting || entry.intersectionRatio > 0) {
                                observer.unobserve(element)
                                if (element === ref.current) {
                                    // Special case where `clientOnly` is `true`. Here we need to reset the `display`
                                    // settings we just had to change.
                                    element.style.display = 'contents'
                                }
                                hydrate()
                                break // break on first match
                            }
                        }
                    },
                    typeof options === 'object' && options !== null
                        ? options
                        : {
                              rootMargin: '250px'
                          }
                )
                observer.observe(element)
                return () => observer.disconnect()
            }

            // `hydrateOn='load'`
            hydrate()
        }, [hydrateOn, hydrated, options])
    }

    if (hydrated) {
        if (!ssr && !context && ref.current?.dataset?.sfdcIslandOrigin === 'server') {
            // Before finally hydrating a root-level context on the client, store a reference to the original
            // server-rendered HTML to be consumed by eventually client-rendered nested/child islands. Unfortunately,
            // there's no better way to reference the elements than an active DOM query. React does not yet know the
            // child elements at this specific point in time, and the child DOM tree only exists at all because of
            // a previous SSR step.
            const islands = findChildren(children, Island)
            const elements = ref.current.querySelectorAll('div[data-sfdc-island]')
            for (let i = 0; i < islands.length; i++) {
                const island = islands.at(i)
                const el = elements.item(i)
                island && el && data.set(island?.props, el?.innerHTML)
            }
        }

        return (
            <IslandContext.Provider value={{hydrated, data}}>
                <div
                    ref={ref}
                    style={{display: 'contents'}}
                    data-sfdc-island
                    data-sfdc-island-origin={ssr ? 'server' : 'client'}
                >
                    {ssr && clientOnly ? null : children}
                </div>
            </IslandContext.Provider>
        )
    }

    // No hydration triggered yet. The browser displays the server-rendered HTML as-is.
    const html = (!ssr && context && context.data.get(props)) || ''
    return (
        <IslandContext.Provider value={{hydrated, data}}>
            <div
                ref={ref}
                style={{display: 'contents'}}
                data-sfdc-island
                data-sfdc-island-origin={html ? 'server' : null}
                suppressHydrationWarning
                dangerouslySetInnerHTML={{__html: html}}
            ></div>
        </IslandContext.Provider>
    )
}

Island.propTypes = {
    children: PropTypes.node,
    hydrateOn: PropTypes.oneOf(['load', 'idle', 'visible', 'off']),
    options: PropTypes.object,
    clientOnly: PropTypes.bool
}

export default Island
