/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {Accordion, Box, Span, Stack} from '@chakra-ui/react'
import {useIntl} from 'react-intl'

const InformationAccordion = ({product}) => {
    const {formatMessage} = useIntl()

    return (
        <Stack direction="row" spacing={[0, 0, 0, 16]}>
            <Accordion.Root collapsible multiple maxWidth={'896px'} flex={[1, 1, 1, 5]}>
                {/* Details */}
                <Accordion.Item key="details" value="details">
                    <Accordion.ItemTrigger height="64px">
                        <Span flex="1" textAlign="left" fontWeight="bold" fontSize="lg">
                            {formatMessage({
                                defaultMessage: 'Product Detail',
                                id: 'product_detail.accordion.button.product_detail'
                            })}
                        </Span>
                        <Accordion.ItemIndicator />
                    </Accordion.ItemTrigger>
                    <Accordion.ItemContent>
                        <Accordion.ItemBody>
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: product?.longDescription
                                }}
                            />
                        </Accordion.ItemBody>
                    </Accordion.ItemContent>
                </Accordion.Item>

                {/* Size & Fit */}
                <Accordion.Item key="size&fit" value="size&fit">
                    <Accordion.ItemTrigger height="64px">
                        <Span flex="1" textAlign="left" fontWeight="bold" fontSize="lg">
                            {formatMessage({
                                defaultMessage: 'Size & Fit',
                                id: 'product_detail.accordion.button.size_fit'
                            })}
                        </Span>
                        <Accordion.ItemIndicator />
                    </Accordion.ItemTrigger>
                    <Accordion.ItemContent>
                        <Accordion.ItemBody>
                            {formatMessage({
                                defaultMessage: 'Coming Soon',
                                id: 'product_detail.accordion.message.coming_soon'
                            })}
                        </Accordion.ItemBody>
                    </Accordion.ItemContent>
                </Accordion.Item>

                {/* Reviews */}
                <Accordion.Item key="reviews" value="reviews">
                    <Accordion.ItemTrigger height="64px">
                        <Span flex="1" textAlign="left" fontWeight="bold" fontSize="lg">
                            {formatMessage({
                                defaultMessage: 'Reviews',
                                id: 'product_detail.accordion.button.reviews'
                            })}
                        </Span>
                        <Accordion.ItemIndicator />
                    </Accordion.ItemTrigger>
                    <Accordion.ItemContent>
                        <Accordion.ItemBody>
                            {formatMessage({
                                defaultMessage: 'Coming Soon',
                                id: 'product_detail.accordion.message.coming_soon'
                            })}
                        </Accordion.ItemBody>
                    </Accordion.ItemContent>
                </Accordion.Item>

                {/* Questions */}
                <Accordion.Item key="questions" value="questions">
                    <Accordion.ItemTrigger height="64px">
                        <Span flex="1" textAlign="left" fontWeight="bold" fontSize="lg">
                            {formatMessage({
                                defaultMessage: 'Questions',
                                id: 'product_detail.accordion.button.questions'
                            })}
                        </Span>
                        <Accordion.ItemIndicator />
                    </Accordion.ItemTrigger>
                    <Accordion.ItemContent>
                        <Accordion.ItemBody>
                            {formatMessage({
                                defaultMessage: 'Coming Soon',
                                id: 'product_detail.accordion.message.coming_soon'
                            })}
                        </Accordion.ItemBody>
                    </Accordion.ItemContent>
                </Accordion.Item>
            </Accordion.Root>

            <Box display={['none', 'none', 'none', 'block']} flex={4}></Box>
        </Stack>
    )
}

InformationAccordion.propTypes = {
    product: PropTypes.object
}

export default InformationAccordion
