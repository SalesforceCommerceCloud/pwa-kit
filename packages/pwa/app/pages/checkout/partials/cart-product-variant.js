import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, FormattedNumber} from 'react-intl'
import useBasket from '../../../commerce-api/hooks/useBasket'
import {AspectRatio, Flex, Image, Stack, Text} from '@chakra-ui/react'

const CartProductVariant = ({item}) => {
    const basket = useBasket()

    if (!basket._productItemsDetail) {
        return null
    }

    const product = basket._productItemsDetail[item.productId]
    const image = product.imageGroups?.find((group) => group.viewType === 'small').images[0]

    const variationValues = Object.keys(product.variationValues).map((key) => {
        const value = product.variationValues[key]
        const attr = product.variationAttributes?.find((attr) => attr.id === key)
        return {
            id: key,
            name: attr?.name || key,
            value: attr.values.find((val) => val.value === value)?.name || value
        }
    })

    return (
        <Flex width="full" align="flex-start">
            {image && (
                <AspectRatio ratio={1} width="84px" mr={2}>
                    <Image alt={image.alt} src={image.disBaseLink} ignoreFallback={true} />
                </AspectRatio>
            )}
            <Stack spacing={0} flex={1}>
                <Text fontWeight="bold">{product.name}</Text>
                {variationValues.map((variationValue) => (
                    <Text fontSize="sm" key={variationValue.id}>
                        {variationValue.value}
                    </Text>
                ))}
                <Text fontSize="sm">
                    <FormattedMessage defaultMessage="Qty" />: {item.quantity}
                </Text>
            </Stack>
            <Text fontWeight="bold">
                <FormattedNumber
                    value={item.price * item.quantity}
                    style="currency"
                    currency={basket.currency}
                />
            </Text>
        </Flex>
    )
}

CartProductVariant.propTypes = {
    item: PropTypes.object.isRequired
}

export default CartProductVariant
