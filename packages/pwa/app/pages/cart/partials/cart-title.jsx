import React from 'react'
import {FormattedMessage, FormattedPlural} from 'react-intl'
import {Text} from '@chakra-ui/react'
import useBasket from '../../../commerce-api/hooks/useBasket'

const CartTitle = () => {
    const basket = useBasket()
    return (
        <Text fontWeight="bold" fontSize={['xl', '2xl']}>
            <FormattedMessage defaultMessage="Cart" /> ({basket.itemAccumulatedCount}
            <FormattedPlural value={basket.itemAccumulatedCount} one=" Item)" other=" Items)" />
        </Text>
    )
}

export default CartTitle
