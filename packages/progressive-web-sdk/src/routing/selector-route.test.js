/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-disable import/namespace */
/* eslint-env jest */

import * as jqueryResponseUtils from '../jquery-response'

import {SelectorRouter} from './index.jsx'

const Positive = () => {}
const Negative = () => {}

describe('getComponent', () => {
    const originalJqueryResponse = jqueryResponseUtils.jqueryResponse
    jqueryResponseUtils.jqueryResponse = () => {
        const mockDoc = {
            find: (selector) => {
                if (selector === '#present') {
                    return [true]
                } else {
                    return []
                }
            }
        }

        return Promise.resolve([{}, mockDoc])
    }

    let realFetch
    beforeEach(() => {
        realFetch = global.fetch
        global.fetch = jest.fn()
        global.fetch.mockReturnValue(Promise.resolve())
    })

    afterEach(() => {
        global.fetch = realFetch
    })

    afterAll(() => {
        jqueryResponseUtils.jqueryResponse = originalJqueryResponse
    })

    test('returns the default component if no match is found', () => {
        const noMatchRouterObject = {
            childRoutes: [{selector: '#notpresent', component: Negative}],
            defaultComponent: Positive
        }

        const testGetComponent = SelectorRouter.defaultProps.getComponent.bind(noMatchRouterObject)

        const callback = jest.fn()

        return testGetComponent({location: {pathname: '', search: ''}}, callback).then(() => {
            expect(callback).toBeCalled()
            expect(callback).toBeCalledWith(null, Positive)
        })
    })

    test('calls the callback with the correct component if it is found', () => {
        const matchRouterObject = {
            childRoutes: [{selector: '#present', component: Positive}]
        }

        const testGetComponent = SelectorRouter.defaultProps.getComponent.bind(matchRouterObject)

        const callback = jest.fn()

        return testGetComponent({location: {pathname: '', search: ''}}, callback).then(() => {
            expect(callback).toBeCalledWith(null, Positive)
        })
    })

    test('calls the onEnter function of the matched route', () => {
        const onEnter = jest.fn()

        const matchRouterObject = {
            childRoutes: [{selector: '#present', component: Positive, onEnter}]
        }

        const testGetComponent = SelectorRouter.defaultProps.getComponent.bind(matchRouterObject)

        return testGetComponent({location: {pathname: '', search: ''}}, () => {}).then(() => {
            expect(onEnter).toBeCalled()
        })
    })

    test('uses makeRequest to create the request if provided', () => {
        const makeRequest = jest.fn()
        makeRequest.mockReturnValue(Promise.resolve())

        const matchRouterObject = {
            childRoutes: [{selector: '#present', component: Positive}],
            makeRequest
        }

        const testGetComponent = SelectorRouter.defaultProps.getComponent.bind(matchRouterObject)

        return testGetComponent({location: {pathname: 'path', search: 'search'}}, () => {}).then(
            () => {
                expect(makeRequest).toBeCalledWith('pathsearch')
            }
        )
    })

    test('calls handleFetchError if the request fails', () => {
        const makeRequest = () => Promise.reject()
        const handleFetchError = jest.fn()

        const matchRouterObject = {
            childRoutes: [{selector: '#present', component: Positive}],
            makeRequest,
            handleFetchError
        }

        const testGetComponent = SelectorRouter.defaultProps.getComponent.bind(matchRouterObject)

        return testGetComponent({location: {pathname: '', search: ''}}, () => {}).then(() => {
            expect(handleFetchError).toBeCalled()
        })
    })
})

describe('onChange', () => {
    test('calls getComponent', () => {
        const prevState = {}
        const nextState = {}
        const replace = () => {}
        const callback = jest.fn()

        SelectorRouter.defaultProps.getComponent = jest.fn((nextState, cb) => {
            cb()
        })
        SelectorRouter.defaultProps.onChange(prevState, nextState, replace, callback)

        expect(SelectorRouter.defaultProps.getComponent).toBeCalled()
        expect(callback).toBeCalled()
    })

    test('sets this.component', () => {
        const prevState = {}
        const nextState = {}
        const replace = () => {}
        const callback = jest.fn()
        const component = {}

        SelectorRouter.defaultProps.getComponent = jest.fn((nextState, cb) => {
            cb(null, component)
        })

        SelectorRouter.defaultProps.onChange(prevState, nextState, replace, callback)

        expect(SelectorRouter.defaultProps.component).toBe(component)
    })
})
