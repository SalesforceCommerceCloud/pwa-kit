/* eslint-disable max-nested-callbacks */

import Promise from 'bluebird'
import * as types from '../types'
import * as cj from 'cookiejar'
import {MerlinsConnector} from './merlins'
import {
    getWindow,
    propTypeErrors,
    record,
    isIntegrationTest as integrationTestRequested
} from '../utils/test-utils'
import nock from 'nock'

const isIntegrationTest = false
let _originalMode = undefined

beforeAll(() => {
    if (integrationTestRequested && !isIntegrationTest) {
        console.warn(
            `You're trying to run the Merlins integration tests, but these have disabled ` +
                `permanently. This is not a problem, it's just informational. The tests will ` +
                `run against pre-recorded HTTP responses instead.`
        )
    }
    _originalMode = nock.back.currentMode
    nock.back.setMode('lockdown')
})

afterAll(() => {
    nock.back.setMode(_originalMode)
})

if (isIntegrationTest) {
    jest.setTimeout(440000)
}

const orderAddress = {
    firstName: 'Donald',
    lastName: 'Trump',
    phone: '5555555555',
    addressLine1: '1600 Pennsylvania Ave NW',
    countryCode: 'US',
    stateCode: '16',
    city: 'Washington',
    postalCode: '20500'
}

const cartItem = {
    productId: 'Beginners Guide To Transfiguration',
    quantity: 1
}

const payment = {
    id: 'mine',
    amount: 10.5,
    methodId: 'checkmo'
}

