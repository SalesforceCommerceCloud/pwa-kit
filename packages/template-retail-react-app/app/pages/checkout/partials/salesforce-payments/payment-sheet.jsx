import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {
    ToggleCard,
    ToggleCardEdit,
    ToggleCardSummary
} from '@salesforce/retail-react-app/app/components/toggle-card'
import {
    Box,
    Button,
    Checkbox,
    Container,
    Heading,
    Stack,
    Text,
    Divider
} from '@salesforce/retail-react-app/app/components/shared/ui'
import AddressDisplay from '@salesforce/retail-react-app/app/components/address-display'
import {useForm} from 'react-hook-form'
import PropTypes from 'prop-types'

import {usePaymentScripts} from '../../../../hooks/salesforce-payments/use-payment-scripts'
import {useSalesforcePayments} from '../../../../hooks/salesforce-payments/use-salesforce-payments'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {createCheckoutParameters, createPaymentRequestInfo} from '../../../../utils/salesforce-payments/payment-method-mapper'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import ShippingAddressSelection from '@salesforce/retail-react-app/app/pages/checkout/partials/shipping-address-selection'
import {usePaymentProcessing} from '../../../../hooks/salesforce-payments/use-payment-processing'
import {getAddressDetails} from '../../../../utils/salesforce-payments/address-mapper'
import PaymentSheetForm from '../../../../components/salesforce-payments/paymentSheetForm'
// Module-level storage for paymentSheet
let paymentSheetInstance = null
// ✅ ADD this module-level variable declaration
let confirmPaymentFunction = null

export const usePaymentSheetSubmission = () => {
    const {processPayment, isProcessing} = usePaymentProcessing()
    const {data: basket} = useCurrentBasket()
    
    const createPaymentIntent = async (paymentData) => {
        const basketId = "1f6a561e694175fff0435dd144" // TODO: use basket.basketId
        
        try {
            const paymentResult = await processPayment({
                basketId: basketId,
                zoneId: 'default',
                amount: paymentData?.amount || "99.99",
                cardCaptureAutomatic: false,
                currency: paymentData?.currency || 'USD',
            })
            
            return {
                client_secret: paymentResult.payment_info.client_secret,
                id: paymentResult.payment_info.payment_intent_id,
                customer: paymentResult.payment_info.customer_id
            }
        } catch (error) {
            console.error('Payment intent creation failed:', error)
            throw error
        }
    }
    
    const submitPaymentSheetOrder = async () => {
        if (!confirmPaymentFunction) {
            throw new Error('Payment sheet not ready. Please wait for payment component to load.')
        }
        
        try {
            // ✅ Checkout-specific logic: get addresses from basket
            const {billing, shipping} = getAddressDetails(basket)
            billing.email = "test@test.com"
            billing.address.country = "US"
            
            // ✅ Call PaymentSheetForm's confirm function
            return await confirmPaymentFunction(createPaymentIntent, billing, {})
        } catch (error) {
            console.error('SFP payment processing failed:', error)
            throw error
        }
    }
    
    return {
        submitPaymentSheetOrder,
        isProcessing
    }
}

