import React, {useState} from 'react'
import {FormattedMessage} from 'react-intl'
import {
    Box,
    Flex,
    Button,
    Stack,
    Text,
    Select,
    Checkbox,
    Badge,
    Image,
    Alert,
    AlertIcon,
    AlertDescription,
    AspectRatio,
    CircularProgress,
    CloseButton
} from '@chakra-ui/react'
import CartItemPrice from './cart-item-price'
import useBasket from '../../../commerce-api/hooks/useBasket'
import PropTypes from 'prop-types'

const CartItem = ({product}) => {
    const basket = useBasket()
    const [showError, setShowError] = useState(false)
    const [showLoading, setShowLoading] = useState(false)
    const productImage = product.imageGroups?.find((group) => group.viewType === 'large').images[0]

    // const promotionalCallouts = product.productPromotions?.map((promo) => promo.calloutMsg)

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
        <Box data-testid="sf-cart-item" position="relative">
            {showLoading && (
                <CircularProgress
                    position="absolute"
                    top="50%"
                    left="50%"
                    isIndeterminate
                    zIndex="9999"
                    margin="-25px 0 0 -25px"
                />
            )}
            <Stack
                borderRadius="4px"
                borderColor="gray.100"
                borderWidth="1px"
                opacity={showLoading ? '0.2' : '1.0'}
                align="flex-start"
                backgroundColor="white"
                padding={[4, 6]}
            >
                {showError && (
                    <Alert
                        status="error"
                        marginBottom={6}
                        backGroundColor="red.50"
                        border="1px solid"
                        borderColor="red.600"
                        borderRadius="4px"
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

                <Flex width="full" backgroundColor="white">
                    <Box
                        marginBottom="62px"
                        width={['88px', '136px']}
                        height={['88px', '136px']}
                        backgroundColor="gray.100"
                        marginRight={4}
                    >
                        {product.c_isSale && (
                            <Badge
                                position="absolute"
                                fontSize="10px"
                                ml={3}
                                marginTop={2}
                                variant="solid"
                                colorScheme="blue"
                            >
                                <FormattedMessage defaultMessage="Sale" />
                            </Badge>
                        )}

                        {/* Client Image */}
                        <AspectRatio ratio={1}>
                            <Image
                                alt={productImage?.alt}
                                src={productImage?.disBaseLink}
                                ignoreFallback={true}
                            />
                        </AspectRatio>
                    </Box>
                    <Stack marginLeft={[4, 6]} spacing={2} flex={1}>
                        <Text lineHeight={1} fontWeight="bold">
                            {product.name}
                        </Text>
                        <Text lineHeight={1} color="gray.700" fontSize="sm">
                            {product.c_refinementColor}
                        </Text>
                        <Text lineHeight={1} color="gray.700" fontSize="sm">
                            <FormattedMessage defaultMessage="Size" /> {product.c_size}
                        </Text>
                        <Text lineHeight={1} color="gray.700" fontSize="sm" paddingTop={2}>
                            <FormattedMessage defaultMessage="Quantity:" />
                        </Text>

                        <Flex align="flex-end" justify="space-between">
                            <Select
                                onChange={(e) => changeItemQuantity(e.target.value, product)}
                                value={product.quantity}
                                width={['90px']}
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
                            {/* <Text fontSize="12">Out of stock</Text> */}
                            {/* {promotionalCallouts &&
                                promotionalCallouts.map((msg, index) => (
                                    <Text key={index} color="gray.700" fontSize="12">
                                        {msg}
                                    </Text>
                                ))} */}

                            <CartItemPrice
                                currency={basket.currency}
                                totalPrice={product.price}
                                basePrice={product.basePrice}
                            />
                        </Flex>
                        <Flex
                            justify={['left', 'left', 'space-between', 'space-between']}
                            marginTop={3}
                            borderBottom={['1px', '1px', '0px']}
                            borderBottomColor={['gray.100', 'gray.100']}
                        >
                            <Box marginTop={[1, 3, 3]}>
                                <Button
                                    onClick={() => removeItem(product)}
                                    variant="link"
                                    size="xs"
                                >
                                    <FormattedMessage defaultMessage="Remove" />
                                </Button>
                                {/* <Button marginLeft={4} variant="link" size="xs">
                                Save for later
                            </Button>
                            <Button marginLeft={4} variant="link" size="xs">
                                Edit
                            </Button> */}
                            </Box>
                            <Checkbox
                                display={['none', 'none', 'flex', 'flex']}
                                size="sm"
                                marginTop="12px"
                            >
                                <FormattedMessage defaultMessage="This is a gift." />
                                <Button marginLeft={1} variant="link" size="sm">
                                    <FormattedMessage defaultMessage="Learn more" />
                                </Button>
                            </Checkbox>
                        </Flex>
                        <Checkbox isDisabled display={['flex', 'flex', 'none', 'none']} size="sm">
                            <FormattedMessage defaultMessage="This is a gift." />
                            <Button marginLeft={1} variant="link" size="xs">
                                <FormattedMessage defaultMessage="Learn more" />
                            </Button>
                        </Checkbox>
                    </Stack>
                </Flex>
            </Stack>
        </Box>
    )
}

CartItem.propTypes = {
    product: PropTypes.object
}

export default CartItem
