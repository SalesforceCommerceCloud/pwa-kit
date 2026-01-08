/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import {
    Alert,
    AlertIcon,
    Box,
    Button,
    Container,
    Grid,
    GridItem,
    Stack
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {FormattedMessage, useIntl} from 'react-intl'
import {useForm} from 'react-hook-form'
import {
    useShopperBasketsMutation,
    useShopperOrdersMutation,
    useShopperCustomersMutation,
    ShopperBasketsMutations,
    ShopperOrdersMutations
} from '@salesforce/commerce-sdk-react'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {
    useCheckout,
    CheckoutProvider
} from '@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context'
import ContactInfo from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-contact-info'
import PickupAddress from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-pickup-address'
import ShippingAddress from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-address'
import ShippingOptions from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-options'
import Payment from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-payment'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import CheckoutSkeleton from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-checkout-skeleton'
import UnavailableProductConfirmationModal from '@salesforce/retail-react-app/app/components/unavailable-product-confirmation-modal'
import LoadingSpinner from '@salesforce/retail-react-app/app/components/loading-spinner'
import {isPickupShipment} from '@salesforce/retail-react-app/app/utils/shipment-utils'
import OrderSummary from '@salesforce/retail-react-app/app/components/order-summary'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useMultiship} from '@salesforce/retail-react-app/app/hooks/use-multiship'
import {
    API_ERROR_MESSAGE,
    TOAST_MESSAGE_REMOVED_ITEM_FROM_CART
} from '@salesforce/retail-react-app/app/constants'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {
    getPaymentInstrumentCardType,
    getMaskCreditCardNumber
} from '@salesforce/retail-react-app/app/utils/cc-utils'
import {nanoid} from 'nanoid'

