import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {
    Box,
    Container,
    Heading,
    Text,
    Divider
} from '@salesforce/retail-react-app/app/components/shared/ui'

import { useSharedSFPInstance } from '../../../../hooks/salesforce-payments/use-shared-payments-sdk'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {createPaymentRequestInfo} from '../../../../utils/salesforce-payments/payment-method-mapper'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import PaymentExpressButtons from '../../../../components/salesforce-payments/paymentExpressButtons'
import {useShopperOrdersMutation} from '@salesforce/commerce-sdk-react'
import {useCountryDetection} from '../../../../utils/salesforce-payments/country-detection'
import { useShippingMethodsForShipment } from '@salesforce/commerce-sdk-react'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import logger from '@salesforce/retail-react-app/app/utils/logger-instance'
import {mapWalletToCommerceAddresses} from '../../../../utils/salesforce-payments/address-mapper'

const SFPaymentsExpress = ({paymentState, setIsPaymentProcessing}) => {

    const {
        paymentConfig,
        metadata,
        paymentConfigLoading,
        isSFPEnabled
    } = paymentState
    const isReady = !paymentConfigLoading && paymentConfig && metadata
    const intl = useIntl()

    // use the shared SFP intance
    const { sfpInstance, isReady: sfpReady } = useSharedSFPInstance()

    const {data: basket} = useCurrentBasket()
    // useRef keeps it in state between re-renders.
    const expressShippingAddressRef = useRef(null) 
    const expressBillingAddressRef = useRef(null) 

    const {mutateAsync: addPaymentInstrumentToBasket} = useShopperBasketsMutation('addPaymentInstrumentToBasket')
    const {mutateAsync: updateBillingAddressForBasket} = useShopperBasketsMutation('updateBillingAddressForBasket')
    const {mutateAsync: removePaymentInstrumentFromBasket} = useShopperBasketsMutation('removePaymentInstrumentFromBasket')
    const {mutateAsync: updateShippingAddressForShipment} = useShopperBasketsMutation('updateShippingAddressForShipment')
    const {mutateAsync: updateShippingMethodForShipment} = useShopperBasketsMutation('updateShippingMethodForShipment')
    const {mutateAsync: createOrder} = useShopperOrdersMutation('createOrder')
    const {mutateAsync: updatePaymentInstrument} = useShopperOrdersMutation('updatePaymentInstrumentForOrder')

    const {country: detectedCountry} = useCountryDetection()

    //TODO: need to address the payment method id issue with ECOM
    //const paymentMethodIdSFP ="SALESFORCE_PAYMENTS";
    const paymentMethodIdSFP ="Salesforce Payments";
    // Add this state to track if we should keep the component mounted
    const [isProcessing, setIsProcessing] = useState(false)

    // ✅ Use ref to store order info
    const currentOrderRef = useRef(null)
    const navigate = useNavigation()

    // Memoize paymentRequestInfo so it doesn't recreate on every render
    const paymentRequestInfo = useMemo(() => {
        return basket ? createPaymentRequestInfo(basket, intl.locale, detectedCountry) : null
    }, [basket, intl.locale])

    /*
        shipping methods query hook is used to refetch shipping methods when the shipping address is updated
        It looks at the address that's set on the shipment already and refetches shipping methods for that address
    */
    const {refetch: refetchShippingMethods} = useShippingMethodsForShipment(
        {
            parameters: {
                basketId: basket?.basketId,
                shipmentId: basket?.shipments?.[0]?.shipmentId || 'me'
            }
        },
        {
            enabled: false // Disable automatic fetching, we'll fetch manually when needed
        }
    )

    /*
        updateShippingMethodForShipment - updates the shipping method for a shipment
    */
    const updateShippingOption = useCallback(async (shippingOption) => {
        // TODO: need to better understand the use-cases around shipmentId
        const shipmentId = basket?.shipments?.[0]?.shipmentId || 'me'

        const updatedBasket =await updateShippingMethodForShipment({
            parameters: {
                basketId: basket.basketId,
                shipmentId: shipmentId
            },
            body: {
                id: shippingOption.id
            }
        })
        
        // Then Refetch shipping methods
        const {data: shippingMethodsResponse} = await refetchShippingMethods()
        const applicableShippingMethods = shippingMethodsResponse.applicableShippingMethods || []
         
        return {
            success: true,
            defaultShippingMethodId: shippingMethodsResponse.defaultShippingMethodId,
            grandTotalAmount: updatedBasket.orderTotal,
            shippingRates: applicableShippingMethods?.map(method => ({
                id: method.id,
                name: method.name,
                shippingFee: method.price,
                description: method.description || method.c_estimatedArrivalTime
            })) || []
        }
    }, [])

    /*
        calculateShippingOptions - calculates the shipping options for a shipment
        TODO: bug: when shipping address changes after changing shipping option before, its not recalculating 
    */
    const calculateShippingOptions = useCallback(async (shippingAddress) => {
        try {            
            /*
                'me' - This is the default shipment ID that Commerce Cloud automatically creates for the first/main shipment in a basket.
                If you have multiple shipments, you can use the shipmentId of the shipment you want to update.
                If you have only one shipment, you can use 'me' for the shipmentId.
            */
            //expressShippingAddressRef.current = shippingAddress // ← Immediate access
      
            const shipmentId = basket?.shipments?.[0]?.shipmentId || 'me'

            const {data: fetchedShippingMethodsResponse} = await refetchShippingMethods()  
          
            // Transform and update basket...
            const transformedAddress = {
                firstName: shippingAddress.firstName || 'FName',
                lastName: shippingAddress.lastName || 'LName',
                address1: shippingAddress.line1 || 'Address1',
                city: shippingAddress.city || '',
                stateCode: shippingAddress.state || '',
                postalCode: shippingAddress.postal_code || '',
                countryCode: shippingAddress.country || 'US'
            }
            /*
                The Two-Step Process:
                updateShippingAddressForShipment - This updates the shipment's address in the basket
                getShippingMethodsForShipment - This gets shipping methods for the current address that's already set on the shipment
            */

            // First, update the shipping address to calculate rates
            const updatedBasket = await updateShippingAddressForShipment({
                parameters: { 
                    basketId: basket.basketId,
                    shipmentId: shipmentId
                },
                body: transformedAddress 
            })
        
            // Then Refetch shipping methods
            const {data: shippingMethodsResponse} = await refetchShippingMethods()
           
            const applicableShippingMethods = shippingMethodsResponse.applicableShippingMethods || []
            const defaultShippingMethodId = shippingMethodsResponse.defaultShippingMethodId

            // Automatically select the default shipping method
            if (defaultShippingMethodId && applicableShippingMethods.length > 0) {
                const updatedBasketWithShipping = await updateShippingMethodForShipment({
                    parameters: {
                        basketId: basket.basketId,
                        shipmentId: shipmentId
                    },
                    body: {
                        id: defaultShippingMethodId
                    }
                })

                return {
                    success: true,
                    defaultShippingMethodId: defaultShippingMethodId,
                    grandTotalAmount: updatedBasketWithShipping.orderTotal,
                    shippingRates: applicableShippingMethods?.map(method => ({
                        id: method.id,
                        name: method.name,
                        shippingFee: method.price,
                        description: method.description || method.c_estimatedArrivalTime
                    })) || []
                }
            }
        } catch (error) {
            logger.error('Shipping calculation failed', {
                namespace: 'PaymentExpress.calculateShippingOptions',
                additionalProperties: {error}
            })
            return {
                success: false,
                error: error.message
            }
        }
    }, [basket])


    /*
        updateOrderPayment - updates the payment instrument for an order
    */
    const updateOrderPayment = async (order, paymentInstrumentId, paymentData) => {
      
        try {
            // For Salesforce Payments, provide the minimal required structure
            const paymentInstrumentUpdate = {
                amount: order.orderTotal,  
                paymentMethodId: paymentMethodIdSFP,
            }

            const result = await updatePaymentInstrument({
                parameters: {
                    orderNo: order.orderNo,                   // Order number
                    paymentInstrumentId: paymentInstrumentId  // Payment instrument ID to update
                },
                body: paymentInstrumentUpdate
            })

            return result
        } catch (error) {
            logger.error('Failed to update payment instrument', {
                namespace: 'PaymentExpress.updateOrderPayment',
                additionalProperties: {error}
            })
            throw error
        }
    }

    /*
        create payment intent function
    */
    const handleCreatePaymentIntent = async (selectedExpressPaymentType) => {
        setIsProcessing(true) // Keep component mounted
        const basketId = basket.basketId

        logger.info('Creating payment intent for express payment', {
            namespace: 'PaymentExpress.handleCreatePaymentIntent',
            additionalProperties: { 
                selectedExpressPaymentType,
                basketId 
            }
        })

        // STEP 1: Add payment instrument to basket BEFORE creating order
        // Remove existing Salesforce Payments instruments first
        const existingInstruments = basket?.paymentInstruments?.filter(
            instrument => instrument.paymentMethodId === paymentMethodIdSFP
        ) || []
        
        for (const instrument of existingInstruments) {
            await removePaymentInstrumentFromBasket({
                parameters: {
                    basketId: basket.basketId,
                    paymentInstrumentId: instrument.paymentInstrumentId
                }
            })
        }

        // Add the Salesforce Payments payment instrument
        const paymentData = {
            "paymentMethodId": paymentMethodIdSFP
        }
        
        await addPaymentInstrumentToBasket({
            parameters: {basketId: basket.basketId},
            body: paymentData
        })

        // we get the billing address from the wallet, but we will not get it until the confirm call
        // TODO: update SDK to return the billing address earlier when it calls the create payment intent function
        let billingAddressToUse = expressBillingAddressRef.current
        // Transform and update basket...
        const transformedAddress = {
            firstName: billingAddressToUse.firstName || 'FName',
            lastName: billingAddressToUse.lastName || 'LName',
            address1: billingAddressToUse.line1 || 'Address1',
            city: billingAddressToUse.city || '',
            stateCode: billingAddressToUse.state || '',
            postalCode: billingAddressToUse.postalCode || '',
            countryCode: billingAddressToUse.country || 'US'
        }

        await updateBillingAddressForBasket({
            body: transformedAddress,
            parameters: {basketId: basket.basketId}
        })

        // first create an order here using the current basket, which also creates payment instrument against order
        const order = await createOrder({
            body: {basketId: basketId}
        })
        const orderNo = order.orderNo

        // Get payment instrument ID from the created order
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
        

        // ✅ Store order info in ref
        currentOrderRef.current = {
            orderNo: order.orderNo,
            orderTotal: order.orderTotal,
        }
 
        return {
            client_secret: paymentReference.clientSecret,
            id: paymentReference.paymentReferenceId,
               // ✅ Add the metadata that Stripe SDK expects
                metadata: {
                    guid: paymentReference.paymentReferenceId || order.orderNo,
                    orderNo: order.orderNo,
                    // Add any other metadata that might be useful
                    paymentMethodId: paymentMethodIdSFP
                }
        }
    }

    const handlePaymentBeforeApproved = useCallback(async (paymentDetails) => {
        logger.info('Payment before approved', {
            namespace: 'PaymentExpress.handlePaymentBeforeApproved',
            additionalProperties: {paymentDetails}
        })
        //save billing address as well to ref
        //expressBillingAddressRef.current = paymentDetails.billingDetails.address

        // Use the utility function to map wallet addresses
        const addresses = mapWalletToCommerceAddresses(paymentDetails)
        
        if (addresses.billingAddress) {
            expressBillingAddressRef.current = addresses.billingAddress
        }
        
        if (addresses.shippingAddress) {
            expressShippingAddressRef.current = addresses.shippingAddress
        }
     }, [])

     // Handle payment approval and navigation
     const handlePaymentApproved = useCallback(async (paymentDetails) => {
        if (!currentOrderRef.current) {
            logger.error('No order information available', {
                namespace: 'PaymentExpress.handlePaymentApproved'
            })
            return
        }
        
        try {
            // Navigate using stored order info
            navigate(`/checkout/confirmation/${currentOrderRef.current.orderNo}`)
            
        } catch (error) {
            logger.error('Error handling payment approval', {
                namespace: 'PaymentExpress.handlePaymentApproved',
                additionalProperties: {error}
            })
        }
    }, [navigate])

    const paymentExpressOptions = useMemo(() => ({
        elementId: 'salesforce-payments-express',
        locale: intl.locale,
        paymentFlow: 'express',
        customTheme: {
            'color-primary': '#007bff'
        },
    }), [intl.locale])

  
    const shouldShowComponent = (isReady && sfpReady && sfpInstance && paymentRequestInfo) || isProcessing
 
    return (
        <Box>   
           {shouldShowComponent && (
                <Box
                    mb={4}
                    p={4}
                    border="1px solid #E2E8F0"
                    borderRadius="md"
                >
                    <Text fontSize="sm" mb={3} color="gray.800">
                        <FormattedMessage 
                            defaultMessage="Express Checkout" 
                            id="checkout.express_checkout.title"
                        />
                    </Text>
                
                    <PaymentExpressButtons
                        sfpInstance={sfpInstance}
                        paymentConfig={paymentConfig}
                        metadata={metadata}
                        paymentRequestInfo={paymentRequestInfo}
                        amount={basket?.productTotal || basket?.productSubTotal || 0}
                        currency={basket?.currency || 'USD'}

                        shippingAddressRequired={true}
                        emailAddressRequired={true}
                        phoneNumberRequired={true}
                        //useManualCapture={true}
                        onCreatePaymentIntent={handleCreatePaymentIntent}
                        onShippingAddressChange={calculateShippingOptions}
                        onShippingOptionChange={updateShippingOption}
                        onPaymentApproved={handlePaymentApproved} 
                        onPaymentBeforeApproved={handlePaymentBeforeApproved}
                        options={paymentExpressOptions}
                        onPaymentProcessingChange={setIsPaymentProcessing}
                        containerProps={{ style: { marginBottom: '16px' } }} 
                    />
                </Box>
            )}
        </Box>
    )

}

export default SFPaymentsExpress

/*
Notes
order_total = 0 until ALL required components are present and calculated (shipping, tax, etc.)

*/