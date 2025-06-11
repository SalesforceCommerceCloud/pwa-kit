import React, {forwardRef} from 'react'
import PropTypes from 'prop-types'
import {Flex, Box, VStack, Text, Fade, Skeleton} from '@salesforce/retail-react-app/app/components/shared/ui'
import ImageGallery from '@salesforce/retail-react-app/app/components/image-gallery'
import Link from '@salesforce/retail-react-app/app/components/link'
import {FormattedMessage} from 'react-intl'
import {HideOnDesktop, HideOnMobile} from '@salesforce/retail-react-app/app/components/responsive'
import QuantityPicker from '@salesforce/retail-react-app/app/components/quantity-picker'
import Swatch from '@salesforce/retail-react-app/app/components/swatch-group/swatch'
import SwatchGroup from '@salesforce/retail-react-app/app/components/swatch-group'
import ProductViewActionButtons from '@salesforce/retail-react-app/app/components/product-view-action-buttons/ProductViewActionButtons'
import ProductViewHeader from '@salesforce/retail-react-app/app/components/product-view/partials/ProductViewHeader'
import {Skeleton as ImageGallerySkeleton} from '@salesforce/retail-react-app/app/components/image-gallery'
import {useIntl} from 'react-intl'
import {useTheme} from '@salesforce/retail-react-app/app/components/shared/ui'

const VariationGroupViewLayout = forwardRef((props, ref) => {
    const {
        product,
        category,
        showFullLink,
        imageSize,
        isWishlistLoading,
        addToCart,
        updateCart,
        addToWishlist,
        updateWishlist,
        isBasketLoading,
        showImageGallery,
        priceData,
        activeCurrency,
        showLoading,
        showInventoryMessage,
        inventoryMessage,
        quantity,
        minOrderQuantity,
        setQuantity,
        variant,
        variationParams,
        variationAttributes,
        stepQuantity,
        disableButton,
        canAddToWishlist,
        showOptionsMessage,
        errorContainerRef,
        onAddToCartModalOpen,
        validateAndShowError,
    } = props
    const intl = useIntl()
    const theme = useTheme()

    return (
        <Flex direction={'column'} data-testid="variation-group-view" ref={ref}>
            {/* Basic information etc. title, price, breadcrumb*/}
            <Box display={['block', 'block', 'block', 'none']}>
                <ProductViewHeader
                    name={product?.name}
                    product={product}
                    priceData={priceData}
                    currency={product?.currency || activeCurrency}
                    category={category}
                    isProductPartOfBundle={false}
                />
            </Box>
            <Flex direction={['column', 'column', 'column', 'row']}>
                {showImageGallery && (
                    <Box flex={1} mr={[0, 0, 0, 6, 6]}>
                        {product ? (
                            <>
                                <ImageGallery
                                    size={imageSize}
                                    imageGroups={product.imageGroups}
                                    selectedVariationAttributes={variationParams}
                                    lazy={false}
                                />
                                <HideOnMobile>
                                    {showFullLink && product && (
                                        <Link
                                            to={`/product/${product.master.masterId}`}
                                            color="blue.600"
                                        >
                                            <FormattedMessage
                                                id="product_view.link.full_details"
                                                defaultMessage="See full details"
                                            />
                                        </Link>
                                    )}
                                </HideOnMobile>
                            </>
                        ) : (
                            <ImageGallerySkeleton />
                        )}
                    </Box>
                )}

                {/* Variations & Quantity Selector & CTA buttons */}
                <VStack align="stretch" spacing={8} flex={1}>
                    <Box display={['none', 'none', 'none', 'block']}>
                        <ProductViewHeader
                            name={product?.name}
                            product={product}
                            priceData={priceData}
                            currency={product?.currency || activeCurrency}
                            category={category}
                            isProductPartOfBundle={false}
                        />
                    </Box>
                    <VStack align="stretch" spacing={4}>
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
                            variationAttributes.map(({id, name, selectedValue, values}) => {
                                const swatches = values.map(
                                    ({href, name, image, value, orderable}, index) => {
                                        const content = image ? (
                                            <Box
                                                height="100%"
                                                width="100%"
                                                minWidth="32px"
                                                backgroundRepeat="no-repeat"
                                                backgroundSize="cover"
                                                backgroundColor={name.toLowerCase()}
                                                backgroundImage={`url(${
                                                    image.disBaseLink || image.link
                                                })`}
                                            />
                                        ) : (
                                            name
                                        )
                                        const hasSelection = Boolean(selectedValue?.value)
                                        const isSelected = selectedValue?.value === value
                                        const isFirst = index === 0
                                        const isFocusable =
                                            isSelected || (!hasSelection && isFirst)
                                        return (
                                            <Swatch
                                                key={value}
                                                href={href}
                                                disabled={!orderable}
                                                value={value}
                                                name={name}
                                                variant={id === 'color' ? 'circle' : 'square'}
                                                selected={isSelected}
                                                isFocusable={isFocusable}
                                            >
                                                {content}
                                            </Swatch>
                                        )
                                    }
                                )
                                return (
                                    <SwatchGroup
                                        key={id}
                                        value={selectedValue?.value}
                                        displayName={selectedValue?.name || ''}
                                        label={intl.formatMessage(
                                            {
                                                defaultMessage: '{variantType}',
                                                id: 'product_view.label.variant_type'
                                            },
                                            {variantType: name}
                                        )}
                                    >
                                        {swatches}
                                    </SwatchGroup>
                                )
                            })
                        )}

                        <VStack align="stretch" maxWidth={'200px'}>
                            <Box fontWeight="bold">
                                <label htmlFor="quantity">
                                    {intl.formatMessage({
                                        defaultMessage: 'Quantity',
                                        id: 'product_view.label.quantity'
                                    })}
                                </label>
                            </Box>

                            <QuantityPicker
                                id="quantity"
                                step={stepQuantity}
                                value={quantity}
                                min={minOrderQuantity}
                                onChange={(stringValue, numberValue) => {
                                    if (numberValue >= 0) {
                                        setQuantity(numberValue)
                                    } else if (stringValue === '') {
                                        setQuantity(stringValue)
                                    }
                                }}
                                onBlur={(e) => {
                                    const value = e.target.value
                                    if (parseInt(value) < 0 || value === '') {
                                        setQuantity(minOrderQuantity)
                                    }
                                }}
                                onFocus={(e) => {
                                    e.target.select()
                                }}
                                productName={product?.name}
                            />
                        </VStack>
                        
                        <Box ref={errorContainerRef}>
                            {!showLoading && showOptionsMessage && (
                                <Fade in={true}>
                                    <Text color="orange.600" fontWeight={600} marginBottom={8}>
                                        {intl.formatMessage({
                                            defaultMessage:
                                                'Please select all your options above'
                                        })}
                                    </Text>
                                </Fade>
                            )}
                        </Box>
                        
                        <HideOnDesktop>
                            {showFullLink && product && (
                                <Link
                                    to={`/product/${product.master.masterId}`}
                                    color="blue.600"
                                >
                                    <FormattedMessage
                                        id="product_view.link.full_details"
                                        defaultMessage="See full details"
                                    />
                                </Link>
                            )}
                        </HideOnDesktop>
                    </VStack>

                    <Box>
                        {!showLoading && showInventoryMessage && (
                            <Fade in={true}>
                                <Text color="orange.600" fontWeight={600} marginBottom={8}>
                                    {inventoryMessage}
                                </Text>
                            </Fade>
                        )}
                        
                        <Box display={['none', 'none', 'none', 'block']}>
                            <ProductViewActionButtons
                                addToCart={addToCart}
                                updateCart={updateCart}
                                addToWishlist={addToWishlist}
                                updateWishlist={updateWishlist}
                                isProductASet={false}
                                isProductPartOfSet={false}
                                isProductABundle={false}
                                isProductPartOfBundle={false}
                                disableButton={disableButton}
                                isBasketLoading={isBasketLoading}
                                isWishlistLoading={isWishlistLoading}
                                canAddToWishlist={canAddToWishlist}
                                variant={variant}
                                product={product}
                                quantity={quantity}
                                onAddToCartModalOpen={onAddToCartModalOpen}
                                validateAndShowError={validateAndShowError}
                            />
                        </Box>
                    </Box>
                </VStack>
            </Flex>

            {/* Sticky call-to-action buttons for mobile */}
            <Box
                position="fixed"
                bg="white"
                width="100%"
                display={['block', 'block', 'block', 'none']}
                p={[4, 4, 6]}
                left={0}
                bottom={0}
                zIndex={2}
                boxShadow={theme?.shadows?.top}
            >
                <ProductViewActionButtons
                    addToCart={addToCart}
                    updateCart={updateCart}
                    addToWishlist={addToWishlist}
                    updateWishlist={updateWishlist}
                    isProductASet={false}
                    isProductABundle={false}
                    isProductPartOfBundle={false}
                    isProductPartOfSet={false}
                    disableButton={disableButton}
                    isBasketLoading={isBasketLoading}
                    isWishlistLoading={isWishlistLoading}
                    canAddToWishlist={canAddToWishlist}
                    variant={variant}
                    product={product}
                    quantity={quantity}
                    onAddToCartModalOpen={onAddToCartModalOpen}
                    validateAndShowError={validateAndShowError}
                />
            </Box>
        </Flex>
    )
})

