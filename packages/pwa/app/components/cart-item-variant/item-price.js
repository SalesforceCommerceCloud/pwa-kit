import React from 'react'
import {FormattedMessage, FormattedNumber} from 'react-intl'
import {Box, Text} from '@chakra-ui/react'
import useBasket from '../../commerce-api/hooks/useBasket'
import {useCartItemVariant} from '.'

/**
 * In the context of a cart product item variant, this component renders the item's
 * pricing, taking into account applied discounts as well as base item prices.
 *
 * @todo - The applied discounts and base pricing needs further investigation to ensure
 * we're properly handling the most common storefront configurations.
 */
const ItemPrice = (props) => {
    const variant = useCartItemVariant()
    const basket = useBasket()

    const {price, basePrice, priceAfterItemDiscount} = variant

    const displayPrice = Math.min(price, priceAfterItemDiscount)

    return (
        <Box textAlign="right" {...props}>
            <Text fontWeight="bold">
                <FormattedNumber style="currency" currency={basket.currency} value={displayPrice} />
                {displayPrice !== price && (
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
                            currency={basket.currency}
                            value={price}
                        />
                    </Text>
                )}
            </Text>

            {price !== basePrice && (
                <Text fontSize="14px">
                    <FormattedNumber
                        style="currency"
                        currency={basket.currency}
                        value={basePrice}
                    />
                    <FormattedMessage
                        defaultMessage="ea"
                        description="Abbreviated 'each', follows price per item, like $10/ea"
                    />
                </Text>
            )}
        </Box>
    )
}

export default ItemPrice
