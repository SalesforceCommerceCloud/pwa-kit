/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import GoogleAnalytics from './connector'

// We are mocking the console outputs because we are testing debug information is outputting
// but this makes the terminal screen really noisy. Below is a toggle to see console output
const showOutput = false

const consoleErr = window.console.error
const consoleWarn = window.console.warn
const consoleInfo = window.console.info
const consoleLog = window.console.log

// Mocking the console object
const wrapOutputWithJest = (originalFn) => {
    return jest.fn((...args) => {
        if (showOutput) {
            originalFn.apply(this, args)
        }
    })
}

// Make sure we have a clean call queue every test
const mockConsoleOutput = () => {
    window.console.error = wrapOutputWithJest(consoleErr)
    window.console.warn = wrapOutputWithJest(consoleWarn)
    window.console.info = wrapOutputWithJest(consoleInfo)
    window.console.log = wrapOutputWithJest(consoleLog)

    // These functions don't exist in jsDom
    window.console.groupCollapsed = jest.fn()
    window.console.groupEnd = jest.fn()
}

const TRACKER_NAME = 'testTracker'
const TRACKER_NAME1 = 'testTracker1'
const TRACKER_NAME2 = 'testTracker2'

class MyGa1 extends GoogleAnalytics {
    constructor(options) {
        super('MyGa1', TRACKER_NAME1, options)
    }

    ready(callback) {
        window.ga('create', 'testGAID1', 'auto', {name: this.trackerName})
        super.ready(callback)
    }
}

class MobifyGA extends GoogleAnalytics {
    constructor(options) {
        super('MobifyGA', TRACKER_NAME2, options)

        this.debugCallback = jest.fn()
    }

    ready() {
        window.ga('create', 'testGAID2', 'auto', {name: this.trackerName})
        super.ready()
    }
}

const purchaseInfo1 = {
    transaction: {
        id: 't-124',
        revenue: '160'
    },
    products: [
        {
            id: 'p-123',
            name: 'Red Potion',
            price: '90',
            quantity: 1
        },
        {
            id: 'p-456',
            name: 'Blue Potion',
            price: '45',
            quantity: 1
        }
    ]
}

const purchaseInfo2 = {
    transaction: {
        id: 't-125',
        revenue: '150'
    },
    products: [
        {
            id: 'p-123',
            name: 'Red Potion',
            price: '90',
            quantity: 1
        },
        {
            id: 'p-457',
            name: 'Green Potion',
            price: '35',
            quantity: 1
        }
    ]
}

const checkMockedCalls = (mockedQueue, values) => {
    const filteredQueue = mockedQueue.filter((queuedCall) => {
        return typeof queuedCall[0] !== 'function'
    })
    expect(filteredQueue).toEqual(values)
}

const runSplitTest = (splitTestTrackingConfig) => {
    const ecommerceLibrary = 'ec'
    const myGA = new MyGa1({
        ecommerceLibrary,
        splitTestTrackingConfig
    })

    myGA.ready()

    const customTaskCall = window.ga.mock.calls[2]
    // Because the customTaskCall contains a function
    // it doesn't play nicely with our checkMockedCalls util
    // so we'll clean up the calls to make future tests easier
    window.ga.mock.calls = window.ga.mock.calls.slice(3)

    // This is the callback which contains the dimensions we set
    const fn = customTaskCall[2]

    const mockModel = {
        get: () => 'clientID'
    }
    fn(mockModel)
}