VariationGroupViewLayout.displayName = 'VariationGroupViewLayout'

VariationGroupViewLayout.propTypes = {
    // Product data
    product: PropTypes.object,
    category: PropTypes.array,
    priceData: PropTypes.object,
    variant: PropTypes.object,
    variationParams: PropTypes.object,
    variationAttributes: PropTypes.array,
    
    // Loading states
    isBasketLoading: PropTypes.bool,
    isWishlistLoading: PropTypes.bool,
    showLoading: PropTypes.bool,
    
    // Quantity and inventory
    quantity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minOrderQuantity: PropTypes.number,
    stepQuantity: PropTypes.number,
    
    // Inventory messages
    showInventoryMessage: PropTypes.bool,
    inventoryMessage: PropTypes.string,
    
    // UI state
    showFullLink: PropTypes.bool,
    showImageGallery: PropTypes.bool,
    showOptionsMessage: PropTypes.bool,
    disableButton: PropTypes.bool,
    canAddToWishlist: PropTypes.bool,
    imageSize: PropTypes.oneOf(['sm', 'md']),
    
    // Currency and locale
    activeCurrency: PropTypes.string,
    intl: PropTypes.object.isRequired,
    theme: PropTypes.object,
    
    // Functions
    addToCart: PropTypes.func,
    updateCart: PropTypes.func,
    addToWishlist: PropTypes.func,
    updateWishlist: PropTypes.func,
    setQuantity: PropTypes.func,
    onAddToCartModalOpen: PropTypes.func,
    
    // Refs
    errorContainerRef: PropTypes.object
}

export default VariationGroupViewLayout 