/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {QueryRouter} from './query-router'

const Default = () => {}
const Boolean = () => {}
const Positive = () => {}
const Negative = () => {}
const WithCallback = () => {}

const fakeQueryRouterObject = {
    defaultComponent: Default,
    childRoutes: [
        {param: 'active', component: Boolean},
        {param: 'sense', value: 'positive', component: Positive},
        {param: 'sense', value: 'negative', component: Negative}
    ]
}

const testGetComponent = QueryRouter.defaultProps.getComponent.bind(fakeQueryRouterObject)

describe('getComponent', () => {
    test('passes the default component when no match is found', () => {
        ;['?notactive', '?sense=neutral', '?', ''].forEach((search) => {
            const callback = jest.fn()

            testGetComponent({location: {search}}, callback)
            expect(callback).toBeCalledWith(null, Default)
        })
    })

    test('reacts to boolean routes correctly', () => {
        ;['?active', '?active=false', '?active=foo'].forEach((search) => {
            const callback = jest.fn()

            testGetComponent({location: {search}}, callback)
            expect(callback).toBeCalledWith(null, Boolean)
        })
    })

    test('reacts to value routes correctly', () => {
        ;[['?sense=positive', Positive], ['?sense=negative', Negative]].forEach(
            ([search, component]) => {
                const callback = jest.fn()

                testGetComponent({location: {search}}, callback)
                expect(callback).toBeCalledWith(null, component)
            }
        )
    })

    test('earlier routes take priority', () => {
        const callback = jest.fn()

        testGetComponent({location: {search: '?sense=positive&active=true'}}, callback)
        expect(callback).toBeCalledWith(null, Boolean)
    })

    test('calls the onEnter callback if present', () => {
        const onEnter = jest.fn()
        fakeQueryRouterObject.childRoutes.push({
            param: 'callback',
            onEnter,
            component: WithCallback
        })

        const callback = jest.fn()
        expect(onEnter).not.toBeCalled()
        testGetComponent({location: {search: '?callback'}}, callback)
        expect(callback).toBeCalledWith(null, WithCallback)
        expect(onEnter).toHaveBeenCalledTimes(1)
    })
})
