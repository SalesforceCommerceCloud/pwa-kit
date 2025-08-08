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
    useAuthHelper,
    AuthHelpers,
    useShopperBasketsMutation,
    useShopperOrdersMutation,
    useShopperCustomersMutation,
    ShopperCustomersMutations,
    ShopperBasketsMutations,
    ShopperOrdersMutations
} from '@salesforce/commerce-sdk-react'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout-container/util/checkout-context'
import ContactInfo from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-contact-info'
import PickupAddress from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-pickup-address'
import ShippingAddress from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-address'
import ShippingOptions from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-options'
import Payment from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-payment'
import OrderSummary from '@salesforce/retail-react-app/app/components/order-summary'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {
    API_ERROR_MESSAGE,
    STORE_LOCATOR_IS_ENABLED
} from '@salesforce/retail-react-app/app/constants'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {
    getPaymentInstrumentCardType,
    getMaskCreditCardNumber
} from '@salesforce/retail-react-app/app/utils/cc-utils'
import {generatePassword} from '@salesforce/retail-react-app/app/utils/password-utils'
import {nanoid} from 'nanoid'

const CheckoutOneClick = () => {
    const {formatMessage} = useIntl()
    const navigate = useNavigation()
    const {step} = useCheckout()
    const showToast = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [enableUserRegistration, setEnableUserRegistration] = useState(false)
    const {data: basket} = useCurrentBasket()
    const [error] = useState()
    const {social = {}} = getConfig().app.login || {}
    const idps = social?.idps
    const isSocialEnabled = !!social?.enabled
    const createCustomerPaymentInstruments = useShopperCustomersMutation('createCustomerPaymentInstrument')
    // The last applied payment instrument on the card. We need to track to save it on the customer profile upon registration
    // as the payment instrument on order only contains the masked number.
    let shopperPaymentInstrument

    // Only enable BOPIS functionality if the feature toggle is on
    const isPickupOrder = STORE_LOCATOR_IS_ENABLED
        ? basket?.shipments[0]?.shippingMethod?.c_storePickupEnabled === true
        : false

    const selectedShippingAddress = basket?.shipments && basket?.shipments[0]?.shippingAddress
    const selectedBillingAddress = basket?.billingAddress
    const appliedPayment = basket?.paymentInstruments && basket?.paymentInstruments[0]

    const {mutateAsync: addPaymentInstrumentToBasket} = useShopperBasketsMutation(
        ShopperBasketsMutations.AddPaymentInstrumentToBasket
    )
    const {mutateAsync: updateBillingAddressForBasket} = useShopperBasketsMutation(
        ShopperBasketsMutations.UpdateBillingAddressForBasket
    )
    const {mutateAsync: createOrder} = useShopperOrdersMutation(ShopperOrdersMutations.CreateOrder)
    const {mutateAsync: register} = useAuthHelper(AuthHelpers.Register)
    const {mutateAsync: createCustomerAddress} = useShopperCustomersMutation(
        ShopperCustomersMutations.CreateCustomerAddress
    )

    const showError = (message) => {
        showToast({
            title: message || formatMessage(API_ERROR_MESSAGE),
            status: 'error'
        })
    }

    // Form for payment method
    const paymentMethodForm = useForm()

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
            paymentMethodId: 'CREDIT_CARD',
            paymentCard: {
                holder: formValue.holder,
                maskedNumber: getMaskCreditCardNumber(formValue.number),
                cardType: getPaymentInstrumentCardType(formValue.cardType),
                expirationMonth: parseInt(expirationMonth),
                expirationYear: parseInt(`20${expirationYear}`)
            }
        }

        shopperPaymentInstrument = {
            holder: formValue.holder,
            number: formValue.number,
            cardType: getPaymentInstrumentCardType(formValue.cardType),
            expirationMonth: parseInt(expirationMonth),
            expirationYear: parseInt(`20${expirationYear}`)
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

        // For one-click checkout, billing same as shipping by default
        const billingSameAsShipping = !isPickupOrder
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

    const submitOrder = async () => {
        const saveShippingAddress = async (customerId, address) => {
            try {
                await createCustomerAddress({
                    body: address,
                    parameters: {customerId: customerId}
                })
            } catch (error) {
                // Fail silently
            }
        }

        const savePaymentInstrument = async (customerId, paymentMethodId) => {
            try {
                const paymentInstrument = {
                    paymentMethodId: paymentMethodId,
                    paymentCard: {
                        holder: shopperPaymentInstrument.holder,
                        number: shopperPaymentInstrument.number,
                        cardType: shopperPaymentInstrument.cardType,
                        expirationMonth: shopperPaymentInstrument.expirationMonth,
                        expirationYear: shopperPaymentInstrument.expirationYear
                    }
                }

                await createCustomerPaymentInstruments.mutateAsync({
                    body: paymentInstrument,
                    parameters: {customerId: customerId}
                })
            } catch (error) {
                // Fail silently
            }
        }

        const registerUser = async (data) => {
            try {
                const body = {
                    customer: {
                        firstName: data.firstName,
                        lastName: data.lastName,
                        email: data.email,
                        login: data.email,
                        phoneHome: data.phoneHome
                    },
                    password: generatePassword()
                }
                const customer = await register(body)

                // Save the shipping address from this order, should not block account creation
                await saveShippingAddress(customer.customerId, data.address)

                // Save the payment instrument
                await savePaymentInstrument(customer.customerId, data.paymentMethodId)

                showToast({
                    variant: 'subtle',
                    title: `${formatMessage(
                        {
                            defaultMessage: 'Welcome {name},',
                            id: 'auth_modal.info.welcome_user'
                        },
                        {
                            name: data.firstName || ''
                        }
                    )}`,
                    description: `${formatMessage({
                        defaultMessage: "You're now signed in.",
                        id: 'auth_modal.description.now_signed_in'
                    })}`,
                    status: 'success',
                    position: 'top-right',
                    isClosable: true
                })
            } catch (error) {
                let message = formatMessage(API_ERROR_MESSAGE)
                if (error.response) {
                    const json = await error.response.json()
                    if (/the login is already in use/i.test(json.detail)) {
                        message = formatMessage({
                            id: 'checkout_confirmation.message.already_has_account',
                            defaultMessage: 'This email already has an account.'
                        })
                    }
                }

                showError(message)
            }
        }

        setIsLoading(true)
        try {
            const order = await createOrder({
                body: {basketId: basket.basketId}
            })

            if (enableUserRegistration) {
                // Remove the id property from the address
                const {id, ...address} = order.shipments[0].shippingAddress
                address.addressId = nanoid()

                await registerUser({
                    firstName: order.billingAddress.firstName,
                    lastName: order.billingAddress.lastName,
                    email: order.customerInfo.email,
                    phoneHome: order.billingAddress.phone,
                    address: address,
                    paymentMethodId: order.paymentInstruments[0].paymentMethodId
                })
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

    const onPlaceOrder = paymentMethodForm.handleSubmit(async (paymentFormValues) => {
        try {
            if (!appliedPayment) {
                await onPaymentSubmit(paymentFormValues)
            }

            // If successful `onBillingSubmit` returns the updated basket. If the form was invalid on
            // submit, `undefined` is returned.
            const updatedBasket = await onBillingSubmit()

            if (updatedBasket) {
                await submitOrder()
            }
        } catch (error) {
            showError()
        }
    })

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

                            <ContactInfo isSocialEnabled={isSocialEnabled} idps={idps} />
                            {isPickupOrder ? <PickupAddress /> : <ShippingAddress />}
                            {!isPickupOrder && <ShippingOptions />}
                            <Payment
                                enableUserRegistration={enableUserRegistration}
                                setEnableUserRegistration={setEnableUserRegistration}
                                paymentMethodForm={paymentMethodForm}
                                billingAddressForm={billingAddressForm}
                            />

                            {step === 4 && (
                                <Box display="flex" bottom="0" px={4} pt={2} pb={4}>
                                    <Container variant="form">
                                        <Button
                                            w="full"
                                            onClick={onPlaceOrder}
                                            isLoading={isLoading}
                                            isDisabled={
                                                !paymentMethodForm.formState.isValid &&
                                                !appliedPayment
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
        </Box>
    )
}

export default CheckoutOneClick
