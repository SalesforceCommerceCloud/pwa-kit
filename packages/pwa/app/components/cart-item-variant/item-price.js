import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, FormattedNumber} from 'react-intl'
import {Stack, Text} from '@chakra-ui/react'
import useBasket from '../../commerce-api/hooks/useBasket'
import {useCartItemVariant} from '.'

/**
 * In the context of a cart product item variant, this component renders the item's
 * pricing, taking into account applied discounts as well as base item prices.
 */
const ItemPrice = ({currency, ...props}) => {
    const variant = useCartItemVariant()
    const basket = useBasket()

    const {price, basePrice, priceAfterItemDiscount} = variant

    const displayPrice = priceAfterItemDiscount ? Math.min(price, priceAfterItemDiscount) : price

    const hasDiscount = displayPrice !== price

    return (
        <Stack
            textAlign="right"
            direction={hasDiscount ? 'column' : 'row'}
            justifyContent="flex-end"
            alignItems="baseline"
            spacing={hasDiscount ? 0 : 1}
            wrap="row"
            {...props}
        >
            <Text fontWeight="bold">
                <FormattedNumber
                    style="currency"
                    currency={currency || basket.currency}
                    value={displayPrice}
                />
                {hasDiscount && (
                    <Text
                        as="span"
                        fontSize="sm"
                        fontWeight="normal"
                        textDecoration="line-through"
                        color="gray.500"
                        marginLeft={1}
                    >
                        <FormattedNumber
                            style="currency"
                            currency={currency || basket.currency}
                            value={price}
                        />
                    </Text>
                )}
            </Text>

            {basePrice && price !== basePrice && (
                <Text fontSize="14px">
                    <FormattedNumber
                        style="currency"
                        currency={currency || basket.currency}
                        value={basePrice}
                    />
                    <FormattedMessage
                        defaultMessage="ea"
                        description="Abbreviated 'each', follows price per item, like $10/ea"
                    />
                </Text>
            )}
        </Stack>
    )
}

ItemPrice.propTypes = {
    currency: PropTypes.string
}

export default ItemPrice
