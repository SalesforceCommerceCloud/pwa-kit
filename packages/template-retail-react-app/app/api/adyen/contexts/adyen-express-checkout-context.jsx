/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {AdyenPaymentMethodsService} from '@salesforce/retail-react-app/app/api/adyen/services/payment-methods'
import {AdyenEnvironmentService} from '@salesforce/retail-react-app/app/api/adyen/services/environment'
import {AdyenShippingMethodsService} from '@salesforce/retail-react-app/app/api/adyen/services/shipping-methods'

export const AdyenExpressCheckoutContext = React.createContext({})

export const fetchPaymentMethods = async (customerId, site, locale, authToken) => {
    const adyenPaymentMethodsService = new AdyenPaymentMethodsService(authToken, site)
    try {
        return await adyenPaymentMethodsService.fetchPaymentMethods(customerId, locale)
    } catch (error) {
        return null
    }
}

export const fetchEnvironment = async (site, authToken) => {
    const adyenEnvironmentService = new AdyenEnvironmentService(authToken, site)
    try {
        return await adyenEnvironmentService.fetchEnvironment()
    } catch (error) {
        return null
    }
}

export const fetchShippingMethods = async (basketId, site, authToken) => {
    const adyenShippingMethodsService = new AdyenShippingMethodsService(authToken, site)
    try {
        return await adyenShippingMethodsService.getShippingMethods(basketId)
    } catch (error) {
        return null
    }
}

export const AdyenExpressCheckoutProvider = ({
    children,
    authToken,
    customerId,
    locale,
    site,
    basket,
    navigate
}) => {
    const [adyenPaymentMethods, setAdyenPaymentMethods] = useState()
    const [adyenEnvironment, setAdyenEnvironment] = useState()
    const [shippingMethods, setShippingMethods] = useState()

    useEffect(() => {
        const fetchAdyenData = async () => {
            const [environment, paymentMethods] = await Promise.all([
                fetchEnvironment(site, authToken),
                fetchPaymentMethods(customerId, site, locale, authToken)
            ])
            setAdyenEnvironment(environment || {error: true})
            setAdyenPaymentMethods(paymentMethods || {error: true})
        }

        fetchAdyenData()
    }, [])

    useEffect(() => {
        const fetchShippingMethodsData = async () => {
            const shippingMethods = await fetchShippingMethods(basket?.basketId, site, authToken)
            setShippingMethods(shippingMethods || {error: true})
        }

        if (basket && !shippingMethods) {
            fetchShippingMethodsData()
        }
    }, [basket])

    const value = {
        adyenEnvironment,
        adyenPaymentMethods,
        basket,
        locale,
        site,
        authToken,
        navigate,
        shippingMethods,
        fetchShippingMethods
    }

    return (
        <AdyenExpressCheckoutContext.Provider value={value}>
            {children}
        </AdyenExpressCheckoutContext.Provider>
    )
}

AdyenExpressCheckoutProvider.propTypes = {
    children: PropTypes.any,
    authToken: PropTypes.any,
    customerId: PropTypes.any,
    locale: PropTypes.any,
    site: PropTypes.any,
    basket: PropTypes.any,
    navigate: PropTypes.any
}

export default AdyenExpressCheckoutProvider
