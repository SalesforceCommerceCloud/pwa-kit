import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {
    Box,
    Flex,
    Button,
    Stack,
    Text,
    Select,
    Checkbox,
    Alert,
    AlertIcon,
    AlertDescription,
    Spinner,
    CloseButton,
    Divider
} from '@chakra-ui/react'
import useBasket from '../../../commerce-api/hooks/useBasket'
import CartItemVariant from '../../../components/cart-item-variant/index.js'
import CartItemVariantImage from '../../../components/cart-item-variant/item-image'
import CartItemVariantName from '../../../components/cart-item-variant/item-name'
import CartItemVariantAttributes from '../../../components/cart-item-variant/item-attributes'
import CartItemVariantPrice from '../../../components/cart-item-variant/item-price'

const CartItem = ({product, index}) => {
    const basket = useBasket()
    const [showError, setShowError] = useState(false)
    const [showLoading, setShowLoading] = useState(false)

    const closeAlert = () => {
        setShowError(false)
    }

    const changeItemQuantity = async (quantity, product) => {
        setShowLoading(true)
        if (quantity === 0) {
            await basket.removeItemFromBasket(product.itemId)
        } else {
            const item = {
                productId: product.id,
                quantity: parseInt(quantity)
            }
            try {
                await basket.updateItemInBasket(item, product.itemId)
                setShowLoading(false)
            } catch (err) {
                setShowLoading(false)
                setShowError(true)
            }
        }
    }

    const removeItem = async (product) => {
        setShowLoading(true)
        try {
            await basket.removeItemFromBasket(product.itemId)
            setShowLoading(false)
        } catch (err) {
            setShowError(true)
            setShowLoading(false)
        }
    }

    return (
        <Box position="relative" data-testid={`sf-cart-item-${index}`}>
            <CartItemVariant variant={product}>
                {showLoading && (
                    <Box
                        position="absolute"
                        bg="white"
                        top={0}
                        left={0}
                        width="100%"
                        height="100%"
                        zIndex="9999"
                    >
                        <Spinner
                            position="absolute"
                            top="50%"
                            left="50%"
                            opacity={0.85}
                            color="blue.600"
                            zIndex="9999"
                            margin="-25px 0 0 -25px"
                        />
                    </Box>
                )}
                <Stack layerStyle="card" align="flex-start">
                    {showError && (
                        <Alert
                            status="error"
                            marginBottom={6}
                            backGroundColor="red.50"
                            border="1px solid"
                            borderColor="red.600"
                            borderRadius={1}
                        >
                            <AlertIcon />
                            <Box flex="1">
                                <AlertDescription fontSize="14px">
                                    <FormattedMessage defaultMessage="Something went wrong. Try again." />
                                    <CloseButton
                                        onClick={() => closeAlert()}
                                        size="sm"
                                        position="absolute"
                                        right="6px"
                                        top="6px"
                                    />
                                </AlertDescription>
                            </Box>
                        </Alert>
                    )}

                    <Flex width="full" alignItems="flex-start" backgroundColor="white">
                        <CartItemVariantImage width={['88px', '136px']} mr={4} />

                        <Stack spacing={3} flex={1}>
                            <Stack spacing={1}>
                                <CartItemVariantName />
                                <CartItemVariantAttributes />
                            </Stack>

                            <Flex align="flex-end" justify="space-between">
                                <Stack spacing={1}>
                                    <Text fontSize="sm" color="gray.700">
                                        <FormattedMessage defaultMessage="Quantity:" />
                                    </Text>
                                    <Select
                                        onChange={(e) =>
                                            changeItemQuantity(e.target.value, product)
                                        }
                                        value={product.quantity}
                                        width="75px"
                                    >
                                        <option value="0">0 / Remove</option>
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                        <option value="5">5</option>
                                        <option value="6">6</option>
                                        <option value="7">7</option>
                                        <option value="8">8</option>
                                        <option value="9">9</option>
                                    </Select>
                                </Stack>

                                <CartItemVariantPrice />
                            </Flex>

                            <Stack
                                direction={{base: 'column', lg: 'row'}}
                                alignItems={{base: 'flex-start', lg: 'center'}}
                                justifyContent={{base: 'flex-start', lg: 'space-between'}}
                                divider={<Divider display={{base: 'block', lg: 'none'}} />}
                            >
                                <Box>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => removeItem(product)}
                                    >
                                        <FormattedMessage defaultMessage="Remove" />
                                    </Button>
                                </Box>
                                <Flex alignItems="center">
                                    <Checkbox spacing={2} isReadOnly={true}>
                                        <FormattedMessage defaultMessage="This is a gift." />
                                    </Checkbox>
                                    <Box marginLeft={1}>
                                        <Button marginLeft={1} variant="link" size="sm">
                                            <FormattedMessage defaultMessage="Learn more" />
                                        </Button>
                                    </Box>
                                </Flex>
                            </Stack>
                        </Stack>
                    </Flex>
                </Stack>
            </CartItemVariant>
        </Box>
    )
}

CartItem.propTypes = {
    product: PropTypes.object,
    index: PropTypes.number
}

export default CartItem
