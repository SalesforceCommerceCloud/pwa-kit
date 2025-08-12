/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useMemo} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {Box, Button, Accordion} from '@chakra-ui/react'
import {useForm} from 'react-hook-form'
import {ChevronDownIcon} from '../icons'
import PromoCodeFields from '../../components/forms/promo-code-fields'
import {API_ERROR_MESSAGE} from '../../../config/constants'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {useCurrentBasket} from '../../hooks'
import {useToast} from '../../hooks/use-toast'

export const usePromoCode = () => {
    const intl = useIntl()
    const {formatMessage} = intl
    const {data: basket} = useCurrentBasket()
    const form = useForm()
    const toast = useToast()

    const messages = useMemo(
        () => ({
            promoApplied: formatMessage({
                id: 'use_promocode.info.promo_applied',
                defaultMessage: 'Promotion applied'
            }),
            checkCode: formatMessage({
                id: 'use_promocode.error.check_the_code',
                defaultMessage:
                    'Check the code and try again, it may already be applied or the promo has expired.'
            }),
            promoRemoved: formatMessage({
                id: 'use_promocode.info.promo_removed',
                defaultMessage: 'Promotion removed'
            }),
            apiError: formatMessage(API_ERROR_MESSAGE)
        }),
        [intl]
    )

    const applyPromoCodeMutation = useShopperBasketsMutation('addCouponToBasket')
    const removePromoCodeMutation = useShopperBasketsMutation('removeCouponFromBasket')

    const submitPromoCode = async ({code}) => {
        try {
            await applyPromoCodeMutation.mutateAsync({
                parameters: {basketId: basket?.basketId},
                body: {
                    code
                }
            })

            form.reset({code: ''})

            toast({
                title: messages.promoApplied,
                type: 'success'
            })
        } catch (e) {
            form.setError(
                'code',
                {
                    type: 'manual',
                    message: messages.checkCode
                },
                {shouldFocus: true}
            )
        }
    }

    const removePromoCode = async (couponItemId) => {
        removePromoCodeMutation.mutate(
            {
                parameters: {basketId: basket?.basketId, couponItemId}
            },
            {
                onSuccess: () => {
                    toast({
                        title: messages.promoRemoved,
                        type: 'success'
                    })
                },
                onError: () => {
                    toast({
                        title: messages.apiError,
                        type: 'error'
                    })
                }
            }
        )
    }

    return {form, submitPromoCode, removePromoCode}
}

export const PromoCode = ({form, submitPromoCode, itemProps}) => {
    const intl = useIntl()
    const {formatMessage} = intl

    const messages = useMemo(
        () => ({
            havePromoCode: formatMessage({
                id: 'promocode.accordion.button.have_promocode',
                defaultMessage: 'Do you have a promo code?'
            })
        }),
        [intl]
    )

    return (
        <Accordion.Root collapsible>
            <Accordion.Item {...itemProps}>
                <Accordion.ItemTrigger asChild>
                    <Button
                        justifyContent="flex-start"
                        fontSize="sm"
                        lineHeight="4"
                        onClick={() => form.reset()}
                        variant="link"
                        color="blue.700"
                        fw="400"
                        pl="0"
                    >
                        {messages.havePromoCode}
                        <Accordion.ItemIndicator asChild>
                            <ChevronDownIcon color="blue.700" />
                        </Accordion.ItemIndicator>
                    </Button>
                </Accordion.ItemTrigger>
                <Accordion.ItemContent px={0} mb={4}>
                    <Accordion.ItemBody>
                        <Box
                            data-testid="promo-code-form"
                            as="form"
                            p={4}
                            background="white"
                            border="1px solid"
                            borderColor="gray.100"
                            borderRadius="sm"
                            onSubmit={form.handleSubmit(submitPromoCode)}
                        >
                            <PromoCodeFields form={form} maxWidth="350px" />
                        </Box>
                    </Accordion.ItemBody>
                </Accordion.ItemContent>
            </Accordion.Item>
        </Accordion.Root>
    )
}

PromoCode.propTypes = {
    /** The form object returned from `usePromoCode` hook */
    form: PropTypes.object.isRequired,

    /** The submit callback returned from `usePromoCode` hook */
    submitPromoCode: PropTypes.func.isRequired,

    /** Props applied to inner AccordionItem. Useful for style overrides. */
    itemProps: PropTypes.object
}

export default PromoCode
