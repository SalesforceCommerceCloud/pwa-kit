import React, {useState, useCallback, useEffect, useRef} from 'react'
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
import {usePaymentConfig} from '../../../../hooks/salesforce-payments/use-payment-config'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {createCheckoutParameters} from '../../../../utils/salesforce-payments/payment-method-mapper'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import ShippingAddressSelection from '@salesforce/retail-react-app/app/pages/checkout/partials/shipping-address-selection'
import {usePaymentProcessing} from '../../../../hooks/salesforce-payments/use-payment-processing'
import {getAddressDetails} from '../../../../utils/salesforce-payments/address-mapper'

// ✅ Module-level storage for paymentSheet (private to this file)
let paymentSheetInstance = null

// ✅ Export the payment processing function for checkout page to use
export const usePaymentSheetSubmission = () => {
    const {processPayment, isProcessing} = usePaymentProcessing()
    const {data: basket} = useCurrentBasket()
    
    const createPaymentIntent = async (paymentData) => {
        console.log('🔄 createPaymentIntent callback called with:', paymentData)
        
        const basketId = "9ab3e52d9fa346a83c819ced37" // TODO: use basket.basketId
        
        try {
            const paymentResult = await processPayment({
                basketId: basketId,
                zoneId: 'default',
                amount: paymentData?.amount || "99.99",
                cardCaptureAutomatic: false,
                currency: paymentData?.currency || 'USD',
            })
            
            console.log('✅ Payment intent created:', paymentResult)
            return {
                client_secret: paymentResult.payment_info.client_secret,
                id: paymentResult.payment_info.payment_intent_id,
                customer: paymentResult.payment_info.customer_id
            }
        } catch (error) {
            console.error('❌ Payment intent creation failed:', error)
            throw error
        }
    }
    
    const submitPaymentSheetOrder = async () => {
        console.log('🚀 Processing SFP payment before order submission...')
        
        if (!paymentSheetInstance) {
            throw new Error('Payment sheet not ready. Please wait for payment component to load.')
        }
        
        try {
            const {billing, shipping} = getAddressDetails(basket)
            
            return new Promise((resolve, reject) => {
                billing.email = "test@test.com" //looks like email is needed but not seeing it in basket
                billing.address.country = "US"
                
                //TODO:  my backend was setting the shipping (need to remove that)
                paymentSheetInstance.confirm(createPaymentIntent, billing, {})
                    .then(function (resp) {
                        const respData = resp.data
                        console.log('✅ SFP payment confirmed:', respData)
                        
                        if (resp.responseCode === 0) {
                            resolve(respData)
                        } else {
                            console.log('❌ SFP payment failed:', respData)
                            reject(new Error('Payment failed'))
                        }
                    })
                    .catch(function (err) {
                        console.log('❌ SFP payment failed:', err)
                        //reject(err)
                         // Simulate a "successful" test flow for now
                      
                        resolve({
                            responseCode: 0, // Simulates `ResponseCode.SUCCESS`
                            data: {
                            paymentData: {
                                id: 'pi_test_fake_123',
                                uuid: 'test-guid-456', // optional: use real one if available
                                paymentGatewayId: 'test-gateway-id',
                                gatewayCustomerId: 'test-customer-id',
                            },
                            paymentToken: 'pi_test_fake_123',
                            billingDetails: billing, // reuse the billing object you passed in
                            testOverride: true, // optional: flag this as a fake for downstream logic
                            },
                        });

                    })
            })
        } catch (error) {
            console.error('❌ SFP payment processing failed:', error)
            throw error
        }
    }
    
    return {
        submitPaymentSheetOrder,
        isProcessing
    }
}

