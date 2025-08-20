/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, { useState, useMemo, useEffect } from 'react'
import PropTypes from 'prop-types'
import {defineMessage, FormattedMessage, useIntl} from 'react-intl'
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
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {useShopperBasketsMutation, useCustomerType} from '@salesforce/commerce-sdk-react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import { useCurrentCustomer } from '@salesforce/retail-react-app/app/hooks/use-current-customer'
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

const Payment = ({
    paymentMethodForm,
    billingAddressForm,
    enableUserRegistration,
    setEnableUserRegistration,
    registeredUserChoseGuest = false,
    onPaymentMethodSaved
}) => {
    console.log('🔍 Debug - Payment component props:', {
        onPaymentMethodSaved: !!onPaymentMethodSaved,
        registeredUserChoseGuest
    })
    const {formatMessage} = useIntl()
    const { data: basket } = useCurrentBasket()
    const { data: customer } = useCurrentCustomer()
    const {isGuest} = useCustomerType()
    const selectedShippingAddress = basket?.shipments && basket?.shipments[0]?.shippingAddress
    const selectedBillingAddress = basket?.billingAddress
    const appliedPayment = basket?.paymentInstruments && basket?.paymentInstruments[0]

    // Track current form values to detect new payment instruments in real-time
    const [currentFormPayment, setCurrentFormPayment] = useState(null)

    console.log('🔍 Debug - Hooks data:', {
        hasBasket: !!basket,
        hasCustomer: !!customer,
        customerId: customer?.customerId,
        customerPaymentInstruments: customer?.paymentInstruments?.length || 0,
        isGuest,
        hasAppliedPayment: !!appliedPayment,
        hasCurrentFormPayment: !!currentFormPayment
    })

    // Function to update current form payment data
    const updateCurrentFormPayment = (formData) => {
        console.log('🔍 Debug - updateCurrentFormPayment called with:', formData)

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
            console.log('🔍 Debug - Form payment updated:', paymentData)
        } else {
            console.log('🔍 Debug - Form payment cleared - missing fields:', {
                hasNumber: !!formData?.number,
                hasHolder: !!formData?.holder,
                hasExpiry: !!formData?.expiry,
                numberLength: formData?.number?.length,
                holderLength: formData?.holder?.length,
                expiryLength: formData?.expiry?.length
            })
            setCurrentFormPayment(null)
        }
    }

    // Detect new payment instruments that aren't in the customer's saved list
    const newPaymentInstruments = useMemo(() => {
        // Use currentFormPayment if available, otherwise fall back to appliedPayment
        const paymentToCheck = currentFormPayment || appliedPayment

        console.log('🔍 Debug - detectNewPaymentInstruments:', {
            isGuest,
            hasCustomer: !!customer,
            customerPaymentInstruments: customer?.paymentInstruments,
            paymentToCheck,
            paymentSource: currentFormPayment ? 'form' : 'basket',
            paymentStructure: paymentToCheck ? {
                hasPaymentCard: !!paymentToCheck.paymentCard,
                numberLastDigits: paymentToCheck.paymentCard?.numberLastDigits,
                maskedNumber: paymentToCheck.paymentCard?.maskedNumber
            } : null
        })

        if (!isGuest && paymentToCheck) {
            console.log('🔍 Debug - All conditions met, checking for new payment...')

            // If customer has no saved payment instruments, any new payment is considered new
            if (!customer?.paymentInstruments || customer.paymentInstruments.length === 0) {
                console.log('🔍 Debug - No existing payment instruments, treating as new payment')
                return [paymentToCheck]
            }

            // Check if current payment instrument is not in saved list
            const isNewPayment = !customer.paymentInstruments.some(saved => {
                // Compare the entire payment instrument structure
                return (
                    saved.paymentCard?.cardType === paymentToCheck.paymentCard?.cardType &&
                    saved.paymentCard?.numberLastDigits === paymentToCheck.paymentCard?.numberLastDigits &&
                    saved.paymentCard?.holder === paymentToCheck.paymentCard?.holder &&
                    saved.paymentCard?.expirationMonth === paymentToCheck.paymentCard?.expirationMonth &&
                    saved.paymentCard?.expirationYear === paymentToCheck.paymentCard?.expirationYear
                )
            })

            console.log('🔍 Debug - Payment comparison:', {
                savedPaymentInstruments: customer.paymentInstruments.map(saved => ({
                    cardType: saved.paymentCard?.cardType,
                    numberLastDigits: saved.paymentCard?.numberLastDigits,
                    holder: saved.paymentCard?.holder,
                    expirationMonth: saved.paymentCard?.expirationMonth,
                    expirationYear: saved.paymentCard?.expirationYear
                })),
                currentPayment: {
                    cardType: paymentToCheck.paymentCard?.cardType,
                    numberLastDigits: paymentToCheck.paymentCard?.numberLastDigits,
                    holder: paymentToCheck.paymentCard?.holder,
                    expirationMonth: paymentToCheck.paymentCard?.expirationMonth,
                    expirationYear: paymentToCheck.paymentCard?.expirationYear
                },
                isNewPayment
            })

            console.log('🔍 Debug - Final result:', {
                isNewPayment,
                newPaymentInstruments: isNewPayment ? [paymentToCheck] : [],
                willShowCheckbox: isNewPayment && !isGuest
            })

            return isNewPayment ? [paymentToCheck] : []
        } else {
            console.log('🔍 Debug - Conditions not met:', {
                isGuest,
                hasCustomer: !!customer,
                hasCustomerPaymentInstruments: !!customer?.paymentInstruments,
                hasPaymentToCheck: !!paymentToCheck,
                customerPaymentInstrumentsLength: customer?.paymentInstruments?.length || 0
            })
        }
        return []
    }, [isGuest, customer, appliedPayment, currentFormPayment])

    // Watch form values in real-time to detect new payment instruments
    useEffect(() => {
        if (paymentMethodForm && !isGuest) {
            const subscription = paymentMethodForm.watch((value, { name, type }) => {
                console.log('🔍 Debug - Form field changed:', { name, type, value })
                updateCurrentFormPayment(value)
            })

            return () => subscription.unsubscribe()
        }
    }, [paymentMethodForm, isGuest])

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
        } catch (e) {
            showError()
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
        }
    })

    const billingAddressAriaLabel = defineMessage({
        defaultMessage: 'Billing Address Form',
        id: 'checkout_payment.label.billing_address_form'
    })

    console.log('🔍 Debug - Payment component about to render:', {
        step,
        STEPS_PAYMENT: STEPS.PAYMENT,
        isEditing: step === STEPS.PAYMENT,
        hasAppliedPayment: !!appliedPayment,
        newPaymentInstrumentsLength: newPaymentInstruments.length
    })

    try {
        return (
        <ToggleCard
            id="step-3"
            data-testid="payment-component"
            title={formatMessage({defaultMessage: 'Payment', id: 'checkout_payment.title.payment'})}
            editing={step === STEPS.PAYMENT}
            isLoading={
                paymentMethodForm.formState.isSubmitting ||
                billingAddressForm.formState.isSubmitting
            }
            disabled={appliedPayment == null}
            onEdit={() => goToStep(STEPS.PAYMENT)}
            editLabel={formatMessage({
                defaultMessage: 'Edit Payment Info',
                id: 'toggle_card.action.editPaymentInfo'
            })}
        >
            <ToggleCardEdit>
                    {console.log('🔍 Debug - ToggleCardEdit rendering')}
                <Box mt={-2} mb={4}>
                    <PromoCode {...promoCodeProps} itemProps={{border: 'none'}} />
                </Box>

                <Stack spacing={6}>
                    {!appliedPayment?.paymentCard ? (
                            <>
                                <PaymentForm form={paymentMethodForm} onSubmit={onSubmit} />

                                {/* Save Payment Method - Show in the actual payment form */}
                                {newPaymentInstruments.length > 0 && (
                                    <SavePaymentMethod
                                        paymentInstrument={newPaymentInstruments[0]}
                                        onSaved={onPaymentMethodSaved}
                                    />
                                )}
                            </>
                    ) : (
                        <Stack spacing={3}>
                            <Heading as="h3" fontSize="md">
                                <FormattedMessage
                                    defaultMessage="Credit Card"
                                    id="checkout_payment.heading.credit_card"
                                />
                            </Heading>
                            <Stack direction="row" spacing={4}>
                                <PaymentCardSummary payment={appliedPayment} />
                                <Button
                                    variant="link"
                                    size="sm"
                                    colorScheme="red"
                                    onClick={onPaymentRemoval}
                                >
                                    <FormattedMessage
                                        defaultMessage="Remove"
                                        id="checkout_payment.action.remove"
                                    />
                                </Button>
                            </Stack>
                        </Stack>
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
                                onChange={(e) => setBillingSameAsShipping(e.target.checked)}
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
            </ToggleCardEdit>

            <ToggleCardSummary>
                    {console.log('🔍 Debug - ToggleCardSummary rendering')}
                <Stack spacing={6}>
                        {console.log('🔍 Debug - Stack in ToggleCardSummary rendering')}
                    {appliedPayment && (
                        <Stack spacing={3}>
                            <Heading as="h3" fontSize="md">
                                <FormattedMessage
                                    defaultMessage="Credit Card"
                                    id="checkout_payment.heading.credit_card"
                                />
                            </Heading>
                            <PaymentCardSummary payment={appliedPayment} />

                                {console.log('🔍 Debug - Render section:', {
                                    newPaymentInstrumentsLength: newPaymentInstruments.length,
                                    newPaymentInstruments,
                                    appliedPayment
                                })}
                                {console.log('🔍 Debug - Render SavePaymentMethod check:', {
                                    newPaymentInstrumentsLength: newPaymentInstruments.length,
                                    newPaymentInstruments,
                                    firstPaymentInstrument: newPaymentInstruments[0],
                                    shouldRender: newPaymentInstruments.length > 0
                                })}
                        </Stack>
                    )}

                        {/* Save Payment Method - Always check, regardless of appliedPayment */}
                        {console.log('🔍 Debug - About to check SavePaymentMethod render conditions')}
                        {console.log('🔍 Debug - Render SavePaymentMethod check:', {
                            newPaymentInstrumentsLength: newPaymentInstruments.length,
                            newPaymentInstruments,
                            firstPaymentInstrument: newPaymentInstruments[0],
                            shouldRender: newPaymentInstruments.length > 0,
                            isGuest,
                            hasAppliedPayment: !!appliedPayment,
                            hasCurrentFormPayment: !!currentFormPayment
                        })}
                        {newPaymentInstruments.length > 0 && (
                            <>
                                <Text color="green.500" fontSize="sm">
                                    🔍 Debug: SavePaymentMethod should render here
                                </Text>
                                <Text color="red.500" fontSize="sm">
                                    🔍 Debug: This text should be visible if conditional rendering works
                                </Text>
                                {console.log('🔍 Debug - About to render SavePaymentMethod component')}
                                <SavePaymentMethod
                                    paymentInstrument={newPaymentInstruments[0]}
                                    onSaved={onPaymentMethodSaved}
                                />
                                {console.log('🔍 Debug - SavePaymentMethod component rendered')}
                            </>
                        )}

                        {/* Debug info */}
                        <Box mt={4} p={3} bg="gray.50" rounded="md">
                            <Text fontSize="sm" color="gray.600">
                                Debug Info:
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                                newPaymentInstruments.length: {newPaymentInstruments.length}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                                isGuest: {isGuest ? 'true' : 'false'}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                                hasCurrentFormPayment: {currentFormPayment ? 'true' : 'false'}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                                hasAppliedPayment: {appliedPayment ? 'true' : 'false'}
                            </Text>
                        </Box>

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

                    <UserRegistration
                        enableUserRegistration={enableUserRegistration}
                        setEnableUserRegistration={setEnableUserRegistration}
                        isGuestCheckout={registeredUserChoseGuest}
                    />
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
    onPaymentMethodSaved: PropTypes.func
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
