import React from 'react'
import PropTypes from 'prop-types'
import {Button} from '@salesforce/retail-react-app/app/components/shared/ui/Button'
import withRegistration from '@salesforce/retail-react-app/app/components/with-registration'
import {useIntl} from 'react-intl'
import {useToast} from '@chakra-ui/react'
import {API_ERROR_MESSAGE} from '@salesforce/retail-react-app/app/constants'

const ButtonWithRegistration = withRegistration(Button)

const ProductViewActionButtons = ({
    addToCart,
    updateCart,
    addToWishlist,
    updateWishlist,
    isProductASet,
    isProductABundle,
    isProductPartOfSet,
    validateAndShowError,
    isProductPartOfBundle,
    disableButton,
    isBasketLoading,
    isWishlistLoading,
    canAddToWishlist,
    variant,
    product,
    quantity,
    onAddToCartModalOpen
}) => {
    const intl = useIntl()
    const buttons = []
    const showToast = useToast()
    const buttonText = {
        update: intl.formatMessage({
            defaultMessage: 'Update',
            id: 'product_view.button.update'
        }),
        addToCart: intl.formatMessage({
            defaultMessage: 'Add to Cart',
            id: 'product_view.button.add_to_cart'
        }),
        addSetToCart: intl.formatMessage({
            defaultMessage: 'Add Set to Cart',
            id: 'product_view.button.add_set_to_cart'
        }),
        addBundleToCart: intl.formatMessage({
            defaultMessage: 'Add Bundle to Cart',
            id: 'product_view.button.add_bundle_to_cart'
        }),
        addToWishlist: intl.formatMessage({
            defaultMessage: 'Add to Wishlist',
            id: 'product_view.button.add_to_wishlist'
        }),
        addSetToWishlist: intl.formatMessage({
            defaultMessage: 'Add Set to Wishlist',
            id: 'product_view.button.add_set_to_wishlist'
        }),
        addBundleToWishlist: intl.formatMessage({
            defaultMessage: 'Add Bundle to Wishlist',
            id: 'product_view.button.add_bundle_to_wishlist'
        })
    }
    const showError = () => {
        showToast({
            title: intl.formatMessage(API_ERROR_MESSAGE),
            status: 'error'
        })
    }

    const handleCartItem = async () => {
        const hasValidSelection = validateAndShowError()

        if (!hasValidSelection) return null

        if (!addToCart && !updateCart) return null
        if (updateCart) {
            await updateCart(variant || product, quantity)
            return
        }
        try {
            // (JEREMY) here the variant just the basic stuff.
            const itemsAdded = await addToCart({variant, quantity})
            if (itemsAdded && onAddToCartModalOpen) {
                onAddToCartModalOpen({
                    product,
                    itemsAdded,
                    selectedQuantity: quantity
                })
            }
        } catch (e) {
            showError && showError()
        }
    }

    const handleWishlistItem = async () => {
        if (!updateWishlist && !addToWishlist) return null
        if (updateWishlist) {
            updateWishlist(product, variant, quantity)
            return
        }
        addToWishlist(product, variant, quantity)
    }

    if ((addToCart || updateCart) && !isProductPartOfBundle) {
        buttons.push(
            <Button
                key="cart-button"
                onClick={handleCartItem}
                isDisabled={disableButton}
                isLoading={isBasketLoading}
                width="100%"
                variant="solid"
                marginBottom={4}
            >
                {updateCart
                    ? buttonText.update
                    : isProductASet
                    ? buttonText.addSetToCart
                    : isProductABundle
                    ? buttonText.addBundleToCart
                    : buttonText.addToCart}
            </Button>
        )
    }
    if ((addToWishlist || updateWishlist) && !isProductPartOfBundle) {
        buttons.push(
            <ButtonWithRegistration
                key="wishlist-button"
                onClick={handleWishlistItem}
                disabled={isWishlistLoading || !canAddToWishlist}
                isLoading={isWishlistLoading}
                width="100%"
                variant="outline"
                marginBottom={4}
            >
                {updateWishlist
                    ? buttonText.update
                    : isProductASet
                    ? buttonText.addSetToWishlist
                    : isProductABundle
                    ? buttonText.addBundleToWishlist
                    : buttonText.addToWishlist}
            </ButtonWithRegistration>
        )
    }

    return <>{buttons}</>
}

ProductViewActionButtons.propTypes = {
    addToCart: PropTypes.func,
    updateCart: PropTypes.func,
    addToWishlist: PropTypes.func,
    updateWishlist: PropTypes.func,
    isProductASet: PropTypes.bool,
    isProductABundle: PropTypes.bool,
    disableButton: PropTypes.bool,
    isBasketLoading: PropTypes.bool,
    isWishlistLoading: PropTypes.bool,
    canAddToWishlist: PropTypes.bool,
    variant: PropTypes.object,
    product: PropTypes.object,
    quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onAddToCartModalOpen: PropTypes.func
}

export default ProductViewActionButtons 