import React, { useEffect, useRef, useState, useCallback } from 'react'
import { 
    createPaymentMethodSet, 
    createSFPConfig 
} from '../../utils/salesforce-payments/payment-method-mapper'
import { Box } from '@salesforce/retail-react-app/app/components/shared/ui'

/**
 * PaymentExpressButtons - Express Payment Methods Component
 * 
 * Renders express payment buttons like Apple Pay, Google Pay, etc.
 * These are typically one-click payment solutions that don't require
 * traditional form inputs.
 */
const PaymentExpressButtons = ({
    sfpInstance,
    paymentConfig,
    metadata,
    paymentRequestInfo,
    options = {},
    onPaymentExpressReady = () => {},
    onConfirmMethodReady = () => {},
    onError = () => {},
    containerProps = {}
}) => {
    // ... implementation
    const [isComponentCreated, setIsComponentCreated] = useState(false)
    const paymentElementRef = useRef(null)
    const containerRef = useRef(null)
    const paymentExpressInstanceRef = useRef(null) // Store SFP instance here
    
    const {
        elementId = 'salesforce-payments-express',
        locale = 'en-US',
        paymentFlow = 'express',
        customTheme = {},
        enabledMethods = null,
        //minHeight = '300px'
    } = options


    // ✅ Memoize the confirmPayment function to prevent recreating on every render
    const confirmPayment = useCallback(async (createPaymentIntent, billingDetails, shippingDetails = {}) => {
        if (!paymentExpressInstanceRef.current) {
            throw new Error('Payment express not ready')
        }
        
        return new Promise((resolve, reject) => {
            paymentExpressInstanceRef.current.confirm(createPaymentIntent, billingDetails, shippingDetails)
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
            })   // Create SFP payment express
            const paymentExpress = sfpInstance.express(
                metadata,
                paymentMethodSetForCheckout,
                config,
                paymentRequestInfo,
                paymentElementRef.current,
                0
            )            
            // Store SFP instance in PaymentExpressButtons
            paymentExpressInstanceRef.current = paymentExpress
            setIsComponentCreated(true)
            
            // Notify parent that SFP is ready
            onPaymentExpressReady(paymentExpress)
            
            // Expose confirm function to parent (PWA Kit callback pattern)
            onConfirmMethodReady(confirmPayment)

        } catch (error) {
            console.error('Failed to create SFP payment express:', error)
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
            paymentExpressInstanceRef.current = null
            setIsComponentCreated(false)
        }
    }, [])

    return (
        <Box
            ref={containerRef}
            minH="60px" // Add minimum height
            border="1px solid #E2E8F0"
            borderRadius="md"
            p={4}
            bg="white"
            {...containerProps}
        />
    )
}

export default PaymentExpressButtons