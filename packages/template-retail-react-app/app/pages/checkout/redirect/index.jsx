/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState, Suspense} from 'react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useAccessToken, useCustomerId} from '@salesforce/commerce-sdk-react'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'

// Dynamic imports for Adyen components
const AdyenCheckout = React.lazy(() =>
    import('@adyen/adyen-salesforce-pwa').then((module) => ({default: module.AdyenCheckout}))
)
const AdyenCheckoutProvider = React.lazy(() =>
    import('@adyen/adyen-salesforce-pwa').then((module) => ({
        default: module.AdyenCheckoutProvider
    }))
)

// Embedded CSS to avoid webpack loader conflicts
const adyenCSS = `
.adyen-checkout__spinner__wrapper{align-items:center;display:flex;height:100%;justify-content:center}.adyen-checkout__spinner__wrapper--inline{display:inline-block;height:auto;margin-right:8px}[dir=rtl] .adyen-checkout__spinner__wrapper--inline{margin-left:8px;margin-right:0}.adyen-checkout__spinner{animation:rotate-spinner 1.5s linear infinite;border:3px solid #0075ff;border-radius:50%;border-top-color:transparent;height:43px;width:43px}.adyen-checkout__spinner--large{height:43px;width:43px}.adyen-checkout__spinner--small{border-width:2px;height:16px;width:16px}.adyen-checkout__spinner--medium{height:28px;width:28px}@keyframes rotate-spinner{0%{transform:rotate(0deg)}to{transform:rotate(1turn)}}.adyen-checkout__button{background:#00112c;border:0;border-radius:6px;color:#fff;cursor:pointer;font-size:1em;font-weight:500;height:48px;margin:0;padding:15px;text-decoration:none;transition:background .3s ease-out,box-shadow .3s ease-out;width:100%}.adyen-checkout__button:focus{box-shadow:0 0 0 2px #3070ED;outline:0}.adyen-checkout__button:hover{background:#1c3045;box-shadow:0 0,0 2px 4px -1px rgba(0,0,0,.2),0 4px 5px 0 rgba(0,0,0,.14)}.adyen-checkout__button:active{background:#3a4a5c}.adyen-checkout__button:hover:focus{box-shadow:0 0 0 2px #3070ED,0 3px 4px rgba(0,15,45,.2)}.adyen-checkout__button:disabled,.adyen-checkout__button:disabled:hover{box-shadow:none;cursor:not-allowed;opacity:.4;-webkit-user-select:all;-moz-user-select:all;user-select:all}.adyen-checkout__button.adyen-checkout__button--loading{background:#687282;box-shadow:none;pointer-events:none;-webkit-user-select:none;-moz-user-select:none;user-select:none}.adyen-checkout__button.adyen-checkout__button--pay{display:flex;justify-content:center;margin-top:24px}.adyen-checkout__button.adyen-checkout__button--pay:disabled{opacity:.4}.adyen-checkout__button.adyen-checkout__button--standalone{margin-top:0}.adyen-checkout__button.adyen-checkout__button--inline{display:block;font-size:.81em;height:auto;padding:10px 8px;width:auto}.adyen-checkout__button.adyen-checkout__button--ghost{background:none;border:0;color:#00112c}.adyen-checkout__button.adyen-checkout__button--ghost:hover{background:#f7f8f9;box-shadow:none}.adyen-checkout__button.adyen-checkout__button--ghost:active{background:#e6e9eb;box-shadow:none}.adyen-checkout__button.adyen-checkout__button--secondary{background:#fff;border:1px solid #00112c;color:#00112c;padding:10px 12px}.adyen-checkout__button.adyen-checkout__button--secondary:hover{background:#f7f8f9;box-shadow:0 2px 4px rgba(27,42,60,.2),0 4px 5px rgba(27,42,60,.14)}.adyen-checkout__button.adyen-checkout__button--secondary:active,.adyen-checkout__button.adyen-checkout__button--secondary:active:hover{background:#f7f8f9;box-shadow:none}.adyen-checkout__button.adyen-checkout__button--secondary:disabled,.adyen-checkout__button.adyen-checkout__button--secondary:disabled:hover{background-color:#f7f8f9;border-color:#99a3ad;box-shadow:none;cursor:not-allowed;opacity:.5;-webkit-user-select:all;-moz-user-select:all;user-select:all}.adyen-checkout__button.adyen-checkout__button--secondary .adyen-checkout__spinner{border-color:transparent #00112c #00112c}.adyen-checkout__button.adyen-checkout__button--action{background:rgba(0,102,255,.1);border:1px solid transparent;color:#0075ff;padding:10px 12px}.adyen-checkout__button.adyen-checkout__button--action:hover{background:rgba(0,102,255,.2);box-shadow:none}.adyen-checkout__button.adyen-checkout__button--action:active,.adyen-checkout__button.adyen-checkout__button--action:active:hover{background:rgba(0,102,255,.3);box-shadow:none}.adyen-checkout__button.adyen-checkout__button--link{background:transparent;border:1px solid transparent;border-radius:3px;color:#0075ff;font-weight:400;padding:2px}.adyen-checkout__button.adyen-checkout__button--link:hover{background:transparent;box-shadow:none;text-decoration:underline}.adyen-checkout__button.adyen-checkout__button--completed,.adyen-checkout__button.adyen-checkout__button--completed:active,.adyen-checkout__button.adyen-checkout__button--completed:active:hover,.adyen-checkout__button.adyen-checkout__button--completed:hover{background:#089a43;color:#fff}.adyen-checkout__button.adyen-checkout__button--completed .adyen-checkout__button__icon{filter:brightness(0) invert(1)}.adyen-checkout__button__content{align-items:center;display:flex;height:100%;justify-content:center}.adyen-checkout__button__icon{margin-right:12px}[dir=rtl] .adyen-checkout__button__icon{margin-left:12px;margin-right:0}.adyen-checkout__button__text{display:block;justify-content:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.adyen-checkout__button .adyen-checkout__spinner{border-color:transparent #fff #fff}.checkout-secondary-button__text{font-size:.85em;margin-left:5px;margin-top:1px}
`

