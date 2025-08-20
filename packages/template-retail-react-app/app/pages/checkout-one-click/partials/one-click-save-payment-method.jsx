/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Checkbox, Stack, Text, useToast } from '@salesforce/retail-react-app/app/components/shared/ui'
import { useShopperCustomersMutation } from '@salesforce/commerce-sdk-react'
import { useCurrentCustomer } from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import { FormattedMessage } from 'react-intl'

export default function SavePaymentMethod({ paymentInstrument, onSaved }) {
    const [shouldSave, setShouldSave] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const { data: customer } = useCurrentCustomer()
    const { mutateAsync: createCustomerPaymentInstrument } = useShopperCustomersMutation('createCustomerPaymentInstrument')
    const showToast = useToast()
    
    console.log('🔍 Debug - SavePaymentMethod render:', {
        hasCustomer: !!customer,
        customerId: customer?.customerId,
        hasPaymentInstrument: !!paymentInstrument,
        paymentInstrument,
        willRender: !!(customer?.customerId && paymentInstrument)
    })

    const handleSavePayment = async () => {
        if (shouldSave && customer?.customerId) {
            setIsSaving(true)
            
            // Use the exact same structure as the one-click checkout guest flow
            const requestBody = {
                paymentMethodId: paymentInstrument.paymentMethodId,
                paymentCard: {
                    holder: paymentInstrument.paymentCard.holder,
                    number: paymentInstrument.paymentCard.number || paymentInstrument.paymentCard.maskedNumber,
                    cardType: paymentInstrument.paymentCard.cardType,
                    expirationMonth: paymentInstrument.paymentCard.expirationMonth,
                    expirationYear: paymentInstrument.paymentCard.expirationYear
                }
            }
            
            console.log('🔍 Debug - Saving payment method:', {
                customerId: customer.customerId,
                requestBody,
                paymentInstrument
            })
            
            try {
                const result = await createCustomerPaymentInstrument({
                    parameters: { customerId: customer.customerId },
                    body: requestBody
                })
                
                console.log('🔍 Debug - Payment method saved successfully:', result)
                
                showToast({
                    title: 'Payment method saved successfully',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                })
                
                onSaved?.(paymentInstrument.paymentInstrumentId)
            } catch (error) {
                console.error('🔍 Debug - Failed to save payment method:', {
                    error,
                    errorMessage: error.message,
                    errorResponse: error.response?.data,
                    status: error.response?.status
                })
                
                showToast({
                    title: 'Failed to save payment method',
                    description: error.message || 'Please try again',
                    status: 'error',
                    duration: 5000,
                    isClosable: true
                })
                // Reset checkbox on error
                setShouldSave(false)
            } finally {
                setIsSaving(false)
            }
        }
    }

    // Auto-save when checkbox is checked
    useEffect(() => {
        if (shouldSave && !isSaving) {
            handleSavePayment()
        }
    }, [shouldSave])

    // Don't render if no customer or payment instrument
    if (!customer?.customerId || !paymentInstrument) {
        console.log('🔍 Debug - SavePaymentMethod returning null:', {
            hasCustomer: !!customer,
            customerId: customer?.customerId,
            hasPaymentInstrument: !!paymentInstrument
        })
        return null
    }

    console.log('🔍 Debug - SavePaymentMethod about to return JSX')
    
    return (
        <Checkbox
            isChecked={shouldSave}
            onChange={(e) => setShouldSave(e.target.checked)}
            isDisabled={isSaving}
            size="md"
        >
            <Text fontSize="sm" color="gray.700">
                <FormattedMessage
                    defaultMessage="Save this payment method"
                    id="checkout.payment.save_payment_method"
                />
            </Text>
        </Checkbox>
    )
}

SavePaymentMethod.propTypes = {
    /** The payment instrument to potentially save */
    paymentInstrument: PropTypes.object,
    /** Callback when payment method is successfully saved */
    onSaved: PropTypes.func
}
