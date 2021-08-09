/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import analyticsManager from './analytics-manager'
import Connector from './connectors/connector'
import {
    onPageReady,
    setCurrencyCode,
    dispatchCartAnalytics,
    ReduxFormPluginOption,
    formSubmitErrorWrapper,
    dispatchWishlistAnalytics,
    sendProductImpressionAnalytics,
    sendProductDetailAnalytics,
    trackPerformance,
    sendOfflinePageview,
    sendOfflineModeUsedAnalytics,
    sendA2HSPromptAnalytics,
    sendAddA2HSAnalytics,
    sendDismissA2HSAnalytics,
    sendLaunchedFromHomeScreenAnalytics
} from './actions'
import {actionTypes, SubmissionError} from 'redux-form'

import Immutable from 'immutable'

/* eslint-disable newline-per-chained-call */

const appState = {
    cart: Immutable.fromJS({
        shipping: {
            label: 'express',
            amount: '10.00'
        },
        discount: {
            amount: '-5.99',
            label: 'test discount',
            code: '123'
        },
        subtotal: '10.00',
        tax: {
            amount: '0.00',
            label: 'tax'
        },
        orderTotal: '14.01',
        items: [
            {
                id: '1234',
                productId: '3',
                href: 'product/url',
                quantity: 1,
                itemPrice: '6.00',
                linePrice: '6.00',
                configureUrl: '/configure/url'
            },
            {
                id: '5678',
                productId: '5',
                href: 'product/url/2',
                quantity: 1,
                itemPrice: '4.00',
                linePrice: '4.00',
                configureUrl: '/configure/url/2'
            }
        ],
        custom: {
            test: 'test'
        }
    }),
    products: Immutable.fromJS({
        3: {
            id: '3',
            title: 'test'
        },
        5: {
            id: '5',
            title: 'test 2'
        }
    }),
    user: Immutable.fromJS({
        wishlist: {
            products: [{productId: '3'}, {productId: '5'}]
        }
    })
}

const getState = () => {
    return appState
}

const createDomElement = (formName, fields, setFormAnalyticName, setInputAnalyticsName) => {
    const form = document.createElement('form')

    form.setAttribute('id', formName)
    if (setFormAnalyticName) {
        form.setAttribute('data-analytics-name', formName)
    }

    document.getElementsByClassName('react-target')[0].appendChild(form)

    Object.keys(fields).forEach((field) => {
        const input = document.createElement('input')

        input.setAttribute('name', field)
        if (setInputAnalyticsName) {
            input.setAttribute('data-analytics-name', field)
        }
        form.appendChild(input)
    })
}

const createStopSubmitAction = (form, payload) => {
    return {
        type: actionTypes.STOP_SUBMIT,
        meta: {
            form
        },
        payload
    }
}

const createBlurAction = (form, field) => {
    return {
        type: actionTypes.BLUR,
        meta: {
            form,
            field
        }
    }
}

const createUpdateSyncErrorsAction = (form, syncErrors) => {
    return {
        type: actionTypes.UPDATE_SYNC_ERRORS,
        meta: {
            form
        },
        payload: {
            syncErrors
        }
    }
}

const createSetSubmitFailedAction = () => {
    return {
        type: actionTypes.SET_SUBMIT_FAILED
    }
}

const mockReduxFormAction = (action) => {
    ReduxFormPluginOption.all(null, action)
}

// // Set up the DOM
window.Progressive = {}

// Build react-target DOM element
const reactRoot = document.createElement('div')
reactRoot.className = 'react-target'
document.body.appendChild(reactRoot)

const scriptel = document.createElement('script')
scriptel.id = 'progressive-web-main'
scriptel.src = '/test.js'
document.body.appendChild(scriptel)

// Mock Analytics Manager
class MyConnector extends Connector {
    constructor() {
        super('New Connector')

        this.init = jest.fn()
        this.pageviewEvent = jest.fn()
        this.purchaseEvent = jest.fn()
        this.send = jest.fn()
        this.receive = jest.fn()

        this.ready()
    }
}

const myConnector = new MyConnector()

analyticsManager.init(
    {
        projectSlug: 'progressive-web-sdk',
        mobifyGAID: 'test',
        ecommerceLibrary: 'ec',
        debug: true
    },
    myConnector
)

