/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useEffect, useRef, useCallback} from 'react'
import PropTypes from 'prop-types'
import {defineMessage, FormattedMessage, useIntl} from 'react-intl'
import {
    Box,
    Checkbox,
    Heading,
    Stack,
    Text,
    Divider
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {
    useShopperBasketsV2Mutation as useShopperBasketsMutation,
    useCustomerType
} from '@salesforce/commerce-sdk-react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useCheckoutAutoSelect} from '@salesforce/retail-react-app/app/hooks/use-checkout-auto-select'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context'
import {
    getPaymentInstrumentCardType,
    getMaskCreditCardNumber,
    getCreditCardIcon
} from '@salesforce/retail-react-app/app/utils/cc-utils'
import {
    ToggleCard,
    ToggleCardEdit,
    ToggleCardSummary
} from '@salesforce/retail-react-app/app/components/toggle-card'
import PaymentForm from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-payment-form'
import ShippingAddressSelection from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-address-selection'
import UserRegistration from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-user-registration'
import SavePaymentMethod from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-save-payment-method'
import AddressDisplay from '@salesforce/retail-react-app/app/components/address-display'
import {PromoCode, usePromoCode} from '@salesforce/retail-react-app/app/components/promo-code'
import {API_ERROR_MESSAGE} from '@salesforce/retail-react-app/app/constants'
import {FormattedNumber} from 'react-intl'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks'
import {isPickupShipment} from '@salesforce/retail-react-app/app/utils/shipment-utils'

const Payment = ({
    paymentMethodForm,
    billingAddressForm,
    enableUserRegistration,
    setEnableUserRegistration,
    registeredUserChoseGuest = false,
    onSavePreferenceChange,
    onPaymentSubmitted,
    selectedPaymentMethod,
    isEditing,
    onSelectedPaymentMethodChange,
    onIsEditingChange,
    billingSameAsShipping,
    setBillingSameAsShipping,
    onOtpLoadingChange,
    onBillingSubmit
}) => {
    const {formatMessage} = useIntl()
    const {data: basketForTotal} = useCurrentBasket()
    const {currency} = useCurrency()
    const currentBasketQuery = useCurrentBasket()
    const {data: basket} = currentBasketQuery
    const {data: customer, isLoading: isCustomerLoading} = useCurrentCustomer()
    const {isGuest} = useCustomerType()
    const selectedBillingAddress = basket?.billingAddress
    const appliedPayment = basket?.paymentInstruments && basket?.paymentInstruments[0]

    // Track current form values to detect new payment instruments in real-time
    const [currentFormPayment, setCurrentFormPayment] = useState(null)

    // Track whether user wants to save the payment method
    const [shouldSavePaymentMethod, setShouldSavePaymentMethod] = useState(false)
    const [isApplyingSavedPayment, setIsApplyingSavedPayment] = useState(false)

    const activeBasketIdRef = useRef(null)

    // Use props for parent-managed state with fallback defaults
    const currentSelectedPaymentMethod =
        selectedPaymentMethod ?? (appliedPayment?.customerPaymentInstrumentId || 'cc')
    const currentIsEditing = isEditing ?? false

    // Callback when user changes save preference
    const handleSavePreferenceChange = (shouldSave) => {
        setShouldSavePaymentMethod(shouldSave)
    }

    // Function to update current form payment data
    const updateCurrentFormPayment = (formData) => {
        if (formData?.number && formData?.holder && formData?.expiry) {
            const [expirationMonth, expirationYear] = formData.expiry.split('/')
            const paymentData = {
                paymentMethodId: 'CREDIT_CARD',
                paymentCard: {
                    holder: formData.holder,
                    numberLastDigits: formData.number.slice(-4),
                    cardType: formData.cardType,
                    expirationMonth: parseInt(expirationMonth),
                    expirationYear: parseInt(`20${expirationYear}`)
                }
            }
            setCurrentFormPayment(paymentData)
        } else {
            setCurrentFormPayment(null)
        }
    }

    // Watch form values in real-time to detect new payment instruments
    useEffect(() => {
        if (paymentMethodForm && !isGuest) {
            const subscription = paymentMethodForm.watch((value) => {
                updateCurrentFormPayment(value)
            })

            return () => subscription.unsubscribe()
        }
    }, [paymentMethodForm, isGuest])

    // Notify parent when save preference changes
    useEffect(() => {
        if (onSavePreferenceChange) {
            onSavePreferenceChange(shouldSavePaymentMethod)
        }
    }, [shouldSavePaymentMethod, onSavePreferenceChange])

    // Handles user registration checkbox toggle (OTP handled by UserRegistration)
    const onUserRegistrationToggle = async (checked) => {
        setEnableUserRegistration(checked)
        if (checked && isGuest) {
            // Default preferences for newly registering guest
            setShouldSavePaymentMethod(true)
        }
    }

    // Determine shipment composition (pickup-only vs mixed/delivery), considering only shipments with items
    const shipments = basket?.shipments || []
    const items = basket?.productItems || []
    const shipmentsWithItems = shipments.filter((s) =>
        items.some((i) => i.shipmentId === s.shipmentId)
    )
    const hasPickupShipments = shipmentsWithItems.some((s) => isPickupShipment(s))
    const hasDeliveryShipments = shipmentsWithItems.some((s) => !isPickupShipment(s))
    const isPickupOnly = hasPickupShipments && !hasDeliveryShipments
    const effectiveBillingSameAsShipping = isPickupOnly ? false : billingSameAsShipping

    // For billing=shipping, align with legacy checkout. use the first delivery shipment's address
    const selectedShippingAddress = React.useMemo(() => {
        if (!shipmentsWithItems.length || isPickupOnly) return null
        const deliveryShipment = shipmentsWithItems.find((s) => !isPickupShipment(s))
        return deliveryShipment?.shippingAddress || null
    }, [shipmentsWithItems, isPickupOnly])

    const {mutateAsync: addPaymentInstrumentToBasket} = useShopperBasketsMutation(
        'addPaymentInstrumentToBasket'
    )
    const {mutateAsync: updateBillingAddressForBasket} = useShopperBasketsMutation(
        'updateBillingAddressForBasket'
    )
    const {mutateAsync: removePaymentInstrumentFromBasket} = useShopperBasketsMutation(
        'removePaymentInstrumentFromBasket'
    )

    const showToast = useToast()
    const showError = (message) => {
        showToast({
            title: message || formatMessage(API_ERROR_MESSAGE),
            status: 'error'
        })
    }

    const {step, STEPS, goToStep} = useCheckout()

    // Using destructuring to remove properties from the object...
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {removePromoCode, ...promoCodeProps} = usePromoCode()

    // Ensure saved payment radio is selected when an applied payment exists but lacks a customerPaymentInstrumentId.
    // We match by last 4 and card type to find the corresponding saved instrument and select it.
    useEffect(() => {
        if (step !== STEPS.PAYMENT) return
        if (currentIsEditing) return
        if (!appliedPayment) return
        // If already selected to a saved instrument, nothing to do
        if (currentSelectedPaymentMethod && currentSelectedPaymentMethod !== 'cc') return
        // If the applied payment references a saved instrument id, nothing to do
        if (appliedPayment.customerPaymentInstrumentId) return
        const last4 = appliedPayment?.paymentCard?.numberLastDigits
        const type = appliedPayment?.paymentCard?.cardType
        if (!last4 || !type) return
        const match = customer?.paymentInstruments?.find(
            (pi) =>
                pi?.paymentCard?.numberLastDigits === last4 &&
                String(pi?.paymentCard?.cardType || '').toLowerCase() ===
                    String(type || '').toLowerCase()
        )
        if (match?.paymentInstrumentId) {
            onSelectedPaymentMethodChange?.(match.paymentInstrumentId)
        }
    }, [
        step,
        STEPS.PAYMENT,
        currentIsEditing,
        appliedPayment,
        currentSelectedPaymentMethod,
        customer?.paymentInstruments,
        onSelectedPaymentMethodChange
    ])

    const onPaymentSubmit = async (formValue, forcedBasketId) => {
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

        // Notify parent component with full card details (before masking)
        if (onPaymentSubmitted) {
            onPaymentSubmitted(formValue)
        }

        return addPaymentInstrumentToBasket({
            parameters: {basketId: forcedBasketId || activeBasketIdRef.current || basket?.basketId},
            body: paymentInstrument
        })
    }

    const [showRegistrationNotice, setShowRegistrationNotice] = useState(false)
    const handleRegistrationSuccess = useCallback(
        async (newBasketId) => {
            if (newBasketId) {
                activeBasketIdRef.current = newBasketId
            }
            setShowRegistrationNotice(true)
            setShouldSavePaymentMethod(true)
            showToast({
                variant: 'subtle',
                title: formatMessage({
                    defaultMessage: 'You are now signed in.',
                    id: 'auth_modal.description.now_signed_in_simple'
                }),
                status: 'success',
                position: 'top-right',
                isClosable: true
            })
        },
        [showToast, formatMessage]
    )

    // Auto-select a saved payment instrument for registered customers (run at most once)
    const {isLoading: isAutoSelectLoading} = useCheckoutAutoSelect({
        currentStep: step,
        targetStep: STEPS.PAYMENT,
        isCustomerRegistered: customer?.isRegistered,
        items: customer?.paymentInstruments,
        getPreferredItem: (instruments) =>
            instruments.find((pi) => pi.default === true) || instruments[0],
        shouldSkip: () => {
            const entered = paymentMethodForm?.getValues?.()
            const hasEnteredCard = entered?.number && entered?.holder && entered?.expiry
            return currentIsEditing || !!hasEnteredCard
        },
        isAlreadyApplied: () => Boolean(appliedPayment),
        applyItem: async (paymentInstrument) => {
            await addPaymentInstrumentToBasket({
                parameters: {
                    basketId: activeBasketIdRef.current || basket?.basketId
                },
                body: {
                    amount: basket?.orderTotal || 0,
                    paymentMethodId: 'CREDIT_CARD',
                    customerPaymentInstrumentId: paymentInstrument.paymentInstrumentId
                }
            })

            if (isPickupOnly && paymentInstrument.billingAddress) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const {addressId, creationDate, lastModified, preferred, ...address} =
                    paymentInstrument.billingAddress
                await updateBillingAddressForBasket({
                    body: address,
                    parameters: {
                        basketId: activeBasketIdRef.current || basket.basketId
                    }
                })
            } else if (selectedShippingAddress) {
                await onBillingSubmit()
            }
        },
        onSuccess: async () => await currentBasketQuery.refetch(),
        onError: (error) => {
            console.error('Failed to auto-select payment:', error)
        },
        enabled: !isCustomerLoading
    })

    const effectiveIsApplyingSavedPayment = isAutoSelectLoading || isApplyingSavedPayment

    const onPaymentMethodChange = async (paymentInstrumentId) => {
        // Only try to remove payment if there's actually an applied payment
        if (appliedPayment) {
            try {
                await onPaymentRemoval()
            } catch (_e) {
                // Removal failed: inform user and do NOT proceed with payment change
                showError(
                    formatMessage({
                        defaultMessage:
                            'Could not remove the applied payment. Please try again or use the current payment to place your order.',
                        id: 'checkout_payment.error.cannot_remove_applied_payment'
                    })
                )
                return
            }
        }

        if (paymentInstrumentId === 'cc') {
            onSelectedPaymentMethodChange?.('cc')
        } else {
            setIsApplyingSavedPayment(true)
            await addPaymentInstrumentToBasket({
                parameters: {basketId: activeBasketIdRef.current || basket?.basketId},
                body: {
                    amount: basket?.orderTotal || 0,
                    paymentMethodId: 'CREDIT_CARD',
                    customerPaymentInstrumentId: paymentInstrumentId
                }
            })
            await currentBasketQuery.refetch()
            if (isPickupOnly) {
                try {
                    const saved = customer?.paymentInstruments?.find(
                        (pi) => pi.paymentInstrumentId === paymentInstrumentId
                    )
                    const addr = saved?.billingAddress
                    if (addr) {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const {addressId, creationDate, lastModified, preferred, ...address} = addr
                        await updateBillingAddressForBasket({
                            body: address,
                            parameters: {basketId: activeBasketIdRef.current || basket.basketId}
                        })
                        await currentBasketQuery.refetch()
                    }
                } catch (_e) {
                    // Fail silently
                }
            }
            setIsApplyingSavedPayment(false)
            onSelectedPaymentMethodChange?.(paymentInstrumentId)
        }
    }

    const onPaymentRemoval = async () => {
        try {
            await removePaymentInstrumentFromBasket({
                parameters: {
                    basketId: activeBasketIdRef.current || basket.basketId,
                    paymentInstrumentId: appliedPayment.paymentInstrumentId
                }
            })
            onSelectedPaymentMethodChange?.('cc')
        } catch (e) {
            showError()
            throw e
        }
    }

    const onSubmit = paymentMethodForm.handleSubmit(async (paymentFormValues) => {
        try {
            if (!appliedPayment) {
                await onPaymentSubmit(paymentFormValues, activeBasketIdRef.current)
            }

            // Update billing address
            await onBillingSubmit()
        } catch (error) {
            showError()
        } finally {
            onIsEditingChange?.(false)
        }
    })

    const handleEditPayment = async () => {
        // Prefer the customer's default saved instrument in edit mode. If none,
        // fall back to the applied payment, then the first saved, then 'cc'.
        const defaultSaved = customer?.paymentInstruments?.find((pi) => pi.default === true)
        const preferredId =
            defaultSaved?.paymentInstrumentId ||
            appliedPayment?.customerPaymentInstrumentId ||
            customer?.paymentInstruments?.[0]?.paymentInstrumentId ||
            'cc'
        onSelectedPaymentMethodChange?.(preferredId)
        onIsEditingChange?.(true)
        goToStep(STEPS.PAYMENT)
    }

    const billingAddressAriaLabel = defineMessage({
        defaultMessage: 'Billing Address Form',
        id: 'checkout_payment.label.billing_address_form'
    })

    try {
        return (
            <ToggleCard
                id="step-3"
                data-testid="payment-component"
                title={formatMessage({
                    defaultMessage: 'Payment',
                    id: 'checkout_payment.title.payment'
                })}
                editing={
                    currentIsEditing ||
                    (step === STEPS.PAYMENT &&
                        (!appliedPayment || (isPickupOnly && !selectedBillingAddress?.address1)))
                }
                isLoading={
                    paymentMethodForm.formState.isSubmitting ||
                    billingAddressForm.formState.isSubmitting ||
                    effectiveIsApplyingSavedPayment ||
                    (isCustomerLoading && !isGuest)
                }
                disabled={appliedPayment == null}
                onEdit={handleEditPayment}
                editLabel={formatMessage({
                    defaultMessage: 'Change',
                    id: 'toggle_card.action.changePaymentInfo'
                })}
            >
                <ToggleCardEdit>
                    {!(
                        customer?.isRegistered &&
                        effectiveIsApplyingSavedPayment &&
                        !appliedPayment
                    ) ? (
                        <>
                            <Box mt={-2} mb={4}>
                                <Stack direction="row" justify="space-between" align="center">
                                    <PromoCode {...promoCodeProps} itemProps={{border: 'none'}} />
                                    <Text fontWeight="bold">
                                        <FormattedNumber
                                            value={basketForTotal?.orderTotal}
                                            style="currency"
                                            currency={currency}
                                        />
                                    </Text>
                                </Stack>
                            </Box>

                            <Stack spacing={6}>
                                {effectiveIsApplyingSavedPayment ? null : (
                                    <PaymentForm
                                        form={paymentMethodForm}
                                        onSubmit={onSubmit}
                                        savedPaymentInstruments={customer?.paymentInstruments || []}
                                        onPaymentMethodChange={onPaymentMethodChange}
                                        selectedPaymentMethod={currentSelectedPaymentMethod}
                                    >
                                        {/* Show for returning users (registered) while editing/adding a new card */}
                                        {!isGuest && (
                                            <SavePaymentMethod
                                                paymentInstrument={currentFormPayment}
                                                onSaved={handleSavePreferenceChange}
                                                checked={shouldSavePaymentMethod}
                                            />
                                        )}
                                    </PaymentForm>
                                )}

                                <Divider borderColor="gray.100" />

                                <Stack spacing={2}>
                                    <Heading as="h3" fontSize="md">
                                        <FormattedMessage
                                            defaultMessage="Billing Address"
                                            id="checkout_payment.heading.billing_address"
                                        />
                                    </Heading>

                                    {!isPickupOnly && selectedShippingAddress && (
                                        <Checkbox
                                            name="billingSameAsShipping"
                                            isChecked={effectiveBillingSameAsShipping}
                                            onChange={(e) =>
                                                setBillingSameAsShipping(e.target.checked)
                                            }
                                        >
                                            <Text fontSize="sm" color="gray.700">
                                                <FormattedMessage
                                                    defaultMessage="Same as shipping address"
                                                    id="checkout_payment.label.same_as_shipping"
                                                />
                                            </Text>
                                        </Checkbox>
                                    )}

                                    {effectiveBillingSameAsShipping && selectedShippingAddress && (
                                        <Box pl={7}>
                                            <AddressDisplay address={selectedShippingAddress} />
                                        </Box>
                                    )}
                                </Stack>

                                {!effectiveBillingSameAsShipping && (
                                    <ShippingAddressSelection
                                        form={billingAddressForm}
                                        selectedAddress={selectedBillingAddress}
                                        formTitleAriaLabel={billingAddressAriaLabel}
                                        hideSubmitButton
                                        isBillingAddress
                                    />
                                )}
                                {(isGuest || showRegistrationNotice) &&
                                    !registeredUserChoseGuest && (
                                        <UserRegistration
                                            enableUserRegistration={enableUserRegistration}
                                            setEnableUserRegistration={onUserRegistrationToggle}
                                            onLoadingChange={onOtpLoadingChange}
                                            isGuestCheckout={registeredUserChoseGuest}
                                            isDisabled={
                                                !(
                                                    appliedPayment ||
                                                    paymentMethodForm.formState.isValid ||
                                                    (isPickupOnly &&
                                                        billingAddressForm.formState.isValid)
                                                ) ||
                                                (!effectiveBillingSameAsShipping &&
                                                    !billingAddressForm.formState.isValid)
                                            }
                                            onSavePreferenceChange={onSavePreferenceChange}
                                            onRegistered={handleRegistrationSuccess}
                                            showNotice={showRegistrationNotice}
                                        />
                                    )}
                            </Stack>
                        </>
                    ) : null}
                </ToggleCardEdit>

                <ToggleCardSummary>
                    <Stack spacing={6}>
                        {appliedPayment && (
                            <Stack spacing={3}>
                                <Stack direction="row" justify="space-between" align="center">
                                    <Heading as="h3" fontSize="md">
                                        <FormattedMessage
                                            defaultMessage="Credit Card"
                                            id="checkout_payment.heading.credit_card"
                                        />
                                    </Heading>
                                    <Text fontWeight="bold">
                                        <FormattedNumber
                                            value={basketForTotal?.orderTotal}
                                            style="currency"
                                            currency={currency}
                                        />
                                    </Text>
                                </Stack>
                                <PaymentCardSummary payment={appliedPayment} />
                            </Stack>
                        )}

                        <Divider borderColor="gray.100" />

                        {selectedBillingAddress && !effectiveBillingSameAsShipping && (
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

                        {(isGuest || showRegistrationNotice) && !registeredUserChoseGuest && (
                            <UserRegistration
                                enableUserRegistration={enableUserRegistration}
                                setEnableUserRegistration={setEnableUserRegistration}
                                onLoadingChange={onOtpLoadingChange}
                                isGuestCheckout={registeredUserChoseGuest}
                                isDisabled={
                                    (!appliedPayment && !paymentMethodForm.formState.isValid) ||
                                    (!effectiveBillingSameAsShipping &&
                                        !billingAddressForm.formState.isValid)
                                }
                                onSavePreferenceChange={onSavePreferenceChange}
                                onRegistered={handleRegistrationSuccess}
                                showNotice={showRegistrationNotice}
                            />
                        )}
                    </Stack>
                </ToggleCardSummary>
            </ToggleCard>
        )
    } catch (error) {
        console.error('🔍 Debug - Payment component render error:', error)
        return <div>Error rendering payment component: {error.message}</div>
    }
}

Payment.propTypes = {
    /** Whether user registration is enabled */
    enableUserRegistration: PropTypes.bool,
    /** Callback to set user registration state */
    setEnableUserRegistration: PropTypes.func,
    /** Whether a registered user has chosen guest checkout */
    registeredUserChoseGuest: PropTypes.bool,
    /** Callback when save preference changes */
    onSavePreferenceChange: PropTypes.func,
    /** Callback when payment is submitted with full card details */
    onPaymentSubmitted: PropTypes.func,
    /** Selected payment method from parent */
    selectedPaymentMethod: PropTypes.string,
    /** Editing state from parent */
    isEditing: PropTypes.bool,
    /** Callback when selected payment method changes */
    onSelectedPaymentMethodChange: PropTypes.func,
    /** Callback when editing state changes */
    onIsEditingChange: PropTypes.func,
    /** Payment method form */
    paymentMethodForm: PropTypes.object.isRequired,
    /** Billing address form */
    billingAddressForm: PropTypes.object.isRequired,
    /** Whether billing address is same as shipping */
    billingSameAsShipping: PropTypes.bool.isRequired,
    /** Callback to set billing same as shipping state */
    setBillingSameAsShipping: PropTypes.func.isRequired,
    /** Callback when OTP loading state changes */
    onOtpLoadingChange: PropTypes.func,
    /** Callback to submit billing address */
    onBillingSubmit: PropTypes.func.isRequired
}

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

export default Payment
