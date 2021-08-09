import React from 'react'
import {shallow} from 'enzyme'
import {UnconnectedProductDetails as ProductDetails} from './index'

test('ProductDetails renders without errors with results', () => {
    const wrapper = shallow(
        <ProductDetails
            initialize={jest.fn()}
            trackPageLoad={jest.fn()}
            updateUiState={jest.fn()}
            uiState={{
                isShippingSheetOpen: true,
                isSubscribed: false,
                variationValues: undefined
            }}
            params={{
                productId: 123
            }}
            product={{
                id: 123,
                name: 'name',
                description: 'description'
            }}
        />
    )
    expect(wrapper).toHaveLength(1)
    expect(wrapper.hasClass('t-product-details')).toBe(true)
})

test('ProductDetails renders error messages', () => {
    const wrapper = shallow(
        <ProductDetails
            initialize={jest.fn()}
            trackPageLoad={jest.fn()}
            updateUiState={jest.fn()}
            uiState={{
                isShippingSheetOpen: true,
                isSubscribed: false,
                variationValues: undefined
            }}
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
            initialize={jest.fn()}
            trackPageLoad={jest.fn()}
            updateUiState={jest.fn()}
            uiState={{
                isShippingSheetOpen: true,
                isSubscribed: false,
                variationValues: undefined
            }}
            params={{
                productId: 123
            }}
            product={{
                id: 123,
                name: 'name',
                description: 'description',
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
                        sizeType: 'large'
                    }
                ]
            }}
        />
    )
    expect(wrapper).toHaveLength(1)
    expect(wrapper.find('.t-product-details__carousel')).toHaveLength(1)
})

test('ProductList updates component when new props are passed', () => {
    const baseProps = {
        initialize: jest.fn(),
        trackPageLoad: jest.fn(),
        params: {productId: 1},
        updateUiState: jest.fn(),
        uiState: {
            isShippingSheetOpen: true,
            isSubscribed: false,
            variationValues: undefined
        },
        product: {
            id: 123,
            name: 'name',
            description: 'description'
        }
    }

    const wrapper = shallow(<ProductDetails {...baseProps} />)

    // trackPageLoad and initialize will be called once during component Mount
    expect(baseProps.trackPageLoad).toHaveBeenCalledTimes(1)
    expect(baseProps.initialize).toHaveBeenCalledTimes(1)

    wrapper.setProps({
        initialize: baseProps.initialize,
        trackPageLoad: baseProps.trackPageLoad,
        params: {productId: 1}
    })

    // trackPageLoad and initialize will not be recalled since same props are passed
    expect(baseProps.trackPageLoad).toHaveBeenCalledTimes(1)
    expect(baseProps.initialize).toHaveBeenCalledTimes(1)

    wrapper.setProps({
        initialize: baseProps.initialize,
        trackPageLoad: baseProps.trackPageLoad,
        params: {productId: 2}
    })

    // trackPageLoad and initialize will be recalled since props are changed
    expect(baseProps.trackPageLoad).toHaveBeenCalledTimes(2)
    expect(baseProps.initialize).toHaveBeenCalledTimes(2)
})

describe('getCarouselImages works appropriately', () => {
    const baseProps = {
        initialize: jest.fn(),
        trackPageLoad: jest.fn(),
        updateUiState: jest.fn(),
        uiState: {
            isShippingSheetOpen: true,
            isSubscribed: false,
            variationValues: undefined
        },
        params: {
            productId: 123
        },
        product: {
            id: 123,
            name: 'name',
            description: 'description',
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
                        {id: 'size', values: [{value: 'large'}]},
                        {id: 'color', values: [{value: 'red'}]}
                    ]
                }
            ]
        }
    }

    test('color not present in variationValues', () => {
        const wrapper = shallow(<ProductDetails {...baseProps} />)
        const instance = wrapper.instance()

        const product = baseProps.product
        const variationValues = {color: 'black'}

        const result = instance.getCarouselImages(product, variationValues)
        expect(result).toHaveLength(0)
    })

    test('color is present in variationValues', () => {
        const wrapper = shallow(<ProductDetails {...baseProps} />)
        const instance = wrapper.instance()

        const product = baseProps.product
        const variationValues = {color: 'red'}

        const result = instance.getCarouselImages(product, variationValues)
        expect(result).toHaveLength(1)
    })
})

describe('toggleShippingSheet works appropriately', () => {
    const baseProps = {
        initialize: jest.fn(),
        trackPageLoad: jest.fn(),
        updateUIState: jest.fn(),
        uiState: {
            isShippingSheetOpen: true,
            isSubscribed: true,
            variationValues: undefined
        },
        params: {
            productId: 123
        },
        product: {
            id: 123,
            name: 'name',
            description: 'description'
        }
    }

    test('updateUIState is called to toggle shipping sheet', () => {
        const wrapper = shallow(<ProductDetails {...baseProps} />)
        const instance = wrapper.instance()

        instance.toggleShippingSheet()
        expect(baseProps.updateUIState).toHaveBeenCalledWith({isShippingSheetOpen: false})
    })
})

test('ProductDetails should set HTTP headers properly', () => {
    const props = {
        initialize: jest.fn(),
        trackPageLoad: jest.fn(),
        updateUIState: jest.fn(),
        uiState: {
            isShippingSheetOpen: true,
            isSubscribed: true,
            variationValues: undefined
        },
        params: {
            productId: 123
        },
        product: {
            id: 123,
            name: 'name',
            description: 'description'
        }
    }
    shallow(<ProductDetails {...props} />)
    expect(props.trackPageLoad.mock.calls.length).toBe(1)
    const getResponseOptions = props.trackPageLoad.mock.calls[0][2]

    expect(getResponseOptions({statusCode: 200})).toEqual({
        statusCode: 200,
        headers: {
            'Cache-Control': 'max-age=0, s-maxage=3600'
        }
    })

    expect(getResponseOptions({statusCode: 404})).toEqual({
        statusCode: 404
    })
})