const adyenOverridesCSS = `
.adyen-checkout__applepay__button {
    width: 100% !important;
    height: 32px !important;
}
`

// Inject CSS manually
const injectCSS = (cssContent, id) => {
    if (typeof document !== 'undefined' && !document.getElementById(id)) {
        const style = document.createElement('style')
        style.id = id
        style.textContent = cssContent
        document.head.appendChild(style)
    }
}

const AdyenCheckoutRedirectContainer = () => {
    const basket = useCurrentBasket()
    const accessToken = useAccessToken()
    const customerId = useCustomerId()
    const {getOrigin} = useMultiSite()
    const {goBack} = useNavigation()

    // Inject CSS on component mount
    useEffect(() => {
        injectCSS(adyenCSS, 'adyen-css-checkout')
        injectCSS(adyenOverridesCSS, 'adyen-overrides-css-checkout')
    }, [])

    const [authToken, setAuthToken] = useState()

    useEffect(() => {
        const getToken = async () => {
            const token = await accessToken.getTokenWhenReady()
            setAuthToken(token)
        }

        getToken()
    }, [accessToken])

    if (!authToken || !basket) {
        return null
    }

    return (
        <Suspense fallback={<div>Loading payment form...</div>}>
            <AdyenCheckoutProvider
                authToken={authToken}
                customerId={customerId}
                locale={getOrigin()}
                site={getOrigin()}
                basket={basket}
                navigate={goBack}
            >
                <AdyenCheckout />
            </AdyenCheckoutProvider>
        </Suspense>
    )
}

export default AdyenCheckoutRedirectContainer
