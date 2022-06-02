/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import ImageGallery from '../image-gallary'
import SwatchGroup from '../swatch-group'
import Swatch from '../swatch-group/swatch'

import ProductTitle from '../product-title'
import {Box, Skeleton} from '@chakra-ui/react'
import {useProduct} from '../../hooks/use-product'
import {useHistory} from 'react-router-dom'
import ProductViewLayout from '../../layout/product-view'

const renderSwatchGroup = (props) => {
    const {swatchGroup, variationAttributes} = props
    const history = useHistory()
    return swatchGroup ? (
        swatchGroup
    ) : (
        <>
            {/* Attribute Swatches */}
            {variationAttributes.map((variationAttribute) => {
                const {id, name, selectedValue, values = []} = variationAttribute
                return (
                    <SwatchGroup
                        key={id}
                        onChange={(_, href) => {
                            if (!href) return
                            history.replace(href)
                        }}
                        variant={id === 'color' ? 'circle' : 'square'}
                        value={selectedValue?.value}
                        displayName={selectedValue?.name || ''}
                        label={name}
                    >
                        {values.map(({href, name, image, value, orderable}) => (
                            <Swatch
                                key={value}
                                href={href}
                                disabled={!orderable}
                                value={value}
                                name={name}
                            >
                                {image ? (
                                    <Box
                                        height="100%"
                                        width="100%"
                                        minWidth="32px"
                                        backgroundRepeat="no-repeat"
                                        backgroundSize="cover"
                                        backgroundColor={name.toLowerCase()}
                                        backgroundImage={
                                            image ? `url(${image.disBaseLink || image.link})` : ''
                                        }
                                    />
                                ) : (
                                    name
                                )}
                            </Swatch>
                        ))}
                    </SwatchGroup>
                )
            })}
        </>
    )
}

function ProductView(props) {
    const {imageGallery, productTitle, swatchGroup, actionButtons} = props
    const {product, variationParams, variationAttributes, showLoading} = useProduct(props.product)

    return (
        <ProductViewLayout>
            <ProductViewLayout.Header>
                {productTitle ? productTitle : <ProductTitle product={product} />}
            </ProductViewLayout.Header>

            <ProductViewLayout.ImageGallery>
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
            </ProductViewLayout.ImageGallery>
            <ProductViewLayout.SwatchGroup>
                {showLoading ? (
                    <>
                        {/* First Attribute Skeleton */}
                        <Skeleton height={6} width={32} />
                        <Skeleton height={20} width={64} />

                        {/* Second Attribute Skeleton */}
                        <Skeleton height={6} width={32} />
                        <Skeleton height={20} width={64} />
                    </>
                ) : (
                    renderSwatchGroup({swatchGroup, variationAttributes})
                )}
            </ProductViewLayout.SwatchGroup>
        </ProductViewLayout>
    )
    // return (
    //     <Flex data-testid="product-view" {...styles.container}>
    //         {/* Basic information etc. title, price, breadcrumb*/}
    //         <Box {...styles.headingWrapperMobile}>
    //             {productTitle ? productTitle : <ProductTitle product={product} />}
    //             {productPrice ? productPrice : <Box>{product.price}</Box>}
    //         </Box>
    //         <Flex direction={['column', 'column', 'column', 'row']}>
    //             <Box {...styles.imageGallery}>
    //                 {product ? (
    //                     <>
    //                         {imageGallery ? (
    //                             imageGallery
    //                         ) : (
    //                             <ImageGallery
    //                                 size={'md'}
    //                                 imageGroups={product.imageGroups}
    //                                 selectedVariationAttributes={variationParams}
    //                             />
    //                         )}
    //                     </>
    //                 ) : (
    //                     <div>LOADING...</div>
    //                 )}
    //             </Box>
    //
    //             {/* Variations & Quantity Selector */}
    //             <VStack {...styles.buySection}>
    //                 <Box {...styles.headingWrapperDesktop}>
    //                     {productTitle ? productTitle : <ProductTitle product={product} />}
    //                 </Box>
    //
    //                 <VStack {...styles.swatchGroupContainer}>
    //                     {showLoading ? (
    //                         <>
    //                             {/* First Attribute Skeleton */}
    //                             <Skeleton height={6} width={32} />
    //                             <Skeleton height={20} width={64} />
    //
    //                             {/* Second Attribute Skeleton */}
    //                             <Skeleton height={6} width={32} />
    //                             <Skeleton height={20} width={64} />
    //                         </>
    //                     ) : (
    //                         renderSwatchGroup({swatchGroup, variationAttributes})
    //                     )}
    //                 </VStack>
    //
    //                 <VStack {...styles.quantityPickerContainer}>quantity picker</VStack>
    //             </VStack>
    //         </Flex>
    //     </Flex>
    // )
}

export default ProductView
