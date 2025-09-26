import React, { useEffect, useRef, useState, useCallback } from 'react'
import { 
    createPaymentMethodSet
} from '../../utils/salesforce-payments/payment-method-mapper'
import { Box } from '@salesforce/retail-react-app/app/components/shared/ui'
import logger from '@salesforce/retail-react-app/app/utils/logger-instance'

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

    amount, 
    currency,

    shippingAddressRequired =false,
    emailAddressRequired =false,
    phoneNumberRequired =false,
 
    options = {},

    onShippingAddressChange, 
    onShippingOptionChange, 
    onCreatePaymentIntent, 

    onPaymentApproved = () => {}, 
    onPaymentBeforeApproved = () => {}, 
    onPaymentProcessingChange = () => {}, // Add this prop
    containerProps = {}
}) => {
    // ... implementation
    const [isComponentCreated, setIsComponentCreated] = useState(false)
    const paymentElementRef = useRef(null)
    const containerRef = useRef(null)
    const paymentExpressInstanceRef = useRef(null) // Store SFP instance here

    // Add state to track the selected payment type
    const [selectedExpressPaymentType, setSelectedExpressPaymentType] = useState(null)
   

    // Extract these properties from the options object, but if any property is missing, 
    // use these defaults as a safety net
    const {
        elementId = 'salesforce-payments-express',
        locale = 'en-US',
        paymentFlow = 'express',
        customTheme = {},
    } = options

    /*
        create payment intent function
        SDK handles everything automatically (user clicks "Pay" → payment happens)
        Parent only provides data/functions (like payment intent creation)

        If you remember, in the case of the payment sheet, parent controls when payment happens 
        (manual triggering).  For express, parent just passes the create payment intent function to the child
    */
    const handleCreatePaymentIntent = useCallback(async () => {
        if (!paymentExpressInstanceRef.current) {
            logger.error('Payment express not ready', {
                namespace: 'PaymentExpressButtons.handleCreatePaymentIntent'
            })
            throw(new Error('Payment express not ready'))
        }
        // pass the create payment intent function to the parent
        if (!onCreatePaymentIntent) {
            logger.error('onCreatePaymentIntent callback not provided', {
                namespace: 'PaymentExpressButtons.handleCreatePaymentIntent'
            })
            throw new Error('onCreatePaymentIntent callback not provided')
        }

        // Signal that payment processing started
        onPaymentProcessingChange(true)

        try {
            const resp = await onCreatePaymentIntent(selectedExpressPaymentType)
            return resp
        } catch (error) {
            logger.error('onCreatePaymentIntent failed', {
                namespace: 'PaymentExpressButtons.handleCreatePaymentIntent',
                additionalProperties: {error: error}
            })
            onPaymentProcessingChange(false)
            throw error
        }
    
    }, [onCreatePaymentIntent, onPaymentProcessingChange])


    // callBack Function object when shipping address changes
    const handleShippingAddressChange = useCallback(async (shippingAddress, callbackFunction) => {
    
        let shippingRates = []

        //call parent to calculate shipping rates based on address
        if (shippingAddress && onShippingAddressChange) {
            const shippingResult = await onShippingAddressChange(shippingAddress)
            if (shippingResult.success) {
                shippingRates = shippingResult.shippingRates
                callbackFunction.updateShippingAddress({
                    shippingMethods: shippingRates,
                    grandTotalAmount: shippingResult.grandTotalAmount,
                    lineItems: [],
                    selectedShippingMethod: shippingResult.defaultShippingMethodId,
                })
            }
        }
    }, [])

    // callBack Function object when shipping option changes
    const handleShippingOptionChange = useCallback(async (shippingOption,callbackFunction) => {
    
        let shippingRates = []

        if(shippingOption && onShippingOptionChange) {
            const shippingOptionResult = await onShippingOptionChange(shippingOption)
            if (shippingOptionResult.success) {
                shippingRates = shippingOptionResult.shippingRates
                callbackFunction.updateShippingRate({
                    shippingMethods: shippingRates,
                    grandTotalAmount: shippingOptionResult.grandTotalAmount,
                    lineItems: [],
                    selectedShippingMethod: shippingOptionResult.defaultShippingMethodId,
                })
            }
        }
    }, [])

    // callBack Function object when express button is clicked
    const handleExpressButtonClick = useCallback(async (paymentType) => {
        try {
            // Here you would typically:
            // 1. Extract billing/shipping info from paymentData
            // 2. Update basket with payment info
            // 3. Process the payment

            // Save the selected payment type
            setSelectedExpressPaymentType(paymentType)

            // return dummy shipping rates since the express callback in SDK requires it
            return {
                shippingRates: [
                    {
                        id: '1',
                        displayName: "shipping rate test",
                        amount: 0,
                    },
                ],
                amount: amount,
            };
            
        } catch (error) {
            logger.error('Express handleExpressButtonClick failed', {
                namespace: 'PaymentExpressButtons.handleExpressButtonClick',
                additionalProperties: {error: error}
            })
            throw error
        }
    }, [])


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

            const paymentMethodSetForCheckout = createPaymentMethodSet(paymentConfig, basketLike, {
                paymentFlow,
                locale
            })
          
            const config = {
                theme: {
                    designTokens: {
                        'color-background': 'var(--skin-background-color-1, transparent)',
                        'input-background-color': '#ffffff',
                        'input-border': '1px solid #ced4da',
                        'input-focus-border': '1px solid rgb(96.5, 210.421875, 255)',
                        ...customTheme // If you have customTheme from options
                    }
                },
                actions: {
                    expressButtonClickFunction: handleExpressButtonClick,
                    onShippingAddressChangeFunction: handleShippingAddressChange,
                    onShippingOptionChangeFunction: handleShippingOptionChange,
                    createIntentFunction: handleCreatePaymentIntent,
                },
                options: {
                    useManualCapture: !paymentConfig.card_capture_automatic,
                    shippingAddressRequired,
                    emailAddressRequired,
                    phoneNumberRequired
                },
            }
            // Create SFP payment express
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

        } catch (error) {
            logger.error('Failed to create SFP payment express', {
                namespace: 'PaymentExpressButtons.useEffect',
                additionalProperties: {error: error}
            })
        }
    }, [
        sfpInstance, 
        paymentConfig, 
        metadata, 
        paymentRequestInfo, 
        isComponentCreated, 
        elementId, 
        locale, 
        paymentFlow, 
        customTheme, 
    ])

    const handleOverlayCleanup = useCallback(() => {
        /*
            ONLY NEEDED IF THE OVERLAY IS STUCK
            // Test this in browser console while the overlay is visible
            document.body.style.overflow = 'auto'

            // Find all fixed position elements
            const fixedElements = Array.from(document.querySelectorAll('*')).filter(el => 
                window.getComputedStyle(el).position === 'fixed'
            )
            console.log('Fixed elements:', fixedElements)

            // Remove likely backdrop elements
            fixedElements.forEach(el => {
                const styles = window.getComputedStyle(el)
                if (styles.backgroundColor.includes('rgba') || styles.background.includes('rgba')) {
                    console.log('Removing:', el)
                    el.remove()
                }
            })
        */
    }, [])
    /*
        The SDK dispatches the event on the DOM element 
        (this.element.dispatchEvent(errorEvent)), not on the SDK instance itself.   
    */
    useEffect(() => {
        if (!paymentElementRef.current || !isComponentCreated) {  
            logger.log('Element or component not ready', {
                namespace: 'PaymentExpressButtons.useEffect'
            })
            return
        }
        const handleBeforeApprove = (event) => {
            // Notify parent component
            onPaymentBeforeApproved(event.detail)
        }

        const handleApprove = (event) => {
            // Reset processing state and notify parent
            onPaymentProcessingChange(false)

            // Notify parent component
            onPaymentApproved(event.detail)
        }

        const handleCancel = (event) => {
            
            // Clean up any stuck overlays
            handleOverlayCleanup()

            onPaymentProcessingChange(false)
        
        }
      
        // Add DOM event listeners to the payment element
        const paymentElement = paymentElementRef.current
        paymentElement.addEventListener('sfppaymentbuttoncancel', handleCancel)
        paymentElement.addEventListener('sfppaymentbuttonapprove', handleApprove) // Add this line
        paymentElement.addEventListener('sfppaymentbuttonbeforeapprove', handleBeforeApprove) // Add this line
        // Cleanup function
        return () => {
            paymentElement.removeEventListener('sfppaymentbuttoncancel', handleCancel)
            paymentElement.removeEventListener('sfppaymentbuttonapprove', handleApprove) 
            paymentElement.removeEventListener('sfppaymentbuttonbeforeapprove', handleBeforeApprove)
        }
    }, [isComponentCreated])
 
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