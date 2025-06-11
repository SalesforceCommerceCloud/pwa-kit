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

const SetProductHeaderView = forwardRef((props, ref) => {
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
        intl,
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
        customInventoryMessage,
        onAddToCartModalOpen,
        validateAndShowError,
        theme
    } = props
    return (
        <Flex direction={'column'} data-testid="product-view" ref={ref}>
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
                        <p>{product?.shortDescription}</p>
                    </VStack>

                    <Box>
                        {!showLoading && showInventoryMessage && !customInventoryMessage && (
                            <Fade in={true}>
                                <Text color="orange.600" fontWeight={600} marginBottom={8}>
                                    {inventoryMessage}
                                </Text>
                            </Fade>
                        )}
                        {!showLoading && customInventoryMessage && (
                            <Fade in={true}>
                                <Text color="orange.600" fontWeight={600} marginBottom={8}>
                                    {customInventoryMessage}
                                </Text>
                            </Fade>
                        )}
                        <Box
                            display={
                                ['none', 'none', 'none', 'block']
                            }
                        >
                            <ProductViewActionButtons
                                addToCart={addToCart}
                                updateCart={updateCart}
                                addToWishlist={addToWishlist}
                                updateWishlist={updateWishlist}
                                isProductASet={true}
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

            {/* Sticky call-to-action buttons for mobile and certain product types */}
            <Box
                position="fixed"
                bg="white"
                width="100%"
                display={
                    ['block', 'block', 'block', 'none']
                }
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
                    isProductASet={true}
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

SetProductHeaderView.displayName = 'SetProductHeaderView'

SetProductHeaderView.propTypes = {
    // Define all the prop types as needed for clarity and validation
}

export default SetProductHeaderView 