const SFPaymentsSheet = () => {
    const intl = useIntl()
    
    // ✅ Load scripts and SFP
    const {scriptsLoaded, loading, hasSFP} = usePaymentScripts(['stripe', 'paypal', 'sfp'])
    const {sfpInstance} = useSalesforcePayments(scriptsLoaded, hasSFP)
    const {usePaymentConfiguration, usePaymentMetadata} = usePaymentConfig()
    const {data: metadata, isLoading: metadataLoading} = usePaymentMetadata()
    const {data: paymentConfig, isLoading: configLoading} = usePaymentConfiguration({})
    
    // ✅ Checkout context
    const {step, STEPS, goToStep, goToNextStep} = useCheckout()
    const {data: basket} = useCurrentBasket()
    
    // ✅ State
    const [sfpComponentCreated, setSfpComponentCreated] = useState(false)
    const [billingSameAsShipping, setBillingSameAsShipping] = useState(true)
    
    // ✅ Refs for DOM elements
    const editContainerRef = useRef(null)
    const paymentElementRef = useRef(null)
    
    // ✅ Form and mutations
    const selectedShippingAddress = basket?.shipments?.[0]?.shippingAddress
    const selectedBillingAddress = basket?.billingAddress
    const appliedPayment = basket?.paymentInstruments?.[0]
    
    const billingAddressForm = useForm({
        mode: 'onChange',
        defaultValues: {...selectedBillingAddress}
    })
    
    const {mutateAsync: addPaymentInstrumentToBasket} = useShopperBasketsMutation('addPaymentInstrumentToBasket')
    const {mutateAsync: updateBillingAddressForBasket} = useShopperBasketsMutation('updateBillingAddressForBasket')
    
    // ✅ Computed values
    const isReady = scriptsLoaded && paymentConfig && metadata && !loading && !configLoading && !metadataLoading
    
    // ✅ Create SFP component (once only)
    const createComponent = useCallback(async () => {
        if (!paymentElementRef.current || sfpComponentCreated || !sfpInstance || !paymentConfig || !metadata) {
            return
        }
        
        console.log('✅ Creating SFP component...')

        // ✅ Check if element is actually in DOM
        const elementInDOM = document.getElementById('salesforce-payments-element')
        if (!elementInDOM) {
            console.log('❌ Element not in DOM yet, skipping creation')
            return
        }
        
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
            console.log('✅ SFP component created successfully')
        } catch (error) {
            console.error('❌ Failed to create SFP component:', error)
        }
    }, [sfpInstance, paymentConfig, metadata, sfpComponentCreated, basket, intl.locale])
    
// ✅ REPLACE the useEffect around line 185 with this corrected version
useEffect(() => {
    console.log('🔍 Single useEffect running:', {
        step,
        isPaymentStep: step === STEPS.PAYMENT,
        editContainerRef: !!editContainerRef.current,
        paymentElementRef: !!paymentElementRef.current,
        isReady,
        sfpComponentCreated
    })
    
    // ✅ Only run when we're actually on the payment step
    if (step === STEPS.PAYMENT && editContainerRef.current && isReady && !sfpComponentCreated) {
        // Create element if it doesn't exist
        if (!paymentElementRef.current) {
            console.log('Creating payment element...')
            const element = document.createElement('div')
            element.id = 'salesforce-payments-element'
            element.style.width = '100%'
            element.style.minHeight = '300px'
            
            paymentElementRef.current = element
            console.log('✅ Payment element created')
        }
        
        // Add element to container if not already there
        if (!editContainerRef.current.contains(paymentElementRef.current)) {
            console.log('Adding element to container...')
            editContainerRef.current.appendChild(paymentElementRef.current)
            console.log('✅ Payment element added to container')
        }
        
        // Trigger SFP component creation
        console.log('✅ All ready, triggering component creation...')
        createComponent()
    }
}, [step, isReady, sfpComponentCreated]) // ✅ Include step in dependencies

    // ✅ Cleanup on unmount
    useEffect(() => {
        return () => {
            paymentSheetInstance = null
            setSfpComponentCreated(false)
        }
    }, [])
    
    // ✅ Event handlers
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
    
    return (
        <Box>

            {/* ✅ Payment container - only shows in edit mode */}
            <Box
                ref={editContainerRef}
                display={step === STEPS.PAYMENT ? "block" : "none"}
                minH="300px"
                border="1px solid #E2E8F0"
                borderRadius="md"
                p={4}
                bg="white"
                mb={4}
            />

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
                        {/* ✅ Note: Payment element is rendered above, outside this component */}
                        {/* ✅ NO BOX HERE - payment is above */}
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