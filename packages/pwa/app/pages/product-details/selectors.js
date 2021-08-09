import {createSelector} from 'reselect'
import {createGetSelector} from 'reselect-immutable-helpers'
import Immutable from 'immutable'

import {getProductDetails, getProducts} from '../../selectors'

export const findImagesWithPropertyValue = (id, value, images = Immutable.List()) => {
    return images
        .filter((image) =>
            image
                .get('variationProperties', Immutable.List())
                .find(
                    (variationPropety) =>
                        variationPropety.get('id') === id &&
                        variationPropety.get('values').find((vv) => vv.get('value') === value)
                )
        )
        .map((image) => image.delete('variationProperties'))
}

export const findOrderableVariationsWithPropertyValue = (
    id,
    value,
    variations = Immutable.List()
) => {
    return variations.filter(
        (variation) => variation.getIn(['values', id]) === value && variation.get('orderable')
    )
}

export const getProductId = createGetSelector(getProductDetails, 'productId')

export const getProduct = createSelector(getProductId, getProducts, (productId, products) => {
    const product = products.get(productId)

    if (!product) {
        return product
    }

    const allImages = product.get('imageSets', Immutable.List()).reduce((acc, curr) => {
        let images = curr.get('images')

        // Inject the variationProperties and sizeType into each image.
        images = images.map((image) =>
            image.merge({
                sizeType: curr.get('sizeType'),
                variationProperties: curr.get('variationProperties')
            })
        )

        return acc.concat(images)
    }, Immutable.List())

    let variationProperties = product.get('variationProperties') || Immutable.List()

    const productVariations = product.get('variations') || Immutable.List()
    const swatchImages = allImages.filter((image) => image.get('sizeType') === 'swatch')

    // Inject [swatches|orderable] into variation property.
    variationProperties = variationProperties.map((variationProperty) =>
        variationProperty.set(
            'values',
            variationProperty.get('values', Immutable.List()).map((value) => {
                const foundSwatchImages = findImagesWithPropertyValue(
                    variationProperty.get('id'),
                    value.get('value'),
                    swatchImages
                )
                const foundOrderableVariations = findOrderableVariationsWithPropertyValue(
                    variationProperty.get('id'),
                    value.get('value'),
                    productVariations
                )

                value = value.set('orderable', !!foundOrderableVariations.size)
                value = foundSwatchImages.size ? value.set('swatches', foundSwatchImages) : value

                return value
            })
        )
    )

    return product.set('variationProperties', variationProperties)
})

export const getErrorMessage = createSelector(getProductDetails, (productDetailsUIState) =>
    productDetailsUIState.get('error')
)
