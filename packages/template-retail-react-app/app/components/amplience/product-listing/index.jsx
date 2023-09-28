import React from 'react'
import PropTypes from 'prop-types'
import {Flex, Select, SimpleGrid} from '@chakra-ui/react'

import Pagination from '../../../components/pagination'
import useWishlist from '../../../hooks/use-wishlist'

// Constants
import {DEFAULT_LIMIT_VALUES} from '../../../constants'

// TO switch back to the OOTB Product Tile, comment out the next 2 lines and uncomment line 10
import AmplienceProductTile from '../../../components/amplience/product-tile'
import {Skeleton as ProductTileSkeleton} from '../../../components/amplience/product-tile'
//import ProductTile, {Skeleton as ProductTileSkeleton} from '../../components/product-tile'

const ProductListing = ({
    basePath,
    isLoading,
    productSearchResult,
    searchParams,
    addItemToWishlist,
    removeItemFromWishlist,
    pageUrls,
    limitUrls
}) => {
    const wishlist = useWishlist()

    return (
        <>
            <SimpleGrid columns={[2, 2, 3, 3]} spacingX={4} spacingY={4}>
                {isLoading || !productSearchResult
                    ? new Array(searchParams.limit)
                          .fill(0)
                          .map((value, index) => <ProductTileSkeleton key={index} />)
                    : productSearchResult.hits.map((productSearchItem) => {
                          const productId = productSearchItem.productId
                          const isInWishlist = !!wishlist.findItemByProductId(productId)

                          return (
                              <AmplienceProductTile
                                  data-testid={`sf-product-tile-${productSearchItem.productId}`}
                                  key={productSearchItem.productId}
                                  product={productSearchItem}
                                  enableFavourite={true}
                                  isFavourite={isInWishlist}
                                  onFavouriteToggle={(isFavourite) => {
                                      const action = isFavourite
                                          ? addItemToWishlist
                                          : removeItemFromWishlist
                                      return action(productSearchItem)
                                  }}
                                  dynamicImageProps={{
                                      widths: ['50vw', '50vw', '20vw', '20vw', '25vw']
                                  }}
                              />
                          )
                      })}
            </SimpleGrid>
            <Flex justifyContent={['center', 'center', 'flex-start']} paddingTop={8}>
                <Pagination currentURL={basePath} urls={pageUrls} />

                {/*
                Our design doesn't call for a page size select. Show this element if you want
                to add one to your design.
                */}
                <Select
                    display="none"
                    value={basePath}
                    onChange={({target}) => {
                        history.push(target.value)
                    }}
                >
                    {limitUrls.map((href, index) => (
                        <option key={href} value={href}>
                            {DEFAULT_LIMIT_VALUES[index]}
                        </option>
                    ))}
                </Select>
            </Flex>
        </>
    )
}

ProductListing.propTypes = {
    basePath: PropTypes.string,
    isLoading: PropTypes.bool,
    pageUrls: PropTypes.arrayOf(PropTypes.string),
    limitUrls: PropTypes.arrayOf(PropTypes.string),
    productSearchResult: PropTypes.object,
    searchParams: PropTypes.object,
    addItemToWishlist: PropTypes.func,
    removeItemFromWishlist: PropTypes.func
}

export default ProductListing
