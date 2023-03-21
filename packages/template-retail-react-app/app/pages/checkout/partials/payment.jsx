/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, useIntl} from 'react-intl'
import {Box, Button, Checkbox, Container, Heading, Stack, Text, Divider} from '@chakra-ui/react'
import {useForm} from 'react-hook-form'
import {useShopperBasketsMutation} from 'commerce-sdk-react-preview'
import {useCurrentBasket} from '../../../hooks/use-current-basket'
import {useCheckout} from '../util/checkout-context'
import usePaymentForms from '../util/usePaymentForms'
import {getPaymentInstrumentCardType, getCreditCardIcon} from '../../../utils/cc-utils'
import {ToggleCard, ToggleCardEdit, ToggleCardSummary} from '../../../components/toggle-card'
import PaymentForm from './payment-form'
import ShippingAddressSelection from './shipping-address-selection'
import AddressDisplay from '../../../components/address-display'
import {PromoCode, usePromoCode} from '../../../components/promo-code'

const Payment = () => {
    const {formatMessage} = useIntl()
    const {data: basket} = useCurrentBasket()
    const selectedShippingAddress = basket?.shipments && basket?.shipments[0]?.shippingAddress
    const selectedBillingAddress = basket?.billingAddress
    const selectedPayment = basket?.paymentInstruments && basket?.paymentInstruments[0]

    const {mutateAsync: addPaymentInstrumentToBasket} = useShopperBasketsMutation(
        'addPaymentInstrumentToBasket'
    )

    const {
        step,
        checkoutSteps,
        setCheckoutStep,
        // selectedShippingAddress,
        // selectedBillingAddress,
        // selectedPayment,
        // getPaymentMethods,
        removePayment
    } = useCheckout()

    const {
        // paymentMethodForm,
        billingAddressForm,
        billingSameAsShipping,
        setBillingSameAsShipping
        // reviewOrder
    } = usePaymentForms()

    const {removePromoCode, ...promoCodeProps} = usePromoCode()

    const paymentMethodForm = useForm()

    const onPaymentSubmit = async () => {
        console.log('onPaymentSubmit')
        const isFormValid = await paymentMethodForm.trigger()

        if (!isFormValid) {
            return
        }

        const formValue = paymentMethodForm.getValues()
        //         cardType
        // :
        // "visa"
        // expiry
        // :
        // "12/26"
        // holder
        // :
        // "test"
        // number
        // :
        // "4111 1111 1111 1111"
        // securityCode
        // :
        // "265"

                // The form gives us the expiration date as `MM/YY` - so we need to split it into
                // month and year to submit them as individual fields.
                const [expirationMonth, expirationYear] = formValue.expiry.split('/')

                const paymentInstrument = {
                    paymentMethodId: 'CREDIT_CARD',
                    paymentCard: {
                        holder: formValue.holder,
                        // maskedNumber: formValue.number.replace(/ /g, ''),
                        // TODO: SCAPI only takes masked cc number ?
                        maskedNumber: "*********1234",
                        cardType: getPaymentInstrumentCardType(formValue.cardType),
                        expirationMonth: parseInt(expirationMonth),
                        expirationYear: parseInt(`20${expirationYear}`),

                        // TODO: These fields are required for saving the card to the customer's
                        // account. Im not sure what they are for or how to get them, so for now
                        // we're just passing some values to make it work. Need to investigate.
                        issueNumber: '',
                        validFromMonth: 1,
                        validFromYear: 2020
                    }
                }

        await addPaymentInstrumentToBasket({parameters: {basketId: basket.basketId}, body: paymentInstrument})
    }
    const onBillingSubmit = async () => {
        console.log('onBillingSubmit')
        // function delay(milliseconds) {
        //     return new Promise(resolve => setTimeout(resolve, milliseconds));
        //   }
        //   await delay(1000)
    }

    const onSubmit = async () => {
        await onPaymentSubmit()
        await onBillingSubmit()
    }
    // const {data: shippingMethods} = useShippingMethodsForShipment(
    //     {
    //         parameters: {
    //             basketId: basket.basketId,
    //             shipmentId: 'me'
    //         }
    //     },
    //     {
    //         enabled: Boolean(basket.basketId) && step === checkoutSteps.ShippingOptions
    //     }
    // )

    // useEffect(() => {
    //     getPaymentMethods()
    // }, [])

    return (
        <ToggleCard
            id="step-3"
            title={formatMessage({defaultMessage: 'Payment', id: 'checkout_payment.title.payment'})}
            editing={step === checkoutSteps.Payment}
            isLoading={
                paymentMethodForm.formState.isSubmitting ||
                billingAddressForm.formState.isSubmitting
            }
            disabled={selectedPayment == null}
            onEdit={() => setCheckoutStep(checkoutSteps.Payment)}
        >
            <ToggleCardEdit>
                <Box mt={-2} mb={4}>
                    <PromoCode {...promoCodeProps} itemProps={{border: 'none'}} />
                </Box>

                <Stack spacing={6}>
                    {!selectedPayment?.paymentCard ? (
                        <PaymentForm form={paymentMethodForm} onSubmit={onPaymentSubmit} />
                    ) : (
                        <Stack spacing={3}>
                            <Heading as="h3" fontSize="md">
                                <FormattedMessage
                                    defaultMessage="Credit Card"
                                    id="checkout_payment.heading.credit_card"
                                />
                            </Heading>
                            <Stack direction="row" spacing={4}>
                                <PaymentCardSummary payment={selectedPayment} />
                                <Button
                                    variant="link"
                                    size="sm"
                                    colorScheme="red"
                                    onClick={removePayment}
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
                            hideSubmitButton
                        />
                    )}

                    <Box pt={3}>
                        <Container variant="form">
                            <Button w="full" onClick={onSubmit}>
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
                    {selectedPayment && (
                        <Stack spacing={3}>
                            <Heading as="h3" fontSize="md">
                                <FormattedMessage
                                    defaultMessage="Credit Card"
                                    id="checkout_payment.heading.credit_card"
                                />
                            </Heading>
                            <PaymentCardSummary payment={selectedPayment} />
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
