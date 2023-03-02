/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useParams} from 'react-router-dom/'
import {
    useProductCategoryPath,
    useProductSearch,
    useProductsPrice,
    useSortRules
} from '../hooks/useFetch'
import {Link, useLocation} from 'react-router-dom'
import {getMediaLink} from '../utils/utils'
import Breadcrumb from '../components/breadcrumb'
import ProductsFilter from '../components/products-filter'

ProductList.propTypes = {}

const ProductTile = ({currency, product, price}) => {
    if (!price || !product) return null
    const imgSrc = getMediaLink(product.defaultImage.url)
    return (
        <Link to={`/products/${product.id}`} style={{textDecoration: 'none', maxWidth: '300px'}}>
            <div style={{width: '150px', minHeight: '150px'}}>
                <img src={imgSrc} alt="" width="150px" />
            </div>
            <div>{product.name}</div>
            <div>
                <div>
                    List Price {price.listPrice} {currency}
                </div>
                <div>
                    Unit Price {price.unitPrice} {currency}
                </div>
            </div>
        </Link>
    )
}
function ProductList() {
    const [sortingId, setSortingId] = React.useState()
    const {categoryId} = useParams()
    const location = useLocation()

    const [selectedFacet, setSelectedFacet] = React.useState([])

    const queryParams = new URLSearchParams(location.search.split('?')?.[1])
    const searchTerm = queryParams.get('q')
    const {data: productPath, isLoading: isProductPathLoading} = useProductCategoryPath(categoryId)
    const {data: sortRulesData} = useSortRules()
    const {
        data,
        isFetching,
        isLoading: isProductSearchLoading,
        error
    } = useProductSearch(
        {
            categoryId,
            searchTerm
        },
        {sortRuleId: sortingId, refinements: selectedFacet},
        {
            keepPreviousData: true
        }
    )
    const productIds = data?.productsPage?.products.map((product) => ({productId: product.id}))
    const {
        data: productListPrice,
        isLoading: productListPriceLoading,
        error: productListPriceError
    } = useProductsPrice(productIds)

    React.useEffect(() => {
        if (!sortingId && sortRulesData?.sortRules.length > 0) {
            setSortingId(sortRulesData?.sortRules[0].id)
        }
    }, [sortRulesData])

    const onFilterClick = (value, facet) => {
        const modifiedFacet = {
            attributeType: facet.attributeType,
            nameOrId: facet.nameOrId,
            type: facet.facetType
        }
        const isFacetSelected = selectedFacet.find((f) => f.nameOrId === modifiedFacet.nameOrId)
        if (!isFacetSelected) {
            setSelectedFacet([...selectedFacet, {...modifiedFacet, values: [value.nameOrId]}])
        } else {
            const chosenFacet = selectedFacet.find((f) => f.nameOrId === modifiedFacet.nameOrId)
            const restOfFacets = selectedFacet.filter((f) => f.nameOrId !== modifiedFacet.nameOrId)
            const isValueSelected = chosenFacet?.values.find((v) => v === value.nameOrId)
            // remove values from facet
            if (isValueSelected) {
                const updatedValues = chosenFacet?.values.filter((v) => v !== value.nameOrId)
                if (updatedValues.length === 0) {
                    setSelectedFacet(restOfFacets)
                    return
                }
                setSelectedFacet([...restOfFacets, {...chosenFacet, values: updatedValues}])
            } else {
                // add values to facet
                setSelectedFacet([
                    ...restOfFacets,
                    {...modifiedFacet, values: [...chosenFacet.values, value.nameOrId]}
                ])
            }
        }
    }
    if (error || productListPriceError) {
        return <div>Something is wrong</div>
    }
    if (data?.productsPage?.products.length === 0) {
        return <div>No product found</div>
    }
    return (
        <div>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                {!queryParams && isProductPathLoading && <div>Loading breadcrumb</div>}
                {productPath && <Breadcrumb categories={productPath} />}
                {sortRulesData && (
                    <select
                        onChange={(e) => {
                            setSortingId(e.target.value)
                        }}
                    >
                        {sortRulesData?.sortRules?.map((rule) => {
                            return (
                                <option key={rule.sortRuleId} value={rule.sortRuleId}>
                                    {rule.label}
                                </option>
                            )
                        })}
                    </select>
                )}
            </div>
            {selectedFacet.length > 0 && (
                <div>
                    <h3>Filters:</h3>
                    <div>
                        {selectedFacet.map((facet) => {
                            return (
                                <div key={facet.nameOrId}>
                                    {facet?.values?.map((val) => (
                                        <div>{val}</div>
                                    ))}
                                </div>
                            )
                        })}
                    </div>
                    <button onClick={() => setSelectedFacet([])}>Clear all filters</button>
                </div>
            )}

            <div style={{display: 'flex'}}>
                <div style={{flex: 1}}>
                    {!isProductSearchLoading && (
                        <ProductsFilter
                            onFilterClick={onFilterClick}
                            facets={data.facets}
                            selectedFacet={selectedFacet}
                        />
                    )}
                </div>
                <div style={{flex: 2}}>
                    <div>
                        {(isProductSearchLoading || productListPriceLoading) && !isFetching && (
                            <div>Loading products...</div>
                        )}
                    </div>

                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '20px'}}>
                        {data?.productsPage?.products?.map((product) => {
                            const price = productListPrice?.pricingLineItemResults?.find((i) =>
                                product.id.includes(i.productId)
                            )
                            return (
                                <ProductTile
                                    key={product.id}
                                    currency={productListPrice?.currencyIsoCode}
                                    product={product}
                                    price={price}
                                />
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductList
