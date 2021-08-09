import React, {Fragment} from 'react'
import {FormattedMessage, FormattedNumber} from 'react-intl'
import {Stack, Text} from '@chakra-ui/react'
import PropTypes from 'prop-types'

const CartItemPrice = ({totalPrice, basePrice, currency}) => {
    return (
        <Fragment>
            <Stack textAlign="right" spacing={0}>
                <Text fontWeight="bold">
                    <FormattedNumber style="currency" currency="USD" value={totalPrice} />
                </Text>
                {totalPrice !== basePrice && (
                    <Text fontSize="14px">
                        <FormattedMessage defaultMessage="each" />{' '}
                        <FormattedNumber style="currency" currency={currency} value={basePrice} />
                    </Text>
                )}
                {/* <Text marginRight={4} fontSize="14px" as="s" color="gray.200">
                    $10.00
                </Text> */}
            </Stack>
        </Fragment>
    )
}

CartItemPrice.propTypes = {
    totalPrice: PropTypes.number,
    basePrice: PropTypes.number,
    currency: PropTypes.string
}

export default CartItemPrice
