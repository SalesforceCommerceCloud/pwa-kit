/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {Fragment, useEffect, useMemo} from 'react'
import {useIntl, FormattedNumber} from 'react-intl'
import {
    Box,
    Button,
    Container,
    Flex,
    Heading,
    SimpleGrid,
    Spacer,
    Stack,
    Text,
    Alert,
    StackSeparator
} from '@chakra-ui/react'
import {useForm} from 'react-hook-form'
import {useParams} from 'react-router-dom'
import {useOrder, useProducts, useAuthHelper, AuthHelpers} from '@salesforce/commerce-sdk-react'
import {getCreditCardIcon} from '../../utils/cc-utils'
import useNavigation from '../../hooks/use-navigation'
import Link from '../../components/link'
import AddressDisplay from '../../components/address-display'
import PostCheckoutRegistrationFields from '../../components/forms/post-checkout-registration-fields'
import PromoPopover from '../../components/promo-popover'
import ItemVariantProvider from '../../components/item-variant'
import CartItemVariantImage from '../../components/item-variant/item-image'
import CartItemVariantName from '../../components/item-variant/item-name'
import CartItemVariantAttributes from '../../components/item-variant/item-attributes'
import CartItemVariantPrice from '../../components/item-variant/item-price'
import {useCurrentCustomer} from '../../hooks/use-current-customer'
import {API_ERROR_MESSAGE} from '../../../config/constants'
import {useCurrency} from '../../hooks'
import {AlertIcon} from '../../components/icons'

const onClient = typeof window !== 'undefined'