describe('Analytics Manager - Actions', () => {
    beforeEach(() => {
        ;[...document.getElementsByTagName('form')].forEach((form) => {
            form.remove()
        })

        myConnector.receive.mockClear()
    })

    test('dispatch setCurrency analytics', () => {
        expect(setCurrencyCode('EUR')).toEqual({
            type: 'Set currency code for analytics',
            payload: 'EUR',
            meta: {
                analytics: {
                    type: 'setCurrency',
                    payload: {
                        currencyCode: 'EUR'
                    }
                }
            }
        })
    })

    test('dispatch pageview analytics', () => {
        expect(onPageReady('test')).toEqual({
            type: 'Send pageview analytics',
            payload: 'test',
            meta: {
                analytics: {
                    type: 'pageview',
                    payload: {
                        templateName: 'test'
                    }
                }
            }
        })
    })

    test('dispatch offline pageview analytics with offline_success', () => {
        expect(
            sendOfflinePageview('https://www.merlinspotions.com', 'test', 'test title', true)
        ).toEqual({
            type: 'Send offline pageview analytics',
            payload: 'https://www.merlinspotions.com',
            meta: {
                analytics: {
                    type: 'pageview',
                    payload: {
                        location: 'https://www.merlinspotions.com',
                        path: '/',
                        templateName: 'test',
                        status: 'offline_success',
                        title: 'test title'
                    }
                }
            }
        })
    })

    test('dispatch offline pageview analytics with offline_failed', () => {
        expect(
            sendOfflinePageview('https://www.merlinspotions.com', 'test', 'test title', false)
        ).toEqual({
            type: 'Send offline pageview analytics',
            payload: 'https://www.merlinspotions.com',
            meta: {
                analytics: {
                    type: 'pageview',
                    payload: {
                        location: 'https://www.merlinspotions.com',
                        path: '/',
                        templateName: 'test',
                        status: 'offline_failed',
                        title: 'test title'
                    }
                }
            }
        })
    })

    test('dispatch offline mode used analytics', () => {
        const duration = 14075
        const timestamp = 1504050704103
        expect(
            sendOfflineModeUsedAnalytics(duration, 1504050704103, [
                {inCache: true},
                {inCache: false},
                {inCache: false}
            ])
        ).toEqual({
            type: 'Send Offline mode used analytics',
            payload: duration,
            meta: {
                analytics: {
                    type: 'offlineModeUsed',
                    payload: {
                        durationOfOffline: duration,
                        timestamp,
                        offlinePageFailed: 2,
                        offlinePageSuccess: 1
                    }
                }
            }
        })
    })

    test('dispatchCartAnalytics - add to cart action', () => {
        const dispatch = jest.fn()

        dispatchCartAnalytics('addToCart', dispatch, getState, '3', '8')

        expect(dispatch.mock.calls).toEqual([
            [
                {
                    type: 'Send cart analytics',
                    payload: 2,
                    meta: {
                        analytics: {
                            type: 'addToCart',
                            payload: {
                                cart: {
                                    count: '2',
                                    subtotal: '10.00',
                                    type: 'cart'
                                },
                                product: {
                                    id: '3',
                                    name: 'Product',
                                    title: 'test',
                                    quantity: '8'
                                }
                            }
                        }
                    }
                }
            ]
        ])
    })

    test('dispatchCartAnalytics - remove from cart action', () => {
        const dispatch = jest.fn()

        dispatchCartAnalytics('removeFromCart', dispatch, getState, '3')

        expect(dispatch.mock.calls).toEqual([
            [
                {
                    type: 'Send cart analytics',
                    payload: 2,
                    meta: {
                        analytics: {
                            type: 'removeFromCart',
                            payload: {
                                cart: {
                                    count: '2',
                                    subtotal: '10.00',
                                    type: 'cart'
                                },
                                product: {
                                    id: '3',
                                    name: 'Product',
                                    title: 'test'
                                }
                            }
                        }
                    }
                }
            ]
        ])
    })

    test('dispatchWishlistAnalytics - add to wishlist action', () => {
        const dispatch = jest.fn()
        const actionType = 'addToWishlist'

        dispatchWishlistAnalytics(actionType, dispatch, getState, '3', '1')

        expect(dispatch.mock.calls).toEqual([
            [
                {
                    type: 'Send wishlist analytics',
                    payload: '3',
                    meta: {
                        analytics: {
                            type: actionType,
                            payload: {
                                cart: {
                                    count: '3',
                                    type: 'wishlist'
                                },
                                product: {
                                    id: '3',
                                    name: 'Product',
                                    title: 'test'
                                }
                            }
                        }
                    }
                }
            ]
        ])
    })

    test('dispatchWishlistAnalytics - remove from wishlist action', () => {
        const dispatch = jest.fn()
        const actionType = 'removeFromWishlist'

        dispatchWishlistAnalytics(actionType, dispatch, getState, '3', '1')

        expect(dispatch.mock.calls).toEqual([
            [
                {
                    type: 'Send wishlist analytics',
                    payload: '2',
                    meta: {
                        analytics: {
                            type: actionType,
                            payload: {
                                cart: {
                                    count: '2',
                                    type: 'wishlist'
                                },
                                product: {
                                    id: '3',
                                    name: 'Product',
                                    title: 'test'
                                }
                            }
                        }
                    }
                }
            ]
        ])
    })

    test('Track submit validation errors', () => {
        const formId = 'test'
        const fields = {
            email: 'Required'
        }
        createDomElement(formId, fields, true, true)

        mockReduxFormAction(createStopSubmitAction(formId, fields))

        expect(myConnector.receive.mock.calls).toEqual([
            [
                'uiInteraction',
                {
                    subject: 'app',
                    action: 'Display',
                    object: 'Error',
                    name: 'test_form:email',
                    content: 'Required'
                },
                undefined
            ]
        ])
    })

    test('Track submit validation errors', () => {
        const formId = 'test'
        const fields = {
            _error: 'Form error'
        }
        createDomElement(formId, fields, true, true)

        mockReduxFormAction(createStopSubmitAction(formId, fields))

        expect(myConnector.receive.mock.calls).toEqual([
            [
                'uiInteraction',
                {
                    subject: 'app',
                    action: 'Display',
                    object: 'Error',
                    name: 'test_form',
                    content: 'Form error'
                },
                undefined
            ]
        ])
    })

    test("No tracking if form isn't there", () => {
        const formId = 'test'
        const fields = {
            email: 'Required'
        }

        mockReduxFormAction(createStopSubmitAction(formId, fields))

        expect(myConnector.receive.mock.calls).toEqual([])
    })

    test("No tracking if input isn't there", () => {
        const formId = 'test'
        const fields = {
            email: 'Required'
        }
        createDomElement(formId, fields, true, true)
        document.getElementsByTagName('input')[0].remove()

        mockReduxFormAction(createStopSubmitAction(formId, fields))

        expect(myConnector.receive.mock.calls).toEqual([])
    })

    test('Track input sync validation errors', () => {
        const formId = 'test'
        const fields = {
            email: 'Required',
            firstName: 'Required',
            lastName: 'Required'
        }
        createDomElement(formId, fields, true, true)

        mockReduxFormAction(createUpdateSyncErrorsAction(formId, fields))
        mockReduxFormAction(createBlurAction(formId, 'email'))

        expect(myConnector.receive.mock.calls).toEqual([
            [
                'uiInteraction',
                {
                    subject: 'app',
                    action: 'Display',
                    object: 'Error',
                    name: 'test_form:email',
                    content: 'Required'
                },
                undefined
            ]
        ])
    })

    test('Track form sync validation errors', () => {
        const formId = 'test'
        const fields = {
            email: 'Email is invalid',
            firstName: 'Required',
            lastName: 'Required'
        }
        createDomElement(formId, fields, true, true)

        mockReduxFormAction(createUpdateSyncErrorsAction(formId, fields))
        mockReduxFormAction(createBlurAction(formId, 'email'))
        mockReduxFormAction(createSetSubmitFailedAction())

        expect(myConnector.receive.mock.calls).toEqual([
            [
                'uiInteraction',
                {
                    subject: 'app',
                    action: 'Display',
                    object: 'Error',
                    name: 'test_form:email',
                    content: 'Email is invalid'
                },
                undefined
            ],
            [
                'uiInteraction',
                {
                    subject: 'app',
                    action: 'Display',
                    object: 'Error',
                    name: 'test_form:email',
                    content: 'Email is invalid'
                },
                undefined
            ],
            [
                'uiInteraction',
                {
                    subject: 'app',
                    action: 'Display',
                    object: 'Error',
                    name: 'test_form:firstName',
                    content: 'Required'
                },
                undefined
            ],
            [
                'uiInteraction',
                {
                    subject: 'app',
                    action: 'Display',
                    object: 'Error',
                    name: 'test_form:lastName',
                    content: 'Required'
                },
                undefined
            ]
        ])
    })

    test('Track Redux Form plugin error', () => {
        const formId = 'test'
        const fields = {
            email: 'Required'
        }
        createDomElement(formId, fields, true, true)

        mockReduxFormAction({
            type: actionTypes.STOP_SUBMIT
        })

        expect(myConnector.receive.mock.calls).toEqual([
            [
                'uiInteraction',
                {
                    subject: 'app',
                    action: 'Receive',
                    object: 'Error',
                    name: 'Redux Form Plugin error'
                },
                undefined
            ]
        ])
    })

    test("Redux Form SET_SUBMIT_FAILED without UPDATE_SYNC_ERRORS action doesn't track anything", () => {
        const formId = 'test'
        const fields = {
            email: 'Email is invalid',
            firstName: 'Required',
            lastName: 'Required'
        }
        createDomElement(formId, fields, true, true)

        mockReduxFormAction(createSetSubmitFailedAction())

        expect(myConnector.receive.mock.calls).toEqual([])
    })

    expect(onPageReady('test')).toEqual({
        type: 'Send pageview analytics',
        payload: 'test',
        meta: {
            analytics: {
                type: 'pageview',
                payload: {
                    templateName: 'test'
                }
            }
        }
    })

    test('Track A2HS Prompt shown', () => {
        expect(sendA2HSPromptAnalytics()).toEqual({
            type: 'Send A2HS Prompt analytics',
            meta: {
                analytics: {
                    type: 'uiInteraction',
                    payload: {
                        subject: 'app',
                        action: 'Display',
                        object: 'Element',
                        name: 'add_to_home:prompt'
                    }
                }
            }
        })
    })

    test('Track accept A2HS from prompt', () => {
        expect(sendAddA2HSAnalytics()).toEqual({
            type: 'Send Add A2HS analytics',
            meta: {
                analytics: {
                    type: 'uiInteraction',
                    payload: {
                        subject: 'user',
                        action: 'Click',
                        object: 'Button',
                        name: 'add_to_home:accept'
                    }
                }
            }
        })
    })

    test('Track dismiss A2HS from prompt', () => {
        expect(sendDismissA2HSAnalytics()).toEqual({
            type: 'Send Dismiss A2HS analytics',
            meta: {
                analytics: {
                    type: 'uiInteraction',
                    payload: {
                        subject: 'user',
                        action: 'Click',
                        object: 'Button',
                        name: 'add_to_home:dismiss'
                    }
                }
            }
        })
    })

    test('Track launched from homescreen', () => {
        expect(sendLaunchedFromHomeScreenAnalytics()).toEqual({
            type: 'Send launched from homescreen analytics',
            meta: {
                analytics: {
                    type: 'launchedFromHomeScreen',
                    payload: {
                        subject: 'user',
                        action: 'Click',
                        object: 'Button',
                        name: 'add_to_home:launch'
                    }
                }
            }
        })
    })

    test('Track API submit errors', (done) => {
        const mockDispatch = () => {
            return new Promise(() => {
                throw new SubmissionError({
                    email: 'Email is required',
                    password: 'Password is required'
                })
            })
        }

        formSubmitErrorWrapper(() => {})(mockDispatch).catch(() => {
            expect(myConnector.receive.mock.calls).toEqual([
                [
                    'uiInteraction',
                    {
                        subject: 'app',
                        action: 'Display',
                        object: 'Error',
                        name: 'submit',
                        content: 'Email is required'
                    },
                    undefined
                ],
                [
                    'uiInteraction',
                    {
                        subject: 'app',
                        action: 'Display',
                        object: 'Error',
                        name: 'submit',
                        content: 'Password is required'
                    },
                    undefined
                ]
            ])
            done()
        })
    })

    test('dispatch product impression analytics', () => {
        expect(sendProductImpressionAnalytics('1')).toEqual({
            type: 'Send product impression analytics',
            payload: '1',
            meta: {
                analytics: {
                    type: 'productImpression',
                    payload: {
                        productId: '1'
                    }
                }
            }
        })
    })

    test('dispatch product detail analytics', () => {
        expect(sendProductDetailAnalytics()).toEqual({
            type: 'Send product detatil analytics',
            meta: {
                analytics: {
                    type: 'productDetail'
                }
            }
        })
    })

    test('Track performance metrics', () => {
        window.Progressive.PerformanceTiming = {
            timingStart: 0
        }

        // First load metrics
        trackPerformance('templateWillMount')
        trackPerformance('templateDidMount')
        trackPerformance('templateAPIEnd')

        // View metrics
        trackPerformance('templateWillMount')
        trackPerformance('templateDidMount')
        trackPerformance('isSavedPage', 'true')
        trackPerformance('templateAPIEnd')

        const mockedCall = myConnector.receive.mock.calls[0]
        const checkCallDelay = (timingValue) => {
            expect(timingValue).toBeGreaterThanOrEqual(0)
            expect(timingValue).toBeLessThan(5)
        }

        expect(mockedCall[0]).toBe('performance')
        expect(mockedCall[1].bundle).toBe('development')
        checkCallDelay(mockedCall[1].templateWillMount)
        checkCallDelay(mockedCall[1].templateDidMount)
        checkCallDelay(mockedCall[1].templateAPIEnd)
        expect(mockedCall[1].isSavedPage).toBe('true')
        expect(mockedCall[1].timingStart).toBeDefined()
    })
})
