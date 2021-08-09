import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import {Box, Button, Checkbox, Container, Heading, Stack, Text, Divider} from '@chakra-ui/react'
import {useCheckout} from '../util/checkout-context'
import usePaymentForms from '../util/usePaymentForms'
import {getCreditCardIcon} from '../../../utils/cc-utils'
import {ChevronDownIcon} from '../../../components/icons'
import {Section, SectionEdit, SectionSummary} from './section'
import PaymentSelection from './payment-selection'
import ShippingAddressSelection from './shipping-address-selection'
import {FormattedMessage} from 'react-intl'

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
        <Section
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
            <SectionEdit>
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
                                <AddressSummary address={selectedShippingAddress} />
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
            </SectionEdit>

            <SectionSummary>
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
                            <AddressSummary address={selectedBillingAddress} />
                        </Stack>
                    )}
                </Stack>
            </SectionSummary>
        </Section>
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

const AddressSummary = ({address}) => (
    <Box>
        <Text>
            {address.firstName} {address.lastName}
        </Text>
        <Text>{address.address1}</Text>
        <Text>
            {address.city}, {address.stateCode} {address.postalCode}
        </Text>
        <Text>{address.countryCode}</Text>
    </Box>
)

AddressSummary.propTypes = {address: PropTypes.object}

export default Payment
