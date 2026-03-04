/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import useEinstein from '@salesforce/retail-react-app/app/hooks/use-einstein'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {isPickupShipment} from '@salesforce/retail-react-app/app/utils/shipment-utils'
import {
    getSessionJSONItem,
    setSessionJSONItem,
    clearSessionJSONItem
} from '@salesforce/retail-react-app/app/utils/utils'

/** SessionStorage key for "checkout as guest" choice so it persists when shopper navigates away and returns */
export const CHECKOUT_GUEST_CHOICE_STORAGE_KEY = 'sf_checkout_one_click_guest_choice'

export const getCheckoutGuestChoiceFromStorage = () => {
    return getSessionJSONItem(CHECKOUT_GUEST_CHOICE_STORAGE_KEY) === true
}

export const setCheckoutGuestChoiceInStorage = (value) => {
    if (value) {
        setSessionJSONItem(CHECKOUT_GUEST_CHOICE_STORAGE_KEY, true)
    } else {
        clearSessionJSONItem(CHECKOUT_GUEST_CHOICE_STORAGE_KEY)
    }
}

const CheckoutContext = React.createContext()

export const CheckoutProvider = ({children}) => {
    const {data: customer} = useCurrentCustomer()
    const {data: basket} = useCurrentBasket()
    const einstein = useEinstein()
    const [step, setStep] = useState()
    const [contactPhone, setContactPhone] = useState('')
    const consolidationLockRef = useRef(false)

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
        if (consolidationLockRef.current) return

        let step = STEPS.REVIEW_ORDER

        const shipments = basket?.shipments || []
        const productItems = basket?.productItems || []
        const shipmentsWithItems = shipments.filter((s) =>
            productItems.some((i) => i.shipmentId === s.shipmentId)
        )
        const hasDeliveryShipments = shipmentsWithItems.some((s) => !isPickupShipment(s))
        const anyDeliveryMissingAddress = shipmentsWithItems.some(
            (s) => !isPickupShipment(s) && !s?.shippingAddress?.address1
        )
        const anyDeliveryMissingMethod = shipmentsWithItems.some(
            (s) => !isPickupShipment(s) && !s?.shippingMethod
        )

        if (customer.isGuest && !basket.customerInfo?.email) {
            step = STEPS.CONTACT_INFO
        } else if (anyDeliveryMissingAddress) {
            // Mixed or delivery-only: prioritize collecting delivery address first
            step = STEPS.SHIPPING_ADDRESS
        } else if (!hasDeliveryShipments && !shipmentsWithItems[0]?.shippingAddress?.address1) {
            // Pickup-only and we haven't set the pickup address details yet
            step = STEPS.PICKUP_ADDRESS
        } else if (anyDeliveryMissingMethod) {
            // Delivery shipments exist and need a shipping method
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
            einstein.sendBeginCheckout(basket, {
                checkoutType: 'one-click'
            })
        }
    }, [])

    // Run this every time checkout steps change
    useEffect(() => {
        if (step != undefined) {
            einstein.sendCheckoutStep(getCheckoutStepName(step), step, basket, {
                checkoutType: 'one-click'
            })
        }
    }, [step])

    const goToNextStep = () => {
        // Check if current step is CONTACT_INFO
        if (step === STEPS.CONTACT_INFO) {
            // Determine if it's a pickup order - only if BOPIS is enabled
            const shipments = basket?.shipments || []
            const productItems = basket?.productItems || []
            const shipmentsWithItems = shipments.filter((s) =>
                productItems.some((i) => i.shipmentId === s.shipmentId)
            )
            const hasDeliveryShipments = shipmentsWithItems.some((s) => !isPickupShipment(s))
            // Skip to appropriate next step; when mixed, go to SHIPPING_ADDRESS
            setStep(hasDeliveryShipments ? STEPS.SHIPPING_ADDRESS : STEPS.PAYMENT)
        } else {
            setStep(step + 1)
        }
    }

    const goToStep = (step) => setStep(step)

    const setConsolidationLock = (locked) => {
        consolidationLockRef.current = locked
    }

    const value = {
        step,
        STEPS,
        goToNextStep,
        goToStep,
        contactPhone,
        setContactPhone,
        setConsolidationLock
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
