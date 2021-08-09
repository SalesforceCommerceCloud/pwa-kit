import React, {useEffect} from 'react'
import {FormattedMessage, FormattedNumber} from 'react-intl'
import {Box, Button, Container, Flex, Radio, RadioGroup, Stack, Text} from '@chakra-ui/react'
import {useForm, Controller} from 'react-hook-form'
import {useCheckout} from '../util/checkout-context'
import {ChevronDownIcon} from '../../../components/icons'
import {Section, SectionEdit, SectionSummary} from './section'

export default function ShippingOptions() {
    const {
        basket,
        step,
        shippingMethods,
        getShippingMethods,
        setCheckoutStep,
        selectedShippingMethod,
        setShippingMethod,
        goToNextStep
    } = useCheckout()

    const form = useForm({
        shouldUnregister: false,
        defaultValues: {
            shippingMethodId: selectedShippingMethod?.id || shippingMethods?.defaultShippingMethodId
        }
    })

    useEffect(() => {
        if (step === 2) {
            getShippingMethods()
        }
    }, [step])

    useEffect(() => {
        const defaultMethodId = shippingMethods?.defaultShippingMethodId
        const methodId = form.getValues().shippingMethodId
        if (!selectedShippingMethod && !methodId && defaultMethodId) {
            form.reset({shippingMethodId: defaultMethodId})
        }
        if (selectedShippingMethod && methodId !== selectedShippingMethod.id) {
            form.reset({shippingMethodId: selectedShippingMethod.id})
        }
    }, [selectedShippingMethod, shippingMethods])

    const submitForm = async ({shippingMethodId}) => {
        await setShippingMethod(shippingMethodId)
        goToNextStep()
    }

    return (
        <Section
            id="step-2"
            title="Shipping & Gift Options"
            editing={step === 2}
            isLoading={form.formState.isSubmitting}
            disabled={selectedShippingMethod == null}
            onEdit={() => setCheckoutStep(2)}
        >
            <SectionEdit>
                <form
                    onSubmit={form.handleSubmit(submitForm)}
                    data-testid="sf-checkout-shipping-options-form"
                >
                    <Stack spacing={6}>
                        {shippingMethods?.applicableShippingMethods && (
                            <Controller
                                name="shippingMethodId"
                                control={form.control}
                                defaultValue=""
                                render={({value, onChange}) => (
                                    <RadioGroup
                                        name="shipping-options-radiogroup"
                                        value={value}
                                        onChange={onChange}
                                    >
                                        <Stack spacing={5}>
                                            {shippingMethods.applicableShippingMethods.map(
                                                (opt) => (
                                                    <Radio value={opt.id} key={opt.id}>
                                                        <Flex justify="space-between" w="full">
                                                            <Text>{opt.name}</Text>
                                                            <Text fontWeight="bold">
                                                                <FormattedNumber
                                                                    value={opt.price}
                                                                    style="currency"
                                                                    currency={basket.currency}
                                                                />
                                                            </Text>
                                                        </Flex>
                                                        <Text fontSize="sm" color="gray.600">
                                                            {opt.description}
                                                        </Text>
                                                    </Radio>
                                                )
                                            )}
                                        </Stack>
                                    </RadioGroup>
                                )}
                            />
                        )}

                        <Box>
                            <Button variant="link" size="sm" rightIcon={<ChevronDownIcon />}>
                                <FormattedMessage defaultMessage="Do you want to send this as a gift?" />
                            </Button>
                        </Box>
                        <Box>
                            <Container variant="form">
                                <Button w="full" type="submit">
                                    <FormattedMessage defaultMessage="Continue to Payment" />
                                </Button>
                            </Container>
                        </Box>
                    </Stack>
                </form>
            </SectionEdit>

            {selectedShippingMethod && (
                <SectionSummary>
                    <Flex justify="space-between" w="full">
                        <Text>{selectedShippingMethod.name}</Text>
                        <Text fontWeight="bold">
                            <FormattedNumber
                                value={selectedShippingMethod.price}
                                style="currency"
                                currency={basket.currency}
                            />
                        </Text>
                    </Flex>
                    <Text fontSize="sm" color="gray.700">
                        {selectedShippingMethod.description}
                    </Text>
                </SectionSummary>
            )}
        </Section>
    )
}
