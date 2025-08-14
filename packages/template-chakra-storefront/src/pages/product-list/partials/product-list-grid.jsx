/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {SimpleGrid} from '@chakra-ui/react'
import ProductTile, {Skeleton as ProductTileSkeleton} from '../../../components/product-tile'
import {isHydrated} from '../../../utils/utils'

const ProductListGrid = ({
    productSearchResult,
    isRefetching,
    isFetched,
    searchParams,
    productListConfig,
    //@sfdc-extension-line SFDC_EXT_WISHLIST
    isItemInWishlist,
    onFavouriteToggle,
    onClickProduct
}) => {
    // Skeletons are shown when we are yet to receive search results, or when we are
    // fetching a new page (and the `keepPreviousData` option is not enabled).
    const showSkeletons = isHydrated() && ((isRefetching && !isFetched) || !productSearchResult)

    return (
        <SimpleGrid columns={[2, 2, 3, 3]} columnGap={4} rowGap={{base: 12, lg: 16}}>
            {showSkeletons
                ? new Array(searchParams.limit)
                      .fill(0)
                      .map((_, index) => <ProductTileSkeleton key={index} />)
                : productSearchResult?.hits?.map((product) => {
                      //@sfdc-extension-line SFDC_EXT_WISHLIST
                      const isInWishlist = isItemInWishlist(product)
                      return (
                          <ProductTile
                              data-testid={`sf-product-tile-${product.productId}`}
                              key={product.productId}
                              product={product}
                              //@sfdc-extension-line SFDC_EXT_WISHLIST
                              enableFavourite={true}
                              //@sfdc-extension-line SFDC_EXT_WISHLIST
                              isFavourite={isInWishlist}
                              isRefreshingData={isRefetching && isFetched}
                              imageViewType={productListConfig.imageViewType}
                              selectableAttributeId={productListConfig.selectableAttributeId}
                              onClick={() => onClickProduct(product)}
                              onFavouriteToggle={(isFavourite) =>
                                  onFavouriteToggle(product, isFavourite)
                              }
                              dynamicImageProps={{
                                  widths: ['50vw', '50vw', '20vw', '20vw', '25vw']
                              }}
                          />
                      )
                  })}
        </SimpleGrid>
    )
}

ProductListGrid.propTypes = {
    productSearchResult: PropTypes.object,
    isRefetching: PropTypes.bool,
    isFetched: PropTypes.bool,
    searchParams: PropTypes.object,
    productListConfig: PropTypes.object,
    isItemInWishlist: PropTypes.func,
    onFavouriteToggle: PropTypes.func,
    onClickProduct: PropTypes.func
}

export default ProductListGrid
