import React from 'react'
import {Box, Text, Flex} from '@chakra-ui/react'
import PropTypes from 'prop-types'

const calculatePromotionDetails = (promotion, basePrice) => {
    const currentPrice = basePrice || 0
    const discountValue = parseFloat(promotion.discount)
    const discountAmount = promotion.discountType === 'PERCENT'
        ? (currentPrice * discountValue) / 100
        : discountValue
    
    return {
        currentPrice,
        discountAmount,
        discountedPrice: currentPrice - discountAmount,
        formattedDiscount: promotion.discountType === 'PERCENT' 
            ? `${promotion.discount}% OFF`
            : `$${promotion.discount} OFF`
    }
}

const CustomPromotions = ({product}) => {
    if (!product?.c_customPromotions) return null

    return (
        <Box mt={4} p={4} bg="white" borderRadius="md" border="1px" borderColor="gray.200" w="150%">
            {product.c_customPromotions.promotions.map((promotion, index) => {
                const basePrice = product.price || product.priceData?.currentPrice?.value
                const {currentPrice, discountAmount, discountedPrice, formattedDiscount} = 
                    calculatePromotionDetails(promotion, basePrice)
                
                return (
                    <Box key={promotion.id || index}>
                        <Flex align="center" gap={2} mb={2}>
                            <Text fontSize="md" fontWeight="600" color="gray.900">
                                {promotion.name}
                            </Text>
                            <Box
                                bg="green.100"
                                color="green.700"
                                px={2}
                                py={1}
                                borderRadius="full"
                                fontSize="sm"
                                fontWeight="600"
                            >
                                {formattedDiscount}
                            </Box>
                        </Flex>

                        {currentPrice > 0 && (
                            <Flex align="center" gap={3}>
                                <Text fontSize="lg" fontWeight="600" color="gray.900">
                                    ${discountedPrice.toFixed(2)}
                                </Text>
                                <Text fontSize="md" color="gray.400" textDecoration="line-through">
                                    ${currentPrice.toFixed(2)}
                                </Text>
                                <Text fontSize="sm" color="green.600" fontWeight="500">
                                    You saved ${discountAmount.toFixed(2)}
                                </Text>
                            </Flex>
                        )}
                    </Box>
                )
            })}
        </Box>
    )
}

CustomPromotions.propTypes = {
    product: PropTypes.object
}

export default CustomPromotions
