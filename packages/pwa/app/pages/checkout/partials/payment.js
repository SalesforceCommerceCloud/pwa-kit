import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Box, Button, Checkbox, Container, Heading, Stack, Text, Divider} from '@chakra-ui/react'
import {useCheckout} from '../util/checkout-context'
import usePaymentForms from '../util/usePaymentForms'
import {getCreditCardIcon} from '../../../utils/cc-utils'
import {ChevronDownIcon} from '../../../components/icons'
import {ToggleCard, ToggleCardEdit, ToggleCardSummary} from '../../../components/toggle-card'
import PaymentSelection from './payment-selection'
import ShippingAddressSelection from './shipping-address-selection'
import AddressDisplay from '../../../components/address-display'

const Payment = () => {
    const {
        step,
        setCheckoutStep,
        selectedShippingAddress,
        selectedBillingAddress,
        selectedPayment,
        getPaymentMethods,
        removePayment
    } = useCheckout()

    const {
        paymentMethodForm,
        billingAddressForm,
        billingSameAsShipping,
        setBillingSameAsShipping,
        reviewOrder
    } = usePaymentForms()

    useEffect(() => {
        getPaymentMethods()
    }, [])

    return (
        <ToggleCard
            id="step-3"
            title="Payment"
            editing={step === 3}
            isLoading={
                paymentMethodForm.formState.isSubmitting ||
                billingAddressForm.formState.isSubmitting
            }
            disabled={selectedPayment == null}
            onEdit={() => setCheckoutStep(3)}
        >
            <ToggleCardEdit>
                <Stack spacing={6}>
                    {!selectedPayment?.paymentCard ? (
                        <PaymentSelection form={paymentMethodForm} hideSubmitButton />
                    ) : (
                        <Stack spacing={6}>
                            <Box>
                                <Button variant="link" size="sm" rightIcon={<ChevronDownIcon />}>
                                    <FormattedMessage defaultMessage="Do you have a gift card or promo code?" />
                                </Button>
                            </Box>

                            <Stack spacing={3}>
                                <Heading as="h3" fontSize="md">
                                    <FormattedMessage defaultMessage="Credit Card" />
                                </Heading>
                                <Stack direction="row" spacing={4}>
                                    <PaymentCardSummary payment={selectedPayment} />
                                    <Button
                                        variant="link"
                                        size="sm"
                                        colorScheme="red"
                                        onClick={removePayment}
                                    >
                                        <FormattedMessage defaultMessage="Remove" />
                                    </Button>
                                </Stack>
                            </Stack>
                        </Stack>
                    )}

                    <Divider borderColor="gray.100" />

                    <Stack spacing={2}>
                        <Heading as="h3" fontSize="md">
                            <FormattedMessage defaultMessage="Billing Address" />
                        </Heading>

                        <Checkbox
                            name="billingSameAsShipping"
                            isChecked={billingSameAsShipping}
                            onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                        >
                            <Text fontSize="sm" color="gray.700">
                                <FormattedMessage defaultMessage="Same as shipping address" />
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
                            <Button w="full" onClick={reviewOrder}>
                                <FormattedMessage defaultMessage="Review Order" />
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
                                <FormattedMessage defaultMessage="Credit Card" />
                            </Heading>
                            <PaymentCardSummary payment={selectedPayment} />
                        </Stack>
                    )}

                    <Divider borderColor="gray.100" />

                    {selectedBillingAddress && (
                        <Stack spacing={2}>
                            <Heading as="h3" fontSize="md">
                                <FormattedMessage defaultMessage="Billing Address" />
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
