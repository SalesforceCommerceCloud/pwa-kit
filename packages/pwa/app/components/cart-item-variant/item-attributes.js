import React, {useEffect, useState} from 'react'
import {FormattedMessage, FormattedNumber} from 'react-intl'
import useBasket from '../../commerce-api/hooks/useBasket'
import {
    Box,
    Flex,
    IconButton,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
    Stack,
    Text
} from '@chakra-ui/react'
import {useCartItemVariant} from '.'
import {InfoIcon} from '../icons'

/**
 * In the context of a cart product item variant, this component renders a styled
 * list of the selected variation values as well as any promos (w/ info popover).
 */
const ItemAttributes = (props) => {
    const variant = useCartItemVariant()
    const basket = useBasket()
    const [promos, setPromos] = useState([])

    // Create a mapping of variation values to their associated attributes. This allows us
    // the render the readable names/labels rather than variation value IDs.
    const variationValues = Object.keys(variant.variationValues || []).map((key) => {
        const value = variant.variationValues[key]
        const attr = variant.variationAttributes?.find((attr) => attr.id === key)
        return {
            id: key,
            name: attr?.name || key,
            value: attr.values.find((val) => val.value === value)?.name || value
        }
    })

    // Fetch all the promotions given by price adjustments. We display this info in
    // the promotion info popover when applicable.
    useEffect(() => {
        ;(async () => {
            if (variant.priceAdjustments?.length > 0) {
                const ids = variant.priceAdjustments.map((adj) => adj.promotionId)
                const promos = await basket.getPromotions(ids)
                setPromos(promos.data)
            }
        })()
    }, [variant.priceAdjustments])

    return (
        <Stack spacing={1.5} flex={1} {...props}>
            {variationValues?.map((variationValue) => (
                <Text lineHeight={1} color="gray.700" fontSize="sm" key={variationValue.id}>
                    {variationValue.name}: {variationValue.value}
                </Text>
            ))}

            {variant.priceAdjustments?.length > 0 && (
                <Flex alignItems="center">
                    <Text lineHeight={1} color="gray.700" fontSize="sm">
                        <FormattedMessage defaultMessage="Promotions" />
                        {': '}
                        <Text as="span" color="green.500">
                            <FormattedNumber
                                style="currency"
                                currency={basket.currency}
                                value={variant.priceAdjustments[0].price}
                            />
                        </Text>
                    </Text>
                    <Box position="relative" ml={2}>
                        <Popover placement="top" boundary="scrollParent">
                            <PopoverTrigger>
                                <IconButton
                                    icon={
                                        <InfoIcon
                                            display="block"
                                            boxSize="18px"
                                            mt="-2px"
                                            ml="-1px"
                                        />
                                    }
                                    display="block"
                                    size="xs"
                                    height="14px"
                                    width="14px"
                                    minWidth="auto"
                                    position="relative"
                                    variant="unstyled"
                                >
                                    <FormattedMessage defaultMessage="Applied promotions info" />
                                </IconButton>
                            </PopoverTrigger>
                            <PopoverContent border="none" borderRadius="base">
                                <Box boxShadow="lg" zIndex="-1">
                                    <PopoverArrow />
                                    <PopoverCloseButton />
                                    <PopoverHeader borderBottom="none">
                                        <Text fontWeight="bold">
                                            <FormattedMessage defaultMessage="Promotions Applied" />
                                        </Text>
                                    </PopoverHeader>
                                    <PopoverBody pt={0}>
                                        <Stack>
                                            {promos.map((promo) => (
                                                <Text key={promo.id} fontSize="sm">
                                                    {promo.calloutMsg}
                                                </Text>
                                            ))}
                                        </Stack>
                                    </PopoverBody>
                                </Box>
                            </PopoverContent>
                        </Popover>
                    </Box>
                </Flex>
            )}
        </Stack>
    )
}

export default ItemAttributes
