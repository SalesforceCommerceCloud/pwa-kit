import React from 'react'
import {shallow} from 'enzyme'
import {UnconnectedProductList as ProductList} from './index'

test('ProductList renders without errors with results', () => {
    const wrapper = shallow(
        <ProductList
            initialize={jest.fn()}
            trackPageLoad={jest.fn()}
            category={{name: 'Shirts'}}
            productSearch={{
                results: [
                    {
                        productId: 123,
                        title: 'Shirt 1',
                        price: 100,
                        href: 'http://www.example.com',
                        defaultImage: {
                            src: 'http://www.example.com/1.jpg',
                            alt: 'Shirt 1'
                        }
                    },
                    {
                        title: 'Shirt 2',
                        price: 99.99,
                        href: 'http://www.example.com',
                        defaultImage: {
                            src: 'http://www.example.com/1.jpg',
                            alt: 'Shirt 2'
                        }
                    }
                ]
            }}
        />
    )
    expect(wrapper).toHaveLength(1)
    expect(wrapper.hasClass('t-product-list')).toBe(true)
})

test('ProductList renders without errors with no search results', () => {
    const wrapper = shallow(
        <ProductList
            initialize={jest.fn()}
            trackPageLoad={jest.fn()}
            category={{name: 'Shirts'}}
            productSearch={{results: []}}
        />
    )
    expect(wrapper).toHaveLength(1)
    expect(wrapper.hasClass('t-product-list')).toBe(true)
})

test('ProductList renders error messages', () => {
    const wrapper = shallow(
        <ProductList initialize={jest.fn()} trackPageLoad={jest.fn()} errorMessage={'Err'} />
    )
    expect(wrapper).toHaveLength(1)
    expect(wrapper.find('.t-product-list__error-msg')).toHaveLength(1)
})

test('ProductList updates component when new props are passed', () => {
    const baseProps = {
        initialize: jest.fn(),
        trackPageLoad: jest.fn(),
        category: {name: 'Shirts'},
        params: {categoryId: 'tshirts'}
    }

    const wrapper = shallow(<ProductList {...baseProps} />)

    // trackPageLoad and initialize will be called once during component Mount
    expect(baseProps.trackPageLoad).toHaveBeenCalledTimes(1)
    expect(baseProps.initialize).toHaveBeenCalledTimes(1)

    wrapper.setProps({
        initialize: baseProps.initialize,
        trackPageLoad: baseProps.trackPageLoad,
        category: {name: 'Shirts'},
        params: {categoryId: 'tshirts'}
    })

    // trackPageLoad and initialize will not be recalled since same props are passed
    expect(baseProps.trackPageLoad).toHaveBeenCalledTimes(1)
    expect(baseProps.initialize).toHaveBeenCalledTimes(1)

    wrapper.setProps({
        initialize: baseProps.initialize,
        trackPageLoad: baseProps.trackPageLoad,
        category: {name: 'changed'},
        params: {categoryId: 'changed'}
    })

    // trackPageLoad and initialize will be recalled since props are changed
    expect(baseProps.trackPageLoad).toHaveBeenCalledTimes(2)
    expect(baseProps.initialize).toHaveBeenCalledTimes(2)
})

describe('queryFromProps works as expected', () => {
    const wrapper = shallow(
        <ProductList
            initialize={jest.fn()}
            trackPageLoad={jest.fn()}
            category={{name: 'Shirts'}}
            params={{categoryId: 'tshirts'}}
        />
    )
    const instance = wrapper.instance()
    test('when valid props are passed', () => {
        const props = {
            initialize: jest.fn(),
            trackPageLoad: jest.fn(),
            category: {name: 'Shirts'},
            params: {categoryId: 'tshirts'}
        }
        expect(instance.queryFromProps(props)).toEqual({
            filters: {categoryId: 'tshirts'},
            query: ''
        })
    })

    test('when props are null', () => {
        expect(instance.queryFromProps(null)).toEqual({})
    })
})

test('ProductList sets HTTP appropriate headers', () => {
    const props = {
        initialize: jest.fn(),
        trackPageLoad: jest.fn(),
        category: {name: 'Shirts'},
        params: {categoryId: 'tshirts'}
    }
    shallow(<ProductList {...props} />)
    expect(props.initialize.mock.calls.length).toBe(1)
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
