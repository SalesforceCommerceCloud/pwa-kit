import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Box } from '@salesforce/retail-react-app/app/components/shared/ui'
import { 
    createPaymentMethodSet, 
    createSFPConfig 
} from '../../utils/salesforce-payments/payment-method-mapper'

/**
 * PaymentSheetForm - Pure SFP Component
 * 
 * Handles all SFP-specific logic including:
 * - Creating SFP component
 * - Storing paymentSheetInstance 
 * - Exposing confirm method to parent
 */
const PaymentSheetForm = ({
    sfpInstance,
    paymentConfig,
    metadata,
    paymentRequestInfo,
    options = {},
    onPaymentSheetReady = () => {},  // Callback when ready
    onConfirmMethodReady = () => {}, // Callback to expose confirm function
    onError = () => {},
    containerProps = {}
}) => {
    const [isComponentCreated, setIsComponentCreated] = useState(false)
    const paymentElementRef = useRef(null)
    const containerRef = useRef(null)
    const paymentSheetInstanceRef = useRef(null) // Store SFP instance here
    
    const {
        elementId = 'salesforce-payments-element',
        locale = 'en-US',
        paymentFlow = 'checkout',
        customTheme = {},
        enabledMethods = null,
        //minHeight = '300px'
    } = options

    // ✅ Memoize the confirmPayment function to prevent recreating on every render
    const confirmPayment = useCallback(async (createPaymentIntent, billingDetails, shippingDetails = {}) => {
        if (!paymentSheetInstanceRef.current) {
            throw new Error('Payment sheet not ready')
        }
        
        return new Promise((resolve, reject) => {
            paymentSheetInstanceRef.current.confirm(createPaymentIntent, billingDetails, shippingDetails)
                .then(function (resp) {
                    const respData = resp.data

                    if (resp.responseCode === 0) {
                        resolve(respData)
                    } else {
                        console.log('❌ SFP payment failed:', respData)
                        reject(new Error('Payment failed'))
                    }
                })
                .catch(function (err) {
                   // Check if it's a validation error that should be shown to user
                    if (err.error && err.error.type === 'validation_error') {
                        // Reject with the actual error so UI can show validation message
                        reject(new Error(err.error.message || 'Payment validation failed'))
                    } else {
                        // For other errors, you might want to reject or handle differently
                        reject(new Error('Payment processing failed'))
                    }
                })
        })
    }, []) // Empty deps since it only uses refs

    // Create SFP component when ready
    useEffect(() => {
        if (!sfpInstance || !paymentConfig || !metadata || !paymentRequestInfo || isComponentCreated) {
            return
        }

        if (!containerRef.current) {
            return
        }

        try {
            // Create payment element
            if (!paymentElementRef.current) {
                const element = document.createElement('div')
                element.id = elementId
                element.style.width = '100%'
                //element.style.minHeight = minHeight
                paymentElementRef.current = element
            }

            // Add to container
            if (!containerRef.current.contains(paymentElementRef.current)) {
                containerRef.current.appendChild(paymentElementRef.current)
            }

            // Create minimal basket-like object for country
            const basketLike = {
                billingAddress: { countryCode: paymentRequestInfo.country }
            }

            // Use existing utilities
            const paymentMethodSetForCheckout = createPaymentMethodSet(paymentConfig, basketLike, {
                paymentFlow,
                locale,
                enabledMethods
            })
        
            const config = createSFPConfig(paymentConfig, {
                customTheme
            })
            // Create SFP payment sheet
            const paymentSheet = sfpInstance.checkout(
                metadata,
                paymentMethodSetForCheckout,
                config,
                paymentRequestInfo,
                paymentElementRef.current
            )
            // Store SFP instance in PaymentSheetForm
            paymentSheetInstanceRef.current = paymentSheet
            setIsComponentCreated(true)
            
            // Notify parent that SFP is ready
            onPaymentSheetReady(paymentSheet)
            
            // Expose confirm function to parent (PWA Kit callback pattern)
            onConfirmMethodReady(confirmPayment)

        } catch (error) {
            console.error('Failed to create SFP payment sheet:', error)
            onError(error)
        }
    }, [
        // ✅ Removed callback functions from dependencies to prevent unnecessary reruns
        sfpInstance, 
        paymentConfig, 
        metadata, 
        paymentRequestInfo, 
        isComponentCreated, 
        elementId, 
        locale, 
        paymentFlow, 
        customTheme, 
        enabledMethods, 
        //minHeight,
        confirmPayment  // ✅ Add memoized function to dependencies
    ])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            paymentSheetInstanceRef.current = null
            setIsComponentCreated(false)
        }
    }, [])

    return (
        <Box
            ref={containerRef}
            //minH={minHeight}
            border="1px solid #E2E8F0"
            borderRadius="md"
            p={4}
            bg="white"
            {...containerProps}
        />
    )
}

export default PaymentSheetForm