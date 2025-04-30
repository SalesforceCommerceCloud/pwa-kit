/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import {
    CardElement,
    useStripe,
    useElements,
    CardNumberElement,
    CardCvcElement,
    CardExpiryElement
} from '@stripe/react-stripe-js'
import axios from 'axios'
import PropTypes from 'prop-types'

const elementStyle = {
    base: {
        fontSize: '16px',
        color: '#000',
        '::placeholder': {
            color: '#a0a0a0'
        },
    },
    invalid: {
        color: '#fa755a',
    },
};

const PaymentForm = ({onPaymentMethod}) => {
    const stripe = useStripe()
    const elements = useElements()
    const [processing, setProcessing] = useState(false)
    const [cardholderName, setCardholderName] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    /*
    const handleSubmit = async (event) => {
        event.preventDefault()
        setProcessing(true)

        try {
            // Create payment intent on backend
            const {data} = await axios.post('/api/payments/create-payment-intent', {
                amount: 1000, // Amount in cents
                currency: 'usd'
            })

            const result = await stripe.confirmCardPayment(data.clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                    billing_details: {
                        name: 'Customer Name'
                    }
                }
            })

            if (result.error) {
                console.error(result.error.message)
            } else {
                // Payment successful
                console.log('Payment succeeded')
            }
        } catch (error) {
            console.error('Payment error', error)
        }

        setProcessing(false)
    }
    */
    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrorMessage('')

        if (!stripe || !elements) {
            return
        }

        const cardElement = elements.getElement(CardNumberElement)

        const {error, paymentMethod} = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
            billing_details: {
                name: cardholderName
            }
        })

        setIsLoading(false)

        if (error) {
            setErrorMessage(error.message)
        } else {
            console.log('PaymentMethod:', paymentMethod)
            onPaymentMethod(paymentMethod);
            //alert(`Success! Card ending in ${paymentMethod.card.last4}`)
        }
    }
    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                <div style={{border: '1px solid #ccc', borderRadius: '4px', padding: '10px'}}>
                    <input
                        type="text"
                        placeholder="Cardholder Name"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        style={{
                            border: 'none',
                            outline: 'none',
                            fontSize: '16px',
                            width: '100%',
                            background: 'transparent',
                        }}
                        required
                    />
                </div>
                <div style={{border: '1px solid #ccc', borderRadius: '4px', padding: '10px'}}>
                    <CardNumberElement options={{style: elementStyle}}/>
                </div>
                <div style={{border: '1px solid #ccc', borderRadius: '4px', padding: '10px'}}>
                    <CardExpiryElement options={{style: elementStyle}}/>
                </div>
                <div style={{border: '1px solid #ccc', borderRadius: '4px', padding: '10px'}}>
                    <CardCvcElement options={{style: elementStyle}}/>
                </div>

                {errorMessage && (
                    <div style={{color: 'red', fontSize: '14px'}}>
                        {errorMessage}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={!stripe || isLoading}
                    style={{
                        backgroundColor: '#007bff',
                        color: '#fff',
                        padding: '12px 24px',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        opacity: isLoading ? 0.6 : 1
                    }}
                >
                    {isLoading ? 'Processing…' : 'Pay'}
                </button>
            </div>

        </form>
    )
}
PaymentForm.propTypes = {
    /** Callback for form submit */
    onPaymentMethod: PropTypes.func
}

export default PaymentForm
