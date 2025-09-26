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
import {createPaymentRequestInfo} from '../../../../utils/salesforce-payments/payment-method-mapper'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import ShippingAddressSelection from '@salesforce/retail-react-app/app/pages/checkout/partials/shipping-address-selection'
import {getAddressDetails} from '../../../../utils/salesforce-payments/address-mapper'
import PaymentSheetForm from '../../../../components/salesforce-payments/paymentSheetForm'
import {useShopperOrdersMutation} from '@salesforce/commerce-sdk-react'
import logger from '@salesforce/retail-react-app/app/utils/logger-instance'
import {useCountryDetection} from '../../../../utils/salesforce-payments/country-detection'

//TODO: integrate with latest ECOM fix for this
const paymentMethodIdSFP ="SALESFORCE_PAYMENTS";

// separate hook for payment sheet submission, called by parent page
export const usePaymentSheetSubmission = (confirmPaymentFunction) => {
    // ✅ Add the mutation hook to update the payment instrument
    const {mutateAsync: updatePaymentInstrument} = useShopperOrdersMutation('updatePaymentInstrumentForOrder')
    // ✅ Add the mutation hook to create an order
    const {mutateAsync: createOrder} = useShopperOrdersMutation('createOrder')
    
    const {data: basket} = useCurrentBasket()

    const {country: detectedCountry} = useCountryDetection()

    // ✅ Store order info from API call before it gets lost after SDK call
    let orderInfoFromAPI = null
   
    const updateOrderPayment = async (order, paymentInstrumentId, paymentData) => {
      
        try {
            const paymentInstrumentUpdate = {
                amount: order.orderTotal,   //TODO this is temporary but needed for now!
                paymentMethodId: paymentMethodIdSFP,
            }

            const result = await updatePaymentInstrument({
                parameters: {
                    orderNo: order.orderNo,                   
                    paymentInstrumentId: paymentInstrumentId  
                },
                body: paymentInstrumentUpdate
            })

            return result
        } catch (error) {
            logger.error('Failed to update payment instrument', {
                namespace: 'PaymentSheet.updateOrderPayment',
                additionalProperties: { error: error.message }  // ✅ Log error details
            })
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

            // ✅ Store order info (will be lost after SDK call)
            orderInfoFromAPI = {
                orderNo: orderNo
            }

            // ✅ Get payment instrument ID from the created order
            const paymentInstrument = order.paymentInstruments?.find(pi => 
                pi.paymentMethodId === paymentMethodIdSFP
            )
            
            //now call the payment instrument update API and get the secret and id back
            const result = await updateOrderPayment(
                order,
                paymentInstrument.paymentInstrumentId,
                {}
            )

            // Find the payment instrument that has the paymentReference
            const paymentInstrumentWithReference = result.paymentInstruments?.find(pi => 
                pi.paymentReference && pi.paymentMethodId === paymentMethodIdSFP
            );
            const paymentReference = paymentInstrumentWithReference?.paymentReference;
                        
                        
            return {
                client_secret: paymentReference.clientSecret,
                id: paymentReference.paymentReferenceId,
            }
        } catch (error) {
            logger.error('Payment intent creation failed', {
                namespace: 'PaymentSheet.createPaymentIntent',
                additionalProperties: { error: error.message }  // ✅ Log error details
            })
            throw error
        }
    }

    const submitPaymentSheetOrder = async () => {
        if (!confirmPaymentFunction) {
            logger.error('confirmPaymentFunction is null - payment form not ready', {
                namespace: 'PaymentSheet.submitPaymentSheetOrder',
                additionalProperties: { error: error.message }  // ✅ Log error details
            })
            throw new Error('Payment sheet not ready. Please wait for payment component to load.')
        }

        try {
            const {billing, shipping} = getAddressDetails(basket)
            if (!billing.address?.country) {
                billing.address.country = detectedCountry
            }

            //createPaymentIntent function is a callback passed to the child component PaymentSheetForm
            //paymentSheetForm calls the SDK and passes down the createPaymentIntent function
            //SDK finally calls it
            const paymentResult = await confirmPaymentFunction(createPaymentIntent, billing, {})

            return {
                paymentResult,
                orderNo: orderInfoFromAPI?.orderNo,
            }
        } catch (error) {
            logger.error('SFP payment processing failed:', {
                namespace: 'PaymentSheet.submitPaymentSheetOrder',
                additionalProperties: { error: error.message } 
            })
            throw error
        }
    }
    
    return {
        submitPaymentSheetOrder,
    }
}

