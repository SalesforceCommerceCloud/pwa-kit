/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {AdyenPaymentMethodsService} from '@salesforce/retail-react-app/app/api/adyen/services/payment-methods'
import {paymentMethodsConfiguration} from '@salesforce/retail-react-app/app/api/adyen/components/paymentMethodsConfiguration'
import {AdyenEnvironmentService} from '@salesforce/retail-react-app/app/api/adyen/services/environment'
import {
    onPaymentsDetailsSuccess,
    onPaymentsSuccess
} from '@salesforce/retail-react-app/app/api/adyen/contexts/helper'

export const AdyenCheckoutContext = React.createContext({})

const AdyenCheckoutProvider = ({
    children,
    authToken,
    customerId,
    isCustomerRegistered,
    locale,
    site,
    adyenConfig,
    navigate,
    basket,
    returnUrl,
    page
}) => {
    const [fetchingPaymentMethods, setFetchingPaymentMethods] = useState(false)
    const [adyenPaymentMethods, setAdyenPaymentMethods] = useState()
    const [adyenEnvironment, setAdyenEnvironment] = useState()
    const [adyenStateData, setAdyenStateData] = useState()
    const [adyenPaymentInProgress, setAdyenPaymentInProgress] = useState()
    const callPaymentMethodsOnPages = ['checkout']

    useEffect(() => {
        const fetchEnvironment = async () => {
            const adyenEnvironmentService = new AdyenEnvironmentService(authToken, site)
            try {
                const data = await adyenEnvironmentService.fetchEnvironment()
                setAdyenEnvironment(data ? data : {error: true})
            } catch (error) {
                setAdyenEnvironment({error})
            }
        }
        fetchEnvironment()
    }, [])

    useEffect(() => {
        const fetchPaymentMethods = async () => {
            setFetchingPaymentMethods(true)
            const adyenPaymentMethodsService = new AdyenPaymentMethodsService(authToken, site)
            try {
                const data = await adyenPaymentMethodsService.fetchPaymentMethods(
                    customerId,
                    locale
                )
                setAdyenPaymentMethods(data ? data : {error: true})
                setFetchingPaymentMethods(false)
            } catch (error) {
                setAdyenPaymentMethods({error})
                setFetchingPaymentMethods(false)
            }
        }

        if (
            !adyenPaymentMethods &&
            !fetchingPaymentMethods &&
            callPaymentMethodsOnPages.includes(page)
        ) {
            fetchPaymentMethods()
        }
    }, [basket?.basketId])

    const getTranslations = () => {
        return adyenConfig?.translations && Object.hasOwn(adyenConfig?.translations, locale.id)
            ? adyenConfig?.translations
            : null
    }

    const getPaymentMethodsConfiguration = async ({
        beforeSubmit = [],
        afterSubmit = [],
        beforeAdditionalDetails = [],
        afterAdditionalDetails = [],
        onError
    }) => {
        return paymentMethodsConfiguration({
            additionalPaymentMethodsConfiguration: adyenConfig?.paymentMethodsConfiguration,
            paymentMethods: adyenPaymentMethods?.paymentMethods,
            isCustomerRegistered,
            token: authToken,
            site,
            basket,
            returnUrl,
            customerId,
            onError: adyenConfig?.onError || onError,
            onNavigate: navigate,
            afterSubmit: [
                ...afterSubmit,
                ...(adyenConfig?.afterSubmit || []),
                onPaymentsSuccess(navigate)
            ],
            beforeSubmit: [...beforeSubmit, ...(adyenConfig?.beforeSubmit || [])],
            afterAdditionalDetails: [
                ...afterAdditionalDetails,
                ...(adyenConfig?.afterAdditionalDetails || []),
                onPaymentsDetailsSuccess(navigate)
            ],
            beforeAdditionalDetails: [
                ...beforeAdditionalDetails,
                ...(adyenConfig?.beforeAdditionalDetails || [])
            ]
        })
    }

    const value = {
        adyenEnvironment,
        adyenPaymentMethods,
        adyenStateData,
        adyenPaymentInProgress,
        locale,
        navigate,
        setAdyenPaymentInProgress: (data) => setAdyenPaymentInProgress(data),
        setAdyenStateData: (data) => setAdyenStateData(data),
        getPaymentMethodsConfiguration,
        getTranslations
    }

    return <AdyenCheckoutContext.Provider value={value}>{children}</AdyenCheckoutContext.Provider>
}

AdyenCheckoutProvider.propTypes = {
    children: PropTypes.any,
    authToken: PropTypes.string,
    customerId: PropTypes.string,
    isCustomerRegistered: PropTypes.bool,
    locale: PropTypes.any,
    site: PropTypes.any,
    adyenConfig: PropTypes.any,
    navigate: PropTypes.any,
    basket: PropTypes.any,
    returnUrl: PropTypes.string,
    page: PropTypes.oneOf(['checkout', 'confirmation', 'redirect'])
}

export default AdyenCheckoutProvider
