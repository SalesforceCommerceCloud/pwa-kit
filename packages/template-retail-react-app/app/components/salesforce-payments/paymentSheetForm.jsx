import React, { useEffect, useRef, useState, useCallback } from 'react'
import { createPaymentMethodSet } from '../../utils/salesforce-payments/payment-method-mapper'
import logger from '@salesforce/retail-react-app/app/utils/logger-instance'

const PaymentSheetForm = ({
  sfpInstance,
  paymentConfig,
  metadata,
  paymentRequestInfo,
  options = {},  // Default: if parent doesn't pass options, use empty object
  onConfirmMethodReady = () => {},
  containerProps = {},
}) => {
  const [isComponentCreated, setIsComponentCreated] = useState(false)
  const paymentElementRef = useRef(null)
  const paymentSheetInstanceRef = useRef(null)

  // Extract these properties from the options object, but if any property is missing, 
  // use these defaults as a safety net
  const {
    elementId = 'salesforce-payments-element',
    locale = 'en-US',
    paymentFlow = 'checkout',
    customTheme = {},
  } = options

  
  /*
    Input Parameters:
    createPaymentIntent: Function that creates payment intent and returns client secret
    billingDetails: Customer billing information (name, address, etc.)
    shippingDetails: Customer shipping information (optional, defaults to {})

    useCallback is a React hook that memoizes a function - basically it returns the same function 
    reference unless its dependencies (if any) change

    Confirm Flow: User action → Parent → Child → SDK
    Confirmation via Payment Sheet is parent controlled:
        Parent decides when to process payment 
        Child(this) exposes the confirmPayment function for the parent to call
  */
  const confirmPayment = useCallback( (createPaymentIntent, billingDetails, shippingDetails = {}) => {
        
    // Guard against invalid calls before the payment sheet is ready 
    if (!createPaymentIntent || !billingDetails) {
        logger.warn('confirmPayment called during setup', {
            namespace: 'PaymentSheetForm.confirmPayment',
        })
        // Return the function itself instead of calling it to avoid infinite recursion
        return confirmPayment
    }

    if (!paymentSheetInstanceRef.current) {
        logger.error('confirmPayment called before PaymentSheet ready', {
            namespace: 'PaymentSheetForm.confirmPayment'
        })
        return Promise.reject(new Error('PaymentSheet not ready or initialized'))
    }
     
    // calls the SDK and returns the promise
    return paymentSheetInstanceRef.current.confirm(createPaymentIntent, billingDetails, shippingDetails)
    .then(resp => {
        if (resp.responseCode === 0) {
            return resp.data
        } else {
            logger.error('Payment confirmation response code is not 0', {
                namespace: 'PaymentSheetForm.confirmPayment',
                additionalProperties: {error: resp.data}
            })
            const error = new Error('Payment confirmation response code is not 0')
            error.response = resp.data 
            return Promise.reject(error)
        }
    })
    .catch(err => {
        if (err.error?.type === 'validation_error') {
            logger.error('Payment confirmation validation_error', {
                namespace: 'PaymentSheetForm.confirmPayment',
            })
            const error = new Error(err.error.message || 'Payment validation failed')
            error.response = err.error.message 
            return Promise.reject(error)
        }
        return Promise.reject(new Error('Payment processing failed'))
    })
  }, [])  


  /*
    Creates and mounts the actual Salesforce payment form (iframe) into the DOM when everything is ready.
    useEffect hook runs whenever a component is mounted, updated, or unmounted.
  */
  useEffect(() => {
    if (!sfpInstance || !paymentConfig || !metadata || !paymentRequestInfo) {
      logger.error('Missing required data', {
        namespace: 'PaymentSheetForm.useEffect.initialization',
      })
      return // Exit if any required data is missing
    }
    if (isComponentCreated) {
      logger.error('Component already created', {
        namespace: 'PaymentSheetForm.useEffect.initialization',
      })
      return // Exit if component already created (prevent duplicates)
    }
    if (!paymentElementRef.current) {
      logger.error('DOM element not ready', {
        namespace: 'PaymentSheetForm.useEffect.initialization',
      })
      return // Exit if DOM element not ready
    }

    try {
        const basketLike = { billingAddress: { countryCode: paymentRequestInfo.country } }
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
                //none passed via actions since parent is responsible for creating the payment intent
            },
            // TODO: add returnUrl, showSaveForFutureUsageCheckbox, savedPaymentMethods, enforceSavedPaymentMethod, showSaveAsDefaultCheckbox, maximumInitialPaymentMethods
            options: {
                useManualCapture: !paymentConfig.card_capture_automatic
            },
        }
        /*
        This setTimeout is used to delay the initialization of the payment sheet
        This is to ensure that the payment sheet is created after the payment element is mounted
        Defers execution until after React's render cycle completes
        React's concurrent features can cause re-renders before the DOM is ready
        */
        const timer = setTimeout(() => {
            if (!paymentElementRef.current) {
                logger.error('Element ref lost at initialization', {
                    namespace: 'PaymentSheetForm.useEffect.initialization',
                })
                return
            }

            // SFP creates the payment sheet:
            const paymentSheet = sfpInstance.checkout(
                metadata,
                paymentMethodSetForCheckout,
                config,
                paymentRequestInfo,
                paymentElementRef.current
            )

            // Store the payment sheet instance in the ref to prevent re-rendering
            paymentSheetInstanceRef.current = paymentSheet
            setIsComponentCreated(true)
            // Call onConfirmMethodReady immediately after creation for the parent component to receive the confirmPayment function
            onConfirmMethodReady(confirmPayment)
        }, 0)
        return () => {
            clearTimeout(timer)
        }
    
    } catch (err) {
        logger.error('Error in checkout init', {
            namespace: 'PaymentSheetForm.useEffect',
            additionalProperties: {error: err}
        })
    }
  }, [
        sfpInstance,
        paymentConfig,
        metadata,
        paymentRequestInfo,
        locale,
        paymentFlow,
        customTheme
  ])

  // Cleanup
  useEffect(() => {
    return () => {
      paymentSheetInstanceRef.current = null
    }
  }, [])

  return (
    <div {...containerProps}>
      <div id={elementId} style={{ width: '100%' }} ref={paymentElementRef} />
    </div>
  )
}
export default PaymentSheetForm