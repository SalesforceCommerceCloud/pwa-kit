import React from 'react'
import ImageGallery from '../image-gallary'
import ProductTitle from '../product-title'
import {Flex, Box, VStack, useStyleConfig, useMultiStyleConfig} from '@chakra-ui/react'
import {useTheme} from '@chakra-ui/react'
import {useProduct} from '../../hooks/use-product'

function ProductView(props) {
    console.log('ProductView props', props)

    const {imageGallery, productTitle, variant} = props
    const {product, variationParams} = useProduct(props.product)
    const styles = useMultiStyleConfig('ProductView', {variant})
    // console.log('styles', styles)
    // console.log('useTheme()', useTheme())
    return (
        <Flex data-testid="product-view" {...styles.container}>
            {/* Basic information etc. title, price, breadcrumb*/}
            <Box {...styles.headingWrapperMobile}>
                {productTitle ? productTitle : <ProductTitle product={product} />}
            </Box>
            <Flex direction={['column', 'column', 'column', 'row']}>
                <Box {...styles.imageGallery}>
                    {product ? (
                        <>
                            {imageGallery ? (
                                imageGallery
                            ) : (
                                <ImageGallery
                                    size={'md'}
                                    imageGroups={product.imageGroups}
                                    selectedVariationAttributes={variationParams}
                                />
                            )}
                        </>
                    ) : (
                        <div>LOADING...</div>
                    )}
                </Box>

                {/* Variations & Quantity Selector */}
                <VStack {...styles.buySection}>
                    <Box {...styles.headingWrapperDesktop}>
                        {productTitle ? productTitle : <ProductTitle product={product} />}
                    </Box>
                </VStack>
            </Flex>
        </Flex>
    )
}

export default ProductView
