import React from 'react'
import {FormattedMessage, FormattedPlural} from 'react-intl'
import {Text} from '@chakra-ui/react'
import useBasket from '../../../commerce-api/hooks/useBasket'

const CartTitle = () => {
    const basket = useBasket()
    return (
        <Text fontWeight="bold" fontSize={['xl', 'xl', 'xl', '2xl']}>
            <FormattedMessage defaultMessage="Cart" /> ({basket.itemAccumulatedCount}
            {/* TODO: [l10n] implement using FormattedMessage instead, so that it will be able to be extracted
            (for example, see https://github.com/mobify/mobify-platform-sdks/blob/27b836e9e624aaa7f90e301033bd42654432d1c0/packages/pwa/app/pages/checkout/confirmation.js#L220)
            */}
            <FormattedPlural value={basket.itemAccumulatedCount} one=" Item)" other=" Items)" />
        </Text>
    )
}

export default CartTitle
