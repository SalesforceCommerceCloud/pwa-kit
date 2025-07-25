/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useMemo, useEffect, useRef, useCallback} from 'react'
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
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout-container/util/checkout-context'
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

const Payment = ({
    paymentMethodForm,
    billingAddressForm,
    enableUserRegistration,
    setEnableUserRegistration,
    registeredUserChoseGuest = false,
    onPaymentMethodSaved,
    onSavePreferenceChange,
    onPaymentSubmitted,
    selectedPaymentMethod,
    isEditing,
    onSelectedPaymentMethodChange,
    onIsEditingChange
}) => {
    const {formatMessage} = useIntl()
    const {data: basketForTotal} = useCurrentBasket()
    const {currency} = useCurrency()
    const currentBasketQuery = useCurrentBasket()
    const {data: basket} = currentBasketQuery
    const {data: customer, isLoading: isCustomerLoading} = useCurrentCustomer()
    const {isGuest} = useCustomerType()
    const selectedShippingAddress = basket?.shipments && basket?.shipments[0]?.shippingAddress
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

    // Detect new payment instruments that aren't in the customer's saved list
    const newPaymentInstruments = useMemo(() => {
        // Use currentFormPayment if available, otherwise fall back to appliedPayment
        const paymentToCheck = currentFormPayment || appliedPayment

        if (!isGuest && paymentToCheck) {
            // If customer has no saved payment instruments, any new payment is considered new
            if (!customer?.paymentInstruments || customer.paymentInstruments.length === 0) {
                return [paymentToCheck]
            }

            // Check if current payment instrument is not in saved list
            const isNewPayment = !customer.paymentInstruments.some((saved) => {
                // Compare the entire payment instrument structure
                return (
                    saved.paymentCard?.cardType === paymentToCheck.paymentCard?.cardType &&
                    saved.paymentCard?.numberLastDigits ===
                        paymentToCheck.paymentCard?.numberLastDigits &&
                    saved.paymentCard?.holder === paymentToCheck.paymentCard?.holder &&
                    saved.paymentCard?.expirationMonth ===
                        paymentToCheck.paymentCard?.expirationMonth &&
                    saved.paymentCard?.expirationYear === paymentToCheck.paymentCard?.expirationYear
                )
            })

            return isNewPayment ? [paymentToCheck] : []
        }
        return []
    }, [isGuest, customer, appliedPayment, currentFormPayment])

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
            setBillingSameAsShipping(true)
            setShouldSavePaymentMethod(true)
        }
    }

    const isPickupOrder = basket?.shipments[0]?.shippingMethod?.c_storePickupEnabled === true
    const [billingSameAsShipping, setBillingSameAsShipping] = useState(!isPickupOrder)

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

    const onPaymentSubmit = async (formValue, forcedBasketId) => {
        // The form gives us the expiration date as `MM/YY` - so we need to split it into
        // month and year to submit them as individual fields.
        const [expirationMonth, expirationYear] = formValue.expiry.split('/')

        const paymentInstrument = {
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

    const handleRegistrationSuccess = useCallback(
        async (newBasketId) => {
            if (newBasketId) {
                activeBasketIdRef.current = newBasketId
            }
            setShouldSavePaymentMethod(true)
            try {
                const values = paymentMethodForm?.getValues?.()
                const hasEnteredCard = values?.number && values?.holder && values?.expiry
                const hasApplied = (currentBasketQuery?.data?.paymentInstruments?.length || 0) > 0
                if (hasEnteredCard && !hasApplied && newBasketId) {
                    await onPaymentSubmit(values, newBasketId)
                    await currentBasketQuery.refetch()
                }
            } catch (_e) {
                // non-blocking
            }
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
        [paymentMethodForm, currentBasketQuery, onPaymentSubmit, showToast, formatMessage]
    )

    // Auto-select a saved payment instrument for registered customers (run at most once)
    const autoAppliedRef = useRef(false)
    useEffect(() => {
        const autoSelectSavedPayment = async () => {
            if (step !== STEPS.PAYMENT || isCustomerLoading) return
            if (autoAppliedRef.current) return
            // Don't auto-apply when in edit mode - user is manually entering/selecting payment
            if (currentIsEditing) return
            const isRegistered = customer?.isRegistered
            const hasSaved = customer?.paymentInstruments?.length > 0
            const alreadyApplied = (basket?.paymentInstruments?.length || 0) > 0
            // If the shopper is currently typing a new card, skip auto-apply of saved
            const entered = paymentMethodForm?.getValues?.()
            const hasEnteredCard = entered?.number && entered?.holder && entered?.expiry
            if (!isRegistered || !hasSaved || alreadyApplied || hasEnteredCard) return
            autoAppliedRef.current = true
            const preferred =
                customer.paymentInstruments.find((pi) => pi.default === true) ||
                customer.paymentInstruments[0]
            try {
                setIsApplyingSavedPayment(true)
                await addPaymentInstrumentToBasket({
                    parameters: {basketId: activeBasketIdRef.current || basket?.basketId},
                    body: {
                        paymentMethodId: 'CREDIT_CARD',
                        customerPaymentInstrumentId: preferred.paymentInstrumentId
                    }
                })
                // After auto-apply, if we already have a shipping address, submit billing so we can advance
                if (selectedShippingAddress) {
                    await onBillingSubmit()
                    // Ensure basket is refreshed with payment & billing
                    await currentBasketQuery.refetch()
                    // Stay on Payment; place-order button is rendered on Payment step in this flow
                }
                // Ensure basket is refreshed with payment & billing
                await currentBasketQuery.refetch()
            } catch (_e) {
                // Ignore and allow manual selection
                console.error(_e)
            } finally {
                setIsApplyingSavedPayment(false)
            }
        }
        autoSelectSavedPayment()
    }, [step, isCustomerLoading])

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
                    paymentMethodId: 'CREDIT_CARD',
                    customerPaymentInstrumentId: paymentInstrumentId
                }
            })
            await currentBasketQuery.refetch()
            setIsApplyingSavedPayment(false)
            onSelectedPaymentMethodChange?.(paymentInstrumentId)
        }
    }

    const onBillingSubmit = async () => {
        // When billing is same as shipping, skip form validation and use shipping address directly
        let billingAddress
        if (billingSameAsShipping) {
            billingAddress = selectedShippingAddress
        } else {
            const isFormValid = await billingAddressForm.trigger()
            if (!isFormValid) {
                return
            }
            billingAddress = billingAddressForm.getValues()
        }
        // Using destructuring to remove properties from the object...
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {addressId, creationDate, lastModified, preferred, ...address} = billingAddress
        return await updateBillingAddressForBasket({
            body: address,
            parameters: {basketId: activeBasketIdRef.current || basket.basketId}
        })
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
                editing={currentIsEditing || step === STEPS.PAYMENT}
                isLoading={
                    paymentMethodForm.formState.isSubmitting ||
                    billingAddressForm.formState.isSubmitting ||
                    isApplyingSavedPayment ||
                    (isCustomerLoading && !isGuest)
                }
                disabled={appliedPayment == null}
                onEdit={handleEditPayment}
                editLabel={formatMessage({
                    defaultMessage: 'Edit Payment Info',
                    id: 'toggle_card.action.editPaymentInfo'
                })}
            >
                <ToggleCardEdit>
                    {!(customer?.isRegistered && isApplyingSavedPayment && !appliedPayment) ? (
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
                                {isApplyingSavedPayment ? null : (
                                    <PaymentForm
                                        form={paymentMethodForm}
                                        onSubmit={onSubmit}
                                        savedPaymentInstruments={customer.paymentInstruments}
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

                                    {!isPickupOrder && selectedShippingAddress && (
                                        <Checkbox
                                            name="billingSameAsShipping"
                                            isChecked={billingSameAsShipping}
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
                                {isGuest && (
                                    <UserRegistration
                                        enableUserRegistration={enableUserRegistration}
                                        setEnableUserRegistration={onUserRegistrationToggle}
                                        isGuestCheckout={registeredUserChoseGuest}
                                        isDisabled={
                                            // Disable until there is either an applied payment or a valid form
                                            !appliedPayment && !paymentMethodForm.formState.isValid
                                        }
                                        onSavePreferenceChange={onSavePreferenceChange}
                                        onRegistered={handleRegistrationSuccess}
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

                        {isGuest && (
                            <UserRegistration
                                enableUserRegistration={enableUserRegistration}
                                setEnableUserRegistration={setEnableUserRegistration}
                                isGuestCheckout={registeredUserChoseGuest}
                                isDisabled={!appliedPayment && !paymentMethodForm.formState.isValid}
                                onSavePreferenceChange={onSavePreferenceChange}
                                onRegistered={handleRegistrationSuccess}
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
    /** Callback when payment method is successfully saved */
    onPaymentMethodSaved: PropTypes.func,
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
    billingAddressForm: PropTypes.object.isRequired
}

Payment.propTypes = {
    /** Whether user registration is enabled */
    enableUserRegistration: PropTypes.bool,
    /** Callback to set user registration state */
    setEnableUserRegistration: PropTypes.func,
    /** Whether a registered user has chosen guest checkout */
    registeredUserChoseGuest: PropTypes.bool,
    /** Callback when payment method is successfully saved */
    onPaymentMethodSaved: PropTypes.func,
    /** Callback when save preference changes */
    onSavePreferenceChange: PropTypes.func
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

Payment.propTypes = {
    paymentMethodForm: PropTypes.object.isRequired,
    billingAddressForm: PropTypes.object.isRequired
}

export default Payment