/*
    component that renders payment sheet
    paymentState: state object containing payment config, metadata, and loading status
    onConfirmFunctionReady: callback function to receive the confirm function from PaymentSheetForm
    
    So why are we passing the confirm function from the page?
    Checkout page needs to trigger payment processing but it has no access to the payment sheet form
    It calls submitPaymentSheetOrder hook when user clicks Place Order
    But the submitPaymentSheetOrder hook needs the confirm function to work
    
    So the checkout page stores the function in a state variable and passes it to the 
    SfPaymentsSheet component
*/
const SFPaymentsSheet = ({paymentState, onConfirmFunctionReady}) => {  // Add onConfirmFunctionReady
    const {
        paymentConfig,
        metadata,
        paymentConfigLoading,
        isSFPEnabled
    } = paymentState

    const intl = useIntl()
    const {country: detectedCountry} = useCountryDetection()
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
    
    const paymentRequestInfo = useMemo(() => {
        return basket ? createPaymentRequestInfo(basket, intl.locale, detectedCountry) : null
    }, [basket, intl.locale])

    // mutation hooks to add, update, and remove payment instrument from basket
    const {mutateAsync: addPaymentInstrumentToBasket} = useShopperBasketsMutation('addPaymentInstrumentToBasket')
    const {mutateAsync: updateBillingAddressForBasket} = useShopperBasketsMutation('updateBillingAddressForBasket')
    const {mutateAsync: removePaymentInstrumentFromBasket} = useShopperBasketsMutation('removePaymentInstrumentFromBasket')

    // Cleanup on unmount
    useEffect(() => {
        return () => {
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
    
    // ✅ Callback to receive confirm function from PaymentSheetForm
    const handleConfirmMethodReady = useCallback((confirmFunction) => {
        if (onConfirmFunctionReady) {
            onConfirmFunctionReady(confirmFunction)
        }
    }, [onConfirmFunctionReady])

    // Memoize objects so their references are stable unless content changes
    const stablePaymentConfig = React.useMemo(() => paymentConfig, [paymentConfig && JSON.stringify(paymentConfig)]);
    const stableMetadata = React.useMemo(() => metadata, [metadata && JSON.stringify(metadata)]);
    const paymentSheetOptions = useMemo(() => ({
        elementId: 'salesforce-payments-element',
        locale: intl.locale,
        paymentFlow: 'checkout',
        customTheme: {
            'color-primary': '#007bff'
        },
    }), [intl.locale])

    // TODO: once the review step is removed as part of 1CC, we can redo the below logic
    return (
        <Box>           
        {/* Custom "Payment" title when editing - appears above credit card form */}
        {step === STEPS.PAYMENT && (
            <Box
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                borderTopRadius="md"
                borderBottom="none"
                px={6}
                pt={4}
                pb={2}
                mb={0}
            >
                <Heading as="h2" fontSize="lg" fontWeight="semibold">
                    <FormattedMessage
                        defaultMessage="Payment"
                        id="checkout_payment.title.payment"
                    />
                </Heading>
            </Box>
        )}

        {/* ✅ Credit card form */}
        <Box
            suppressHydrationWarning={true}
            style={{
                display: step === STEPS.PAYMENT ? 'block' : 'none'
            }} 
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderTopRadius={0} // No top radius since title is above
            borderBottomRadius="0"
            borderBottom="none"
            p={6}
            mb={0}
        >
            <PaymentSheetForm
                sfpInstance={sfpInstance}
                paymentConfig={stablePaymentConfig}
                metadata={stableMetadata}
                paymentRequestInfo={paymentRequestInfo}
                options={paymentSheetOptions}
                onConfirmMethodReady={handleConfirmMethodReady}
                containerProps={{ style: { marginBottom: '16px' } }} 
            />
        </Box>
            
            <ToggleCard
                id="step-3"
                // ✅ Hide title when editing, show when reviewing
                title={step === STEPS.PAYMENT ? "" : intl.formatMessage({defaultMessage: 'Payment', id: 'checkout_payment.title.payment'})}
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
                     
                        {/* Remove or conditionally show divider */}
                        {step !== STEPS.PAYMENT && <Divider />}
                        
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