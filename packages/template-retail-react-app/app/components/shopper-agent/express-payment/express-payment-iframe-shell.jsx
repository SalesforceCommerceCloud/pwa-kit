/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useCallback, useEffect, useMemo, useRef} from 'react'
import PropTypes from 'prop-types'
import {useLocation} from 'react-router-dom'

import ExpressPaymentProvider from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/provider'
import {
    EXPRESS_PAYMENT_EVENTS,
    getValidatedParentOrigin,
    postExpressPaymentEvent
} from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/messages'
import {createExpressPaymentLifecycle} from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/lifecycle'
import useExpressPaymentContext from '@salesforce/retail-react-app/app/components/shopper-agent/express-payment/use-express-payment-context'
import {useAppOrigin} from '@salesforce/retail-react-app/app/hooks/use-app-origin'

// Match the minimum interactive height used by the Commerce Client host. The shell
// reports the full measured height; the host owns any maximum-height policy.
const MIN_IFRAME_HEIGHT = 44

const ExpressPaymentIframeShell = ({Provider = ExpressPaymentProvider}) => {
    const location = useLocation()
    const appOrigin = useAppOrigin()
    const containerRef = useRef(null)
    const availableDetailsRef = useRef(null)
    const successSentRef = useRef(false)

    const query = useMemo(() => new URLSearchParams(location.search), [location.search])
    const parentOrigin = getValidatedParentOrigin(query.get('parentOrigin'), appOrigin)
    const {context, isValid: contextIsValid} = useExpressPaymentContext({
        resolveBasket: Boolean(parentOrigin)
    })

    const notifyParent = useCallback(
        (type, payload = {}) => postExpressPaymentEvent({parentOrigin, type, payload}),
        [parentOrigin]
    )

    const notifyParentOfAvailability = useCallback(() => {
        if (successSentRef.current || !availableDetailsRef.current) return

        const measuredHeight = Math.ceil(containerRef.current?.getBoundingClientRect().height || 0)
        const height = Math.max(MIN_IFRAME_HEIGHT, measuredHeight)
        notifyParent(EXPRESS_PAYMENT_EVENTS.AVAILABLE, {
            height,
            ...availableDetailsRef.current
        })
    }, [notifyParent])

    const lifecycle = useMemo(
        () =>
            createExpressPaymentLifecycle({
                availableDetailsRef,
                successSentRef,
                notifyParent,
                notifyParentOfAvailability
            }),
        [notifyParent, notifyParentOfAvailability]
    )

    useEffect(() => {
        // The framed document must remain visually transparent inside the host surface.
        const previousHtmlBackground = document.documentElement.style.backgroundColor
        const previousBodyBackground = document.body.style.backgroundColor
        document.documentElement.style.backgroundColor = 'transparent'
        document.body.style.backgroundColor = 'transparent'

        return () => {
            document.documentElement.style.backgroundColor = previousHtmlBackground
            document.body.style.backgroundColor = previousBodyBackground
        }
    }, [])

    useEffect(() => {
        if (!parentOrigin || contextIsValid) return
        notifyParent(EXPRESS_PAYMENT_EVENTS.UNAVAILABLE)
    }, [contextIsValid, notifyParent, parentOrigin])

    useEffect(() => {
        if (!containerRef.current || typeof ResizeObserver === 'undefined') return undefined
        const observer = new ResizeObserver(notifyParentOfAvailability)
        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [notifyParentOfAvailability])

    if (!parentOrigin || !contextIsValid) return null

    return (
        <div
            ref={containerRef}
            data-testid="express-payment-iframe-shell"
            data-payment-surface={context.surface}
        >
            <Provider context={context} lifecycle={lifecycle} />
        </div>
    )
}

ExpressPaymentIframeShell.propTypes = {
    // Optional provider injection supports contract and integration validation.
    // Production routes rely on the default export from provider.jsx.
    Provider: PropTypes.elementType
}

export default ExpressPaymentIframeShell
