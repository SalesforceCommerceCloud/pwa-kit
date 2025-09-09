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
import {useSharedSFPInstance} from '../../../../hooks/salesforce-payments/use-shared-payments-sdk'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {createCheckoutParameters, createPaymentRequestInfo} from '../../../../utils/salesforce-payments/payment-method-mapper'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import ShippingAddressSelection from '@salesforce/retail-react-app/app/pages/checkout/partials/shipping-address-selection'
import {usePaymentProcessing} from '../../../../hooks/salesforce-payments/use-payment-processing'
import {getAddressDetails} from '../../../../utils/salesforce-payments/address-mapper'
import PaymentSheetForm from '../../../../components/salesforce-payments/paymentSheetForm'
import {useShopperOrdersMutation} from '@salesforce/commerce-sdk-react'
import {useCountryDetection} from '../../../../utils/salesforce-payments/country-detection'

// Module-level storage for paymentSheet
let paymentSheetInstance = null
// ✅ ADD this module-level variable declaration
let confirmPaymentFunction = null

//TODO: need to address the payment method id issue with ECOM
const paymentMethodIdSFP ="SALESFORCE_PAYMENTS";

export const usePaymentSheetSubmission = () => {
    const {processPayment, isProcessing} = usePaymentProcessing()
    
    // ✅ Add the mutation hook to update the payment instrument
    const {mutateAsync: updatePaymentInstrument} = useShopperOrdersMutation('updatePaymentInstrumentForOrder')
    // ✅ Add the mutation hook to create an order
    const {mutateAsync: createOrder} = useShopperOrdersMutation('createOrder')
    
    const {data: basket} = useCurrentBasket()

    const {country: detectedCountry} = useCountryDetection()
    // ✅ Get country directly from address when available
    const getCountryForPayment = (basket, fallbackCountry) => {
        return basket?.billingAddress?.countryCode || 
            basket?.shipments?.[0]?.shippingAddress?.countryCode || 
            fallbackCountry
    }

    // ✅ Store order info from API calls
    let orderInfoFromAPI = null
   
    const updateOrderPayment = async (orderNo, paymentInstrumentId, paymentData) => {
      
        try {
            // ✅ For Salesforce Payments, provide the minimal required structure
            const paymentInstrumentUpdate = {
                paymentMethodId: paymentMethodIdSFP,
                // Note: For Salesforce Payments, you typically don't need paymentCard details
                // as those are handled by the SFP SDK
            }

            const result = await updatePaymentInstrument({
                parameters: {
                    orderNo: orderNo,                      // Order number
                    paymentInstrumentId: paymentInstrumentId  // Payment instrument ID to update
                },
                body: paymentInstrumentUpdate
            })
            return result
        } catch (error) {
            console.error('❌ Failed to update payment instrument:', error)
            throw error
        }
    }

    const createPaymentIntent = async (paymentData) => {
        const basketId = basket.basketId
      
        try {
            // first create an order here using the current basket, which also creates payment instrument against order
            const order = await createOrder({
                body: {basketId: basketId}
            })
            const orderNo = order.orderNo

            // ✅ Store order info (will be lost after SDK call)??
            orderInfoFromAPI = {
                orderNo: orderNo
            }

            // ✅ Get payment instrument ID from the created order
            const paymentInstrument = order.paymentInstruments?.find(pi => 
                pi.paymentMethodId === "SALESFORCE_PAYMENTS"
            )
            //now call the payment instrument update API and get the secret and id back
            const result = await updateOrderPayment(
                orderNo,
                paymentInstrument.paymentInstrumentId,
                {}
            )

            //TODO read the secret and id from the result
            return {
                client_secret: "xx",
                id: "yy",
                //customer: paymentResult.payment_info.customer_id
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
            // Apply country fallback if needed
            if (!billing.address?.country) {
                billing.address.country = detectedCountry
            }

            const paymentResult = await confirmPaymentFunction(createPaymentIntent, billing, {})

            // (You'll need to check the exact structure of paymentResult)
            return {
                paymentResult,
                orderNo: orderInfoFromAPI?.orderNo,
            }
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
    
    // use the shared SFP instance
    const { sfpInstance, isReady: sfpReady } = useSharedSFPInstance()

    // Checkout context
    const {step, STEPS, goToStep, goToNextStep} = useCheckout()
    const {data: basket} = useCurrentBasket()
    
    // State
    const [sfpComponentCreated, setSfpComponentCreated] = useState(false)
    const [billingSameAsShipping, setBillingSameAsShipping] = useState(true)

    const selectedShippingAddress = basket?.shipments?.[0]?.shippingAddress
    const selectedBillingAddress = basket?.billingAddress
    const appliedPayment = basket?.paymentInstruments?.[0]
    
    const billingAddressForm = useForm({
        mode: 'onChange',
        defaultValues: {...selectedBillingAddress}
    })
    
    const {mutateAsync: addPaymentInstrumentToBasket} = useShopperBasketsMutation('addPaymentInstrumentToBasket')
    const {mutateAsync: updateBillingAddressForBasket} = useShopperBasketsMutation('updateBillingAddressForBasket')
    const {mutateAsync: removePaymentInstrumentFromBasket} = useShopperBasketsMutation('removePaymentInstrumentFromBasket')

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
     
        // Remove existing instruments first
        const existingInstruments = basket?.paymentInstruments?.filter(
            instrument => instrument.paymentMethodId === 'SALESFORCE_PAYMENTS'
        ) || []
        
        for (const instrument of existingInstruments) {
            await removePaymentInstrumentFromBasket({
                parameters: {
                    basketId: basket?.basketId,
                    paymentInstrumentId: instrument.paymentInstrumentId
                }
            })
        }
    
        /*
            TODO: unless a payment method is already added to ECOM, using anything else throws
            {
                "title": "Invalid Payment Method Id",
                "type": "https://api.commercecloud.salesforce.com/documentation/error/v1/errors/invalid-payment-method-id",
                "detail": "The payment method with ID 'Salesforce Payments' is unknown or can't be applied.",
                "paymentMethodId": "Salesforce Payments"
            }
        */
        const paymentData = {
            "paymentMethodId": paymentMethodIdSFP
        }
        await addPaymentInstrumentToBasket({
            parameters: {basketId: basket?.basketId},
            body: paymentData
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
        //minHeight: '300px'
    }), [intl.locale])

    return (
        <Box>           
           {/* ✅ Keep PaymentSheetForm always mounted, control visibility with CSS */}
           {isReady && sfpReady && sfpInstance && paymentRequestInfo && (
                <Box
                    position={step === STEPS.PAYMENT ? "static" : "absolute"}
                    visibility={step === STEPS.PAYMENT ? "visible" : "hidden"}
                    height={step === STEPS.PAYMENT ? "auto" : 0}
                    overflow="hidden"
                    width="100%"
                    zIndex={step === STEPS.PAYMENT ? 1 : -1}
                >
                    <PaymentSheetForm
                        sfpInstance={sfpInstance}
                        paymentConfig={paymentConfig}
                        metadata={metadata}
                        paymentRequestInfo={paymentRequestInfo}
                        options={paymentSheetOptions}
                        onConfirmMethodReady={handleConfirmMethodReady}
                        containerProps={{ mb: 4 }}
                    />
                </Box>
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