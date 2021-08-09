import React, {useEffect, useState, Fragment} from 'react'
import {FormattedMessage, FormattedNumber} from 'react-intl'
import {useHistory} from 'react-router-dom'
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
    AlertIcon
} from '@chakra-ui/react'
import {useForm} from 'react-hook-form'
import {getCreditCardIcon} from '../../utils/cc-utils'
import useBasket from '../../commerce-api/hooks/useBasket'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import {useLocale} from '../../locale'
import Link from '../../components/link'
import CartProductVariant from './partials/cart-product-variant'
import PostCheckoutRegistrationFields from '../../components/forms/post-checkout-registration-fields'

const CheckoutConfirmation = () => {
    const history = useHistory()
    const basket = useBasket()
    const customer = useCustomer()
    const [locale] = useLocale()

    // The order data will initially be stored as our basket when first coming to this
    // page. We capture it in local state to use for our UI. A new basket will be automatically
    // created so we should only reference our captured order data here.
    const [order] = useState(basket)

    // If we don't have an order object on first render we need to transition back to a
    // different page. Fow now, we push to the homepage.
    useEffect(() => {
        if (!order || order._type !== 'order') {
            // TODO: call `useNavigation` hook once it's merged
            history.push('/')
        }
    }, [order])

    if (!order || order._type !== 'order') {
        return null
    }

    const CardIcon = getCreditCardIcon(order.paymentInstruments[0].paymentCard?.cardType)

    const form = useForm({
        defaultValues: {
            email: customer?.email || order.customerInfo?.email || '',
            password: '',
            firstName: customer.firstName || order.billingAddress?.firstName,
            lastName: customer.lastName || order.billingAddress?.lastName
        }
    })
    const submitForm = async (data) => {
        try {
            await customer.registerCustomer(data)
        } catch (error) {
            const existingAccountMessage = (
                <Fragment>
                    <FormattedMessage defaultMessage="This email already has an account." />
                    &nbsp;
                    <Link to={`/${locale}/login`} color="blue.600">
                        <FormattedMessage defaultMessage="Log in here" />
                    </Link>
                </Fragment>
            )

            const message = /the login is already in use/i.test(error.message)
                ? existingAccountMessage
                : error.message

            form.setError('global', {type: 'manual', message})
            return
        }

        // Customer is successfully registered with a new account,
        // and the recent order would be associated with this account too.
        // Now redirect to the Account page.
        history.push(`/${locale}/account`)
    }

    return (
        <Box background="gray.50">
            <Container
                maxWidth="container.md"
                py={{base: 7, md: 16}}
                px={{base: 0, md: 4}}
                data-testid="sf-checkout-confirmation-container"
            >
                <Stack spacing={4}>
                    <Box layerStyle="card" rounded={[0, 0, 'base']} px={[4, 4, 6]} py={[6, 6, 8]}>
                        <Stack spacing={6}>
                            <Heading align="center" fontSize={['2xl']}>
                                <FormattedMessage defaultMessage="Thank you for your order!" />
                            </Heading>

                            <Box>
                                <Container variant="form">
                                    <Stack spacing={3}>
                                        <Text align="center">
                                            <FormattedMessage defaultMessage="Order Number" />:{' '}
                                            <Text as="span" fontWeight="bold">
                                                {order.orderNo}
                                            </Text>
                                        </Text>
                                        <Text align="center">
                                            <FormattedMessage
                                                defaultMessage="We will send an email to <b>{email}</b> with your confirmation number and receipt shortly."
                                                values={{
                                                    // eslint-disable-next-line react/display-name
                                                    b: (chunks) => <b>{chunks}</b>,
                                                    email: order.customerInfo.email
                                                }}
                                            />
                                        </Text>

                                        <Spacer />

                                        <Button as={Link} href="/" variant="outline">
                                            <FormattedMessage defaultMessage="Continue Shopping" />
                                        </Button>
                                    </Stack>
                                </Container>
                            </Box>
                        </Stack>
                    </Box>

                    {customer.authType === 'guest' && (
                        <Box
                            layerStyle="card"
                            rounded={[0, 0, 'base']}
                            px={[4, 4, 6]}
                            py={[6, 6, 8]}
                        >
                            <Container variant="form">
                                <Heading fontSize="lg" marginBottom={6}>
                                    <FormattedMessage defaultMessage="Create an account for faster checkout" />
                                </Heading>

                                <form onSubmit={form.handleSubmit(submitForm)}>
                                    <Stack spacing={4}>
                                        {form.errors?.global && (
                                            <Alert status="error">
                                                <AlertIcon />
                                                {form.errors.global.message}
                                            </Alert>
                                        )}

                                        <PostCheckoutRegistrationFields form={form} />

                                        <Button
                                            type="submit"
                                            width="full"
                                            onClick={() => form.clearErrors('global')}
                                            isLoading={form.formState.isSubmitting}
                                        >
                                            <FormattedMessage defaultMessage="Create Account" />
                                        </Button>
                                    </Stack>
                                </form>
                            </Container>
                        </Box>
                    )}

                    <Box layerStyle="card" rounded={[0, 0, 'base']} px={[4, 4, 6]} py={[6, 6, 8]}>
                        <Container variant="form">
                            <Stack spacing={6}>
                                <Heading fontSize="lg">
                                    <FormattedMessage defaultMessage="Delivery Details" />
                                </Heading>

                                <SimpleGrid columns={[1, 1, 2]} spacing={6}>
                                    <Stack spacing={1}>
                                        <Heading as="h3" fontSize="sm">
                                            <FormattedMessage defaultMessage="Shipping Address" />
                                        </Heading>
                                        <Box>
                                            <Text>
                                                {order.shipments[0].shippingAddress.fullName}
                                            </Text>
                                            <Text>
                                                {order.shipments[0].shippingAddress.address1}
                                            </Text>
                                            <Text>
                                                {order.shipments[0].shippingAddress.city},{' '}
                                                {order.shipments[0].shippingAddress.stateCode}{' '}
                                                {order.shipments[0].shippingAddress.postalCode}
                                            </Text>
                                            <Text>
                                                {order.shipments[0].shippingAddress.countryCode}
                                            </Text>
                                        </Box>
                                    </Stack>

                                    <Stack spacing={1}>
                                        <Heading as="h3" fontSize="sm">
                                            <FormattedMessage defaultMessage="Shipping Method" />
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
                            <Stack spacing={6}>
                                <Heading fontSize="lg">
                                    <FormattedMessage defaultMessage="Order Summary" />
                                </Heading>

                                <Stack spacing={4}>
                                    <Text>
                                        <FormattedMessage
                                            description="# item(s) in order"
                                            defaultMessage="{itemCount, plural, =0 {0 items} one {# item} other {# items}}"
                                            values={{
                                                itemCount: order.productItems.reduce(
                                                    (a, b) => a + b.quantity,
                                                    0
                                                )
                                            }}
                                        />
                                    </Text>

                                    <Stack spacing={5} align="flex-start">
                                        {order.productItems?.map((item) => (
                                            <CartProductVariant item={item} key={item.itemId} />
                                        ))}

                                        <Stack w="full" py={4} borderY="1px" borderColor="gray.200">
                                            <Flex justify="space-between">
                                                <Text fontWeight="bold">
                                                    <FormattedMessage defaultMessage="Subtotal" />
                                                </Text>
                                                <Text fontWeight="bold">
                                                    <FormattedNumber
                                                        value={order.productSubTotal}
                                                        style="currency"
                                                        currency={order.currency}
                                                    />
                                                </Text>
                                            </Flex>
                                            <Flex justify="space-between">
                                                <Text>
                                                    <FormattedMessage defaultMessage="Shipping" />
                                                </Text>
                                                <Text>
                                                    <FormattedNumber
                                                        value={order.shippingTotal}
                                                        style="currency"
                                                        currency={order.currency}
                                                    />
                                                </Text>
                                            </Flex>
                                            <Flex justify="space-between">
                                                <Text>
                                                    <FormattedMessage defaultMessage="Tax" />
                                                </Text>
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
                                            <Text fontWeight="bold">
                                                <FormattedMessage defaultMessage="Estimated Total" />
                                            </Text>
                                            <Text fontWeight="bold">{order.orderTotal}</Text>
                                        </Flex>
                                    </Stack>
                                </Stack>
                            </Stack>
                        </Container>
                    </Box>

                    <Box layerStyle="card" rounded={[0, 0, 'base']} px={[4, 4, 6]} py={[6, 6, 8]}>
                        <Container variant="form">
                            <Stack spacing={6}>
                                <Heading fontSize="lg">
                                    <FormattedMessage defaultMessage="Payment Details" />
                                </Heading>

                                <SimpleGrid columns={[1, 1, 2]} spacing={6}>
                                    <Stack spacing={1}>
                                        <Heading as="h3" fontSize="sm">
                                            <FormattedMessage defaultMessage="Billing Address" />
                                        </Heading>
                                        <Box>
                                            <Text>{order.billingAddress.fullName}</Text>
                                            <Text>{order.billingAddress.address1}</Text>
                                            <Text>
                                                {order.billingAddress.city},{' '}
                                                {order.billingAddress.stateCode}{' '}
                                                {order.billingAddress.postalCode}
                                            </Text>
                                            <Text>{order.billingAddress.countryCode}</Text>
                                        </Box>
                                    </Stack>

                                    <Stack spacing={1}>
                                        <Heading as="h3" fontSize="sm">
                                            <FormattedMessage defaultMessage="Credit Card" />
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
