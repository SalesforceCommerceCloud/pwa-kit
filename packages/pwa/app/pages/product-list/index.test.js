import React from 'react'
import ProductList from './index'
import {mountWithRouter} from '../../utils/test-utils'

test('ProductList renders without errors with results', () => {
    const wrapper = mountWithRouter(
        <ProductList
            initialize={jest.fn()}
            trackPageLoad={jest.fn()}
            match={{
                params: {
                    categoryId: 'tshirts'
                }
            }}
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
                        productId: 124,
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
            category={{
                name: 'T-Shirts'
            }}
        />
    ).render()
    expect(wrapper).toHaveLength(1)
    expect(wrapper.hasClass('t-product-list')).toBe(true)
})

test('ProductList renders without errors with no search results', () => {
    const wrapper = mountWithRouter(
        <ProductList
            match={{
                params: {
                    categoryId: 'tshirts'
                }
            }}
            productSearch={{results: []}}
            category={undefined}
        />
    ).render()
    expect(wrapper).toHaveLength(1)
    expect(wrapper.hasClass('t-product-list')).toBe(true)
})

test('ProductList renders error messages', () => {
    const wrapper = mountWithRouter(
        <ProductList
            match={{
                params: {
                    categoryId: 'tshirts'
                }
            }}
            errorMessage={'Err'}
        />
    ).render()
    expect(wrapper).toHaveLength(1)
    expect(wrapper.find('.t-product-list__error-msg')).toHaveLength(1)
})

test('ProductList should get props when the category id changes in the URL', () => {
    const params1 = {categoryId: 1}
    const params2 = {categoryId: 2}
    expect(ProductList.shouldGetProps({previousParams: params1, params: params1})).toBe(false)
    expect(ProductList.shouldGetProps({previousParams: params1, params: params2})).toBe(true)
})

test('getTemplateName works', () => {
    expect(ProductList.getTemplateName()).toEqual('product-list')
})
