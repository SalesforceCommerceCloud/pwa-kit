import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, FormattedNumber} from 'react-intl'
import {AspectRatio, Flex, Image, Stack, Text} from '@chakra-ui/react'

const CartProductVariant = ({item, variant}) => {
    if (!variant) {
        return null
    }

    const image = variant.imageGroups?.find((group) => group.viewType === 'small').images[0]

    const variationValues = Object.keys(variant.variationValues).map((key) => {
        const value = variant.variationValues[key]
        const attr = variant.variationAttributes?.find((attr) => attr.id === key)
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
                <Text fontWeight="bold">{variant.name}</Text>
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
                    currency={variant.currency}
                />
            </Text>
        </Flex>
    )
}

CartProductVariant.propTypes = {
    item: PropTypes.object.isRequired,
    variant: PropTypes.object
}

export default CartProductVariant
