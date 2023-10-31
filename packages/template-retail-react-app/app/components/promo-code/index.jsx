/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, useIntl} from 'react-intl'
import {
    Box,
    Button,
    Accordion,
    AccordionButton,
    AccordionItem,
    AccordionPanel,
    useToast
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useForm} from 'react-hook-form'
import {ChevronDownIcon, ChevronUpIcon} from '@salesforce/retail-react-app/app/components/icons'
import PromoCodeFields from '@salesforce/retail-react-app/app/components/forms/promo-code-fields'
import {API_ERROR_MESSAGE} from '@salesforce/retail-react-app/app/constants'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'

export const usePromoCode = () => {
    const {formatMessage} = useIntl()
    const {data: basket} = useCurrentBasket()
    const form = useForm()
    const toast = useToast()

    const applyPromoCodeMutation = useShopperBasketsMutation('addCouponToBasket')
    const removePromoCodeMutation = useShopperBasketsMutation('removeCouponFromBasket')

    const submitPromoCode = async ({code}) => {
        applyPromoCodeMutation.mutate(
            {
                parameters: {basketId: basket?.basketId},
                body: {
                    code
                }
            },
            {
                onSuccess: () => {
                    form.reset({code: ''})
                    toast({
                        title: formatMessage({
                            defaultMessage: 'Promotion applied',
                            id: 'use_promocode.info.promo_applied'
                        }),
                        status: 'success',
                        position: 'top-right',
                        isClosable: true
                    })
                },
                onError: () => {
                    form.setError('code', {
                        type: 'manual',
                        message: formatMessage({
                            defaultMessage:
                                'Check the code and try again, it may already be applied or the promo has expired.',
                            id: 'use_promocode.error.check_the_code'
                        })
                    })
                }
            }
        )
    }

    const removePromoCode = async (couponItemId) => {
        removePromoCodeMutation.mutate(
            {
                parameters: {basketId: basket?.basketId, couponItemId}
            },
            {
                onSuccess: () => {
                    toast({
                        title: formatMessage({
                            defaultMessage: 'Promotion removed',
                            id: 'use_promocode.info.promo_removed'
                        }),
                        status: 'success',
                        position: 'top-right',
                        isClosable: true
                    })
                },
                onError: () => {
                    toast({
                        title: formatMessage(API_ERROR_MESSAGE),
                        status: 'error',
                        position: 'top-right',
                        isClosable: true
                    })
                }
            }
        )
    }

    return {form, submitPromoCode, removePromoCode}
}

export const PromoCode = ({form, submitPromoCode, itemProps}) => {
    const [isOpen, setOpen] = useState()

    useEffect(() => {
        if (form.formState.isSubmitSuccessful) {
            setOpen(false)
        }
    }, [form.formState.isSubmitSuccessful])

    return (
        <Accordion allowToggle index={isOpen ? 0 : -1} onChange={() => setOpen(!isOpen)}>
            <AccordionItem {...itemProps}>
                {({isExpanded}) => (
                    <>
                        <AccordionButton
                            as={Button}
                            justifyContent="flex-start"
                            variant="link"
                            fontSize="sm"
                            rightIcon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                            onClick={() => form.reset()}
                        >
                            <FormattedMessage
                                defaultMessage="Do you have a promo code?"
                                id="promocode.accordion.button.have_promocode"
                            />
                        </AccordionButton>

                        <AccordionPanel px={0} mb={4}>
                            <Box
                                data-testid="promo-code-form"
                                as="form"
                                p={4}
                                background="white"
                                border="1px solid"
                                borderColor="gray.100"
                                borderRadius="base"
                                onSubmit={form.handleSubmit(submitPromoCode)}
                            >
                                <PromoCodeFields form={form} maxWidth="350px" />
                            </Box>
                        </AccordionPanel>
                    </>
                )}
            </AccordionItem>
        </Accordion>
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