const SFPaymentsSheet = ({paymentState}) => {
    const {
        paymentConfig,
        metadata,
        paymentConfigLoading,
        isSFPEnabled
    } = paymentState

    const isReady = !paymentConfigLoading && paymentConfig && metadata

    const intl = useIntl()
    
    // Load scripts and SFP
    const {scriptsLoaded, loading, hasSFP} = usePaymentScripts(['stripe', 'paypal', 'sfp'])
    const {sfpInstance} = useSalesforcePayments(scriptsLoaded, hasSFP)
    
    // Checkout context
    const {step, STEPS, goToStep, goToNextStep} = useCheckout()
    const {data: basket} = useCurrentBasket()
    
    // State
    const [sfpComponentCreated, setSfpComponentCreated] = useState(false)
    const [billingSameAsShipping, setBillingSameAsShipping] = useState(true)
    
    // Refs for DOM elements
    const editContainerRef = useRef(null)
    const paymentElementRef = useRef(null)
    
    // Form and mutations
    const selectedShippingAddress = basket?.shipments?.[0]?.shippingAddress
    const selectedBillingAddress = basket?.billingAddress
    const appliedPayment = basket?.paymentInstruments?.[0]
    
    const billingAddressForm = useForm({
        mode: 'onChange',
        defaultValues: {...selectedBillingAddress}
    })
    
    const {mutateAsync: addPaymentInstrumentToBasket} = useShopperBasketsMutation('addPaymentInstrumentToBasket')
    const {mutateAsync: updateBillingAddressForBasket} = useShopperBasketsMutation('updateBillingAddressForBasket')
    
    // Create SFP component with fresh values (no stale closure)
    useEffect(() => {
        return;
        if (step === STEPS.PAYMENT && editContainerRef.current && isReady && !sfpComponentCreated) {
            // Create element if it doesn't exist
            if (!paymentElementRef.current) {
                const element = document.createElement('div')
                element.id = 'salesforce-payments-element'
                element.style.width = '100%'
                element.style.minHeight = '300px'
                paymentElementRef.current = element
            }
            
            // Add element to container if not already there
            if (!editContainerRef.current.contains(paymentElementRef.current)) {
                editContainerRef.current.appendChild(paymentElementRef.current)
            }
            
            // Create SFP component with fresh values
            if (sfpInstance && paymentConfig && metadata) {
                const elementInDOM = document.getElementById('salesforce-payments-element')
                if (!elementInDOM) return
                
                try {
                    const checkoutParams = createCheckoutParameters(
                        sfpInstance,
                        metadata,
                        paymentConfig,
                        basket,
                        {
                            locale: intl.locale,
                            paymentFlow: 'checkout',
                            elementId: 'salesforce-payments-element',
                            customTheme: {
                                'color-primary': '#007bff'
                            }
                        }
                    )
                    
                    const paymentSheet = sfpInstance.checkout(
                        checkoutParams.metadata,
                        checkoutParams.paymentMethodSetForCheckout,
                        checkoutParams.config,
                        checkoutParams.paymentRequestInfo,
                        paymentElementRef.current
                    )
                    
                    paymentSheetInstance = paymentSheet
                    setSfpComponentCreated(true)
                } catch (error) {
                    console.error('Failed to create SFP component:', error)
                }
            }
        }
    }, [step, isReady, sfpComponentCreated, sfpInstance, paymentConfig, metadata, basket, intl.locale])
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            paymentSheetInstance = null
            setSfpComponentCreated(false)
        }
    }, [])
    
    // Event handlers
    const onBillingSubmit = async () => {
        const isFormValid = await billingAddressForm.trigger()
        if (!isFormValid) return
        
        const billingAddress = billingSameAsShipping ? selectedShippingAddress : billingAddressForm.getValues()
        const {addressId, creationDate, lastModified, preferred, ...address} = billingAddress
        
        return await updateBillingAddressForBasket({
            body: address,
            parameters: {basketId: basket.basketId}
        })
    }
    
    const onReview = async () => {
        const mockPaymentData = {
            "amount": 9.99,
            "paymentCard": {
                "expirationYear": 1990,
                "expirationMonth": 7,
                "validFromMonth": 8,
                "validFromYear": 2007,
                "issueNumber": "i117",
                "maskedNumber": "*********1234",
                "holder": "Miller",
                "cardType": "Visa"
            },
            "paymentMethodId": "CREDIT_CARD"
        }
        
        await addPaymentInstrumentToBasket({
            parameters: {basketId: basket?.basketId},
            body: mockPaymentData
        })
        
        const updatedBasket = await onBillingSubmit()
        if (updatedBasket) {
            goToNextStep()
        }
    }
    
   // ✅ Memoize paymentRequestInfo so it doesn't recreate on every render
   const paymentRequestInfo = useMemo(() => {
    return basket ? createPaymentRequestInfo(basket, intl.locale) : null
}, [basket, intl.locale])

     // ✅ Callback when PaymentSheetForm is ready
     const handlePaymentSheetReady = (paymentSheet) => {
        console.log('✅ Payment sheet ready')
    }
    
    // ✅ Callback to receive confirm function from PaymentSheetForm
    const handleConfirmMethodReady = useCallback((confirmFunction) => {
        confirmPaymentFunction = confirmFunction
    }, [])

    const handlePaymentSheetError = (error) => {
        console.error('❌ Payment sheet error:', error)
    }

    // ✅ Memoize options object
    const paymentSheetOptions = useMemo(() => ({
        elementId: 'salesforce-payments-element',
        locale: intl.locale,
        paymentFlow: 'checkout',
        customTheme: {
            'color-primary': '#007bff'
        },
        minHeight: '300px'
    }), [intl.locale])


 // ✅ Add debugging to track what's changing
 useEffect(() => {
    console.log('🔍 PaymentSheet render conditions:', {
        step,
        STEPS_PAYMENT: STEPS.PAYMENT,
        isPaymentStep: step === STEPS.PAYMENT,
        isReady,
        hasSfpInstance: !!sfpInstance,
        hasPaymentRequestInfo: !!paymentRequestInfo,
        willRenderForm: step === STEPS.PAYMENT && isReady && sfpInstance && paymentRequestInfo
    })
})



    return (
        <Box>
            {/* Payment container - only shows in edit mode */}
            {/*<Box
                ref={editContainerRef}
                display={step === STEPS.PAYMENT ? "block" : "none"}
                minH="300px"
                border="1px solid #E2E8F0"
                borderRadius="md"
                p={4}
                bg="white"
                mb={4}
            />*/}
            {/* ✅ PaymentSheetForm OUTSIDE ToggleCard - persists across edit/summary 
                  Don't conditionally render based on step. Instead, always render the PaymentSheetForm 
                  but use CSS to show/hide it. Preserves form data when switching between edit/summary:
                  Stays mounted across step changes
                  If you include the step === STEPS.PAYMENT condition, the form will unmount and remount
                  when you switch between edit/summary, losing form data since the step value changes.
                  */}
                {isReady && sfpInstance && paymentRequestInfo && (
                <PaymentSheetForm
                    sfpInstance={sfpInstance}
                    paymentConfig={paymentConfig}
                    metadata={metadata}
                    paymentRequestInfo={paymentRequestInfo}
                    options={paymentSheetOptions}
                    onConfirmMethodReady={handleConfirmMethodReady}
                    containerProps={{ 
                        mb: 4,
                        // ✅ Use CSS to show/hide instead of unmount/mount
                        display: step === STEPS.PAYMENT ? "block" : "none"
                    }}
                />
            )}


            <ToggleCard
                id="step-3"
                title={intl.formatMessage({defaultMessage: 'Payment', id: 'checkout_payment.title.payment'})}
                editing={step === STEPS.PAYMENT}
                disabled={appliedPayment == null}
                onEdit={() => goToStep(STEPS.PAYMENT)}
                editLabel={intl.formatMessage({
                    defaultMessage: 'Edit Payment Info',
                    id: 'toggle_card.action.editPaymentInfo'
                })}
            >
                <ToggleCardEdit>
                    <Stack spacing={6}>
                        <Text fontSize="sm" color="gray.500" fontStyle="italic">
                            Payment form is above
                        </Text>

                        <Divider />
                        
                        <Stack spacing={2}>
                            <Heading as="h3" fontSize="md">
                                <FormattedMessage
                                    defaultMessage="Billing Address"
                                    id="checkout_payment.heading.billing_address"
                                />
                            </Heading>
                            
                            <Checkbox
                                isChecked={billingSameAsShipping}
                                onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                            >
                                <Text fontSize="sm" color="gray.700">
                                    <FormattedMessage
                                        defaultMessage="Same as shipping address"
                                        id="checkout_payment.label.same_as_shipping"
                                    />
                                </Text>
                            </Checkbox>
                            
                            {billingSameAsShipping && selectedShippingAddress && (
                                <Box pl={7}>
                                    <AddressDisplay address={selectedShippingAddress} />
                                </Box>
                            )}
                        </Stack>
                        
                        {!billingSameAsShipping && (
                            <ShippingAddressSelection
                                form={billingAddressForm}
                                selectedAddress={selectedBillingAddress}
                                hideSubmitButton
                                isBillingAddress
                            />
                        )}
                        
                        <Box pt={3}>
                            <Container variant="form">
                                <Button w="full" onClick={onReview}>
                                    <FormattedMessage
                                        defaultMessage="Review Order"
                                        id="checkout_payment.button.review_order"
                                    />
                                </Button>
                            </Container>
                        </Box>
                    </Stack>
                </ToggleCardEdit>
                
                <ToggleCardSummary>
                    <Stack spacing={6}>
                        {appliedPayment && (
                            <Stack spacing={3}>
                                <Heading as="h3" fontSize="md">
                                    <FormattedMessage
                                        defaultMessage="Payment Method"
                                        id="checkout_payment.heading.payment_method"
                                    />
                                </Heading>
                                <Text fontSize="sm" color="gray.600">
                                    Payment details entered and ready for submission
                                </Text>
                            </Stack>
                        )}
                        
                        <Divider />
                        
                        {selectedBillingAddress && (
                            <Stack spacing={2}>
                                <Heading as="h3" fontSize="md">
                                    <FormattedMessage
                                        defaultMessage="Billing Address"
                                        id="checkout_payment.heading.billing_address"
                                    />
                                </Heading>
                                <AddressDisplay address={selectedBillingAddress} />
                            </Stack>
                        )}
                    </Stack>
                </ToggleCardSummary>
            </ToggleCard>
        </Box>
    )
}

export default SFPaymentsSheet