describe('Google Analyics Connector', () => {
    beforeEach(() => {
        // Clean all scripts
        ;[...document.getElementsByTagName('script')].forEach((script) => {
            document.body.removeChild(script)
        })

        mockConsoleOutput()

        window.ga = jest.fn((arg) => {
            // Mock Ga ready callback
            if (typeof arg === 'function') {
                arg()
            }
        })
        window.ga.getByName = (trackerName) => {
            if (
                trackerName === TRACKER_NAME ||
                trackerName === TRACKER_NAME1 ||
                trackerName === TRACKER_NAME2
            ) {
                return {
                    get: jest.fn()
                }
            }
            return undefined
        }

        // Append first script tag
        const el = document.createElement('script')
        el.src = `/scripts/first.js`
        document.body.appendChild(el)
    })

    test('initializes', () => {
        const ecommerceLibrary = 'ec'
        const myGA = new GoogleAnalytics('Test', TRACKER_NAME, {ecommerceLibrary})

        expect(myGA).toBeDefined()
        expect(myGA.name).toBe('Test')
        expect(myGA.trackerName).toBe(TRACKER_NAME)
        expect(myGA.options.ecommerceLibrary).toBe(ecommerceLibrary)

        const scripts = document.getElementsByTagName('script')
        expect(scripts.length).toBe(2)
    })

    test('throws error if tracker name is not provided', () => {
        let myGA
        expect(() => {
            myGA = new GoogleAnalytics()
        }).toThrow()

        expect(myGA).toBeUndefined()
    })

    test('getActionName will namespace the action with tracker name', () => {
        const ecommerceLibrary = 'ec'
        const myGA = new GoogleAnalytics('Test', TRACKER_NAME, {ecommerceLibrary})

        expect(myGA.getActionName('page')).toBe(`${TRACKER_NAME}.page`)
    })

    test('init throws error when required options are not present', () => {
        let myGA

        expect(() => {
            myGA = new GoogleAnalytics('Test', TRACKER_NAME)
        }).toThrow()

        expect(myGA).toBeUndefined()
    })

    test('init throws error when required options are not valid', () => {
        let myGA

        expect(() => {
            myGA = new GoogleAnalytics('Test', TRACKER_NAME, {
                ecommerceLibrary: 'ec2'
            })
        }).toThrow()

        expect(myGA).toBeUndefined()
    })

    test('ready does not error when all requirements are met', () => {
        const ecommerceLibrary = 'ec'
        const myGA = new MyGa1({ecommerceLibrary})

        expect(() => {
            myGA.ready()
        }).not.toThrow()

        checkMockedCalls(window.ga.mock.calls, [
            ['create', 'testGAID1', 'auto', {name: TRACKER_NAME1}]
        ])
    })

    test('ready callback is called', (done) => {
        const ecommerceLibrary = 'ec'
        const myGA = new MyGa1({ecommerceLibrary})

        myGA.ready(() => {
            done()
        })
    })

    test('ready throws when requirments are not met', () => {
        const ecommerceLibrary = 'ec'
        const myGA = new GoogleAnalytics('Test', 'testTracker3', {ecommerceLibrary})

        expect(() => {
            myGA.ready()
        }).toThrow()
    })

    test('calls setSplitTestTracking if splitTestTrackingConfig is defined', () => {
        const ecommerceLibrary = 'ec'
        const myGA = new MyGa1({
            ecommerceLibrary,
            splitTestTrackingConfig: {
                clientIDDimension: 3,
                bucketDimension: 4,
                bucketValue: 'experiment'
            }
        })

        myGA.setSplitTestTracking = jest.fn()
        myGA.ready()

        expect(myGA.setSplitTestTracking).toBeCalled()
    })

    test('setSplitTestTracking sets custom dimensions', () => {
        runSplitTest({
            clientIDDimension: 3,
            bucketDimension: 4,
            bucketValue: 'experiment'
        })

        checkMockedCalls(window.ga.mock.calls, [
            [`${TRACKER_NAME1}.set`, 'dimension3', 'clientID'],
            [`${TRACKER_NAME1}.set`, 'dimension4', 'experiment']
        ])
    })

    test('setSplitTestTracking does not set the clientID if clientIDDimension is undefined', () => {
        runSplitTest({
            bucketDimension: 4,
            bucketValue: 'experiment'
        })

        checkMockedCalls(window.ga.mock.calls, [
            [`${TRACKER_NAME1}.set`, 'dimension4', 'experiment']
        ])
    })

    test('setSplitTestTracking does not set the bucket if bucketDimension is undefined', () => {
        runSplitTest({
            clientIDDimension: 3
        })

        checkMockedCalls(window.ga.mock.calls, [[`${TRACKER_NAME1}.set`, 'dimension3', 'clientID']])
    })

    test('send does not invoke window.ga if no arguments are provided', () => {
        const ecommerceLibrary = 'ec'
        const myGA = new MyGa1({ecommerceLibrary})

        myGA.ready()
        myGA.send('pageview')

        checkMockedCalls(window.ga.mock.calls, [
            ['create', 'testGAID1', 'auto', {name: TRACKER_NAME1}]
        ])
    })

    test('sends a pageview event', () => {
        const ecommerceLibrary = 'ec'
        const myGA = new MobifyGA({
            ecommerceLibrary,
            debug: true
        })

        myGA.ready()
        myGA.receive('pageview', {templateName: 'test'})

        checkMockedCalls(window.ga.mock.calls, [
            ['create', 'testGAID2', 'auto', {name: TRACKER_NAME2}],
            [`${TRACKER_NAME2}.set`, 'page', '/'],
            [`${TRACKER_NAME2}.send`, 'pageview']
        ])

        expect(myGA.debugCallback.mock.calls).toEqual([['pageview', `send`, 'pageview']])
    })

    test('sends a purchase event with ec', () => {
        const ecommerceLibrary = 'ec'
        const myGA = new MyGa1({
            ecommerceLibrary,
            debug: true
        })

        myGA.ready()

        // Mock GA created tracker
        window.ga.getAll = jest.fn(() => {
            return [myGA.tracker]
        })

        myGA.receive('purchase', purchaseInfo1)

        checkMockedCalls(window.ga.mock.calls, [
            ['create', 'testGAID1', 'auto', {name: TRACKER_NAME1}],
            [`${TRACKER_NAME1}.require`, 'ec'],
            [
                `${TRACKER_NAME1}.ec:addProduct`,
                {
                    id: 'p-123',
                    name: 'Red Potion',
                    price: '90',
                    quantity: '1'
                }
            ],
            [
                `${TRACKER_NAME1}.ec:addProduct`,
                {
                    id: 'p-456',
                    name: 'Blue Potion',
                    price: '45',
                    quantity: '1'
                }
            ],
            [
                `${TRACKER_NAME1}.ec:setAction`,
                'purchase',
                {
                    id: 't-124',
                    revenue: '160'
                }
            ],
            [`${TRACKER_NAME1}.send`, 'event', 'Ecommerce', 'Purchase', {nonInteraction: 1}]
        ])
    })

    test('sends a purchase event with ecommerce', () => {
        const ecommerceLibrary = 'ecommerce'
        const myGA = new MyGa1({
            ecommerceLibrary,
            debug: true
        })

        myGA.ready()

        // Mock GA created tracker
        window.ga.getAll = jest.fn(() => {
            return [myGA.tracker]
        })

        myGA.receive('purchase', purchaseInfo1)

        checkMockedCalls(window.ga.mock.calls, [
            ['create', 'testGAID1', 'auto', {name: TRACKER_NAME1}],
            [`${TRACKER_NAME1}.require`, 'ecommerce'],
            [
                `${TRACKER_NAME1}.ecommerce:addItem`,
                {
                    id: 't-124',
                    sku: 'p-123',
                    name: 'Red Potion',
                    price: '90',
                    quantity: '1'
                }
            ],
            [
                `${TRACKER_NAME1}.ecommerce:addItem`,
                {
                    id: 't-124',
                    sku: 'p-456',
                    name: 'Blue Potion',
                    price: '45',
                    quantity: '1'
                }
            ],
            [
                `${TRACKER_NAME1}.ecommerce:addTransaction`,
                {
                    id: 't-124',
                    revenue: '160'
                }
            ],
            [`${TRACKER_NAME1}.ecommerce:send`]
        ])
    })

    test('sends 2 purchase event with ec does not load ec plugin twice', () => {
        const ecommerceLibrary = 'ec'
        const myGA = new MyGa1({
            ecommerceLibrary,
            debug: true
        })

        myGA.ready()

        // Mock GA created tracker
        window.ga.getAll = jest.fn(() => {
            return [myGA.tracker]
        })

        myGA.receive('purchase', purchaseInfo1)

        // Mock loaded plugin
        myGA.tracker.plugins_ = {
            get: jest.fn(() => true)
        }

        myGA.receive('purchase', purchaseInfo2)

        checkMockedCalls(window.ga.mock.calls, [
            ['create', 'testGAID1', 'auto', {name: TRACKER_NAME1}],
            [`${TRACKER_NAME1}.require`, 'ec'],
            [
                `${TRACKER_NAME1}.ec:addProduct`,
                {
                    id: 'p-123',
                    name: 'Red Potion',
                    price: '90',
                    quantity: '1'
                }
            ],
            [
                `${TRACKER_NAME1}.ec:addProduct`,
                {
                    id: 'p-456',
                    name: 'Blue Potion',
                    price: '45',
                    quantity: '1'
                }
            ],
            [
                `${TRACKER_NAME1}.ec:setAction`,
                'purchase',
                {
                    id: 't-124',
                    revenue: '160'
                }
            ],
            [`${TRACKER_NAME1}.send`, 'event', 'Ecommerce', 'Purchase', {nonInteraction: 1}],
            [
                `${TRACKER_NAME1}.ec:addProduct`,
                {
                    id: 'p-123',
                    name: 'Red Potion',
                    price: '90',
                    quantity: '1'
                }
            ],
            [
                `${TRACKER_NAME1}.ec:addProduct`,
                {
                    id: 'p-457',
                    name: 'Green Potion',
                    price: '35',
                    quantity: '1'
                }
            ],
            [
                `${TRACKER_NAME1}.ec:setAction`,
                'purchase',
                {
                    id: 't-125',
                    revenue: '150'
                }
            ],
            [`${TRACKER_NAME1}.send`, 'event', 'Ecommerce', 'Purchase', {nonInteraction: 1}]
        ])
    })

    test('sends 1 purchase event with ec with 2 different GA connectors', () => {
        const ecommerceLibrary = 'ec'
        const myGA1 = new MyGa1({
            ecommerceLibrary,
            debug: true
        })
        const myGA2 = new MobifyGA({
            ecommerceLibrary,
            debug: true
        })

        myGA1.ready()
        myGA2.ready()

        // Mock GA created tracker
        window.ga.getAll = jest.fn(() => {
            return [myGA1.tracker, myGA2.tracker]
        })

        myGA1.receive('purchase', purchaseInfo1)

        // Mock loaded plugin
        myGA1.tracker.plugins_ = {
            get: jest.fn((plugin) => {
                return plugin === 'ec'
            })
        }

        myGA2.receive('purchase', purchaseInfo2)

        checkMockedCalls(window.ga.mock.calls, [
            ['create', 'testGAID1', 'auto', {name: TRACKER_NAME1}],
            ['create', 'testGAID2', 'auto', {name: TRACKER_NAME2}],
            [`${TRACKER_NAME1}.require`, 'ec'],
            [
                `${TRACKER_NAME1}.ec:addProduct`,
                {
                    id: 'p-123',
                    name: 'Red Potion',
                    price: '90',
                    quantity: '1'
                }
            ],
            [
                `${TRACKER_NAME1}.ec:addProduct`,
                {
                    id: 'p-456',
                    name: 'Blue Potion',
                    price: '45',
                    quantity: '1'
                }
            ],
            [
                `${TRACKER_NAME1}.ec:setAction`,
                'purchase',
                {
                    id: 't-124',
                    revenue: '160'
                }
            ],
            [`${TRACKER_NAME1}.send`, 'event', 'Ecommerce', 'Purchase', {nonInteraction: 1}],
            [`${TRACKER_NAME2}.require`, 'ec'],
            [
                `${TRACKER_NAME2}.ec:addProduct`,
                {
                    id: 'p-123',
                    name: 'Red Potion',
                    price: '90',
                    quantity: '1'
                }
            ],
            [
                `${TRACKER_NAME2}.ec:addProduct`,
                {
                    id: 'p-457',
                    name: 'Green Potion',
                    price: '35',
                    quantity: '1'
                }
            ],
            [
                `${TRACKER_NAME2}.ec:setAction`,
                'purchase',
                {
                    id: 't-125',
                    revenue: '150'
                }
            ],
            [`${TRACKER_NAME2}.send`, 'event', 'Ecommerce', 'Purchase', {nonInteraction: 1}]
        ])
    })

    test('sends 1 purchase event with ecommerce with 2 different GA connectors', () => {
        const ecommerceLibrary = 'ecommerce'
        const myGA1 = new MyGa1({
            ecommerceLibrary,
            debug: true
        })
        const myGA2 = new MobifyGA({
            ecommerceLibrary,
            debug: true
        })

        myGA1.ready()
        myGA2.ready()

        // Mock GA created tracker
        window.ga.getAll = jest.fn(() => {
            return [myGA1.tracker, myGA2.tracker]
        })

        myGA1.receive('purchase', purchaseInfo1)

        // Mock loaded plugin
        myGA1.tracker.plugins_ = {
            get: jest.fn((plugin) => {
                return plugin === 'ecommerce'
            })
        }

        myGA2.receive('purchase', purchaseInfo2)

        checkMockedCalls(window.ga.mock.calls, [
            ['create', 'testGAID1', 'auto', {name: TRACKER_NAME1}],
            ['create', 'testGAID2', 'auto', {name: TRACKER_NAME2}],
            [`${TRACKER_NAME1}.require`, 'ecommerce'],
            [
                `${TRACKER_NAME1}.ecommerce:addItem`,
                {
                    id: 't-124',
                    sku: 'p-123',
                    name: 'Red Potion',
                    price: '90',
                    quantity: '1'
                }
            ],
            [
                `${TRACKER_NAME1}.ecommerce:addItem`,
                {
                    id: 't-124',
                    sku: 'p-456',
                    name: 'Blue Potion',
                    price: '45',
                    quantity: '1'
                }
            ],
            [
                `${TRACKER_NAME1}.ecommerce:addTransaction`,
                {
                    id: 't-124',
                    revenue: '160'
                }
            ],
            [`${TRACKER_NAME1}.ecommerce:send`],
            [`${TRACKER_NAME2}.require`, 'ecommerce'],
            [
                `${TRACKER_NAME2}.ecommerce:addItem`,
                {
                    id: 't-125',
                    sku: 'p-123',
                    name: 'Red Potion',
                    price: '90',
                    quantity: '1'
                }
            ],
            [
                `${TRACKER_NAME2}.ecommerce:addItem`,
                {
                    id: 't-125',
                    sku: 'p-457',
                    name: 'Green Potion',
                    price: '35',
                    quantity: '1'
                }
            ],
            [
                `${TRACKER_NAME2}.ecommerce:addTransaction`,
                {
                    id: 't-125',
                    revenue: '150'
                }
            ],
            [`${TRACKER_NAME2}.ecommerce:send`]
        ])
    })

    test('sends 1 purchase event with ecommerce with 2 different GA connectors', () => {
        const myGA1 = new MyGa1({
            ecommerceLibrary: 'ec',
            debug: true
        })
        const myGA2 = new MobifyGA({
            ecommerceLibrary: 'ecommerce',
            debug: true
        })

        myGA1.ready()
        myGA2.ready()

        // Mock GA created tracker
        window.ga.getAll = jest.fn(() => {
            return [myGA1.tracker, myGA2.tracker]
        })

        myGA1.receive('purchase', purchaseInfo1)

        // Mock loaded plugin
        myGA1.tracker.plugins_ = {
            get: jest.fn((plugin) => {
                return plugin === 'ec'
            })
        }

        expect(() => {
            myGA2.receive('purchase', purchaseInfo2)
        }).toThrow()
    })

    test('sends a product impression event with ec', () => {
        const myGA = new MyGa1({
            ecommerceLibrary: 'ec'
        })

        myGA.ready()

        // Mock GA created tracker
        window.ga.getAll = jest.fn(() => {
            return [myGA.tracker]
        })

        myGA.ecAddImpressionAction({
            id: 'p-123',
            name: 'Red Potion',
            price: '90',
            quantity: '1'
        })

        checkMockedCalls(window.ga.mock.calls, [
            ['create', 'testGAID1', 'auto', {name: TRACKER_NAME1}],
            [`${TRACKER_NAME1}.require`, 'ec'],
            [
                `${TRACKER_NAME1}.ec:addImpression`,
                {
                    id: 'p-123',
                    name: 'Red Potion',
                    price: '90',
                    quantity: '1'
                }
            ]
        ])
    })

    test('sends a product impression event with ecommerce', () => {
        const myGA = new MyGa1({
            ecommerceLibrary: 'ecommerce'
        })

        myGA.ready()

        // Mock GA created tracker
        window.ga.getAll = jest.fn(() => {
            return [myGA.tracker]
        })

        myGA.ecAddImpressionAction({
            id: 'p-123',
            name: 'Red Potion',
            price: '90',
            quantity: 1
        })

        checkMockedCalls(window.ga.mock.calls, [
            ['create', 'testGAID1', 'auto', {name: TRACKER_NAME1}]
        ])
    })

    test('set currency code', () => {
        const myGA = new MyGa1({
            ecommerceLibrary: 'ecommerce'
        })

        myGA.ready()

        // Mock GA created tracker
        window.ga.getAll = jest.fn(() => {
            return [myGA.tracker]
        })

        myGA.receive('setCurrency', {
            currencyCode: 'EUR'
        })

        checkMockedCalls(window.ga.mock.calls, [
            ['create', 'testGAID1', 'auto', {name: TRACKER_NAME1}],
            [`${TRACKER_NAME1}.set`, 'currencyCode', 'EUR']
        ])
    })

    test('on apply pay, we can see the events with right actions', () => {
        const myGA = new MyGa1({
            ecommerceLibrary: 'ecommerce'
        })

        myGA.ready()

        // Mock GA created tracker
        window.ga.getAll = jest.fn(() => {
            return [myGA.tracker]
        })

        myGA.receive('applePayOptionDisplayed')
        myGA.receive('applePayButtonDisplayed')
        myGA.receive('applePayButtonClicked')

        checkMockedCalls(window.ga.mock.calls, [
            ['create', 'testGAID1', 'auto', {name: TRACKER_NAME1}],
            [
                `${TRACKER_NAME1}.send`,
                'event',
                'ecommerce',
                'apple pay payment option displayed',
                {nonInteraction: 1}
            ],
            [
                `${TRACKER_NAME1}.send`,
                'event',
                'ecommerce',
                'apple pay button displayed',
                {nonInteraction: 1}
            ],
            [`${TRACKER_NAME1}.send`, 'event', 'ecommerce', 'apple pay clicked']
        ])
    })
})
