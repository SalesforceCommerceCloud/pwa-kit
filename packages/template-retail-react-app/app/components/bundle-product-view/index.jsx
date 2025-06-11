import React, {useCallback, useState, useRef} from 'react'
import PropTypes from 'prop-types'
import {Box} from '@salesforce/retail-react-app/app/components/shared/ui'
import InformationAccordion from '@salesforce/retail-react-app/app/pages/product-detail/partials/information-accordion'
import {
    normalizeSetBundleProduct,
} from '@salesforce/retail-react-app/app/utils/product-utils'
import {
    useProducts,
} from '@salesforce/commerce-sdk-react'
import {getAddToCartHandler} from '@salesforce/retail-react-app/app/utils/cart-handlers'
import BundleProductHeader from '@salesforce/retail-react-app/app/components/bundle-product-view/partials/BundleProductHeader'
import BundleProductChildItem from '@salesforce/retail-react-app/app/components/bundle-product-view/partials/BundleProductChildItem'
const BundleProductView = ({
    product,
    einstein,
    primaryCategory,
    handleAddToWishlist,
    isProductLoading,
    isBasketLoading,
    isWishlistLoading,
    updateItemsInBasketMutation,
    showError
}) => {
    const [childProductSelection, setChildProductSelection] = useState({})
    const [childProductOrderability, setChildProductOrderability] = useState({})
    const [selectedBundleQuantity, setSelectedBundleQuantity] = useState(1)
    const childProductRefs = useRef({})

    let bundleChildVariantIds = Object.keys(childProductSelection)
            ?.map((key) => childProductSelection[key].variant.productId)
            .join(',')

    const {data: bundleChildrenData} = useProducts(
        {
            parameters: {
                ids: bundleChildVariantIds,
                allImages: false,
                expand: ['availability', 'variations'],
                select: '(data.(id,inventory,master))'
            }
        },
        {
            enabled: bundleChildVariantIds?.length > 0,
            keepPreviousData: true
        }
    )

    if (bundleChildrenData) {
        // Loop through the bundle children and update the inventory for variant selection
        product.bundledProducts.forEach(({product: childProduct}, index) => {
            const matchingChildProduct = bundleChildrenData.data.find(
                (bundleChild) => bundleChild.master.masterId === childProduct.id
            )
            if (matchingChildProduct) {
                product.bundledProducts[index].product = {
                    ...childProduct,
                    inventory: matchingChildProduct.inventory
                }
            }
        })
    }

    const comboProduct = normalizeSetBundleProduct(product)

    const handleAddToCart = getAddToCartHandler({
        product,
        updateItemsInBasketMutation,
        childProductSelection,
        einstein,
        showError
    })

    const handleChildProductValidation = useCallback(() => {
        // Run validation for all child products. This will ensure the error
        // messages are shown.
        Object.values(childProductRefs.current).forEach(({validateOrderability}) => {
            validateOrderability({scrollErrorIntoView: false})
        })

        // Using ot state for which child products are selected, scroll to the first
        // one that isn't selected.
        const selectedProductIds = Object.keys(childProductSelection)
        const firstUnselectedProduct = comboProduct.childProducts.find(
            ({product: childProduct}) => !selectedProductIds.includes(childProduct.id)
        )?.product
 

        if (firstUnselectedProduct) {
            // Get the reference to the product view and scroll to it.
            const {ref} = childProductRefs.current[firstUnselectedProduct.id]

            if (ref.scrollIntoView) {
                ref.scrollIntoView({
                    behavior: 'smooth',
                    block: 'end'
                })
            }

            return false
        }

        return true
    }, [product, childProductSelection])

    return (
        <>
            <BundleProductHeader
                product={product}
                category={primaryCategory?.parentCategoryTree || []}
                addToCart={handleAddToCart}
                addToWishlist={handleAddToWishlist}
                isProductLoading={isProductLoading}
                validateOrderability={handleChildProductValidation}
                childProductOrderability={childProductOrderability}
                isBasketLoading={isBasketLoading}
                setSelectedBundleQuantity={setSelectedBundleQuantity}
            />

            <hr />

            {/* Render the child products */}
            {comboProduct.childProducts?.map(
                ({product: childProduct, quantity: childQuantity}) => (
                    <Box key={childProduct.id} data-testid="child-product">
                        <BundleProductChildItem
                            ref={function (ref) {
                                childProductRefs.current[childProduct.id] = {
                                    ref,
                                    validateOrderability: this.validateOrderability
                                }
                            }}
                            product={childProduct}
                            childOfBundleQuantity={childQuantity}
                            selectedBundleParentQuantity={selectedBundleQuantity}
                            addToCart={null}
                            addToWishlist={null}
                            onVariantSelected={(product, variant, quantity) => {
                                if (quantity) {
                                    setChildProductSelection((previousState) => ({
                                        ...previousState,
                                        [product.id]: {
                                            product,
                                            variant,
                                            quantity: childQuantity
                                        }
                                    }))
                                } else {
                                    const selections = {...childProductSelection}
                                    delete selections[product.id]
                                    setChildProductSelection(selections)
                                }
                            }}
                            isProductLoading={isProductLoading}
                            isBasketLoading={isBasketLoading}
                            isWishlistLoading={isWishlistLoading}
                            setChildProductOrderability={
                                setChildProductOrderability
                            }
                        />
                        <InformationAccordion product={childProduct} />

                        <Box display={['none', 'none', 'none', 'block']}>
                            <hr />
                        </Box>
                    </Box>
                )
            )}
        </>
    )
}

BundleProductView.propTypes = {
    product: PropTypes.object.isRequired,
    primaryCategory: PropTypes.object,
    isProductASet: PropTypes.bool,
    isProductABundle: PropTypes.bool,
    handleAddToCart: PropTypes.func.isRequired,
    handleAddToWishlist: PropTypes.func.isRequired,
    isProductLoading: PropTypes.bool,
    isBasketLoading: PropTypes.bool,
    isWishlistLoading: PropTypes.bool,
    handleChildProductValidation: PropTypes.func,
    childProductOrderability: PropTypes.object,
    setSelectedBundleQuantity: PropTypes.func,
    comboProduct: PropTypes.object.isRequired,
    childProductRefs: PropTypes.object.isRequired,
    childProductSelection: PropTypes.object.isRequired,
    setChildProductSelection: PropTypes.func.isRequired,
    selectedBundleQuantity: PropTypes.number
}

export default BundleProductView 