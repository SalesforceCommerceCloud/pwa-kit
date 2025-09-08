import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {
    Box,
    Container,
    Heading,
    Text,
    Divider
} from '@salesforce/retail-react-app/app/components/shared/ui'

import {usePaymentScripts} from '../../../../hooks/salesforce-payments/use-payment-scripts'
import {useSalesforcePayments} from '../../../../hooks/salesforce-payments/use-salesforce-payments'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {createCheckoutParameters, createPaymentRequestInfo} from '../../../../utils/salesforce-payments/payment-method-mapper'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import ShippingAddressSelection from '@salesforce/retail-react-app/app/pages/checkout/partials/shipping-address-selection'
import {getAddressDetails} from '../../../../utils/salesforce-payments/address-mapper'
import PaymentExpressButtons from '../../../../components/salesforce-payments/paymentExpressButtons'
import {useShopperOrdersMutation} from '@salesforce/commerce-sdk-react'
import {useCountryDetection} from '../../../../utils/salesforce-payments/country-detection'

// Module-level storage for paymentSheet
let paymentExpressInstance = null
let confirmPaymentFunction = null

const SFPaymentsExpress = ({paymentState}) => {

    const {
        paymentConfig,
        metadata,
        paymentConfigLoading,
        isSFPEnabled
    } = paymentState
    const isReady = !paymentConfigLoading && paymentConfig && metadata
    const intl = useIntl()


    // Load scripts and SFP
    const {scriptsLoaded, loading, hasSFP} = usePaymentScripts(['sfp'])
    const {sfpInstance} = useSalesforcePayments(scriptsLoaded, hasSFP)
    
    // Checkout context but for Express it might be different
    const {step, STEPS, goToStep, goToNextStep} = useCheckout()
    const {data: basket} = useCurrentBasket()
    
    // State
    const [sfpComponentCreated, setSfpComponentCreated] = useState(false)
    const [billingSameAsShipping, setBillingSameAsShipping] = useState(true)

    // shipping and billing address selection?
    const selectedShippingAddress = basket?.shipments?.[0]?.shippingAddress
    const selectedBillingAddress = basket?.billingAddress
    const appliedPayment = basket?.paymentInstruments?.[0]
    
    
    const {mutateAsync: addPaymentInstrumentToBasket} = useShopperBasketsMutation('addPaymentInstrumentToBasket')
    const {mutateAsync: updateBillingAddressForBasket} = useShopperBasketsMutation('updateBillingAddressForBasket')
    const {mutateAsync: removePaymentInstrumentFromBasket} = useShopperBasketsMutation('removePaymentInstrumentFromBasket')

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            paymentExpressInstance = null
            setSfpComponentCreated(false)
        }
    }, [])

   // ✅ Memoize paymentRequestInfo so it doesn't recreate on every render
    const paymentRequestInfo = useMemo(() => {
        return basket ? createPaymentRequestInfo(basket, intl.locale) : null
    }, [basket, intl.locale])


    // ✅ Callback when PaymentExpressComponent is ready
    const handlePaymentExpressReady = (paymentExpress) => {
        console.log('✅ Payment Express ready')
    }

    // ✅ Callback to receive confirm function from PaymentExpressComponent
    const handleConfirmMethodReady = useCallback((confirmFunction) => {
        confirmPaymentFunction = confirmFunction
    }, [])

    const handlePaymentExpressError = (error) => {
        console.error('❌ Payment Express error:', error)
    }

     // ✅ Memoize options object
     const paymentExpressOptions = useMemo(() => ({
        elementId: 'salesforce-payments-express',
        locale: intl.locale,
        paymentFlow: 'express',
        customTheme: {
            'color-primary': '#007bff'
        },
        //minHeight: '300px'
    }), [intl.locale])

    /*return (
        <div>
            <h1>SFPaymentsExpress</h1>
        </div>
    )*/
    return (
        <Box>           
            {/* ✅ Keep PaymentSheetForm always mounted, control visibility with CSS */}
            {isReady && sfpInstance && paymentRequestInfo && (
                <Box
                    position={step === STEPS.PAYMENT ? "static" : "absolute"}
                    visibility={step === STEPS.PAYMENT ? "visible" : "hidden"}
                    height="auto"
                    overflow="hidden"
                    width="100%"
                    zIndex={step === STEPS.PAYMENT ? 1 : -1}
                >
                    <PaymentExpressButtons
                        sfpInstance={sfpInstance}
                        paymentConfig={paymentConfig}
                        metadata={metadata}
                        paymentRequestInfo={paymentRequestInfo}
                        options={paymentExpressOptions}
                        onConfirmMethodReady={handleConfirmMethodReady}
                        containerProps={{ mb: 4 }}
                    />
                </Box>
            )}
        </Box>
    )

}

export default SFPaymentsExpress