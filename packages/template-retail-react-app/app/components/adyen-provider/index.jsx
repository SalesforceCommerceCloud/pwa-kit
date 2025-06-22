/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import loadable from '@loadable/component'

// Lazy load Adyen components
const AdyenCheckout = loadable(
    () =>
        import('@adyen/adyen-salesforce-pwa').then((module) => ({
            default: module.AdyenCheckout
        })),
    {
        ssr: false
    }
)
const AdyenCheckoutProvider = loadable(
    () =>
        import('@adyen/adyen-salesforce-pwa').then((module) => ({
            default: module.AdyenCheckoutProvider
        })),
    {
        ssr: false
    }
)

const AdyenProvider = ({
    children,
    authToken,
    customerId,
    locale,
    site,
    basket,
    navigate,
    ...props
}) => {
    const [adyenLoaded, setAdyenLoaded] = useState(false)

    useEffect(() => {
        // Dynamically import Adyen CSS only when component mounts
        Promise.all([
            import('@adyen/adyen-salesforce-pwa/dist/app/adyen.css'),
            import('@salesforce/retail-react-app/app/styles/adyen-overrides.css')
        ])
            .then(() => {
                setAdyenLoaded(true)
            })
            .catch((error) => {
                console.warn('Failed to load Adyen styles:', error)
                setAdyenLoaded(true) // Continue anyway
            })
    }, [])

    if (!adyenLoaded || !authToken || !basket) {
        return <div>Loading payment system...</div>
    }

    return (
        <AdyenCheckoutProvider
            authToken={authToken}
            customerId={customerId}
            locale={locale}
            site={site}
            basket={basket}
            navigate={navigate}
            {...props}
        >
            {children}
        </AdyenCheckoutProvider>
    )
}

AdyenProvider.propTypes = {
    children: PropTypes.node.isRequired,
    authToken: PropTypes.string,
    customerId: PropTypes.string,
    locale: PropTypes.string,
    site: PropTypes.string,
    basket: PropTypes.object,
    navigate: PropTypes.func
}

export default AdyenProvider
export {AdyenCheckout}
