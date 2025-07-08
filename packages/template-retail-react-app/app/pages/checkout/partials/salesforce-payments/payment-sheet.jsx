import React, {useState, useCallback, useEffect} from 'react'
import {defineMessage, FormattedMessage, useIntl} from 'react-intl'
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
import {PromoCode, usePromoCode} from '@salesforce/retail-react-app/app/components/promo-code'
import AddressDisplay from '@salesforce/retail-react-app/app/components/address-display'
import {useForm} from 'react-hook-form'
import PropTypes from 'prop-types'

import {usePaymentScripts} from '../../../../hooks/salesforce-payments/use-payment-scripts'
// read the sfp instance from the hook
import {useSalesforcePayments} from '../../../../hooks/salesforce-payments/use-salesforce-payments'

// You import usePaymentConfig
import {usePaymentConfig} from '../../../../hooks/salesforce-payments/use-payment-config'

import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'

import { createCheckoutParameters } from '../../../../utils/salesforce-payments/payment-method-mapper'

import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'

//not sure how this is being used
import ShippingAddressSelection from '@salesforce/retail-react-app/app/pages/checkout/partials/shipping-address-selection'

//not sure if I need this
import {
    getPaymentInstrumentCardType,
    getMaskCreditCardNumber,
    getCreditCardIcon
} from '@salesforce/retail-react-app/app/utils/cc-utils'


