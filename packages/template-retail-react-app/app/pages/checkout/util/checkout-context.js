/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import useEinstein from '@salesforce/retail-react-app/app/hooks/use-einstein'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {STORE_LOCATOR_IS_ENABLED} from '@salesforce/retail-react-app/app/constants'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {
    findDeliveryShipmentWithoutAddress,
    findExistingDeliveryShipment,
    isPickupShipment
} from '@salesforce/retail-react-app/app/utils/shipment-utils'

const CheckoutContext = React.createContext()

export const CheckoutProvider = ({children}) => {
    const {data: customer} = useCurrentCustomer()
    const {data: basket} = useCurrentBasket()
    const einstein = useEinstein()
    const [step, setStep] = useState()
    const storeLocatorEnabled = getConfig()?.app?.storeLocatorEnabled ?? STORE_LOCATOR_IS_ENABLED

    const CHECKOUT_STEPS_LIST = [
        'CONTACT_INFO',
        'PICKUP_ADDRESS',
        'SHIPPING_ADDRESS',
        'SHIPPING_OPTIONS',
        'PAYMENT',
        'REVIEW_ORDER'
    ]
    const STEPS = CHECKOUT_STEPS_LIST.reduce((acc, step, idx) => ({...acc, [step]: idx}), {})

    const getCheckoutStepName = (step) => CHECKOUT_STEPS_LIST[step]

    useEffect(() => {
        if (!customer || !basket) {
            return
        }

        const allShipmentsHaveAddress = !findDeliveryShipmentWithoutAddress(basket)
        const allShipmentsHaveAShippingMethod = !basket.shipments.find(
            (shipment) => !shipment.shippingMethod
        )

        let step = STEPS.REVIEW_ORDER

        if (customer.isGuest && !basket.customerInfo?.email) {
            step = STEPS.CONTACT_INFO
        } else if (!allShipmentsHaveAddress) {
            step = STEPS.SHIPPING_ADDRESS
        } else if (!allShipmentsHaveAShippingMethod) {
            step = STEPS.SHIPPING_OPTIONS
        } else if (!basket.paymentInstruments || !basket.billingAddress) {
            step = STEPS.PAYMENT
        }

        setStep(step)
    }, [
        customer?.isGuest,
        basket?.customerInfo?.email,
        basket?.shipments,
        basket?.paymentInstruments,
        basket?.billingAddress
    ])

    /**************** Einstein ****************/
    // Run this once when checkout begins
    useEffect(() => {
        if (basket?.productItems) {
            einstein.sendBeginCheckout(basket)
        }
    }, [])

    // Run this every time checkout steps change
    useEffect(() => {
        if (step != undefined) {
            einstein.sendCheckoutStep(getCheckoutStepName(step), step, basket)
        }
    }, [step])

    const goToNextStep = () => {
        // Check if current step is CONTACT_INFO
        if (step === STEPS.CONTACT_INFO) {
            const shipments = basket?.shipments || []
            const pickupShipments = shipments.filter(isPickupShipment)
            const deliveryShipments = shipments.filter((shipment) => !isPickupShipment(shipment))

            // If all items are pickup at one store, skip directly to payment
            const shouldSkipDirectlyToPayment =
                pickupShipments.length === 1 &&
                deliveryShipments.length === 0 &&
                (basket?.productItems?.length
                    ? basket.productItems.every(
                          (item) => item.shipmentId === pickupShipments[0].shipmentId
                      )
                    : true)

            if (shouldSkipDirectlyToPayment) {
                setStep(STEPS.PAYMENT)
                return
            }

            const hasAnyPickupShipment = storeLocatorEnabled && pickupShipments.length > 0
            // Otherwise go to pickup address for pickup baskets, or shipping address for delivery baskets
            setStep(hasAnyPickupShipment ? STEPS.PICKUP_ADDRESS : STEPS.SHIPPING_ADDRESS)
        } else if (step === STEPS.PICKUP_ADDRESS) {
            const hasDeliveryShipment = Boolean(findExistingDeliveryShipment(basket))
            setStep(hasDeliveryShipment ? STEPS.SHIPPING_ADDRESS : STEPS.PAYMENT)
        } else {
            setStep(step + 1)
        }
    }

    const goToStep = (step) => setStep(step)

    const value = {
        step,
        STEPS,
        goToNextStep,
        goToStep
    }

    return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>
}

CheckoutProvider.propTypes = {
    children: PropTypes.any
}

/**
 * A hook for managing checkout state and actions
 * @returns {Object} Checkout data and actions
 */
export const useCheckout = () => {
    return React.useContext(CheckoutContext)
}
