import * as selectors from './selectors'
import Immutable from 'immutable'

test('findImagesWithPropertyValue selects images by variation property', () => {
    const images = Immutable.fromJS([
        {
            url: 'example.com/black.jpg',
            variationProperties: [{id: 'color', values: [{value: 'black'}]}]
        },
        {
            url: 'example.com/white.jpg',
            variationProperties: [{id: 'color', values: [{value: 'white'}]}]
        }
    ])
    const selected = selectors.findImagesWithPropertyValue('color', 'black', images)
    expect(selected.toJS()).toEqual([{url: 'example.com/black.jpg'}])
})

test('findImagesWithPropertyValue handles undefined', () => {
    const selected = selectors.findImagesWithPropertyValue('color', 'black', undefined)
    expect(selected.toJS()).toEqual([])
})

test('findOrderableVariationsWithPropertyValue selects orderable variations by property', () => {
    const variation1 = {values: {color: 'black'}, orderable: false}
    const variation2 = {values: {popularity: 100}, orderable: true}

    const images = Immutable.fromJS([variation1, variation2])
    const selected = selectors.findOrderableVariationsWithPropertyValue('popularity', 100, images)
    expect(selected.toJS()).toEqual([variation2])
})

test('findOrderableVariationsWithPropertyValue handles undefined', () => {
    const selected = selectors.findOrderableVariationsWithPropertyValue('color', 'black', undefined)
    expect(selected.toJS()).toEqual([])
})

test('getProduct renders the correct product', () => {
    const mockState = {
        ui: {
            pages: {
                productDetails: Immutable.fromJS({productId: 2})
            }
        },
        data: {
            products: Immutable.fromJS([
                {name: 'product 0', id: 0},
                {name: 'product 1', id: 1},
                {name: 'product 2', id: 2},
                {name: 'product 3', id: 3},
                {name: 'product 4', id: 4}
            ])
        }
    }
    const result = selectors.getProduct(mockState, mockState)
    expect(result.toJS()).toEqual({name: 'product 2', id: 2, variationProperties: []})
})

test('getProduct renders undefined if product not found', () => {
    const mockState = {
        ui: {
            pages: {
                productDetails: Immutable.fromJS({productId: 5})
            }
        },
        data: {
            products: Immutable.fromJS([
                {name: 'product 0', id: 0},
                {name: 'product 1', id: 1},
                {name: 'product 2', id: 2},
                {name: 'product 3', id: 3},
                {name: 'product 4', id: 4}
            ])
        }
    }
    const result = selectors.getProduct(mockState, mockState)
    expect(result).toEqual(undefined)
})

test('Variation properties of product returned', () => {
    const mockState = {
        ui: {
            pages: {
                productDetails: Immutable.fromJS({productId: 2})
            }
        },
        data: {
            products: Immutable.fromJS([
                {name: 'product 0', id: 0},
                {name: 'product 1', id: 1},
                {
                    name: 'product 2',
                    id: 2,
                    variationProperties: [
                        {
                            id: 'color',
                            label: 'Color',
                            values: [{name: 'black', value: 'Black'}, {name: 'grey', value: 'Grey'}]
                        },
                        {
                            id: 'size',
                            label: 'Size',
                            values: [
                                {name: 'S', value: 'SM'},
                                {name: 'M', value: 'MD'},
                                {name: 'L', value: 'LG'}
                            ]
                        }
                    ],
                    variations: [
                        {values: {name: 'black', color: 'Black'}, orderable: true},
                        {values: {name: 'grey', color: 'Grey'}}
                    ]
                },
                {name: 'product 3', id: 3},
                {name: 'product 4', id: 4}
            ])
        }
    }
    const result = selectors.getProduct(mockState, mockState)
    expect(result.toJS().variationProperties[0].values[0].orderable).toBe(true)
    expect(result.toJS().variationProperties[0].values[1].orderable).toBe(false)
})

test('Image sets', () => {
    const mockState = {
        ui: {
            pages: {
                productDetails: Immutable.fromJS({productId: 2})
            }
        },
        data: {
            products: Immutable.fromJS([
                {name: 'product 0', id: 0},
                {name: 'product 1', id: 1},
                {
                    name: 'product 2',
                    id: 2,
                    imageSets: [
                        {
                            images: [
                                {title: 'image1', alt: 'image1'},
                                {title: 'image2', alt: 'image2'}
                            ],
                            sizeType: 'large'
                        },
                        {
                            images: [
                                {title: 'image3', alt: 'image3'},
                                {title: 'image4', alt: 'image4'}
                            ],
                            sizeType: 'swatch',
                            variationProperties: [
                                {id: 'size', values: [{value: 'large'}]},
                                {id: 'color', values: [{value: 'Black'}]}
                            ]
                        }
                    ],
                    variationProperties: [
                        {
                            id: 'color',
                            label: 'Color',
                            values: [{name: 'black', value: 'Black'}, {name: 'grey', value: 'Grey'}]
                        },
                        {
                            id: 'size',
                            label: 'Size',
                            values: [
                                {name: 'S', value: 'SM'},
                                {name: 'M', value: 'MD'},
                                {name: 'L', value: 'LG'}
                            ]
                        }
                    ],
                    variations: [
                        {values: {name: 'black', color: 'Black'}, orderable: true},
                        {values: {name: 'grey', color: 'Grey'}}
                    ]
                },
                {name: 'product 3', id: 3},
                {name: 'product 4', id: 4}
            ])
        }
    }
    const result = selectors.getProduct(mockState, mockState)
    const values = result.toJS().variationProperties[0].values
    expect(values[0].swatches).toBeDefined()
    expect(values[0].swatches).toEqual([
        {title: 'image3', alt: 'image3', sizeType: 'swatch'},
        {title: 'image4', alt: 'image4', sizeType: 'swatch'}
    ])
})

test('getErrorMessage behavior', () => {
    const mockState = {
        ui: {
            pages: {
                productDetails: Immutable.fromJS({productId: 7, error: 'Product not found'})
            }
        },
        data: {
            products: Immutable.fromJS([
                {name: 'product 0', id: 0},
                {name: 'product 1', id: 1},
                {name: 'product 2', id: 2},
                {name: 'product 3', id: 3},
                {name: 'product 4', id: 4}
            ])
        }
    }
    const mockState2 = {
        ui: {
            pages: {
                productDetails: Immutable.fromJS({productId: 2})
            }
        },
        data: {
            products: Immutable.fromJS([
                {name: 'product 0', id: 0},
                {name: 'product 1', id: 1},
                {name: 'product 2', id: 2},
                {name: 'product 3', id: 3},
                {name: 'product 4', id: 4}
            ])
        }
    }
    expect(selectors.getErrorMessage(mockState)).toEqual('Product not found')
    expect(selectors.getErrorMessage(mockState2)).toBe(undefined)
})