const CheckoutConfirmation = () => {
    const intl = useIntl()
    const {formatMessage} = intl
    const {orderNo} = useParams()
    const navigate = useNavigation()
    const {data: customer} = useCurrentCustomer()
    const register = useAuthHelper(AuthHelpers.Register)
    const {data: order} = useOrder(
        {
            parameters: {orderNo}
        },
        {
            enabled: !!orderNo && onClient
        }
    )
    const {currency} = useCurrency()
    const itemIds = order?.productItems.map((item) => item.productId)
    const {data: products} = useProducts({parameters: {ids: itemIds?.join(',')}})
    const productItemsMap = products?.data.reduce((map, item) => ({...map, [item.id]: item}), {})
    const form = useForm()

    useEffect(() => {
        form.reset({
            email: order?.customerInfo?.email || '',
            password: '',
            firstName: order?.billingAddress?.firstName,
            lastName: order?.billingAddress?.lastName
        })
    }, [order])

    if (!order || !order.orderNo) {
        return null
    }

    const messages = useMemo(
        () => ({
            thankYou: intl.formatMessage({
                id: 'checkout_confirmation.heading.thank_you_for_order',
                defaultMessage: 'Thank you for your order!'
            }),
            orderNumber: intl.formatMessage({
                id: 'checkout_confirmation.label.order_number',
                defaultMessage: 'Order Number'
            }),
            emailConfirmation: intl.formatMessage(
                {
                    id: 'checkout_confirmation.message.will_email_shortly',
                    defaultMessage:
                        'We will send an email to <b>{email}</b> with your confirmation number and receipt shortly.'
                },
                {
                    b: (chunks) => <b>{chunks}</b>,
                    email: order?.customerInfo?.email
                }
            ),
            continueShopping: intl.formatMessage({
                id: 'checkout_confirmation.link.continue_shopping',
                defaultMessage: 'Continue Shopping'
            }),
            createAccount: intl.formatMessage({
                id: 'checkout_confirmation.heading.create_account',
                defaultMessage: 'Create an account for faster checkout'
            }),
            createAccountButton: intl.formatMessage({
                id: 'checkout_confirmation.button.create_account',
                defaultMessage: 'Create Account'
            }),
            deliveryDetails: intl.formatMessage({
                id: 'checkout_confirmation.heading.delivery_details',
                defaultMessage: 'Delivery Details'
            }),
            shippingAddress: intl.formatMessage({
                id: 'checkout_confirmation.heading.shipping_address',
                defaultMessage: 'Shipping Address'
            }),
            shippingMethod: intl.formatMessage({
                id: 'checkout_confirmation.heading.shipping_method',
                defaultMessage: 'Shipping Method'
            }),
            orderSummary: intl.formatMessage({
                id: 'checkout_confirmation.heading.order_summary',
                defaultMessage: 'Order Summary'
            }),
            itemCount: intl.formatMessage(
                {
                    id: 'checkout_confirmation.message.num_of_items_in_order',
                    defaultMessage: '{itemCount, plural, =0 {0 items} one {# item} other {# items}}'
                },
                {
                    itemCount: order?.productItems?.reduce((a, b) => a + b.quantity, 0) || 0
                }
            ),
            subtotal: intl.formatMessage({
                id: 'checkout_confirmation.label.subtotal',
                defaultMessage: 'Subtotal'
            }),
            shipping: intl.formatMessage({
                id: 'checkout_confirmation.label.shipping',
                defaultMessage: 'Shipping'
            }),
            promoApplied: intl.formatMessage({
                id: 'checkout_confirmation.label.promo_applied',
                defaultMessage: 'Promotion applied'
            }),
            free: intl.formatMessage({
                id: 'checkout_confirmation.label.free',
                defaultMessage: 'Free'
            }),
            tax: intl.formatMessage({
                id: 'checkout_confirmation.label.tax',
                defaultMessage: 'Tax'
            }),
            orderTotal: intl.formatMessage({
                id: 'checkout_confirmation.label.order_total',
                defaultMessage: 'Order Total'
            }),
            paymentDetails: intl.formatMessage({
                id: 'checkout_confirmation.heading.payment_details',
                defaultMessage: 'Payment Details'
            }),
            billingAddress: intl.formatMessage({
                id: 'checkout_confirmation.heading.billing_address',
                defaultMessage: 'Billing Address'
            }),
            creditCard: intl.formatMessage({
                id: 'checkout_confirmation.heading.credit_card',
                defaultMessage: 'Credit Card'
            })
        }),
        [intl, order]
    )

    const CardIcon = getCreditCardIcon(order.paymentInstruments[0].paymentCard?.cardType)

    const submitForm = async (data) => {
        try {
            const body = {
                customer: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    login: data.email
                },
                password: data.password
            }
            await register.mutateAsync(body)

            navigate(`/account`)
        } catch (error) {
            if (!error.response) {
                form.setError('global', {
                    type: 'manual',
                    message: intl.formatMessage(API_ERROR_MESSAGE)
                })
                return
            }
            const json = await error.response.json()

            const errorMessages = {
                accountExists: intl.formatMessage({
                    id: 'checkout_confirmation.message.already_has_account',
                    defaultMessage: 'This email already has an account.'
                }),
                loginLink: intl.formatMessage({
                    id: 'checkout_confirmation.link.login',
                    defaultMessage: 'Log in here'
                })
            }

            const existingAccountMessage = (
                <Fragment>
                    {errorMessages.accountExists}
                    &nbsp;
                    <Link to="/login" color="blue.600">
                        {errorMessages.loginLink}
                    </Link>
                </Fragment>
            )

            const message = /the login is already in use/i.test(json.detail)
                ? existingAccountMessage
                : intl.formatMessage(API_ERROR_MESSAGE)

            form.setError('global', {type: 'manual', message})
        }
    }

    return (
        <Box background="gray.50">
            <Container
                maxWidth="container.md"
                py={{base: 7, md: 16}}
                px={{base: 0, md: 4}}
                data-testid="sf-checkout-confirmation-container"
            >
                <Stack gap="4">
                    <Box layerStyle="card" rounded={[0, 0, 'base']} px={[4, 4, 6]} py={[6, 6, 8]}>
                        <Stack gap="6">
                            <Heading textAlign="center" fontSize={['2xl']}>
                                {messages.thankYou}
                            </Heading>

                            <Box>
                                <Container variant="form">
                                    <Stack gap="3">
                                        <Text textAlign="center">
                                            {messages.orderNumber}:{' '}
                                            <Text as="span" fontWeight="bold">
                                                {order.orderNo}
                                            </Text>
                                        </Text>
                                        <Text textAlign="center">{messages.emailConfirmation}</Text>

                                        <Spacer />

                                        <Button as={Link} href="/" variant="outline">
                                            {messages.continueShopping}
                                        </Button>
                                    </Stack>
                                </Container>
                            </Box>
                        </Stack>
                    </Box>

                    {customer.isGuest && (
                        <Box
                            layerStyle="card"
                            rounded={[0, 0, 'base']}
                            px={[4, 4, 6]}
                            py={[6, 6, 8]}
                        >
                            <Container variant="form">
                                <Heading fontSize="lg" marginBottom={6}>
                                    {messages.createAccount}
                                </Heading>

                                <form onSubmit={form.handleSubmit(submitForm)}>
                                    <Stack gap="4">
                                        {form.formState.errors?.global && (
                                            <Alert.Root status="error" role="alert">
                                                <Alert.Indicator>
                                                    <AlertIcon />
                                                </Alert.Indicator>
                                                <Alert.Description>
                                                    {form.formState.errors.global.message}
                                                </Alert.Description>
                                            </Alert.Root>
                                        )}

                                        <PostCheckoutRegistrationFields form={form} />

                                        <Button
                                            type="submit"
                                            width="full"
                                            onClick={() => form.clearErrors('global')}
                                            isLoading={form.formState.isSubmitting}
                                        >
                                            {messages.createAccountButton}
                                        </Button>
                                    </Stack>
                                </form>
                            </Container>
                        </Box>
                    )}

                    <Box layerStyle="card" rounded={[0, 0, 'base']} px={[4, 4, 6]} py={[6, 6, 8]}>
                        <Container variant="form">
                            <Stack gap="6">
                                <Heading fontSize="lg">{messages.deliveryDetails}</Heading>

                                <SimpleGrid columns={[1, 1, 2]} gap="6">
                                    <Stack gap="1">
                                        <Heading as="h3" fontSize="sm">
                                            {messages.shippingAddress}
                                        </Heading>
                                        <AddressDisplay
                                            address={order.shipments[0].shippingAddress}
                                        />
                                    </Stack>

                                    <Stack gap="1">
                                        <Heading as="h3" fontSize="sm">
                                            {messages.shippingMethod}
                                        </Heading>
                                        <Box>
                                            <Text>{order.shipments[0].shippingMethod.name}</Text>
                                            <Text>
                                                {order.shipments[0].shippingMethod.description}
                                            </Text>
                                        </Box>
                                    </Stack>
                                </SimpleGrid>
                            </Stack>
                        </Container>
                    </Box>

                    <Box layerStyle="card" rounded={[0, 0, 'base']} px={[4, 4, 6]} py={[6, 6, 8]}>
                        <Container variant="form">
                            <Stack gap="6">
                                <Heading fontSize="lg">{messages.orderSummary}</Heading>

                                <Stack gap="4">
                                    <Text>{messages.itemCount}</Text>

                                    <Stack
                                        gap="5"
                                        alignItems="flex-start"
                                        separator={<StackSeparator width="full" />}
                                    >
                                        <Stack gap="5" alignItems="flex-start" width="full">
                                            {order.productItems?.map((product, idx) => {
                                                const productDetail =
                                                    productItemsMap?.[product.productId] || {}
                                                const variant = {
                                                    ...product,
                                                    ...productDetail,
                                                    price: product.price
                                                }

                                                return (
                                                    <ItemVariantProvider
                                                        key={product.productId}
                                                        index={idx}
                                                        variant={variant}
                                                    >
                                                        <Flex width="full" alignItems="flex-start">
                                                            <CartItemVariantImage
                                                                width="80px"
                                                                mr={2}
                                                            />
                                                            <Stack
                                                                gap="1"
                                                                marginTop="-3px"
                                                                flex={1}
                                                            >
                                                                <CartItemVariantName />
                                                                <Flex
                                                                    width="full"
                                                                    justifyContent="space-between"
                                                                    alignItems="flex-end"
                                                                >
                                                                    <CartItemVariantAttributes
                                                                        includeQuantity
                                                                    />
                                                                    <CartItemVariantPrice
                                                                        currency={currency}
                                                                    />
                                                                </Flex>
                                                            </Stack>
                                                        </Flex>
                                                    </ItemVariantProvider>
                                                )
                                            })}
                                        </Stack>

                                        <Stack w="full" py={4} borderY="1px" borderColor="gray.200">
                                            <Flex justify="space-between">
                                                <Text fontWeight="bold">{messages.subtotal}</Text>
                                                <Text fontWeight="bold">
                                                    <FormattedNumber
                                                        style="currency"
                                                        currency={order?.currency}
                                                        value={order?.productSubTotal}
                                                    />
                                                </Text>
                                            </Flex>
                                            {order.orderPriceAdjustments?.map((adjustment) => (
                                                <Flex
                                                    justify="space-between"
                                                    key={adjustment.priceAdjustmentId}
                                                >
                                                    <Text>{adjustment.itemText}</Text>
                                                    <Text color="green.500">
                                                        <FormattedNumber
                                                            style="currency"
                                                            currency={order?.currency}
                                                            value={adjustment.price}
                                                        />
                                                    </Text>
                                                </Flex>
                                            ))}
                                            <Flex justify="space-between">
                                                <Flex alignItems="center">
                                                    <Text lineHeight={1}>
                                                        {messages.shipping}
                                                        {order.shippingItems[0].priceAdjustments
                                                            ?.length > 0 && (
                                                            <Text as="span" ml={1}>
                                                                ({messages.promoApplied})
                                                            </Text>
                                                        )}
                                                    </Text>
                                                    {order.shippingItems?.[0]?.priceAdjustments
                                                        ?.length > 0 && (
                                                        <PromoPopover ml={2}>
                                                            <Stack>
                                                                {order.shippingItems[0].priceAdjustments?.map(
                                                                    (adjustment) => (
                                                                        <Text
                                                                            key={
                                                                                adjustment.priceAdjustmentId
                                                                            }
                                                                            fontSize="sm"
                                                                        >
                                                                            {adjustment.itemText}
                                                                        </Text>
                                                                    )
                                                                )}
                                                            </Stack>
                                                        </PromoPopover>
                                                    )}
                                                </Flex>

                                                {order.shippingItems[0].priceAdjustments?.some(
                                                    ({appliedDiscount}) =>
                                                        appliedDiscount?.type === 'free'
                                                ) ? (
                                                    <Text
                                                        as="span"
                                                        color="green.500"
                                                        textTransform="uppercase"
                                                    >
                                                        {messages.free}
                                                    </Text>
                                                ) : (
                                                    <Text>
                                                        <FormattedNumber
                                                            value={order.shippingTotal}
                                                            style="currency"
                                                            currency={order.currency}
                                                        />
                                                    </Text>
                                                )}
                                            </Flex>
                                            <Flex justify="space-between">
                                                <Text>{messages.tax}</Text>
                                                <Text>
                                                    <FormattedNumber
                                                        value={order.taxTotal}
                                                        style="currency"
                                                        currency={order.currency}
                                                    />
                                                </Text>
                                            </Flex>
                                        </Stack>

                                        <Flex w="full" justify="space-between">
                                            <Text fontWeight="bold">{messages.orderTotal}</Text>
                                            <Text fontWeight="bold">
                                                <FormattedNumber
                                                    style="currency"
                                                    currency={order?.currency}
                                                    value={order?.orderTotal}
                                                />
                                            </Text>
                                        </Flex>
                                    </Stack>
                                </Stack>
                            </Stack>
                        </Container>
                    </Box>

                    <Box layerStyle="card" rounded={[0, 0, 'base']} px={[4, 4, 6]} py={[6, 6, 8]}>
                        <Container variant="form">
                            <Stack gap="6">
                                <Heading fontSize="lg">{messages.paymentDetails}</Heading>

                                <SimpleGrid columns={[1, 1, 2]} gap="6">
                                    <Stack gap="1">
                                        <Heading as="h3" fontSize="sm">
                                            {messages.billingAddress}
                                        </Heading>
                                        <AddressDisplay address={order.billingAddress} />
                                    </Stack>

                                    <Stack gap="1">
                                        <Heading as="h3" fontSize="sm">
                                            {messages.creditCard}
                                        </Heading>

                                        <Stack direction="row">
                                            {CardIcon && <CardIcon layerStyle="ccIcon" />}

                                            <Box>
                                                <Text>
                                                    {
                                                        order.paymentInstruments[0].paymentCard
                                                            ?.cardType
                                                    }
                                                </Text>
                                                <Stack direction="row">
                                                    <Text>
                                                        &bull;&bull;&bull;&bull;{' '}
                                                        {
                                                            order.paymentInstruments[0].paymentCard
                                                                ?.numberLastDigits
                                                        }
                                                    </Text>
                                                    <Text>
                                                        {
                                                            order.paymentInstruments[0].paymentCard
                                                                ?.expirationMonth
                                                        }
                                                        /
                                                        {
                                                            order.paymentInstruments[0].paymentCard
                                                                ?.expirationYear
                                                        }
                                                    </Text>
                                                </Stack>
                                            </Box>
                                        </Stack>
                                    </Stack>
                                </SimpleGrid>
                            </Stack>
                        </Container>
                    </Box>
                </Stack>
            </Container>
        </Box>
    )
}

export default CheckoutConfirmation
