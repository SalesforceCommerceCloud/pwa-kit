/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'

import {Button, HStack, NumberInput, useSlotRecipe} from '@chakra-ui/react'
import {FormattedMessage, useIntl} from 'react-intl'
import PropTypes from 'prop-types'

/**
 * This is the mobile implementation of the Chakra NumberInput. This simple component essentially
 * is a helper so we don't have to reuse the hooks every time we need a number input since design dictates
 * we use the mobile variation on all screens.
 *
 * NOTE: We can optionally put global logic we see if in here, and various styling decisions in this single
 * component.
 *
 * @param {*} props
 * @returns
 */
const QuantityPicker = (props) => {
    const intl = useIntl()
    const recipe = useSlotRecipe({key: 'quantityPicker'})

    const {productName, ...rest} = props
    const styles = recipe()

    return (
        <NumberInput.Root
            unstyled
            css={styles.root}
            focusInputOnChange={false}
            onFocus={(e) => {
                // eslint-disable-next-line react/prop-types
                const {onFocus} = props

                // This is useful for mobile devices, this allows the user to pop open the keyboard and set the
                // new quantity with one click.
                e.target.select()

                // If there is a `onFocus` property define, call it with the event captured.
                // eslint-disable-next-line react/prop-types
                onFocus?.call(this, e)
            }}
            {...rest}
        >
            <HStack>
                <NumberInput.DecrementTrigger asChild>
                    <Button
                        css={styles.decrementTrigger}
                        data-testid="quantity-decrement"
                        variant="outline"
                        ariaLabel={intl.formatMessage(
                            {
                                defaultMessage: 'Decrement Quantity for {productName}',
                                id: 'product_view.label.assistive_msg.quantity_decrement'
                            },
                            {productName}
                        )}
                    >
                        <FormattedMessage
                            id="product_view.label.quantity_decrement"
                            defaultMessage={'\u2212'} // HTML &minus;
                        />
                    </Button>
                </NumberInput.DecrementTrigger>
                <NumberInput.Input
                    css={styles.input}
                    ariaLabel={intl.formatMessage({
                        defaultMessage: 'Quantity',
                        id: 'product_view.label.quantity'
                    })}
                    maxWidth={'44px'}
                    textAlign="center"
                />
                <NumberInput.IncrementTrigger asChild>
                    <Button
                        css={styles.incrementTrigger}
                        data-testid="quantity-increment"
                        variant="outline"
                        ariaLabel={intl.formatMessage(
                            {
                                defaultMessage: 'Increment Quantity for {productName}',
                                id: 'product_view.label.assistive_msg.quantity_increment'
                            },
                            {productName}
                        )}
                    >
                        <FormattedMessage
                            id="product_view.label.quantity_increment"
                            defaultMessage="+"
                        />
                    </Button>
                </NumberInput.IncrementTrigger>
            </HStack>
        </NumberInput.Root>
    )
}

QuantityPicker.propTypes = {
    productName: PropTypes.string
}

export default QuantityPicker
