/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useRef, useState} from 'react'
import {
    Alert,
    AlertIcon,
    Box,
    Button,
    Container,
    Grid,
    GridItem,
    Stack,
    Portal,
    Spinner,
    Center
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {FormattedMessage, useIntl} from 'react-intl'
import {useForm} from 'react-hook-form'
import {
    useShopperBasketsV2Mutation as useShopperBasketsMutation,
    useShopperOrdersMutation,
    useShopperCustomersMutation,
    ShopperBasketsMutations,
    ShopperOrdersMutations
} from '@salesforce/commerce-sdk-react'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {
    useCheckout,
    CheckoutProvider,
    getCheckoutGuestChoiceFromStorage,
    setCheckoutGuestChoiceInStorage
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

const CheckoutOneClick = () => {
    const {formatMessage} = useIntl()
    const navigate = useNavigation()
    const {step, STEPS} = useCheckout()
    const showToast = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [enableUserRegistration, setEnableUserRegistration] = useState(false)
    const [registeredUserChoseGuest, setRegisteredUserChoseGuest] = useState(
        getCheckoutGuestChoiceFromStorage
    )
    const [shouldSavePaymentMethod, setShouldSavePaymentMethod] = useState(false)
    const [isOtpLoading, setIsOtpLoading] = useState(false)
    const [isPlacingOrder, setIsPlacingOrder] = useState(false)

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

    const billingSameAsShippingRef = useRef(billingSameAsShipping)
    useEffect(() => {
        billingSameAsShippingRef.current = billingSameAsShipping
    }, [billingSameAsShipping])

    const [isShipmentCleanupComplete, setIsShipmentCleanupComplete] = useState(false)
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
    const {mutateAsync: removePaymentInstrumentFromBasket} = useShopperBasketsMutation(
        ShopperBasketsMutations.RemovePaymentInstrumentFromBasket
    )
    const {mutateAsync: updateBillingAddressForBasket} = useShopperBasketsMutation(
        ShopperBasketsMutations.UpdateBillingAddressForBasket
    )
    const {mutateAsync: createOrder} = useShopperOrdersMutation(ShopperOrdersMutations.CreateOrder)

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
        if (!basket?.basketId) {
            return
        }
        if (basket?.shipments?.length <= 1) {
            setIsShipmentCleanupComplete(true)
            return
        }

        let cancelled = false
        setIsShipmentCleanupComplete(false)
        removeEmptyShipments(basket).then(() => {
            if (!cancelled) {
                setIsShipmentCleanupComplete(true)
            }
        })
        return () => {
            cancelled = true
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
        mode: 'onTouched',
        reValidateMode: 'onChange',
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

    const onBillingSubmit = async (billingFormSnapshot) => {
        let billingAddress
        // Read from ref to avoid stale closures during async onPlaceOrder flow
        const isSameAsShipping = billingSameAsShippingRef.current
        if (isSameAsShipping && selectedShippingAddress) {
            billingAddress = selectedShippingAddress
            // Validate that shipping address has required address fields
            if (!billingAddress?.address1) {
                showError(
                    formatMessage({
                        id: 'checkout.error.billing_address_required',
                        defaultMessage: 'Please enter a billing address.'
                    })
                )
                return
            }
        } else {
            // If a pre-captured snapshot was provided, restore it to the form.
            if (billingFormSnapshot) {
                billingAddressForm.reset(billingFormSnapshot, {keepDirty: true})
            }

            // Validate all required address fields (excluding phone for billing)
            const fieldsToValidate = [
                'address1',
                'firstName',
                'lastName',
                'city',
                'stateCode',
                'postalCode',
                'countryCode'
            ]

            // First, mark all fields as touched so errors will be displayed when validation runs
            // This must happen BEFORE trigger() so errors show immediately
            fieldsToValidate.forEach((field) => {
                const currentValue = billingAddressForm.getValues(field) || ''
                billingAddressForm.setValue(field, currentValue, {
                    shouldValidate: false,
                    shouldTouch: true
                })
            })

            // Now trigger validation - errors will show because fields are already touched
            const isFormValid = await billingAddressForm.trigger(fieldsToValidate)

            if (!isFormValid) {
                // Payment section should already be open from onPlaceOrder
                // Focus on the first name field (first field in the form)
                setTimeout(() => {
                    billingAddressForm.setFocus('firstName')
                }, 100)
                return
            }
            billingAddress = billingAddressForm.getValues()

            // Double-check that address is present
            if (!billingAddress?.address1) {
                showError(
                    formatMessage({
                        id: 'checkout.error.billing_address_required',
                        defaultMessage: 'Please enter a billing address.'
                    })
                )
                setIsEditingPayment(true)
                return
            }
        }

        const latestBasketId = currentBasketQuery.data?.basketId || basket.basketId
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {addressId, creationDate, lastModified, preferred, ...address} = billingAddress
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
            }

            setCheckoutGuestChoiceInStorage(false)
            navigate(`/checkout/confirmation/${order.orderNo}`)
        } catch (error) {
            const message = formatMessage({
                id: 'checkout.message.generic_error',
                defaultMessage: 'An unexpected error occurred during checkout.'
            })
            showError(message)
            setIsPlacingOrder(false)
        } finally {
            setIsLoading(false)
        }
    }

    const onPlaceOrder = async () => {
        // Show overlay immediately to prevent double-clicking
        setIsPlacingOrder(true)
        try {
            // Check if we have form values (new card entered)
            const paymentFormValues = paymentMethodForm.getValues()
            const hasFormValues = paymentFormValues && paymentFormValues.expiry
            // Check if user selected to enter a new card (vs using a saved payment)
            const isEnteringNewCard = selectedPaymentMethod === 'cc' || !selectedPaymentMethod

            // If using a new card (either no applied payment OR user selected 'cc' and entered form values), validate fields
            const isUsingNewCard = !appliedPayment || (isEnteringNewCard && hasFormValues)
            if (isUsingNewCard) {
                const isValid = await paymentMethodForm.trigger()
                if (!isValid) {
                    // Keep payment section open and show field errors
                    setIsEditingPayment(true)
                    setIsPlacingOrder(false)
                    return
                }
            }

            // Snapshot billing form values BEFORE any payment mutations to preserve custom billing address during auth transitions
            const billingFormSnapshot = !billingSameAsShippingRef.current
                ? {...billingAddressForm.getValues()}
                : null

            // PCI: Cardholder data (CHD) - use only for single submission to API. Do not log, persist, or expose.
            let fullCardDetails = null
            if (hasFormValues) {
                const [expirationMonth, expirationYear] = paymentFormValues.expiry.split('/')
                fullCardDetails = {
                    holder: paymentFormValues.holder,
                    number: paymentFormValues.number,
                    cardType: getPaymentInstrumentCardType(paymentFormValues.cardType),
                    expirationMonth: parseInt(expirationMonth),
                    expirationYear: parseInt(`20${expirationYear}`)
                }
            }
            // For saved payments (appliedPayment), we don't need fullCardDetails - they're already saved

            // Handle payment submission
            if (isEnteringNewCard && hasFormValues) {
                // User entered a new card - need to replace existing payment if one exists
                if (appliedPayment) {
                    // Remove the existing payment before adding the new one
                    try {
                        await removePaymentInstrumentFromBasket({
                            parameters: {
                                basketId: basket?.basketId,
                                paymentInstrumentId: appliedPayment.paymentInstrumentId
                            }
                        })
                        // Refetch basket to ensure we have the latest state
                        await currentBasketQuery.refetch()
                    } catch (error) {
                        showError(
                            formatMessage({
                                defaultMessage:
                                    'Could not remove the applied payment. Please try again or use the current payment to place your order.',
                                id: 'checkout_payment.error.cannot_remove_applied_payment'
                            })
                        )
                        setIsPlacingOrder(false)
                        return
                    }
                }
                // Add the new payment instrument
                await onPaymentSubmit(paymentFormValues)
            } else if (!appliedPayment) {
                // No payment applied yet - this shouldn't happen if validation passed,
                // but handle it as a safety check
                if (hasFormValues) {
                    await onPaymentSubmit(paymentFormValues)
                }
            }

            // Ensure payment section is open before validating billing address
            // This ensures the billing form is rendered and visible when we validate
            setIsEditingPayment(true)

            // Wait for the payment section to open and billing form to render
            await new Promise((resolve) => setTimeout(resolve, 0))

            // If successful `onBillingSubmit` returns the updated basket. If the form was invalid on
            // submit, `undefined` is returned.
            const updatedBasket = await onBillingSubmit(billingFormSnapshot)

            if (updatedBasket) {
                await submitOrder(fullCardDetails)
                fullCardDetails = null // Clear reference to CHD after use (PCI: minimize retention)
            } else {
                // Billing validation failed, clear overlay
                setIsPlacingOrder(false)
            }
        } catch (error) {
            showError()
            setIsPlacingOrder(false)
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
                                <ShippingAddress
                                    enableUserRegistration={enableUserRegistration}
                                    isShipmentCleanupComplete={isShipmentCleanupComplete}
                                />
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
                                onOtpLoadingChange={setIsOtpLoading}
                                onBillingSubmit={onBillingSubmit}
                            />

                            {step >= STEPS.PAYMENT && (
                                <Box display="flex" bottom="0" px={4} pt={2} pb={4}>
                                    <Container variant="form">
                                        <Button
                                            w="full"
                                            onClick={onPlaceOrder}
                                            isLoading={isLoading}
                                            disabled={
                                                isOtpLoading ||
                                                isPlacingOrder ||
                                                !isShipmentCleanupComplete
                                            }
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

            {/* Loading overlay when Place Order is clicked */}
            {isPlacingOrder && (
                <Portal>
                    <Box
                        position="fixed"
                        top="0"
                        left="0"
                        right="0"
                        bottom="0"
                        bg="blackAlpha.600"
                        zIndex={9999}
                        data-testid="sf-place-order-loading-overlay"
                    >
                        <Center h="100%">
                            <Spinner size="xl" color="white" thickness="4px" />
                        </Center>
                    </Box>
                </Portal>
            )}
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

    // Track whether the checkout has rendered at least once to persist data during auth transitions
    const hasRenderedCheckoutRef = useRef(false)
    const canRender = !!customer?.customerId && !!basket?.basketId
    if (canRender) {
        hasRenderedCheckoutRef.current = true
    }

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

    // Show skeleton only on the initial load
    if (!canRender && !hasRenderedCheckoutRef.current) {
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