const CheckoutOneClick = () => {
    const {formatMessage} = useIntl()
    const navigate = useNavigation()
    const {step, STEPS} = useCheckout()
    const showToast = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [enableUserRegistration, setEnableUserRegistration] = useState(false)
    const [registeredUserChoseGuest, setRegisteredUserChoseGuest] = useState(false)
    const [shouldSavePaymentMethod, setShouldSavePaymentMethod] = useState(false)

    const currentBasketQuery = useCurrentBasket()
    const {data: basket} = currentBasketQuery
    const {data: currentCustomer} = useCurrentCustomer()
    const {removeEmptyShipments} = useMultiship(basket)
    const [error] = useState()
    const {social = {}} = getConfig().app.login || {}
    const idps = social?.idps
    const isSocialEnabled = !!social?.enabled
    const createCustomerPaymentInstruments = useShopperCustomersMutation(
        'createCustomerPaymentInstrument'
    )
    // The last applied payment instrument on the card. We need to track to save it on the customer profile upon registration
    // as the payment instrument on order only contains the masked number.
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)
    const [isEditingPayment, setIsEditingPayment] = useState(false)

    // Compute shipment types (consider only shipments that have items assigned)
    const allShipments = basket?.shipments || []
    const productItems = basket?.productItems || []
    const shipmentsWithItems = allShipments.filter((s) =>
        productItems.some((i) => i.shipmentId === s.shipmentId)
    )
    const pickupShipments = shipmentsWithItems.filter(
        (s) => isPickupShipment(s) || !!s.c_fromStoreId
    )
    const deliveryShipments = shipmentsWithItems.filter((s) => !isPickupShipment(s))
    const hasPickupShipments = pickupShipments.length > 0
    const hasDeliveryShipments = deliveryShipments.length > 0
    const isPickupOnly = hasPickupShipments && !hasDeliveryShipments
    const [billingSameAsShipping, setBillingSameAsShipping] = useState(true)
    // For billing=shipping, align with legacy: use the first delivery shipment's address
    const selectedShippingAddress =
        deliveryShipments.length > 0 ? deliveryShipments[0]?.shippingAddress : null
    const selectedBillingAddress = basket?.billingAddress

    // appliedPayment includes both manually entered payment instruments and saved payment instruments
    // that have been applied to the basket via addPaymentInstrumentToBasket
    const appliedPayment = basket?.paymentInstruments && basket?.paymentInstruments[0]

    const {mutateAsync: addPaymentInstrumentToBasket} = useShopperBasketsMutation(
        ShopperBasketsMutations.AddPaymentInstrumentToBasket
    )
    const {mutateAsync: updateBillingAddressForBasket} = useShopperBasketsMutation(
        ShopperBasketsMutations.UpdateBillingAddressForBasket
    )
    const {mutateAsync: createOrder} = useShopperOrdersMutation(ShopperOrdersMutations.CreateOrder)
    const createCustomerAddress = useShopperCustomersMutation('createCustomerAddress')
    const updateCustomer = useShopperCustomersMutation('updateCustomer')

    const handleSavePreferenceChange = (shouldSave) => {
        setShouldSavePaymentMethod(shouldSave)
    }

    const showError = (message) => {
        showToast({
            title: message || formatMessage(API_ERROR_MESSAGE),
            status: 'error'
        })
    }

    // Remove any empty shipments whenever navigating to the checkout page
    // Using basketId ensures that the basket is in a valid state before removing empty shipments
    useEffect(() => {
        if (basket?.shipments?.length > 1) {
            removeEmptyShipments(basket)
        }
    }, [basket?.basketId])

    // Form for payment method
    const paymentMethodForm = useForm({
        mode: 'onChange',
        shouldUnregister: false,
        defaultValues: {
            holder: '',
            number: '',
            cardType: '',
            expiry: ''
        }
    })

    // Form for billing address
    const billingAddressForm = useForm({
        mode: 'onChange',
        shouldUnregister: false,
        defaultValues: {...selectedBillingAddress}
    })

    const onPaymentSubmit = async (formValue) => {
        // The form gives us the expiration date as `MM/YY` - so we need to split it into
        // month and year to submit them as individual fields.
        const [expirationMonth, expirationYear] = formValue.expiry.split('/')

        const paymentInstrument = {
            amount: basket?.orderTotal || 0,
            paymentMethodId: 'CREDIT_CARD',
            paymentCard: {
                holder: formValue.holder,
                maskedNumber: getMaskCreditCardNumber(formValue.number),
                cardType: getPaymentInstrumentCardType(formValue.cardType),
                expirationMonth: parseInt(expirationMonth),
                expirationYear: parseInt(`20${expirationYear}`)
            }
        }

        return addPaymentInstrumentToBasket({
            parameters: {basketId: basket?.basketId},
            body: paymentInstrument
        })
    }

    // Reset guest checkout flag when step changes (user goes back to edit)
    useEffect(() => {
        if (step === 0) {
            setRegisteredUserChoseGuest(false)
        }
    }, [step])

    // Ensure saved payment radio is selected when entering Payment with an applied instrument
    useEffect(() => {
        if (step === STEPS.PAYMENT && appliedPayment?.customerPaymentInstrumentId) {
            setSelectedPaymentMethod(appliedPayment.customerPaymentInstrumentId)
        }
    }, [step, appliedPayment?.customerPaymentInstrumentId, STEPS.PAYMENT])

    // Clamp when cart becomes pickup-only; preserve shopper choice otherwise
    useEffect(() => {
        if (isPickupOnly) {
            setBillingSameAsShipping(false)
        }
    }, [isPickupOnly])

    const onBillingSubmit = async () => {
        let billingAddress
        if (billingSameAsShipping && selectedShippingAddress) {
            billingAddress = selectedShippingAddress
        } else {
            const isFormValid = await billingAddressForm.trigger()

            if (!isFormValid) {
                return
            }
            billingAddress = billingAddressForm.getValues()
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {addressId, creationDate, lastModified, preferred, ...address} = billingAddress
        const latestBasketId = currentBasketQuery.data?.basketId || basket.basketId
        return await updateBillingAddressForBasket({
            body: address,
            parameters: {basketId: latestBasketId}
        })
    }

    const submitOrder = async (fullCardDetails) => {
        const savePaymentInstrumentWithDetails = async (
            customerId,
            paymentMethodId,
            fullCardDetails
        ) => {
            try {
                // Set as default only for newly registered users (guests who just registered)
                const isNewlyRegisteredUser =
                    enableUserRegistration &&
                    currentCustomer?.isRegistered &&
                    !registeredUserChoseGuest

                const paymentInstrument = {
                    paymentMethodId: paymentMethodId,
                    default: isNewlyRegisteredUser,
                    paymentCard: {
                        holder: fullCardDetails.holder,
                        number: fullCardDetails.number,
                        cardType: fullCardDetails.cardType,
                        expirationMonth: fullCardDetails.expirationMonth,
                        expirationYear: fullCardDetails.expirationYear
                    }
                }

                await createCustomerPaymentInstruments.mutateAsync({
                    body: paymentInstrument,
                    parameters: {customerId: customerId}
                })
            } catch (error) {
                if (shouldSavePaymentMethod) {
                    showError(
                        formatMessage({
                            id: 'checkout_payment.error.cannot_save_payment',
                            defaultMessage: 'Could not save payment method. Please try again.'
                        })
                    )
                }
            }
        }

        // Save payment instrument for existing registered users if they checked the save box
        const savePaymentInstrumentForRegisteredUser = async (
            customerId,
            orderPaymentInstrument,
            fullCardDetails
        ) => {
            try {
                if (orderPaymentInstrument && fullCardDetails) {
                    await savePaymentInstrumentWithDetails(
                        customerId,
                        orderPaymentInstrument.paymentMethodId,
                        fullCardDetails
                    )
                }
            } catch (error) {
                console.error(
                    'Debug - Failed to save payment instrument for registered user:',
                    error
                )
                // Fail silently
            }
        }

        setIsLoading(true)
        try {
            // Ensure we are using the freshest basket id
            const refreshed = await currentBasketQuery.refetch()
            const latestBasketId = refreshed.data?.basketId || basket.basketId

            // Create order with the latest basket
            const order = await createOrder({
                body: {basketId: latestBasketId}
            })

            // If user is registered at this point, optionally save payment method
            {
                // For existing registered users, save payment instrument if they checked the save box
                // Only save if we have full card details (i.e., user entered a new card)
                if (
                    currentCustomer?.isRegistered &&
                    !registeredUserChoseGuest &&
                    shouldSavePaymentMethod &&
                    order.paymentInstruments?.[0] &&
                    fullCardDetails
                ) {
                    const paymentInstrument = order.paymentInstruments[0]
                    await savePaymentInstrumentForRegisteredUser(
                        order.customerInfo.customerId,
                        paymentInstrument,
                        fullCardDetails
                    )
                }

                // For newly registered guests only, persist shipping address when billing same as shipping
                // Skip saving pickup/store addresses - only save delivery addresses
                // For multi-shipment orders, save all delivery addresses with the first one as default
                if (
                    enableUserRegistration &&
                    currentCustomer?.isRegistered &&
                    !registeredUserChoseGuest
                ) {
                    try {
                        const customerId = order.customerInfo?.customerId
                        if (!customerId) return

                        // Get all delivery shipments (not pickup) from the order
                        // This handles both single delivery and multi-shipment orders
                        // For BOPIS orders, pickup shipments are filtered out
                        const deliveryShipments =
                            order?.shipments?.filter(
                                (shipment) =>
                                    !isPickupShipment(shipment) && shipment.shippingAddress
                            ) || []

                        if (deliveryShipments.length > 0) {
                            // Save all delivery addresses, with the first one as preferred
                            for (let i = 0; i < deliveryShipments.length; i++) {
                                const shipment = deliveryShipments[i]
                                const shipping = shipment.shippingAddress
                                if (!shipping) continue

                                // Whitelist fields and strip non-customer fields (e.g., id, _type)
                                const {
                                    address1,
                                    address2,
                                    city,
                                    countryCode,
                                    firstName,
                                    lastName,
                                    phone,
                                    postalCode,
                                    stateCode
                                } = shipping || {}

                                await createCustomerAddress.mutateAsync({
                                    parameters: {customerId},
                                    body: {
                                        addressId: nanoid(),
                                        preferred: i === 0, // First address is preferred
                                        address1,
                                        address2,
                                        city,
                                        countryCode,
                                        firstName,
                                        lastName,
                                        phone,
                                        postalCode,
                                        stateCode
                                    }
                                })
                            }

                            // Also persist billing phone as phoneHome
                            const phoneHome = order?.billingAddress?.phone
                            if (phoneHome) {
                                await updateCustomer.mutateAsync({
                                    parameters: {customerId},
                                    body: {phoneHome}
                                })
                            }
                        }
                    } catch (_e) {
                        // Only surface error if shopper opted to register/save details; otherwise fail silently
                        showError(
                            formatMessage({
                                id: 'checkout.error.cannot_save_address',
                                defaultMessage: 'Could not save shipping address.'
                            })
                        )
                    }
                }
            }

            navigate(`/checkout/confirmation/${order.orderNo}`)
        } catch (error) {
            const message = formatMessage({
                id: 'checkout.message.generic_error',
                defaultMessage: 'An unexpected error occurred during checkout.'
            })
            showError(message)
        } finally {
            setIsLoading(false)
        }
    }

    const onPlaceOrder = async () => {
        try {
            // If using a new card (no applied saved payment), validate fields to surface errors
            const isUsingNewCard = !appliedPayment
            if (isUsingNewCard) {
                const isValid = await paymentMethodForm.trigger()
                if (!isValid) {
                    // Keep payment section open and show field errors
                    setIsEditingPayment(true)
                    return
                }
            }
            // Check if we have form values (new card entered)
            const paymentFormValues = paymentMethodForm.getValues()
            const hasFormValues = paymentFormValues && paymentFormValues.expiry

            // Prepare full card details for saving (only if we have form values for new cards)
            let fullCardDetails = null
            if (hasFormValues) {
                const [expirationMonth, expirationYear] = paymentFormValues.expiry.split('/')
                fullCardDetails = {
                    holder: paymentFormValues.holder,
                    number: paymentFormValues.number, // Full card number from form
                    cardType: getPaymentInstrumentCardType(paymentFormValues.cardType),
                    expirationMonth: parseInt(expirationMonth),
                    expirationYear: parseInt(`20${expirationYear}`)
                }
            }
            // For saved payments (appliedPayment), we don't need fullCardDetails
            // because we're not saving them again - they're already saved

            if (!appliedPayment) {
                // No payment applied, need to add a new payment instrument
                if (hasFormValues) {
                    await onPaymentSubmit(paymentFormValues)
                }
            }

            // If successful `onBillingSubmit` returns the updated basket. If the form was invalid on
            // submit, `undefined` is returned.
            const updatedBasket = await onBillingSubmit()

            if (updatedBasket) {
                await submitOrder(fullCardDetails)
            }
        } catch (error) {
            showError()
        }
    }

    useEffect(() => {
        if (error || step === 4) {
            window.scrollTo({top: 0})
        }
    }, [error, step])

    return (
        <Box background="gray.50" flex="1">
            <Container
                data-testid="sf-checkout-container"
                maxWidth="container.xl"
                py={{base: 7, lg: 16}}
                px={{base: 0, lg: 8}}
            >
                <Grid templateColumns={{base: '1fr', lg: '66% 1fr'}} gap={{base: 10, xl: 20}}>
                    <GridItem>
                        <Stack spacing={4}>
                            {error && (
                                <Alert status="error" variant="left-accent">
                                    <AlertIcon />
                                    {error}
                                </Alert>
                            )}

                            <ContactInfo
                                isSocialEnabled={isSocialEnabled}
                                idps={idps}
                                onRegisteredUserChoseGuest={setRegisteredUserChoseGuest}
                            />
                            {hasPickupShipments && <PickupAddress />}
                            {hasDeliveryShipments && (
                                <ShippingAddress enableUserRegistration={enableUserRegistration} />
                            )}
                            {hasDeliveryShipments && <ShippingOptions />}
                            <Payment
                                enableUserRegistration={enableUserRegistration}
                                setEnableUserRegistration={setEnableUserRegistration}
                                paymentMethodForm={paymentMethodForm}
                                billingAddressForm={billingAddressForm}
                                registeredUserChoseGuest={registeredUserChoseGuest}
                                onSavePreferenceChange={handleSavePreferenceChange}
                                onPaymentSubmitted={onPaymentSubmit}
                                selectedPaymentMethod={selectedPaymentMethod}
                                isEditing={isEditingPayment}
                                onSelectedPaymentMethodChange={setSelectedPaymentMethod}
                                onIsEditingChange={setIsEditingPayment}
                                billingSameAsShipping={billingSameAsShipping}
                                setBillingSameAsShipping={setBillingSameAsShipping}
                            />

                            {step >= STEPS.PAYMENT && (
                                <Box display="flex" bottom="0" px={4} pt={2} pb={4}>
                                    <Container variant="form">
                                        <Button
                                            w="full"
                                            onClick={onPlaceOrder}
                                            isLoading={isLoading}
                                            data-testid="place-order-button"
                                            size="lg"
                                            px={8}
                                            minW="200px"
                                        >
                                            <FormattedMessage
                                                defaultMessage="Place Order"
                                                id="checkout_payment.button.place_order"
                                            />
                                        </Button>
                                    </Container>
                                </Box>
                            )}
                        </Stack>
                    </GridItem>

                    <GridItem py={6} px={[4, 4, 4, 0]}>
                        <OrderSummary
                            basket={basket}
                            showTaxEstimationForm={false}
                            showCartItems={true}
                        />
                    </GridItem>
                </Grid>
            </Container>
        </Box>
    )
}

