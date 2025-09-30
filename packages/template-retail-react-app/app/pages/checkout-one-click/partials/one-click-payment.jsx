/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useMemo, useEffect, useRef} from 'react'
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
import {useShopperBasketsMutation, useCustomerType} from '@salesforce/commerce-sdk-react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
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

const Payment = ({
    paymentMethodForm,
    billingAddressForm,
    enableUserRegistration,
    setEnableUserRegistration,
    registeredUserChoseGuest = false,
    onPaymentMethodSaved,
    onSavePreferenceChange
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
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
        appliedPayment?.customerPaymentInstrumentId || 'cc'
    )
    const [isEditing, setIsEditing] = useState(false)

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

    const onPaymentSubmit = async (formValue) => {
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

        return addPaymentInstrumentToBasket({
            parameters: {basketId: basket?.basketId},
            body: paymentInstrument
        })
    }

    // Auto-select a saved payment instrument for registered customers (run at most once)
    const autoAppliedRef = useRef(false)
    useEffect(() => {
        const autoSelectSavedPayment = async () => {
            if (step !== STEPS.PAYMENT || isCustomerLoading) return
            if (autoAppliedRef.current) return
            const isRegistered = customer?.isRegistered
            const hasSaved = customer?.paymentInstruments?.length > 0
            const alreadyApplied = (basket?.paymentInstruments?.length || 0) > 0
            if (!isRegistered || !hasSaved || alreadyApplied) return
            autoAppliedRef.current = true
            const preferred =
                customer.paymentInstruments.find((pi) => pi.preferred === true) ||
                customer.paymentInstruments[0]
            try {
                setIsApplyingSavedPayment(true)
                await addPaymentInstrumentToBasket({
                    parameters: {basketId: basket?.basketId},
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
        if (paymentInstrumentId === 'cc') {
            setSelectedPaymentMethod('cc')
        } else {
            setIsApplyingSavedPayment(true)
            await addPaymentInstrumentToBasket({
                parameters: {basketId: basket?.basketId},
                body: {
                    paymentMethodId: 'CREDIT_CARD',
                    customerPaymentInstrumentId: paymentInstrumentId
                }
            })
            await currentBasketQuery.refetch()
            setIsApplyingSavedPayment(false)
            setSelectedPaymentMethod(paymentInstrumentId)
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
            parameters: {basketId: basket.basketId}
        })
    }

    const onPaymentRemoval = async () => {
        try {
            await removePaymentInstrumentFromBasket({
                parameters: {
                    basketId: basket.basketId,
                    paymentInstrumentId: appliedPayment.paymentInstrumentId
                }
            })
            setSelectedPaymentMethod('cc')
        } catch (e) {
            showError()
            throw e
        }
    }

    const onSubmit = paymentMethodForm.handleSubmit(async (paymentFormValues) => {
        try {
            if (!appliedPayment) {
                await onPaymentSubmit(paymentFormValues)
            }

            // Update billing address
            await onBillingSubmit()
        } catch (error) {
            showError()
        } finally {
            setIsEditing(false)
        }
    })

    const handleEditPayment = async () => {
        if (appliedPayment) {
            // Pre-select the applied saved payment in the radio list if present
            const savedId = appliedPayment?.customerPaymentInstrumentId
            if (savedId) {
                onPaymentMethodChange(savedId)
            } else if (customer?.paymentInstruments?.length > 0) {
                // Default to first saved method if any; otherwise leave current selection
                onPaymentMethodChange(customer.paymentInstruments[0].paymentInstrumentId)
            }
            try {
                await onPaymentRemoval()
                // Ensure basket reflects removal before rendering form
                await currentBasketQuery.refetch()
            } catch (_e) {
                // Removal failed: inform user and do NOT enter edit mode
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
        setIsEditing(true)
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
                editing={isEditing || step === STEPS.PAYMENT}
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
                                        selectedPaymentMethod={selectedPaymentMethod}
                                    >
                                        {/* Show for returning users (registered) while editing/adding a new card */}
                                        {!isGuest && (
                                            <SavePaymentMethod
                                                paymentInstrument={currentFormPayment}
                                                onSaved={handleSavePreferenceChange}
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
                                        setEnableUserRegistration={setEnableUserRegistration}
                                        isGuestCheckout={registeredUserChoseGuest}
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

                        {/* Guest only: offer save for future use */}
                        {isGuest && newPaymentInstruments.length > 0 && (
                            <SavePaymentMethod
                                paymentInstrument={newPaymentInstruments[0]}
                                onSaved={onPaymentMethodSaved}
                            />
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