describe(`The Merlins Connector`, () => {
    let connectors

    beforeEach(() => {
        connectors = []
    })

    afterEach(() => {
        // JSDOM cleanup
        connectors.forEach((connector) => connector.window.close())
    })

    /**
     * Returned object is suitable to pass to createUser() during tests.
     */
    const userFixture = (key) => {
        const time = isIntegrationTest ? new Date().getTime() : ''
        const createFixture = {
            firstName: `test-${key}${time}-firstName`,
            lastName: `test-${key}${time}-lastName`,
            email: `test-${key}${time}-email@example.com`,
            password: `test-${key}${time}-password`
        }
        const expectedFixture = {
            id: 'me',
            firstName: createFixture.firstName,
            lastName: createFixture.lastName,
            email: createFixture.email
        }
        return [createFixture, expectedFixture]
    }

    /**
     * @param {String} setCookie
     * @returns {String}
     */
    const convertSetCookieToCookie = (setCookie) => {
        return new cj.Cookie(setCookie).toValueString()
    }

    test('Should convert a set-cookie header to a cookie header', () => {
        const setCookieHeaders = [
            'a=a; domain=www.merlinspotions.com; HttpOnly; secure',
            'b=b; domain=something-else.com',
            'c=c'
        ]
        const cookieHeaders = setCookieHeaders.map(convertSetCookieToCookie)
        expect(cookieHeaders).toEqual(['a=a', 'b=b', 'c=c'])
    })

    const makeConnector = () => {
        const basePath = 'https://www.merlinspotions.com'
        return getWindow(basePath).then((_window) => {
            const connector = new MerlinsConnector({
                window: _window,
                basePath,
                dondeGeoBasePath: 'https://donde-geo-tools.herokuapp.com',
                dondeApiBasePath: 'https://api.donde.io',
                cookieDomainRewrites: {'www.merlinspotions.com': 'www.merlins-proxy.com'}
            })
            connectors.push(connector)
            return connector
        })
    }

    describe('Searching for products', () => {
        const sorts = [
            undefined,
            {query: 'name', key: 'name', compare: (a, b) => a.localeCompare(b)},
            {query: 'price', key: 'price', compare: (a, b) => a - b}
        ]
        sorts.forEach((sortOpts) => {
            const spec = test(`with a sort order [sort: ${sortOpts && sortOpts.query}]`, () => {
                return record(spec, () => {
                    const query = {
                        filters: {categoryId: 'potions'},
                        ...(sortOpts && {sort: sortOpts.query})
                    }
                    return makeConnector()
                        .then((connector) => connector.searchProducts(query))
                        .then((data) => {
                            expect(propTypeErrors(types.ProductSearch, data)).toBeFalsy()
                            if (sortOpts) {
                                const {key, compare} = sortOpts
                                // eslint-disable-next-line max-nested-callbacks
                                const values = data.results.map((item) => item[key])
                                const expected = values.slice().sort(compare)
                                expect(values).toEqual(expected)
                            }
                        })
                })
            })
        })

        const counts = [4, 8]
        counts.forEach((count) => {
            const spec = test(`with a max count (count: ${count})`, () => {
                return record(spec, () => {
                    const query = {
                        filters: {categoryId: 'potions'},
                        count
                    }
                    return makeConnector()
                        .then((connector) => connector.searchProducts(query))
                        .then((data) => {
                            expect(propTypeErrors(types.ProductSearch, data)).toBeFalsy()
                            expect(data.results.length).toEqual(count)
                        })
                })
            })
        })

        const spec1 = test(`with a zero-result search query`, () => {
            return record(spec1, () => {
                const query = {
                    query: 'empty'
                }
                return makeConnector()
                    .then((connector) => connector.searchProducts(query))
                    .then((data) => {
                        expect(propTypeErrors(types.ProductSearch, data)).toBeFalsy()
                        expect(data.results.length).toEqual(0)
                    })
            })
        })
    })

    describe('Getting a product', () => {
        const spec1 = test('with a valid id should resolve with a Product instance', () => {
            return record(spec1, () => {
                let connector
                return makeConnector()
                    .then((conn) => {
                        connector = conn
                    })
                    .then(() => connector.getProduct('eye-of-newt'))
                    .then((data) => {
                        expect(propTypeErrors(types.Product, data)).toBeFalsy()
                    })
            })
        })

        const spec2 = test('with an invalid id should reject', () => {
            return record(spec2, () => {
                return makeConnector().then((connector) =>
                    expect(connector.getProduct('horse-pants')).rejects.toThrow()
                )
            })
        })
    })

    describe('Getting products', () => {
        const spec1 = test('with valid ids should resolve with a ProductList instance with populated data', () => {
            return record(spec1, () => {
                const validIds = ['eye-of-newt', 'unicorn-blood']
                return makeConnector()
                    .then((connector) => connector.getProducts(validIds))
                    .then((result) => {
                        expect(propTypeErrors(types.ProductList, result)).toBeFalsy()
                        expect(result.data.length).toEqual(validIds.length)
                    })
            })
        })

        const spec2 = test('with invalid ids should resolve with a ProductList instance with empty data', () => {
            return record(spec2, () => {
                const invalidIds = ['horse-pants', 'wrinkly-ears']
                return makeConnector()
                    .then((connector) => connector.getProducts(invalidIds))
                    .then((result) => {
                        expect(propTypeErrors(types.ProductList, result)).toBeFalsy()
                        expect(result.data.length).toEqual(0)
                    })
            })
        })

        const spec3 = test('with a mix of valid and invalid ids should resolve with a ProductList instance with only valid data', () => {
            return record(spec3, () => {
                const validIds = ['eye-of-newt', 'unicorn-blood']
                const invalidIds = ['horse-pants', 'wrinkly-ears']
                return makeConnector()
                    .then((connector) => connector.getProducts([...validIds, ...invalidIds]))
                    .then((result) => {
                        expect(propTypeErrors(types.ProductList, result)).toBeFalsy()
                        expect(result.data.length).toEqual(validIds.length)
                        expect(result.total).toEqual(validIds.length)
                        expect(result.count).toEqual(validIds.length)
                    })
            })
        })
    })

    const spec2 = test('Getting a store', () => {
        return record(spec2, () => {
            const id = 'bc/vancouver/948-homer-street'
            return makeConnector()
                .then((connector) => connector.getStore(id))
                .then((data) => {
                    expect(propTypeErrors(types.Store, data)).toBeFalsy()
                })
        })
    })

    describe('Searching for stores', () => {
        // searchStoreRequest is using default values for start and count if not provided
        const spec1 = test('Only longitude provided, missing latitude', () => {
            return record(spec1, () => {
                const searchStoreRequest = {
                    latlon: {
                        longitude: -123.08359
                    }
                }
                return makeConnector().then((connector) => {
                    expect(() => {
                        connector.searchStores(searchStoreRequest)
                    }).toThrowError('Provide Latitude and Longitude coordinates')
                })
            })
        })

        const spec2 = test('Only latitude provided, missing longitude', () => {
            return record(spec2, () => {
                const searchStoreRequest = {
                    latlon: {
                        latitude: 49.24667
                    }
                }
                return makeConnector().then((connector) => {
                    expect(() => {
                        connector.searchStores(searchStoreRequest)
                    }).toThrowError('Provide Latitude and Longitude coordinates')
                })
            })
        })

        const spec3 = test('Valid latitude and longitude provided', () => {
            return record(spec3, () => {
                const searchStoreRequest = {
                    latlon: {
                        latitude: 49.24667,
                        longitude: -123.08359
                    }
                }
                return makeConnector()
                    .then((connector) => connector.searchStores(searchStoreRequest))
                    .then((data) => {
                        expect(data.stores).not.toHaveLength(0)
                        expect(data.stores).toHaveLength(data.count)
                        expect(propTypeErrors(types.StoreSearchResult, data)).toBeFalsy()
                    })
            })
        })

        const spec4 = test('0.0, 0.0 geo-coordinates allowed', () => {
            return record(spec4, () => {
                const searchStoreRequest = {
                    latlon: {
                        latitude: 0.0,
                        longitude: 0.0
                    }
                }
                return makeConnector()
                    .then((connector) => connector.searchStores(searchStoreRequest))
                    .then((data) => {
                        expect(data.stores).not.toHaveLength(0)
                        expect(data.stores).toHaveLength(data.count)
                        expect(propTypeErrors(types.StoreSearchResult, data)).toBeFalsy()
                    })
            })
        })
    })

    describe('Get Product Categories', () => {
        const spec1 = test(`getCategory should resolve to a Category instance`, () => {
            return record(spec1, () => {
                const category = 'root'
                return makeConnector()
                    .then((connector) => connector.getCategory(category))
                    .then((data) => {
                        expect(propTypeErrors(types.Category, data)).toBeFalsy()
                        expect(data.id).toEqual(category)
                    })
            })
        })

        const spec2 = test(`getCategories should resolve to a CategoryList instance`, () => {
            return record(spec2, () => {
                return makeConnector()
                    .then((connector) => connector.getCategories(['books', 'potions']))
                    .then((result) => {
                        expect(propTypeErrors(types.CategoryList, result)).toBeFalsy()
                        expect(result.count).toEqual(2)
                    })
            })
        })
    })

    describe('Authentication', () => {
        const spec1 = test(`should allow a user to login and logout`, () => {
            return record(spec1, () => {
                const [createUserData, expectedUserData] = userFixture('auth-login')
                let connector
                return makeConnector()
                    .then((conn) => {
                        connector = conn
                    })
                    .then(() => connector.registerCustomer(createUserData))
                    .then(() => connector.login(createUserData.email, createUserData.password))
                    .then((user) => expect(user).toEqual(expectedUserData))
                    .then(() => connector.logout())
                    .then(() =>
                        expect(connector.getCustomer('me')).rejects.toEqual(new Error('logged out'))
                    )
            })
        })

        const spec2 = test(`should allow a session to be restored on a new Connector instance`, () => {
            return record(spec2, () => {
                const [createUserData, expectedUserData] = userFixture('session-restore')
                let connector
                return makeConnector()
                    .then((conn) => {
                        connector = conn
                    })
                    .then(() => connector.registerCustomer(createUserData))
                    .then(() => connector.login(createUserData.email, createUserData.password))
                    .then(() => makeConnector())
                    .then((connector2) => {
                        const cookieString = connector
                            .getCookies()
                            .map(convertSetCookieToCookie)
                            .join('; ')
                        connector2.setCookies(cookieString)
                        return connector2.getCustomer('me')
                    })
                    .then((data) => expect(data).toEqual(expectedUserData))
            })
        })
    })

    describe('Account management', () => {
        const spec1 = test('Should support creating a new user account', () => {
            return record(spec1, () => {
                const [createData, expectedData] = userFixture('new-account')
                let connector
                return makeConnector()
                    .then((conn) => {
                        connector = conn
                    })
                    .then(() => connector.registerCustomer(createData))
                    .then(() => connector.login(createData.email, createData.password))
                    .then((user) => expect(user).toEqual(expectedData))
            })
        })
    })

    describe('Cart Integration Test', () => {
        const spec1 = test('Guest User', () => {
            return record(spec1, () => {
                const anonymousCustomerInformation = {
                    id: 'anonymous',
                    email: 'engineer@mobify.com'
                }
                const updateInformation = {
                    email: 'engineer@mobify.com'
                }
                let cart
                let connector

                return (
                    makeConnector()
                        .then((conn) => {
                            connector = conn
                        })
                        .then(() => connector.login())
                        // 1. Create a new cart
                        .then(() => connector.createCart())
                        .then((data) => {
                            expect(propTypeErrors(types.Cart, data)).toBeFalsy()
                            cart = data
                        })
                        // 2. Set customer information
                        .then(() => connector.setCustomerInformation(cart, updateInformation))
                        .then((data) => {
                            expect(data.customerInfo.id).toEqual(anonymousCustomerInformation.id)
                            expect(data.customerInfo.email).toEqual(
                                anonymousCustomerInformation.email
                            )

                            cart = data // Update local cart variable
                        })
                        // 3. Add Cart Item
                        .then(() => connector.addCartItem(cart, cartItem))
                        .then((data) => {
                            expect(data.items).toHaveLength(1)
                            expect(data.items[0].productId.toLowerCase()).toEqual(
                                cartItem.productId.toLowerCase()
                            )
                            expect(data.items[0].quantity).toEqual(cartItem.quantity)

                            cart = data // Update local cart variable
                        })
                        // 4. Update Cart Item
                        .then(() => connector.updateCartItem(cart, {...cart.items[0], quantity: 2}))
                        .then((data) => {
                            expect(data.items).toHaveLength(1)
                            expect(data.items[0].productId.toLowerCase()).toEqual(
                                cartItem.productId.toLowerCase()
                            )
                            expect(data.items[0].quantity).toEqual(2)

                            cart = data
                        })
                        // 5. Remove Cart item
                        .then(() => connector.removeCartItem(cart, cart.items[0].id))
                        .then((data) => {
                            expect(data.items).toHaveLength(0)

                            cart = data // Update local cart variable
                        })
                        // 5b. Re-add Cart Item NOTE: We need this because shipping methods requires an items to be present.
                        .then(() => connector.addCartItem(cart, cartItem))
                        .then((data) => {
                            cart = data // Update local cart variable
                        })
                        // 6. Set Billing Address
                        .then(() => connector.setBillingAddress(cart, orderAddress))
                        .then((data) => {
                            expect(data.billingAddress).toMatchObject(orderAddress)
                            expect(
                                propTypeErrors(types.OrderAddress, data.billingAddress)
                            ).toBeFalsy()

                            cart = data // Update local cart variable
                        })
                        // 7. Set Shipping Address
                        .then(() => connector.setShippingAddress(cart, orderAddress))
                        .then((data) => {
                            expect(data.shippingAddress).toMatchObject(orderAddress)
                            expect(
                                propTypeErrors(types.OrderAddress, data.shippingAddress)
                            ).toBeFalsy()

                            cart = data // Update local cart variable
                        })
                        // 8. Get Shipping Methods
                        .then(() => connector.getShippingMethods(cart))
                        .then((data) => {
                            cart.shippingMethods = data

                            expect(data.length).not.toBeLessThan(1)
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                        })
                        // 9. Set Shipping Method
                        .then(() => connector.setShippingMethod(cart, cart.shippingMethods[0]))
                        .then((data) => {
                            expect(data.selectedShippingMethodId).toEqual(
                                cart.shippingMethods[0].id
                            )
                            expect(propTypeErrors(types.Cart, data)).toBeFalsy()

                            cart = data // Update local cart variable
                        })
                        // 10. Get Payment Methods
                        .then(() => connector.getPaymentMethods(cart))
                        .then((data) => {
                            expect(data.length).not.toBeLessThan(0)

                            cart.paymentMethods = data
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                        })
                        // 11. Set Payment
                        .then(() => connector.setPayment(cart, payment))
                        .then((data) => {
                            expect(data.payments).toHaveLength(1)
                            expect(propTypeErrors(types.Payment, data.payments[0])).toBeFalsy()
                            expect(data.payments[0].methodId).toEqual(payment.methodId)

                            cart = data // Update local cart variable
                        })
                        // 12. Create Order
                        .then(() => connector.createOrder(cart))
                        .then((data) => {
                            expect(propTypeErrors(types.Order, data)).toBeFalsy()
                        })
                )
            })
        })

        const spec2 = test(`Registered User`, () => {
            return record(spec2, () => {
                const updateInformation = {
                    email: 'engineer@mobify.com'
                }
                let cart
                let connector

                const [customerFixture, expectedData] = userFixture('cart-registered-1')

                return (
                    makeConnector()
                        .then((conn) => {
                            connector = conn
                        })
                        .then(() => connector.registerCustomer(customerFixture))
                        .then(() =>
                            connector.login(customerFixture.email, customerFixture.password)
                        )
                        .then((user) => expect(user).toEqual(expectedData))

                        // 2. Create a cart
                        .then(() => connector.createCart())
                        .then((data) => {
                            cart = data // assign cart to a local var
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.customerInfo.id).toBeDefined()
                            expect(cart.customerInfo.id).not.toEqual('me')
                            expect(cart.customerInfo.email).toEqual(customerFixture.email)
                            expect(cart.selectedShippingMethodId).toBeUndefined()
                            return null
                        })
                        // 3. Set customer information (email)
                        .then(() => connector.setCustomerInformation(cart, updateInformation))
                        .then((data) => {
                            cart = data // update cart
                            expect(cart.customerInfo.email).toEqual(updateInformation.email)
                        })
                        // 4. Delete cart items if there are already some on the cart
                        .then(() => {
                            const promises = []
                            for (let i = 0; i < cart.items.length; i++) {
                                const promise = connector.removeCartItem(cart, cart.items[i].id)
                                promises.push(promise)
                            }
                            return Promise.all(promises)
                        })
                        .then(() => connector.getCart(cart.id))
                        .then((data) => {
                            cart = data
                            expect(cart.items.length).toEqual(0)
                        })
                        // 5. Add a cart item
                        .then(() => connector.addCartItem(cart, cartItem))
                        .then((data) => {
                            cart = data // update cart
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.items.length).toEqual(1)
                            const cartItemUpdated = cart.items[0]
                            expect(cartItemUpdated.productId.toLowerCase()).toEqual(
                                cartItem.productId.toLowerCase()
                            )
                            expect(cartItemUpdated.quantity).toEqual(cartItem.quantity)
                            expect(cartItemUpdated.id).toBeDefined()
                            return null
                        })
                        // 5. Update cart item
                        .then(() => connector.updateCartItem(cart, {...cart.items[0], quantity: 2}))
                        .then((data) => {
                            cart = data // update cart
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.items.length).toEqual(1)
                            const cartItemUpdated = cart.items[0]
                            expect(cartItemUpdated.productId.toLowerCase()).toEqual(
                                cartItem.productId.toLowerCase()
                            )
                            expect(cartItemUpdated.quantity).toEqual(2)
                            expect(cartItemUpdated.id).toBeDefined()
                            return null
                        })
                        // 14. Delete cart item
                        .then(() => connector.removeCartItem(cart, cart.items[0].id))
                        .then((data) => {
                            cart = data
                            expect(cart.items.length).toEqual(0)
                        })
                        // Re-add cart item
                        .then(() => connector.addCartItem(cart, cartItem))
                        // 7. Set shipping address
                        // Shipping address must be set before setting shipping method.
                        .then(() => connector.setShippingAddress(cart, orderAddress))
                        .then((data) => {
                            cart = data // update cart
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.shippingAddress).toMatchObject(orderAddress)
                            return null
                        })
                        // 8. Set billing address
                        .then(() => connector.setBillingAddress(cart, orderAddress))
                        .then((data) => {
                            cart = data
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.billingAddress).toMatchObject(orderAddress)
                            return null
                        })
                        // 9. Update billing address
                        .then(() => {
                            const billingAddressUpdated = {
                                ...orderAddress,
                                firstName: 'Mickey',
                                lastName: 'Mouse',
                                phone: '8887776666',
                                addressLine1: '1800 Transylvania Ave SE'
                            }
                            return Promise.all([
                                Promise.resolve(billingAddressUpdated),
                                connector.setBillingAddress(cart, billingAddressUpdated)
                            ])
                        })
                        .then(([billingAddressUpdated, data]) => {
                            cart = data
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.billingAddress.id).toBeUndefined()
                            expect(cart.billingAddress).toMatchObject(billingAddressUpdated)
                            expect(cart.billingAddress.firstName).not.toEqual(
                                orderAddress.firstName
                            )
                            expect(cart.billingAddress.lastName).not.toEqual(orderAddress.lastName)
                            expect(cart.billingAddress.phone).not.toEqual(orderAddress.phone)
                            expect(cart.billingAddress.addressLine1).not.toEqual(
                                orderAddress.addressLine1
                            )
                            return null
                        })
                        // 10. Get shipping methods
                        .then(() => connector.getShippingMethods(cart))
                        .then((shippingMethods) => {
                            expect(shippingMethods.length).toBeGreaterThanOrEqual(1)
                            return shippingMethods[0]
                        })
                        // 11. Set shipping method
                        .then((shippingMethod) => {
                            return Promise.all([
                                shippingMethod,
                                connector.setShippingMethod(cart, shippingMethod)
                            ])
                        })
                        .then(([shippingMethod, data]) => {
                            cart = data // update cart
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.selectedShippingMethodId).toBeDefined()
                            expect(cart.selectedShippingMethodId).toEqual(shippingMethod.id)
                        })
                        // 12. Get payment methods
                        .then(() => connector.getPaymentMethods(cart))
                        // 13. Set payment
                        .then((paymentMethods) => {
                            const method = paymentMethods[0]
                            return Promise.all([
                                connector.setPayment(cart, {methodId: method.id}),
                                Promise.resolve(method.id)
                            ])
                        })
                        .then(([data, paymentMethodId]) => {
                            if (data) {
                                cart = data // update cart
                                expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                                expect(cart.payments.length).toEqual(1)
                                const paymentUpdated = cart.payments[0]
                                expect(paymentUpdated.id).toBeDefined() // stub id
                                expect(paymentUpdated.amount).toEqual(cart.total) // always set payment amount to cart total.
                                expect(paymentUpdated.methodId).toEqual(paymentMethodId)
                                expect(paymentUpdated.details).toBeUndefined()
                                const cartItemUpdated = cart.items[0]
                                expect(cartItemUpdated.baseItemPrice).toBeGreaterThan(0)
                                expect(cartItemUpdated.baseLinePrice).toBeGreaterThan(0)
                                expect(cartItemUpdated.itemPrice).toBeGreaterThan(0)
                                expect(cartItemUpdated.linePrice).toBeGreaterThan(0)
                                expect(cart.discounts).toBeGreaterThanOrEqual(0)
                                expect(cart.shipping).toBeGreaterThanOrEqual(0)
                                expect(cart.tax).toBeGreaterThan(0)
                                expect(cart.subtotal).toBeGreaterThan(0)
                                expect(cart.total).toBeGreaterThan(0)
                            }
                        })
                        .then(() =>
                            Promise.all([Promise.resolve(cart), connector.createOrder(cart)])
                        )
                        .then(([cart, order]) => {
                            expect(propTypeErrors(types.Order, order)).toBeFalsy()
                            expect(order.billingAddress).toMatchObject(cart.billingAddress)
                            expect(order.payments[0]).toMatchObject(cart.payments[0])
                            expect(order.items[0]).toMatchObject(cart.items[0])
                            expect(order.discounts).toBeGreaterThanOrEqual(0)
                            expect(order.shipping).toBeGreaterThanOrEqual(0)
                            expect(order.tax).toBeGreaterThan(0)
                            expect(order.subtotal).toBeGreaterThan(0)
                            expect(order.total).toBeGreaterThan(0)
                            expect(order.status).toBeDefined()
                            expect(order.creationDate).toBeDefined()
                            expect(order.id).toBeDefined()
                            return order
                        })
                        .then((order) =>
                            Promise.all([Promise.resolve(order), connector.getOrders([order.id])])
                        )
                        .then(([order, orders]) => {
                            expect(orders.count).toEqual(1)
                            expect(orders.total).toEqual(1)
                            expect(orders.data[0].id).toEqual(order.id)
                            return null
                        })
                        .then(() => connector.logout())
                        .then(() =>
                            expect(connector.getCustomer('me')).rejects.toEqual(
                                new Error('logged out')
                            )
                        )
                )
            })
        })
    })

    describe('Coupon support', () => {
        const testBody = (connector) =>
            connector
                .createCart()
                .then((cart) => connector.addCartItem(cart, cartItem))
                .then((cart) => connector.addCouponEntry(cart, 'MAGIC'))
                .then((cart) => {
                    expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                    expect(cart.items.length).toEqual(1)
                    expect(cart.couponEntries.length).toEqual(1)
                    expect(cart.couponEntries).toEqual([{id: 'MAGIC', code: 'MAGIC'}])
                    expect(cart.discounts).toBeLessThan(0)
                    return cart
                })
                .then((cart) => connector.removeCouponEntry(cart, cart.couponEntries[0].id))
                .then((cart) => {
                    expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                    expect(cart.items.length).toEqual(1)
                    expect(cart.couponEntries).toEqual([])
                    expect(cart.discounts).toBe(0)
                })

        const spec1 = test('Should allow a registered user to add/remove a CouponEntry to/from their cart', () => {
            return record(spec1, () => {
                let connector

                const [customerFixture, expectedData] = userFixture('coupons-2')
                return makeConnector()
                    .then((conn) => {
                        connector = conn
                    })
                    .then(() => connector.registerCustomer(customerFixture))
                    .then(() => connector.login(customerFixture.email, customerFixture.password))
                    .then((user) => expect(user).toEqual(expectedData))
                    .then(() => testBody(connector))
            })
        })

        const spec2 = test('Should allow a guest user to add/remove a CouponEntry to/from their cart', () => {
            return record(spec2, () => {
                let connector

                return makeConnector()
                    .then((conn) => {
                        connector = conn
                    })
                    .then(() => connector.login())
                    .then(() => testBody(connector))
            })
        })
    })
})