const CheckoutContainer = () => {
    const {data: customer} = useCurrentCustomer()
    const {data: basket} = useCurrentBasket()
    const {formatMessage} = useIntl()
    const removeItemFromBasketMutation = useShopperBasketsMutation('removeItemFromBasket')
    const toast = useToast()
    const [isDeletingUnavailableItem, setIsDeletingUnavailableItem] = useState(false)

    const handleRemoveItem = async (product) => {
        await removeItemFromBasketMutation.mutateAsync(
            {
                parameters: {basketId: basket.basketId, itemId: product.itemId}
            },
            {
                onSuccess: () => {
                    toast({
                        title: formatMessage(TOAST_MESSAGE_REMOVED_ITEM_FROM_CART, {quantity: 1}),
                        status: 'success'
                    })
                },
                onError: () => {
                    toast({
                        title: formatMessage(API_ERROR_MESSAGE),
                        status: 'error'
                    })
                }
            }
        )
    }
    const handleUnavailableProducts = async (unavailableProductIds) => {
        setIsDeletingUnavailableItem(true)
        const productItems = basket?.productItems?.filter((item) =>
            unavailableProductIds?.includes(item.productId)
        )
        for (let item of productItems) {
            await handleRemoveItem(item)
        }
        setIsDeletingUnavailableItem(false)
    }

    if (!customer || !customer.customerId || !basket || !basket.basketId) {
        return <CheckoutSkeleton />
    }

    return (
        <CheckoutProvider>
            {isDeletingUnavailableItem && <LoadingSpinner wrapperStyles={{height: '100vh'}} />}

            <CheckoutOneClick />
            <UnavailableProductConfirmationModal
                productItems={basket?.productItems}
                handleUnavailableProducts={handleUnavailableProducts}
            />
        </CheckoutProvider>
    )
}

export default CheckoutContainer
