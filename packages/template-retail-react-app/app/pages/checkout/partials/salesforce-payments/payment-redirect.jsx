// pages/checkout/partials/salesforce-payments/payment-redirect.jsx
import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const PaymentRedirect = () => {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleRedirect = () => {
      const urlParams = new URLSearchParams(location.search)
      
      // Extract parameters exactly like LWC getPaymentStatus()
      const paymentIntentId = urlParams.get('payment_intent')
      const uuid = urlParams.get('uuid')
      const gatewayId = urlParams.get('gatewayId')
      const redirectResultId = urlParams.get('redirectResult')
      const type = urlParams.get('paymentMethodType')
      const isManualCapture = urlParams.get('isManualCapture')
      
      const billingDetails = {
        name: urlParams.get('billingName'),
        email: urlParams.get('billingEmail'),
        phone: urlParams.get('billingPhone'),
        address: {
          line1: urlParams.get('billingLine1'),
          line2: urlParams.get('billingLine2'),
          city: urlParams.get('billingCity'),
          state: urlParams.get('billingState'),
          postalCode: urlParams.get('billingPostalCode'),
          country: urlParams.get('billingCountry')
        }
      }

      // Validate required parameters like LWC does
      if (
        (paymentIntentId !== null || redirectResultId !== null) &&
        uuid !== null &&
        gatewayId !== null &&
        billingDetails.address.line1 !== null &&
        billingDetails.address.country !== null
      ) {
        console.log('Payment redirect successful:', {
          paymentIntentId,
          uuid,
          gatewayId,
          redirectResultId,
          type,
          isManualCapture,
          billingDetails
        })
        
        // Success - redirect to confirmation
        navigate('/checkout/confirmation')
      } else {
        console.error('Missing required payment data:', {
          paymentIntentId,
          uuid,
          gatewayId,
          redirectResultId,
          billingLine1: billingDetails.address.line1,
          billingCountry: billingDetails.address.country
        })
        
        // Error - redirect to failure page
        navigate('/checkout/payment-failed')
      }
    }

    // Call the handler
    handleRedirect()
  }, [location, navigate])

  return (
    <div>
      <h2>Processing Payment...</h2>
      <p>Please wait while we process your payment.</p>
    </div>
  )
}

export default PaymentRedirect