const SFPaymentsSheet = () => {
    //const {formatMessage} = useIntl()
    const intl = useIntl()
    // read the sfp related scripts
    const {scriptsLoaded, loading, hasSFP, hasStripe, hasPaypal, loadedScripts} = usePaymentScripts(['stripe', 'paypal', 'sfp'])
    // SFP initialization
    //const {sfpInstance, isInitialized, initError, isLoading: sfpLoading} = useSalesforcePayments()
// Pass the values to the SFP hook
const {sfpInstance, isInitialized, initError, isLoading: sfpLoading} = useSalesforcePayments(scriptsLoaded, hasSFP)
   // Then you destructure both hooks from it
    const {usePaymentConfiguration, usePaymentMetadata} = usePaymentConfig()

    // Query for payment metadata (will call it before sfp is loaded)
    const {data: metadata, isLoading: metadataLoading, error: metadataError} = usePaymentMetadata()
    // Query for payment config (will call it before sfp is loaded)
    const {data: paymentConfig, isLoading: configLoading} = usePaymentConfiguration({})

 // Check all loading states
const isLoading = loading || configLoading || metadataLoading
console.log(isLoading);
const isReady = scriptsLoaded && paymentConfig && metadata && !isLoading



    //this is maintaining the local component state 
    const [state, setState] = useState({
        isLoading: false,
        paymentSheet: undefined
    })
    //this callback is used for updating the local component state when needed 
    const mergeState = useCallback((data) => {
        setState((_state) => ({
            ..._state,
            ...data
        }))
    })

    const [billingSameAsShipping, setBillingSameAsShipping] = useState(true) // By default, have billing addr to be the same as shipping
    // Using destructuring to remove properties from the object...
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {removePromoCode, ...promoCodeProps} = usePromoCode()


    // need to read the values from checkoutContext to know which step we are on
    const checkoutContext = useCheckout();
    
    const {
        step,
        STEPS,
        goToStep,
        goToNextStep,
        checkoutSteps,
        setCheckoutStep,
    } = checkoutContext || {};



    const {data: basket} = useCurrentBasket()

// ✅ Also check what's in the basket directly
console.log('Basket Debug:', {
    shippingFromBasket: basket?.shipments?.[0]?.shippingAddress,
    billingFromBasket: basket?.billingAddress
});
   

   // if basket already has a payment instrument, assume payments has been added, if so disable the toggle card
   const appliedPayment = basket?.paymentInstruments && basket?.paymentInstruments[0]
   const selectedShippingAddress = basket?.shipments && basket?.shipments[0]?.shippingAddress
   const selectedBillingAddress = basket?.billingAddress

   const billingAddressForm = useForm({
    mode: 'onChange',
    shouldUnregister: false,
    defaultValues: {...selectedBillingAddress}
    })

    //what are these mutations for?
    const {mutateAsync: addPaymentInstrumentToBasket} = useShopperBasketsMutation(
        'addPaymentInstrumentToBasket'
    )
    const {mutateAsync: updateBillingAddressForBasket} = useShopperBasketsMutation(
        'updateBillingAddressForBasket'
    )

   const createComponent = useCallback(async () => {
        console.log('createComponent called')
        console.log('Payment Config:', paymentConfig)
        console.log('Metadata:', metadata)

        let lastPaymentIntentResponse = undefined
        const paymentSheetElement = document.getElementById('salesforce-payments-element');
        
        //here we will check if the div container exists and sfpp has been loaded into the window etc.
        if (paymentSheetElement && 
            !paymentSheetElement.getAttribute('data-mounted') && 
            sfpInstance && 
            !state.paymentSheet && 
            paymentConfig &&    //Wait for config data
            metadata    //Wait for metadata data
        ){
            console.log("Creating payment component...")
            console.log(sfpInstance);
            paymentSheetElement.setAttribute('data-mounted', 'true')
   // ✅ Now you have both paymentConfig and metadata available
   console.log('Using config:', paymentConfig)
   console.log('Using metadata:', metadata)
            //now given sfpInstance is available setup some duummy data and then test

             // Create all parameters at once
             const checkoutParams = createCheckoutParameters(
                sfpInstance,
                metadata,
                paymentConfig,
                basket,
                {
                    locale: intl.locale,
                    paymentFlow: 'checkout',
                    elementId: 'salesforce-payments-element',
                    //createIntentFunction: handleCreateIntent,
                    //updateIntentFunction: handleUpdateIntent,
                    customTheme: {
                        'color-primary': '#007bff' // Custom theme if needed
                    }
                }
            )
            console.log(checkoutParams);
          
            const paymentSheet = sfpInstance.checkout(
                checkoutParams.metadata,
                checkoutParams.paymentMethodSetForCheckout,
                checkoutParams.config,
                checkoutParams.paymentRequestInfo,
                checkoutParams.paymentSheetElement,
            );
            mergeState({paymentSheet})
            console.log(paymentSheet);
/*


 const paymentMethodSet = {
                id: '0x0123456789012',
                name: 'Test Payment Method Set',
                countryCode: 'US',
                paymentMethodSetAccounts: [
                    {
                        accountId: 'acct_1KiiO5RArCOz1e7h',
                        gatewayId: '01x12345',
                        vendor: 'Stripe',
                        config: {
                            key: 'pk_test_JsbBx7imKb7n7Xtlb5MH5BNO00ttiURmPV',
                        },
                    },
                ],
                paymentMethods: [
                    {
                        paymentMethodType: 'card',
                        accountId: 'acct_1KiiO5RArCOz1e7h',
                        paymentModes: ['Multistep'],
                    },
                ],
            };
        
    const paymentMethodSetForCheckout = paymentMethodSet;
    const paymentRequestInfo = {
        amount: params.amount,
        currency: params.currency,
        country: params.country,
        locale: params.locale,
    };
    // TODO: how are we building the theme? 
    const config = {
        labels: {},
        theme: buildTheme(),
        options: {
            returnUrl: buildReturnUrl(),
            useManualCapture: params.manualcapture === 'true',
            showSaveForFutureUsageCheckbox: params.spm === 'true',
            savedPaymentMethods: params.spm === 'true' ? savedPaymentMethods : [],
            maximumInitialPaymentMethods: 3,
            returningPayer: params.spm === 'true',
        },
        actions: {
        createIntentFunction: createPaymentIntent,
        },
    };

    const paymentSheet = sfpInstance.checkout(
      metadata,
      paymentMethodSetForCheckout,
      config,
      paymentRequestInfo,
      paymentSheetElement,
    );
*/


            
                                    /*const response = await payments.testAPI();
                                    console.log(response);
                                    setApiResponse(response);

                                    const configuration = await getPaymentConfigurationFromAPI({
                                        id: 'payments',
                                        selector: '#salesforce-payments-element',
                                        apiResponse:response
                                    })*/
                                    //const paymentSheet = sfpp.mount(configuration)
                            
                                    //mergeState({paymentSheet})
        }
    }, [sfpInstance, paymentConfig, metadata])

    //Runs when: step or sfpp changes (dependency array [step, sfpp])
    //Calls createComponent() to mount the payment component
    //Uses requestAnimationFrame: Ensures the DOM update happens on the next frame for better performance
    useEffect(() => {
        console.log('useEffect triggered with:', {
            step,
            sfpInstance: !!sfpInstance,
            paymentConfig: !!paymentConfig,
            metadata: !!metadata,
            configLoading,
            metadataLoading
        })
        
        if (sfpInstance) {
            requestAnimationFrame(() => {
                createComponent()
            })
        }
    }, [step, sfpInstance, paymentConfig, metadata, configLoading, metadataLoading, createComponent])


    const onBillingSubmit = async () => {
        const isFormValid = await billingAddressForm.trigger()

        if (!isFormValid) {
            return
        }
        const billingAddress = billingSameAsShipping
            ? selectedShippingAddress
            : billingAddressForm.getValues()
        // Using destructuring to remove properties from the object...
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {addressId, creationDate, lastModified, preferred, ...address} = billingAddress
        
        // issue is this is not the same basket that I am using for local org!
        return await updateBillingAddressForBasket({
            body: address,
            parameters: {basketId: basket.basketId}
        })
    }

    const onReview = async () => {
        console.log('onReview called')
        /*
        Right now these are the only payment method types we support
            source/bc_transaction/javasource/com/demandware/beehive/bpc/capi/payment/PaymentInstrumentInfoConstants.java
         public enum PaymentType
    {
        BASIC_CREDIT("BASIC_CREDIT",PaymentTypeClass.CREDIT_CARD),
        BANK_TRANSFER("BANK_TRANSFER",PaymentTypeClass.BANK_TRANSFER),
        BASIC_GIFT_CERTIFICATE("BASIC_GIFT_CERTIFICATE",PaymentTypeClass.GIFT_CERTIFICATE),
        CYBERSOURCE_CREDIT("CYBERSOURCE_CREDIT",PaymentTypeClass.CREDIT_CARD),
        CYBERSOURCE_BML("CYBERSOURCE_BML",PaymentTypeClass.BML),
        PAYPAL_CREDIT("PAYPAL_CREDIT",PaymentTypeClass.CREDIT_CARD),
        VERISIGN_CREDIT( "VERISIGN_CREDIT", PaymentTypeClass.CREDIT_CARD ),
        SALESFORCE_PAYMENTS( "SALESFORCE_PAYMENTS", PaymentTypeClass.CREDIT_CARD );
            */
        //add mock data but this info should be coming from the SDK but need to understand consequences
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
        };
        await addPaymentInstrumentToBasket({
            parameters: {basketId: basket?.basketId},
            body: mockPaymentData
        })

       //in pwa-kit checkout review requires billing to be submitted before 
       const updatedBasket = await onBillingSubmit()

       if (updatedBasket) {
        goToNextStep()
       }
    }

    return (
        //This is the title of the card
        <ToggleCard
            id="step-3"
            title={intl.formatMessage({defaultMessage: 'Payment', id: 'checkout_payment.title.payment'})}
            //editing={true}  //this puts the component either in edit or summary mode
            editing={step === STEPS.PAYMENT}
            isLoading={
            false
            }
            disabled={appliedPayment == null}
            onEdit={() => goToStep(STEPS.PAYMENT)}
            editLabel={intl.formatMessage({
                defaultMessage: 'Edit Payment Info',
                id: 'toggle_card.action.editPaymentInfo'
            })}
        >
            <ToggleCardEdit>
                 {/*<Box mt={-2} mb={4}>
                    <PromoCode {...promoCodeProps} itemProps={{border: 'none'}} />
                </Box>*/}

                <Stack spacing={6}>
                    {!appliedPayment?.paymentCard ? (
                        <>
                         {isReady}
                         <div id="salesforce-payments-element1"></div>
                           
                           
                           {/* Payment element container */}
                            <Box
                                id="salesforce-payments-element"
                                border="1px solid"
                                borderColor="gray.200"
                                borderRadius="lg"
                                p={6}
                                bg="white"
                                minH="300px"
                                shadow="sm"
                                position="relative"
                                display={isReady ? 'block' : 'none'}
                                _focus={{
                                    borderColor: "blue.500",
                                    shadow: "outline"
                                }}
                            />                                               
                        </>
                    ) : (
                        <span>show payment summary here and allow edit </span>
                    )}

      {/* Debug Section 
      <div style={{border: '1px solid #red', padding: '10px', margin: '10px 0', backgroundColor: '#ffe6e6'}}>
    <h4>SFP Initialization Debug:</h4>
    <p><strong>Scripts Loaded:</strong> {scriptsLoaded ? 'Yes' : 'No'}</p>
    <p><strong>Has SFP:</strong> {hasSFP ? 'Yes' : 'No'}</p>
    <p><strong>window.SFPayments exists:</strong> {typeof window !== 'undefined' && window.SFPayments ? 'Yes' : 'No'}</p>
    <p><strong>SFP Instance:</strong> {sfpInstance ? 'Available' : 'Not Available'}</p>
    <p><strong>Is Initialized:</strong> {isInitialized ? 'Yes' : 'No'}</p>
    <p><strong>SFP Loading:</strong> {sfpLoading ? 'Yes' : 'No'}</p>
    <p><strong>Init Error:</strong> {initError ? initError.message : 'None'}</p>
    <p><strong>Window SFPayments type:</strong> {typeof window !== 'undefined' ? typeof window.SFPayments : 'undefined'}</p>
</div>*/}



                    <Divider borderColor="gray.100" />

                    <Stack spacing={2}>
                        <Heading as="h3" fontSize="md">
                            <FormattedMessage
                                defaultMessage="Billing Address"
                                id="checkout_payment.heading.billing_address"
                            />
                        </Heading>

                        <Checkbox
                            name="billingSameAsShipping"
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
                            formTitleAriaLabel={billingAddressAriaLabel}
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

            {/*TODO: maybe have a different summary component here */}
            <ToggleCardSummary>
                <Stack spacing={6}>
                    {/*if payment has been added to basket, then show the info */}
                    {appliedPayment && (
                        <Stack spacing={3}>
                            <Heading as="h3" fontSize="md">
                                <FormattedMessage
                                    defaultMessage="Credit Card"
                                    id="checkout_payment.heading.credit_card"
                                />
                            </Heading>
                            <PaymentCardSummary payment={appliedPayment} />
                        </Stack>
                    )}

                    <Divider borderColor="gray.100" />

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
    )
}

//what is this for and do I need it?
const PaymentCardSummary = ({payment}) => {
    const CardIcon = getCreditCardIcon(payment?.paymentCard?.cardType)
    return (
        <Stack direction="row" alignItems="center" spacing={3}>
            {CardIcon && <CardIcon layerStyle="ccIcon" />}

            <Stack direction="row">
                <Text>{payment.paymentCard.cardType}</Text>
                <Text>&bull;&bull;&bull;&bull; {payment.paymentCard.numberLastDigits}</Text>
                <Text>
                    {payment.paymentCard.expirationMonth}/{payment.paymentCard.expirationYear}
                </Text>
            </Stack>
        </Stack>
    )
}

PaymentCardSummary.propTypes = {payment: PropTypes.object}
export default SFPaymentsSheet