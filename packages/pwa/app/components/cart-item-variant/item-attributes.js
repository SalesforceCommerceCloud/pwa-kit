/* eslint-disable no-unused-vars */
import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
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
    Text,
    Portal
} from '@chakra-ui/react'
import {useCartItemVariant} from './'
import {InfoIcon} from '../icons'

/**
 * In the context of a cart product item variant, this component renders a styled
 * list of the selected variation values as well as any promos (w/ info popover).
 */
const ItemAttributes = ({includeQuantity, ...props}) => {
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
            let ids
            if (variant.priceAdjustments?.length > 0) {
                ids = variant.priceAdjustments
                    .map((adj) => adj.promotionId)
                    .filter((id) => {
                        return !promos.find((promo) => promo.id === id)
                    })
            }
            if (ids && ids.length > 0) {
                const promos = await basket.getPromotions(ids)
                if (promos?.data) {
                    setPromos(promos.data)
                }
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

            {includeQuantity && (
                <Text lineHeight={1} color="gray.700" fontSize="sm">
                    <FormattedMessage
                        defaultMessage="Quantity: {quantity}"
                        values={{quantity: variant.quantity}}
                    />
                </Text>
            )}

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
                        <Popover
                            placement="top"
                            boundary="scrollParent"
                            trigger="hover"
                            variant="small"
                        >
                            <PopoverTrigger>
                                <IconButton
                                    icon={
                                        <InfoIcon
                                            display="block"
                                            boxSize="18px"
                                            mt="-2px"
                                            ml="-1px"
                                            color="gray.600"
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
                            <Portal>
                                <PopoverContent border="none" borderRadius="base">
                                    <Box boxShadow="lg" zIndex="-1">
                                        <PopoverArrow />
                                        <PopoverCloseButton />
                                        <PopoverHeader borderBottom="none">
                                            <Text fontWeight="bold" fontSize="md">
                                                <FormattedMessage defaultMessage="Promotions Applied" />
                                            </Text>
                                        </PopoverHeader>
                                        <PopoverBody pt={0}>
                                            <Stack>
                                                {promos?.map((promo) => (
                                                    <Text key={promo?.id} fontSize="sm">
                                                        {promo?.calloutMsg}
                                                    </Text>
                                                ))}
                                            </Stack>
                                        </PopoverBody>
                                    </Box>
                                </PopoverContent>
                            </Portal>
                        </Popover>
                    </Box>
                </Flex>
            )}
        </Stack>
    )
}

ItemAttributes.propTypes = {
    includeQuantity: PropTypes.bool
}

export default ItemAttributes
