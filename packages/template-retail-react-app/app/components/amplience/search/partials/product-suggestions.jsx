import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {
    Text,
    Stack,
    Box,
    HStack,
    VStack,
    Skeleton,
    AspectRatio,
    SimpleGrid,
    useBreakpointValue,
    SkeletonText,
    Image,
    usePrevious
} from '@chakra-ui/react'
import {useCommerceAPI} from '../../../../commerce-api/contexts'
import {handleAsyncError} from '../../../../commerce-api/utils'
import {productUrlBuilder} from '../../../../utils/url'
import {useCurrency} from '../../../../hooks'
import {useIntl} from 'react-intl'
import _ from 'lodash'

const selectImage = (product) => {
    const groups = product.imageGroups
    if (groups == null || groups.length === 0) {
        return {}
    }

    const desiredViewType = 'large'
    const desiredGroup = groups.find((group) => group.viewType === desiredViewType) ?? groups[0]

    return desiredGroup.images[0]
}

const ProductSuggestions = ({suggestions, closeAndNavigate}) => {
    if (!suggestions) {
        return null
    }
    const api = useCommerceAPI()
    const [apiProducts, setApiProducts] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const isMobile = useBreakpointValue({base: true, lg: false, xl: false, xxl: false, xxxl: false})
    const {currency: activeCurrency} = useCurrency()
    const intl = useIntl()
    const previousSuggestions = usePrevious(suggestions)

    useEffect(() => {
        if (previousSuggestions && _.isEqual(previousSuggestions, suggestions)) {
            // No need to reload the suggestions if they are identical.
            return
        }

        let active = true

        if (suggestions?.length === 0) {
            // No products likely means that the IDs haven't arrived yet.
            setApiProducts([])
            setIsLoading(true)
            return
        }

        handleAsyncError(async () => {
            const products = suggestions.map((suggestion) => suggestion.productId)
            const response = await api.shopperProducts.getProducts({
                parameters: {ids: products.join(',')}
            })

            if (active) {
                const products = response.data.map((product) => ({
                    ...product,
                    productId: product.id,
                    link: productUrlBuilder({id: product.id}),
                    image: selectImage(product)
                }))

                setApiProducts(products)
                setIsLoading(false)
            }
        })()

        return () => (active = false)
    }, [api, suggestions])

    return (
        <>
            <SimpleGrid columns={{sm: 1, lg: 3}} spacing={2}>
                {isLoading &&
                    !isMobile &&
                    [...new Array(6)].map((item, i) => (
                        <Stack key={i}>
                            <AspectRatio ratio={1}>
                                <Skeleton />
                            </AspectRatio>
                            <SkeletonText noOfLines={2} />
                        </Stack>
                    ))}
                {isLoading && isMobile && (
                    <Box w={'100%'} alignItems={'flex-start'}>
                        {[...new Array(6)].map((item, i) => (
                            <HStack key={i} h={'48px'} gap={4}>
                                <Skeleton w={'40px'} h={'40px'} />
                                <SkeletonText w={'100px'} noOfLines={1} />
                                <SkeletonText w={'50px'} noOfLines={1} />
                            </HStack>
                        ))}
                    </Box>
                )}
                {apiProducts &&
                    apiProducts.map((item, i) => (
                        <Box key={i} w={'100%'} alignItems={'flex-start'}>
                            {!isMobile && (
                                <VStack
                                    style={{cursor: 'pointer'}}
                                    onMouseDown={() => closeAndNavigate(item.link)}
                                >
                                    <Box w={'140px'} h={'140px'} style={{minWidth: '140px'}}>
                                        <AspectRatio ratio={1}>
                                            <Image
                                                src={item.image.link}
                                                width={140}
                                                alt={item.image.alt}
                                            />
                                        </AspectRatio>
                                    </Box>
                                    <Text
                                        fontSize={'xs'}
                                        sx={{width: '100%', textAlign: 'left'}}
                                        fontWeight={700}
                                    >
                                        {item.name}
                                    </Text>
                                    <Text fontSize={'xs'} sx={{width: '100%', textAlign: 'left'}}>
                                        {intl.formatNumber(item.price, {
                                            style: 'currency',
                                            currency: item.currency || activeCurrency
                                        })}
                                    </Text>
                                </VStack>
                            )}
                            {isMobile && (
                                <HStack
                                    h={'40px'}
                                    gap={4}
                                    style={{cursor: 'pointer'}}
                                    onMouseDown={() => closeAndNavigate(item.link)}
                                >
                                    <Box w={'40px'} style={{minWidth: '40px'}}>
                                        <Image
                                            src={item.image.link}
                                            width={40}
                                            alt={item.image.alt}
                                        />
                                    </Box>
                                    <Text fontSize="xs" fontWeight={700}>
                                        {item.name}
                                    </Text>
                                    <Text fontSize="xs">
                                        {intl.formatNumber(item.price, {
                                            style: 'currency',
                                            currency: item.currency || activeCurrency
                                        })}
                                    </Text>
                                </HStack>
                            )}
                        </Box>
                    ))}
            </SimpleGrid>
        </>
    )
}

ProductSuggestions.propTypes = {
    suggestions: PropTypes.array,
    closeAndNavigate: PropTypes.func
}

export default ProductSuggestions