import React from 'react'
import {shallow} from 'enzyme'
import ProductDetails from './index'
import {getCarouselImageSizeType, getCarouselImagePropertyVariation} from '../../connector'
import * as Helpers from './helpers'
import {mountWithRouter} from '../../utils/test-utils'

const CAROUSEL_IMAGE_SIZE_TYPE = getCarouselImageSizeType()
const CAROUSEL_VARIATION_PROPERTY_VARIATION = getCarouselImagePropertyVariation()
const product = {
    id: 123,
    name: 'name',
    description: 'description',
    variations: [
        {
            id: '1001',
            price: 20,
            orderable: true,
            values: {
                [CAROUSEL_VARIATION_PROPERTY_VARIATION]: 'blue'
            }
        }
    ],
    variationProperties: [
        {
            id: CAROUSEL_VARIATION_PROPERTY_VARIATION,
            label: 'Color',
            values: [{name: 'Blue', value: 'blue'}]
        }
    ],
    imageSets: [
        {
            images: [
                {
                    alt: 'pic-alt',
                    description: 'pic-description',
                    src: 'pic-src',
                    title: 'pic-title'
                }
            ],
            sizeType: 'default',
            variationProperties: [
                {id: 'size', values: [{value: CAROUSEL_IMAGE_SIZE_TYPE}]},
                {id: CAROUSEL_VARIATION_PROPERTY_VARIATION, values: [{value: 'red'}]}
            ]
        },
        {
            images: [
                {
                    alt: 'pic-alt',
                    description: 'pic-description',
                    src: 'pic-src',
                    title: 'pic-title'
                }
            ],
            sizeType: 'swatch',
            variationProperties: [
                {id: 'size', values: [{value: CAROUSEL_IMAGE_SIZE_TYPE}]},
                {id: CAROUSEL_VARIATION_PROPERTY_VARIATION, values: [{value: 'blue'}]}
            ]
        }
    ]
}

const parsedProduct = {
    id: 123,
    name: 'name',
    description: 'description',
    variations: [
        {
            id: '1001',
            price: 20,
            orderable: true,
            values: {
                [CAROUSEL_VARIATION_PROPERTY_VARIATION]: 'blue'
            }
        }
    ],
    variationProperties: [
        {
            id: CAROUSEL_VARIATION_PROPERTY_VARIATION,
            label: 'Color',
            values: [
                {
                    name: 'Blue',
                    value: 'blue',
                    orderable: true,
                    swatches: [
                        {
                            alt: 'pic-alt',
                            description: 'pic-description',
                            src: 'pic-src',
                            title: 'pic-title',
                            sizeType: 'swatch',
                            variationProperties: [
                                {id: 'size', values: [{value: CAROUSEL_IMAGE_SIZE_TYPE}]},
                                {
                                    id: CAROUSEL_VARIATION_PROPERTY_VARIATION,
                                    values: [{value: 'blue'}]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ],
    imageSets: [
        {
            images: [
                {
                    alt: 'pic-alt',
                    description: 'pic-description',
                    src: 'pic-src',
                    title: 'pic-title'
                }
            ],
            sizeType: 'default',
            variationProperties: [
                {id: 'size', values: [{value: CAROUSEL_IMAGE_SIZE_TYPE}]},
                {id: CAROUSEL_VARIATION_PROPERTY_VARIATION, values: [{value: 'red'}]}
            ]
        },
        {
            images: [
                {
                    alt: 'pic-alt',
                    description: 'pic-description',
                    src: 'pic-src',
                    title: 'pic-title'
                }
            ],
            sizeType: 'swatch',
            variationProperties: [
                {id: 'size', values: [{value: CAROUSEL_IMAGE_SIZE_TYPE}]},
                {id: CAROUSEL_VARIATION_PROPERTY_VARIATION, values: [{value: 'blue'}]}
            ]
        }
    ],
    allImages: [
        {
            alt: 'pic-alt',
            description: 'pic-description',
            src: 'pic-src',
            title: 'pic-title',
            sizeType: 'default',
            variationProperties: [
                {id: 'size', values: [{value: CAROUSEL_IMAGE_SIZE_TYPE}]},
                {id: CAROUSEL_VARIATION_PROPERTY_VARIATION, values: [{value: 'red'}]}
            ]
        },
        {
            alt: 'pic-alt',
            description: 'pic-description',
            src: 'pic-src',
            title: 'pic-title',
            sizeType: 'swatch',
            variationProperties: [
                {id: 'size', values: [{value: CAROUSEL_IMAGE_SIZE_TYPE}]},
                {id: CAROUSEL_VARIATION_PROPERTY_VARIATION, values: [{value: 'blue'}]}
            ]
        }
    ]
}

test('ProductDetails renders without errors with results', () => {
    const getCarouselImages = jest.spyOn(Helpers, 'getCarouselImages')
    const wrapper = mountWithRouter(
        <ProductDetails
            params={{
                productId: 123
            }}
            product={parsedProduct}
        />
    ).render()
    expect(wrapper).toHaveLength(1)
    expect(wrapper.hasClass('t-product-details')).toBe(true)
    expect(getCarouselImages).toHaveBeenCalled()
})

test('ProductDetails renders error messages', () => {
    const wrapper = shallow(
        <ProductDetails
            params={{
                productId: 123
            }}
            errorMessage={'Err'}
        />
    )
    expect(wrapper).toHaveLength(1)
    expect(
        wrapper
            .find('h2')
            .first()
            .text()
    ).toEqual('Err')
})

test('ProductDetails renders without errors with image carousel', () => {
    const wrapper = shallow(
        <ProductDetails
            params={{
                productId: 123
            }}
            product={parsedProduct}
        />
    )
    expect(wrapper).toHaveLength(1)
    expect(wrapper.find('.t-product-details__carousel')).toHaveLength(1)
    expect(wrapper.find('.t-product-details__variations')).toHaveLength(1)
})

describe('parseProduct works appropriately', () => {
    test('variation values have matching swatches and imageSets is expanded into allImages', () => {
        const result = Helpers.parseProduct(product)
        expect(result).toEqual(parsedProduct)
    })
})

describe('getCarouselImages works appropriately', () => {
    test('color not present in variationValues', () => {
        const variationValues = {[CAROUSEL_VARIATION_PROPERTY_VARIATION]: 'black'}

        const result = Helpers.getCarouselImages(parsedProduct, variationValues)
        expect(result).toHaveLength(0)
    })

    test('color is present in variationValues', () => {
        const variationValues = {color: 'red'}

        const result = Helpers.getCarouselImages(parsedProduct, variationValues)
        expect(result).toHaveLength(1)
    })
})

describe('toggleShippingSheet works appropriately', () => {
    test('updateUIState is called to toggle shipping sheet', () => {
        const wrapper = shallow(
            <ProductDetails
                params={{
                    productId: 123
                }}
                product={parsedProduct}
            />
        )
        const instance = wrapper.instance()
        instance.setState({isShippingSheetOpen: true})

        instance.toggleShippingSheet()
        expect(instance.state.isShippingSheetOpen).toBe(false)
    })
})

describe('static lifecycle methods', () => {
    test('getTemplateName works', () => {
        expect(ProductDetails.getTemplateName()).toEqual(expect.stringMatching(/.+/))
    })

    test('shouldGetProps returns true when productId changes', () => {
        expect(
            ProductDetails.shouldGetProps({previousParams: {productId: 1}, params: {productId: 1}})
        ).toBe(false)
        expect(
            ProductDetails.shouldGetProps({previousParams: {productId: 1}, params: {productId: 2}})
        ).toBe(true)
    })
})
