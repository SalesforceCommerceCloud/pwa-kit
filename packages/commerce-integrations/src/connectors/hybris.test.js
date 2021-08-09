/**
 * @jest-environment node
 */

/* eslint-disable max-nested-callbacks */
import Promise from 'bluebird'
import * as hybris from 'hybris-occ-client'
import {HybrisConnector} from './hybris'
import * as types from '../types'
import {
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
            `You're trying to run the Hybris integration tests, but these have disabled ` +
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
    jest.setTimeout(45000)
}

const userFixture = (key) => {
    const time = isIntegrationTest ? new Date().getTime() : ''
    return {
        firstName: `test-${key}${time}-firstName`,
        lastName: `test-${key}${time}-lastName`,
        email: `test-${key}${time}-email@example.com`,
        password: `test-${key}${time}-Pa55word`,
        titleCode: 'ms'
    }
}

const conf = {
    url: 'https://hybris.merlinspotions.com'
}

/* eslint-disable no-unused-vars */
const customerInfo = {
    email: 'mobifyqa2@domain.com'
}

const registeredUser = {
    username: 'mobifyqa@gmail.com',
    password: 'p4ssword'
}

const orderAddress = {
    titleCode: 'ms',
    firstName: 'Donald',
    lastName: 'Duck',
    phone: '4449992222',
    addressLine1: '333 Rosewood Dr',
    countryCode: 'GB',
    stateCode: 'GB-KEN',
    city: 'Liverpool',
    postalCode: '83920'
}

const cartItem = {
    productId: '300515779',
    quantity: 1
}

const payment = {
    // hybris doesn't need to know payment amount.
    methodId: 'CREDIT_CARD',
    details: {
        type: 'amex',
        holderName: 'Donald Trump',
        number: 411111111111111,
        expiryMonth: 1,
        expiryYear: 2021
    }
}
/* eslint-disable no-unused-vars */

describe(`The Hybris Connector`, () => {
    const makeConnector = () =>
        new HybrisConnector({
            client: new hybris.ApiClient({
                basePath: `${conf.url}/rest/v2/apparel-uk/`,
                defaultHeaders: {},
                timeout: 60000
            }),
            catalogId: 'apparelProductCatalog',
            catalogVersionId: 'Online',
            authentication: {
                authorizationUrl: `${conf.url}/authorizationserver/oauth/token`,
                clientId: 'mobile_android',
                clientSecret: 'secret'
            }
        })

    describe('Searching for products', () => {
        const sorts = [
            undefined,
            {query: 'name-asc', key: 'productName', compare: (a, b) => a.localeCompare(b)},
            {query: 'price-desc', key: 'price', compare: (a, b) => b - a}
        ]
        sorts.forEach((sortOpts) => {
            const spec = test(`with a sort order [sort: ${sortOpts && sortOpts.query}]`, () => {
                return record(spec, () => {
                    const connector = makeConnector()
                    const query = {
                        filters: {categoryId: '220000'},
                        ...(sortOpts && {sort: sortOpts.query})
                    }
                    return connector.searchProducts(query).then((data) => {
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

        const counts = [2, 8]
        counts.forEach((count) => {
            const spec = test(`with a max count (count: ${count})`, () => {
                return record(spec, () => {
                    const connector = makeConnector()
                    const query = {
                        filters: {categoryId: '220000'},
                        count
                    }
                    return connector.searchProducts(query).then((data) => {
                        expect(propTypeErrors(types.ProductSearch, data)).toBeFalsy()
                        expect(data.results.length).toEqual(count)
                    })
                })
            })
        })

        const spec1 = test(`by query value returns results for a known search query value`, () => {
            return record(spec1, () => {
                const connector = makeConnector()
                const searchRequest = {
                    query: 'mouse'
                }
                return connector.searchProducts(searchRequest).then((data) => {
                    expect(propTypeErrors(types.ProductSearch, data)).toBeFalsy()
                    expect(data.results.length).toBeGreaterThan(0)
                    expect(data.query.toLowerCase()).toEqual(searchRequest.query.toLowerCase())
                })
            })
        })

        const spec2 = test(`by query value returns no results for a unknown search query value`, () => {
            return record(spec2, () => {
                const connector = makeConnector()
                const searchRequest = {
                    query: 'xxxyyyaaabbb'
                }
                return connector.searchProducts(searchRequest).then((data) => {
                    expect(propTypeErrors(types.ProductSearch, data)).toBeFalsy()
                    expect(data.results.length).toEqual(0)
                    expect(data.query.toLowerCase()).toEqual(searchRequest.query.toLowerCase())
                })
            })
        })
    })

    describe('Getting a product', () => {
        const spec1 = test('with a valid id should resolve with a Product instance', () => {
            return record(spec1, () => {
                const connector = makeConnector()
                return connector.getProduct('300659388').then((data) => {
                    expect(propTypeErrors(types.Product, data)).toBeFalsy()
                })
            })
        })

        const spec2 = test('with an invalid id should reject', () => {
            return record(spec2, () => {
                const connector = makeConnector()
                expect(connector.getProduct('1')).rejects.toThrow()
            })
        })
    })

    describe('Getting products', () => {
        const spec1 = test('with valid ids', () => {
            // should resolve with a ProductList instance with populated data
            return record(spec1, () => {
                const connector = makeConnector()
                const validIds = ['300659388', '300466683']
                return connector.getProducts(validIds).then((result) => {
                    expect(propTypeErrors(types.ProductList, result)).toBeFalsy()
                    expect(result.data.length).toEqual(validIds.length)
                })
            })
        })

        const spec2 = test('with invalid ids', () => {
            // should resolve with a ProductList instance with empty data
            return record(spec2, () => {
                const connector = makeConnector()
                const invalidIds = ['1', '2']
                return connector.getProducts(invalidIds).then((result) => {
                    expect(propTypeErrors(types.ProductList, result)).toBeFalsy()
                    expect(result.data.length).toEqual(0)
                })
            })
        })

        const spec3 = test('with a mix of valid and invalid ids', () => {
            // should resolve with a ProductList instance with partial data
            return record(spec3, () => {
                const connector = makeConnector()
                const validIds = ['300659388', '300466683']
                const invalidIds = ['1', '2']

                return connector.getProducts([...validIds, ...invalidIds]).then((result) => {
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
            const connector = makeConnector()
            return connector.getStore('London Hospital').then((data) => {
                expect(propTypeErrors(types.Store, data)).toBeFalsy()
            })
        })
    })

    describe('Searching for Stores', () => {
        // searchStoreRequest is using default values for start, count if not provided
        const spec1 = test('Only longitude provided, missing latitude', () => {
            return record(spec1, () => {
                const connector = makeConnector()
                const searchStoreRequest = {
                    latlon: {
                        longitude: -0.116745
                    }
                }
                expect(() => {
                    connector.searchStores(searchStoreRequest)
                }).toThrowError('Provide Latitude and Longitude coordinates')
            })
        })

        const spec2 = test('Only latitude provided, missing longitude', () => {
            return record(spec2, () => {
                const connector = makeConnector()
                const searchStoreRequest = {
                    latlon: {
                        latitude: 52.514151
                    }
                }
                expect(() => {
                    connector.searchStores(searchStoreRequest)
                }).toThrowError('Provide Latitude and Longitude coordinates')
            })
        })

        const spec3 = test('Valid latitude and longitude provided', () => {
            return record(spec3, () => {
                const connector = makeConnector()
                const searchStoreRequest = {
                    latlon: {
                        latitude: 52.514151,
                        longitude: -0.116745
                    }
                }
                return connector.searchStores(searchStoreRequest).then((data) => {
                    expect(data.stores).not.toHaveLength(0)
                    expect(data.stores).toHaveLength(data.count)
                    expect(propTypeErrors(types.StoreSearchResult, data)).toBeFalsy()
                })
            })
        })

        const spec4 = test('0.0, 0.0 geo-coordinates allowed', () => {
            return record(spec4, () => {
                const connector = makeConnector()
                const searchStoreRequest = {
                    latlon: {
                        latitude: 0.0,
                        longitude: 0.0
                    }
                }
                return expect(connector.searchStores(searchStoreRequest)).rejects.toThrowError(
                    'No stores found'
                )
            })
        })
    })

    describe('Get Product Categories', () => {
        const spec1 = test(`getCategory should resolve to a Category instance`, () => {
            return record(spec1, () => {
                const connector = makeConnector()
                const category = 'categories'
                return connector.getCategory(category).then((data) => {
                    expect(propTypeErrors(types.Category, data)).toBeFalsy()
                    expect(data.id).toEqual(category)
                })
            })
        })

        const spec2 = test(`getCategories should resolve to a CategoryList instance`, () => {
            return record(spec2, () => {
                const connector = makeConnector()
                const categories = ['220000', '320000']
                return connector.getCategories(categories).then((result) => {
                    expect(propTypeErrors(types.CategoryList, result)).toBeFalsy()
                    expect(result.count).toEqual(2)
                    expect(result.data[0].id).toEqual(categories[0])
                    expect(result.data[1].id).toEqual(categories[1])
                })
            })
        })
    })

    describe('Account management', () => {
        const spec = test('Should support creating a new user account', () => {
            return record(spec, () => {
                const data = userFixture('creating-accounts')
                const connector = makeConnector()
                return connector
                    .login()
                    .then(() => connector.registerCustomer(data))
                    .then((customer) =>
                        expect(propTypeErrors(types.Customer, customer)).toBeFalsy()
                    )
                    .then(() => connector.getCustomer('current'))
                    .then((customer) => {
                        expect(propTypeErrors(types.Customer, customer)).toBeFalsy()
                        expect(customer).toEqual({
                            id: 'current',
                            firstName: data.firstName,
                            lastName: data.lastName,
                            email: data.email
                        })
                    })
            })
        })
    })

    describe('Login', () => {
        const spec1 = test('should support logging in as a registered user', () => {
            return record(spec1, () => {
                const connector = makeConnector()
                const username = 'mobifyqa@gmail.com'
                const password = 'p4ssword'
                return connector.login(username, password).then((customer) => {
                    expect(connector.client.authentications.auth.accessToken).toBeDefined()
                    expect(connector.client.authentications.auth.expiresIn).toBeDefined()
                    expect(connector.client.authentications.auth.refreshToken).toBeDefined()
                    expect(propTypeErrors(types.Customer, customer)).toBeFalsy()
                    expect(customer.id).toEqual('current')
                })
            })
        })

        const spec2 = test('should allow a session to be transferred from another instance', () => {
            return record(spec2, () => {
                let customer
                const connector1 = makeConnector()
                const connector2 = makeConnector()
                return connector1
                    .login('mobifyqa@gmail.com', 'p4ssword')
                    .then((_customer) => {
                        customer = _customer
                    })
                    .then(() => {
                        // Transfer session onto connector 2
                        connector2.setAuthentications(connector1.getAuthentications())
                        return connector2.getCustomer('current')
                    })
                    .then((_customer) => {
                        expect(customer).toEqual(_customer)
                    })
            })
        })

        const spec3 = test('should support logging in as a guest', () => {
            return record(spec3, () => {
                const connector = makeConnector()
                return connector.login().then((customer) => {
                    expect(connector.client.authentications.auth.accessToken).toBeDefined()
                    expect(connector.client.authentications.auth.expiresIn).toBeDefined()
                    expect(connector.client.authentications.auth.refreshToken).toBeUndefined()
                    // expect(propTypeErrors(types.Customer, customer)).toBeFalsy()
                    expect(customer.id).toEqual('anonymous')
                })
            })
        })

        const spec4 = test('login as registered user and refresh access token', () => {
            return record(spec4, () => {
                const connector = makeConnector()
                const username = 'mobifyqa@gmail.com'
                const password = 'p4ssword'
                let oldAuth
                let newAuth
                return connector.login(username, password).then((customer) => {
                    oldAuth = Object.assign({}, connector.client.authentications.auth)
                    expect(propTypeErrors(types.Customer, customer)).toBeFalsy()
                    expect(customer.id).toEqual('current')
                    return (
                        connector
                            .refreshSession()
                            // eslint-disable-next-line max-nested-callbacks
                            .then((customer) => {
                                newAuth = connector.client.authentications.auth
                                expect(oldAuth.accessToken).not.toEqual(newAuth.accessToken)
                                expect(oldAuth.refreshToken).not.toEqual(newAuth.refreshToken)
                                expect(propTypeErrors(types.Customer, customer)).toBeFalsy()
                                expect(customer.id).toEqual('current')
                            })
                    )
                })
            })
        })

        const spec5 = test('login as guest and refresh access token', () => {
            return record(spec5, () => {
                const connector = makeConnector()
                let oldAuth
                let newAuth
                return connector.login().then((customer) => {
                    oldAuth = Object.assign({}, connector.client.authentications.auth)
                    expect(oldAuth.refreshToken).toBeUndefined()
                    expect(propTypeErrors(types.Customer, customer)).toBeFalsy()
                    expect(customer.id).toEqual('anonymous')
                    return (
                        connector
                            .refreshSession()
                            // eslint-disable-next-line max-nested-callbacks
                            .then((customer) => {
                                newAuth = connector.client.authentications.auth
                                expect(oldAuth.accessToken).toEqual(newAuth.accessToken)
                                expect(newAuth.refreshToken).toBeUndefined()
                                expect(propTypeErrors(types.Customer, customer)).toBeFalsy()
                                expect(customer.id).toEqual('anonymous')
                            })
                    )
                })
            })
        })
    })

    describe('Cart Integration Test', () => {
        const spec1 = test('for a guest user', () => {
            return record(spec1, () => {
                const connector = makeConnector()
                let cartId
                // 1. Login as a guest user
                return (
                    connector
                        .login()
                        .then((user) => {
                            expect(user.id).toEqual('anonymous')
                            return null
                        })
                        // 2. Create a cart
                        .then(() => connector.createCart())
                        .then((cart) => {
                            cartId = cart.id
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.customerInfo.id).toEqual('anonymous')
                            expect(cart.customerInfo.email).toBeUndefined()
                            expect(cart.items.length).toEqual(0)
                            expect(cart.selectedShippingMethodId).toBeUndefined()
                            expect(cart.payments.length).toEqual(0)
                            expect(cart.subtotal).toEqual(0)
                            expect(cart.shipping).toBeUndefined()
                            expect(cart.discounts).toEqual(0)
                            expect(cart.tax).toEqual(0)
                            expect(cart.total).toEqual(0)
                            return cart
                        })
                        // Try to set a shipping address before setting an email will result in an error
                        .then((cart) => {
                            // eslint-disable-next-line max-nested-callbacks
                            expect(() => {
                                connector.setShippingAddress(cart, orderAddress)
                            }).toThrow()
                            return cart
                        })
                        // 3. Set customer information (email) - only possible for guest user
                        .then((cart) => connector.setCustomerInformation(cart, customerInfo))
                        .then((cart) => {
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.customerInfo).toEqual({
                                id: 'anonymous',
                                email: customerInfo.email
                            })
                            return cart
                        })
                        // 4. Add cart item
                        .then((cart) => connector.addCartItem(cart, cartItem))
                        .then((cart) => {
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.items.length).toEqual(1)
                            const cartItemUpdated = cart.items[0]
                            expect(cartItemUpdated.productId).toEqual(cartItem.productId)
                            expect(cartItemUpdated.quantity).toEqual(cartItem.quantity)
                            expect(cartItemUpdated.id).toEqual('0') // cart item id is entry number
                            expect(cartItemUpdated.baseItemPrice).toBeGreaterThan(0)
                            expect(cartItemUpdated.baseLinePrice).toBeGreaterThan(0)
                            expect(cartItemUpdated.itemPrice).toBeGreaterThan(0)
                            expect(cartItemUpdated.linePrice).toBeGreaterThan(0)
                            expect(cart.subtotal).toBeGreaterThan(0)
                            expect(cart.total).toBeGreaterThan(0)
                            return cart
                        })
                        // 5. Update cart item
                        .then((cart) =>
                            Promise.all([
                                connector.updateCartItem(cart, {
                                    ...cartItem,
                                    id: cart.items[0].id,
                                    quantity: 2
                                }),
                                Promise.resolve(cart.items[0])
                            ])
                        )
                        .then(([cart, oldCartItem]) => {
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.items.length).toEqual(1)
                            const cartItemUpdated = cart.items[0]
                            expect(cartItemUpdated.productId).toEqual(cartItem.productId)
                            expect(cartItemUpdated.quantity).toEqual(2)
                            expect(cartItemUpdated.id).toEqual('0') // cart item id is entry number (0 indexed position in list of entries)
                            expect(cartItemUpdated.baseItemPrice).toEqual(oldCartItem.baseItemPrice)
                            expect(cartItemUpdated.baseLinePrice).toBeGreaterThan(
                                oldCartItem.baseLinePrice
                            )
                            expect(cartItemUpdated.itemPrice).toEqual(oldCartItem.itemPrice)
                            expect(cartItemUpdated.linePrice).toBeGreaterThan(oldCartItem.linePrice)
                            return Promise.all([
                                Promise.resolve(cart),
                                Promise.resolve(cartItemUpdated)
                            ])
                        })
                        // 6. Delete cart item
                        .then(([cart, cartItemUpdated]) =>
                            connector.removeCartItem(cart, cartItemUpdated.id)
                        )
                        .then((cart) => {
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.items.length).toEqual(0)
                            return cart
                        })
                        // 7. Get payment methods (need to set a valid card type for a payment)
                        .then((cart) =>
                            Promise.all([Promise.resolve(cart), connector.getPaymentMethods(cart)])
                        )
                        // Trying to add a payment before setting a billing address will result in an error
                        .then(([cart, paymentMethods]) => {
                            const creditCardPaymentMethod = paymentMethods[0]
                            payment.methodId = creditCardPaymentMethod.id
                            payment.details.type = creditCardPaymentMethod.types[0].id
                            // eslint-disable-next-line max-nested-callbacks
                            expect(() => {
                                connector.setPayment(cart, payment)
                            }).toThrow()
                            return Promise.all([
                                Promise.resolve(cart),
                                Promise.resolve(paymentMethods)
                            ])
                        })
                        // 8. Set billing address - need to set billing address first before adding a payment
                        .then(([cart, paymentMethods]) =>
                            Promise.all([
                                Promise.resolve(paymentMethods),
                                connector.setBillingAddress(cart, orderAddress)
                            ])
                        )
                        // 9. Add payment
                        .then(([paymentMethods, cart]) => {
                            const creditCardPaymentMethod = paymentMethods[0]
                            payment.methodId = creditCardPaymentMethod.id
                            payment.details.type = creditCardPaymentMethod.types[0].id
                            return connector.setPayment(cart, payment)
                        })
                        .then((cart) => {
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.payments.length).toEqual(1)
                            const paymentUpdated = cart.payments[0]
                            expect(paymentUpdated.id).toBeDefined()
                            expect(paymentUpdated.amount).toEqual(cart.total) // always set payment amount to cart total.
                            expect(paymentUpdated.methodId).toEqual(payment.methodId)
                            expect(paymentUpdated.details.type).toEqual(payment.details.type)
                            expect(paymentUpdated.details.holderName).toEqual(
                                payment.details.holderName
                            )
                            expect(paymentUpdated.details.number).toBeUndefined() // card number comes back as a masked number. see next expect.
                            expect(paymentUpdated.details.maskedNumber).toContain('************')
                            expect(paymentUpdated.details.username).toBeUndefined()
                            expect(paymentUpdated.details.expiryMonth).toEqual(
                                payment.details.expiryMonth
                            )
                            expect(paymentUpdated.details.expiryYear).toEqual(
                                payment.details.expiryYear
                            )
                            expect(paymentUpdated.details.ccv).toBeUndefined()
                            expect(cart.billingAddress).toEqual(orderAddress)
                            return cart
                        })
                        // 10. Update payment
                        .then((cart) => {
                            const paymentModified = JSON.parse(JSON.stringify(payment))
                            paymentModified.details.holderName = 'Ronald Duck'
                            paymentModified.details.number = 411111111111111
                            return Promise.all([
                                Promise.resolve(cart.payments[0]),
                                Promise.resolve(paymentModified),
                                connector.setPayment(cart, paymentModified)
                            ])
                        })
                        .then(([oldPayment, newPayment, cart]) => {
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.payments.length).toEqual(1)
                            const paymentUpdated = cart.payments[0]
                            expect(paymentUpdated.id).toBeDefined()
                            expect(paymentUpdated.id).not.toEqual(oldPayment.id) // payment id changes upon update for guest users because payments do not persist on guest user account
                            expect(paymentUpdated.amount).toEqual(cart.total)
                            expect(paymentUpdated.amount).toEqual(oldPayment.amount)
                            expect(paymentUpdated.methodId).toEqual(oldPayment.methodId)
                            expect(paymentUpdated.details.type).toEqual(oldPayment.details.type)
                            expect(paymentUpdated.details.holderName).toEqual(
                                newPayment.details.holderName
                            )
                            expect(paymentUpdated.details.holderName).not.toEqual(
                                oldPayment.details.holderName
                            )
                            expect(paymentUpdated.details.number).toBeUndefined() // card number comes back as a masked number. see next expect.
                            expect(paymentUpdated.details.maskedNumber).toContain('************')
                            expect(paymentUpdated.details.username).toBeUndefined()
                            expect(paymentUpdated.details.expiryMonth).toEqual(
                                oldPayment.details.expiryMonth
                            )
                            expect(paymentUpdated.details.expiryYear).toEqual(
                                oldPayment.details.expiryYear
                            )
                            expect(paymentUpdated.details.ccv).toBeUndefined()
                            expect(cart.billingAddress).toBeDefined()
                            return Promise.resolve([cart, newPayment])
                        })
                        // 11. Update the billing address
                        .then(([cart, newPayment]) => {
                            // For a guest user, if the payment details number is not re-injected, billing address will not be updated

                            // eslint-disable-next-line max-nested-callbacks
                            expect(() => {
                                connector.setBillingAddress(cart, orderAddress)
                            }).toThrow()

                            // For a guest user, to update billing address, re-inject payment details number for existing payment
                            cart.payments[0].details.number = 411111111111111
                            return Promise.all([
                                Promise.resolve(newPayment),
                                connector.setBillingAddress(cart, orderAddress)
                            ])
                        })
                        .then(([newPayment, cart]) => {
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.billingAddress).toEqual(orderAddress)
                            const paymentUpdated = cart.payments[0]
                            expect(paymentUpdated.id).toBeDefined()
                            expect(paymentUpdated.id).not.toEqual(newPayment.id) // For a guest user, an updated payment is a new payment
                            expect(paymentUpdated.amount).toBeGreaterThanOrEqual(0)
                            expect(paymentUpdated.methodId).toEqual(newPayment.methodId)
                            expect(paymentUpdated.details.type).toEqual(newPayment.details.type)
                            expect(paymentUpdated.details.holderName).toEqual(
                                newPayment.details.holderName
                            )
                            expect(paymentUpdated.details.number).toBeUndefined() // card number comes back as a masked number. see next expect.
                            expect(paymentUpdated.details.maskedNumber).toContain('************')
                            expect(paymentUpdated.details.username).toBeUndefined()
                            expect(paymentUpdated.details.expiryMonth).toEqual(
                                newPayment.details.expiryMonth
                            )
                            expect(paymentUpdated.details.expiryYear).toEqual(
                                newPayment.details.expiryYear
                            )
                            expect(paymentUpdated.details.ccv).toBeUndefined()
                            return cart
                        })
                        // 12. Set shipping address
                        .then((cart) => connector.setShippingAddress(cart, orderAddress))
                        .then((cart) => {
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.shippingAddress).toMatchObject(orderAddress)
                            return cart
                        })
                        // TODO: Check if the update is in the hybris instance. (when phone field is fixed)
                        // 13. Get shipping methods
                        .then((cart) =>
                            Promise.all([Promise.resolve(cart), connector.getShippingMethods(cart)])
                        )
                        .then(([cart, shippingMethods]) => {
                            expect(shippingMethods.length).toBeGreaterThanOrEqual(1)
                            expect(shippingMethods[0].id).toBeDefined()
                            expect(shippingMethods[0].cost).toBeGreaterThanOrEqual(0)
                            return Promise.resolve([cart, shippingMethods[0]])
                        })
                        // 14. Set shipping method
                        .then(([cart, shippingMethod]) =>
                            Promise.all([
                                shippingMethod,
                                connector.setShippingMethod(cart, shippingMethod)
                            ])
                        )
                        .then(([shippingMethod, cart]) => {
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.selectedShippingMethodId).toBeDefined()
                            expect(cart.selectedShippingMethodId).toEqual(shippingMethod.id)
                            return cart
                        })
                        // Check if the update is in the hybris instance
                        .then((cart) =>
                            Promise.all([Promise.resolve(cart), connector.getCart(cart.id)])
                        )
                        .then(([cart, backendCart]) =>
                            expect(backendCart.selectedShippingMethodId).toEqual(
                                cart.selectedShippingMethodId
                            )
                        )
                        // 15. Delete cart
                        .then(() => connector.deleteCart(cartId))
                        .then(() => expect(connector.getCart(cartId)).rejects.toThrow())
                        // Delete the cart on error
                        .catch((e) => {
                            connector.deleteCart(cartId)
                            throw e
                        })
                )
            })
        })

        const spec2 = test('for a registered user', () => {
            return record(spec2, () => {
                const connector = makeConnector()
                let cartId
                // 1. Login as a registered user with username and password
                return (
                    connector
                        .login(registeredUser.username, registeredUser.password)
                        .then((user) => {
                            expect(user.id).toEqual('current')
                            return null
                        })
                        // 2. Create a cart
                        .then(() => connector.createCart())
                        .then((cart) => {
                            cartId = cart.id
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.customerInfo.id).toEqual('current')
                            expect(cart.customerInfo.email).toBeUndefined()
                            expect(cart.items.length).toEqual(0)
                            expect(cart.selectedShippingMethodId).toBeUndefined()
                            expect(cart.payments.length).toEqual(0)
                            expect(cart.subtotal).toEqual(0)
                            expect(cart.shipping).toBeUndefined()
                            expect(cart.discounts).toEqual(0)
                            expect(cart.tax).toEqual(0)
                            expect(cart.total).toEqual(0)
                            return cart
                        })
                        // Try to set customer information (email) - not allowed for registered user
                        // Should result in error
                        .then((cart) => {
                            expect(
                                connector.setCustomerInformation(cart, customerInfo)
                            ).rejects.toThrow()
                            return cart
                        })
                        // 3. Add cart item
                        .then((cart) => connector.addCartItem(cart, cartItem))
                        .then((cart) => {
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.items.length).toEqual(1)
                            const cartItem = cart.items[0]
                            expect(cart.items[0]).toMatchObject(cartItem)
                            expect(cartItem.id).toEqual('0') // cart item id is entry number
                            expect(cartItem.baseItemPrice).toBeGreaterThan(0)
                            expect(cartItem.baseLinePrice).toBeGreaterThan(0)
                            expect(cartItem.itemPrice).toBeGreaterThan(0)
                            expect(cartItem.linePrice).toBeGreaterThan(0)
                            expect(cart.subtotal).toBeGreaterThan(0)
                            expect(cart.total).toBeGreaterThan(0)
                            return cart
                        })
                        // 4. Update cart item
                        .then((cart) =>
                            Promise.all([
                                connector.updateCartItem(cart, {
                                    ...cartItem,
                                    id: cart.items[0].id,
                                    quantity: 2
                                }),
                                Promise.resolve(cart.items[0])
                            ])
                        )
                        .then(([cart, oldCartItem]) => {
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.items.length).toEqual(1)
                            const cartItemUpdated = cart.items[0]
                            expect(cartItemUpdated.productId).toEqual(cartItem.productId)
                            expect(cartItemUpdated.quantity).toEqual(2)
                            expect(cartItemUpdated.id).toEqual('0') // cart item id is entry number
                            expect(cartItemUpdated.baseItemPrice).toEqual(oldCartItem.baseItemPrice)
                            expect(cartItemUpdated.baseLinePrice).toBeGreaterThan(
                                oldCartItem.baseLinePrice
                            )
                            expect(cartItemUpdated.itemPrice).toEqual(oldCartItem.itemPrice)
                            expect(cartItemUpdated.linePrice).toBeGreaterThan(oldCartItem.linePrice)
                            return Promise.resolve([cart, cartItemUpdated])
                        })
                        // 5. Delete cart item
                        .then(([cart, cartItemUpdated]) =>
                            connector.removeCartItem(cart, cartItemUpdated.id)
                        )
                        .then((cart) => {
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.items.length).toEqual(0)
                            return cart
                        })
                        // 6. Get payment methods (need to set a valid card type for a payment)
                        .then((cart) =>
                            Promise.all([Promise.resolve(cart), connector.getPaymentMethods(cart)])
                        )
                        // Trying to add a payment before setting a billing address will result in an error
                        .then(([cart, paymentMethods]) => {
                            payment.methodId = paymentMethods[0].id
                            payment.details.type = paymentMethods[0].types[0].id
                            // eslint-disable-next-line max-nested-callbacks
                            expect(() => {
                                connector.setPayment(cart, payment)
                            }).toThrow()
                            return cart
                        })
                        // 7. Set billing address - need to set billing address first before adding a payment
                        .then((cart) => connector.setBillingAddress(cart, orderAddress))
                        // 8. Add payment
                        .then((cart) => connector.setPayment(cart, payment))
                        .then((cart) => {
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.payments.length).toEqual(1)
                            const paymentUpdated = cart.payments[0]
                            expect(paymentUpdated.id).toBeDefined()
                            expect(paymentUpdated.amount).toEqual(cart.total) // always set payment amount to cart total.
                            expect(paymentUpdated.methodId).toEqual(payment.methodId)
                            expect(paymentUpdated.details.type).toEqual(payment.details.type)
                            expect(paymentUpdated.details.holderName).toEqual(
                                payment.details.holderName
                            )
                            expect(paymentUpdated.details.number).toBeUndefined() // card number comes back as a masked number. see next expect.
                            expect(paymentUpdated.details.maskedNumber).toContain('************')
                            expect(paymentUpdated.details.username).toBeUndefined()
                            expect(paymentUpdated.details.expiryMonth).toEqual(
                                payment.details.expiryMonth
                            )
                            expect(paymentUpdated.details.expiryYear).toEqual(
                                payment.details.expiryYear
                            )
                            expect(paymentUpdated.details.ccv).toBeUndefined()
                            expect(cart.billingAddress.id).toBeUndefined() // billing address id is only set when a payment is set in hybris.
                            expect(cart.billingAddress).toMatchObject(orderAddress)
                            return cart
                        })
                        // 9. Update the same payment
                        .then((cart) => {
                            const paymentModified = JSON.parse(JSON.stringify(payment))
                            paymentModified.details.holderName = 'Donald Duck'
                            paymentModified.details.number = 411111111111111
                            return Promise.all([
                                Promise.resolve(cart.payments[0]),
                                Promise.resolve(paymentModified),
                                connector.setPayment(cart, paymentModified)
                            ])
                        })
                        .then(([oldPayment, newPayment, cart]) => {
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.payments.length).toEqual(1)
                            const paymentUpdated = cart.payments[0]
                            expect(paymentUpdated.id).toBeDefined()
                            expect(paymentUpdated.id).toEqual(oldPayment.id) // the payment with the same id is updated
                            expect(paymentUpdated.amount).toEqual(cart.total)
                            expect(paymentUpdated.amount).toEqual(oldPayment.amount)
                            expect(paymentUpdated.methodId).toEqual(oldPayment.methodId)
                            expect(paymentUpdated.details.type).toEqual(oldPayment.details.type)
                            expect(paymentUpdated.details.holderName).toEqual(
                                newPayment.details.holderName
                            )
                            expect(paymentUpdated.details.holderName).not.toEqual(
                                oldPayment.details.holderName
                            )
                            expect(paymentUpdated.details.number).toBeUndefined() // card number comes back as a masked number. see next expect.
                            expect(paymentUpdated.details.maskedNumber).toContain('************')
                            expect(paymentUpdated.details.username).toBeUndefined()
                            expect(paymentUpdated.details.expiryMonth).toEqual(
                                oldPayment.details.expiryMonth
                            )
                            expect(paymentUpdated.details.expiryYear).toEqual(
                                oldPayment.details.expiryYear
                            )
                            expect(paymentUpdated.details.ccv).toBeUndefined()
                            expect(cart.billingAddress).toBeDefined()
                            return cart
                        })
                        // 10. Update the billing address
                        .then((cart) => {
                            const orderAddressModified = JSON.parse(JSON.stringify(orderAddress))
                            orderAddressModified.lastName = 'Ron'
                            return Promise.all([
                                Promise.resolve(orderAddressModified),
                                connector.setBillingAddress(cart, orderAddressModified)
                            ])
                        })
                        .then(([orderAddressModified, cart]) => {
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.billingAddress).toEqual(orderAddressModified)
                            return cart
                        })
                        // Check if the update is in the hybris instance.
                        .then((cart) =>
                            Promise.all([Promise.resolve(cart), connector.getCart(cart.id)])
                        )
                        .then(([cart, backendCart]) => {
                            expect(cart.billingAddress.lastName).toEqual(
                                backendCart.billingAddress.lastName
                            )
                            return cart
                        })
                        // 11. Set shipping address
                        .then((cart) => connector.setShippingAddress(cart, orderAddress))
                        .then((cart) => {
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.shippingAddress).toMatchObject(orderAddress)
                            return cart
                        })
                        // TODO: Check if the update is in the hybris instance. (when phone field is fixed)
                        // 12. Get shipping methods
                        .then((cart) =>
                            Promise.all([Promise.resolve(cart), connector.getShippingMethods(cart)])
                        )
                        .then(([cart, shippingMethods]) => {
                            expect(shippingMethods.length).toBeGreaterThanOrEqual(1)
                            return Promise.resolve([cart, shippingMethods[0]])
                        })
                        // 13. Set shipping method
                        .then(([cart, shippingMethod]) =>
                            Promise.all([
                                shippingMethod,
                                connector.setShippingMethod(cart, shippingMethod)
                            ])
                        )
                        .then(([shippingMethod, cart]) => {
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.selectedShippingMethodId).toBeDefined()
                            expect(cart.selectedShippingMethodId).toEqual(shippingMethod.id)
                            return cart
                        })
                        // Check if the update is in the hybris instance
                        .then((cart) =>
                            Promise.all([Promise.resolve(cart), connector.getCart(cart.id)])
                        )
                        .then(([cart, backendCart]) =>
                            expect(cart.selectedShippingMethodId).toEqual(
                                backendCart.selectedShippingMethodId
                            )
                        )
                        // 14. Delete cart
                        .then(() => connector.deleteCart(cartId))
                        .then(() => expect(connector.getCart(cartId)).rejects.toThrow())
                        // Delete the cart on error
                        .catch((e) => {
                            connector.deleteCart(cartId)
                            throw e
                        })
                )
            })
        })
    })

    describe('Cart Migration Test', () => {
        const spec1 = test('migrate guest cart to registered user cart', () => {
            return record(spec1, () => {
                const connector = makeConnector()
                let cartToMigrateId
                let newCartId
                // 1. Log in as guest user
                return (
                    connector
                        .login()
                        .then((user) => expect(user.id).toEqual('anonymous'))
                        // 2. Create a cart for guest user
                        .then(() => connector.createCart())
                        .then((cart) => {
                            cartToMigrateId = cart.id
                            expect(cart.customerInfo.id).toEqual('anonymous')
                            return cart
                        })
                        // 3. Add cart item to guest user cart
                        .then((cart) => connector.addCartItem(cart, cartItem))
                        .then((cart) => {
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.items.length).toEqual(1)
                            expect(cart.items[0]).toMatchObject(cartItem)
                            expect(cart.items[0].id).toEqual('0') // cart item id is entry number
                            expect(cart.items[0].baseItemPrice).toBeGreaterThan(0)
                            expect(cart.items[0].baseLinePrice).toBeGreaterThan(0)
                            expect(cart.items[0].itemPrice).toBeGreaterThan(0)
                            expect(cart.items[0].linePrice).toBeGreaterThan(0)
                            expect(cart.subtotal).toBeGreaterThan(0)
                            expect(cart.total).toBeGreaterThan(0)
                            return Promise.resolve(cart)
                        })
                        // 4. Logout
                        .then((cartToMigrate) =>
                            Promise.all([Promise.resolve(cartToMigrate), connector.logout()])
                        )
                        // 5. Login as a registered user with username and password
                        .then(([cartToMigrate]) =>
                            Promise.all([
                                Promise.resolve(cartToMigrate),
                                connector.login(registeredUser.username, registeredUser.password)
                            ])
                        )
                        .then(([cartToMigrate, user]) => {
                            expect(user.id).toEqual('current')
                            return Promise.resolve(cartToMigrate)
                        })
                        // 2. Create a cart for registered user by migrating over the guest user cart
                        .then((cartToMigrate) => connector.createCart(cartToMigrate))
                        // Delete the guest user cart on error
                        .catch((e) => {
                            connector.deleteCart(cartToMigrateId)
                            throw e
                        })
                        .then((cart) => {
                            newCartId = cart.id
                            expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                            expect(cart.customerInfo.id).toEqual('current')
                            expect(cart.customerInfo.email).toBeUndefined()
                            expect(cart.items.length).toEqual(1)
                            expect(cart.items[0]).toMatchObject(cartItem)
                            expect(cart.items[0].id).toEqual('0') // cart item id is entry number (0-based index position in list)
                            expect(cart.items[0].baseItemPrice).toBeGreaterThan(0)
                            expect(cart.items[0].baseLinePrice).toBeGreaterThan(0)
                            expect(cart.items[0].itemPrice).toBeGreaterThan(0)
                            expect(cart.items[0].linePrice).toBeGreaterThan(0)
                            expect(cart.selectedShippingMethodId).toBeUndefined()
                            expect(cart.payments.length).toEqual(0)
                            expect(cart.subtotal).toBeGreaterThan(0)
                            expect(cart.total).toBeGreaterThan(0)
                            return null
                        })
                        // 3. Delete cart for registered user (old cart already deleted upon merge through hybris api)
                        .then(() => connector.deleteCart(newCartId))
                        .then(() => expect(connector.getCart(newCartId)).rejects.toThrow())
                        // Delete the cart on error
                        .catch((e) => {
                            connector.deleteCart(newCartId)
                            throw e
                        })
                )
            })
        })
    })

    describe('Orders flow', () => {
        const spec2 = test('Registered User', () => {
            return record(spec2, () => {
                const connector = makeConnector()
                let cartId
                // 1. Log in as registered user
                return (
                    connector
                        .login(registeredUser.username, registeredUser.password)
                        // 2. Create and populate cart
                        .then(() => connector.createCart())
                        .then((cart) => {
                            cartId = cart.id
                            return connector.addCartItem(cart, cartItem)
                        })
                        .then((cart) => connector.setShippingAddress(cart, orderAddress))
                        .then((cart) =>
                            Promise.all([Promise.resolve(cart), connector.getShippingMethods(cart)])
                        )
                        .then(([cart, shippingMethods]) =>
                            connector.setShippingMethod(cart, shippingMethods[0])
                        )
                        .then((cart) => connector.setBillingAddress(cart, orderAddress))
                        .then((cart) => connector.setPayment(cart, payment))
                        .then((cart) =>
                            Promise.all([Promise.resolve(cart), connector.createOrder(cart)])
                        )
                        // Delete the cart on error
                        .catch((e) => {
                            connector.deleteCart(cartId)
                            throw e
                        })
                        .then(([cart, order]) => {
                            expect(propTypeErrors(types.Order, order)).toBeFalsy()
                            expect(order.id).toBeDefined()
                            expect(order.creationDate).toBeDefined()
                            expect(order.status).toBeDefined()
                            expect(order.customerInfo.id).toEqual(cart.customerInfo.id)
                            expect(order.customerInfo.email).toEqual(registeredUser.username)
                            expect(order.items.length).toEqual(1)
                            expect(order.items[0]).toMatchObject(cartItem)
                            // hybris 6.4 does not return phone field, update to 6.5 if phone field needed
                            const orderAddressReturned = JSON.parse(JSON.stringify(orderAddress))
                            orderAddressReturned.phone = undefined
                            expect(order.shippingAddress).toMatchObject(orderAddressReturned)
                            expect(order.billingAddress).toMatchObject(orderAddressReturned)
                            expect(order.selectedShippingMethodId).toEqual(
                                cart.selectedShippingMethodId
                            )
                            expect(order.items.length).toEqual(1)
                            expect(order.payments[0].details.number).toBeUndefined() // card number comes back as a masked number. see next expect.
                            expect(order.payments[0].details.maskedNumber).toContain('************')
                            const paymentReturned = JSON.parse(JSON.stringify(payment))
                            paymentReturned.details.number = undefined
                            expect(order.payments[0]).toMatchObject(paymentReturned)
                            expect(order.subtotal).toEqual(cart.subtotal)
                            // shipping, discounts, tax may be updated after order is created
                            expect(order.shipping).toBeGreaterThanOrEqual(0)
                            expect(order.discounts).toBeGreaterThanOrEqual(cart.discounts)
                            expect(order.tax).toBeGreaterThanOrEqual(cart.tax)
                            expect(order.total).toBeGreaterThanOrEqual(cart.total)
                            return Promise.resolve(order)
                        })
                        .then((order) =>
                            Promise.all([connector.getOrders([order.id]), Promise.resolve(order)])
                        )
                        .then(([orders, order]) => {
                            expect(orders.count).toEqual(1)
                            expect(orders.total).toEqual(1)

                            // BUG: does not save billing address region when sending billing address through a POST cart payment detail.
                            // Since getOrder/s does not take in a cart parameter, we cannot persist this field to the returned order.
                            orders.data[0].billingAddress.stateCode = order.billingAddress.stateCode
                            expect(orders.data[0]).toMatchObject(order)
                            expect(propTypeErrors(types.OrderList, orders)).toBeFalsy()
                        })
                )
            })
        })

        const spec3 = test('Guest User', () => {
            return record(spec3, () => {
                const connector = makeConnector()
                let cartId
                // 1. Log in as guest user
                return (
                    connector
                        .login()
                        // 2. Create a cart for guest user
                        .then(() => connector.createCart())
                        .then((cart) => {
                            cartId = cart.id
                            return connector.addCartItem(cart, cartItem)
                        })
                        .then((cart) => connector.setCustomerInformation(cart, customerInfo))
                        .then((cart) => connector.setShippingAddress(cart, orderAddress))
                        .then((cart) =>
                            Promise.all([Promise.resolve(cart), connector.getShippingMethods(cart)])
                        )
                        .then(([cart, shippingMethods]) =>
                            connector.setShippingMethod(cart, shippingMethods[0])
                        )
                        .then((cart) => connector.setBillingAddress(cart, orderAddress))
                        .then((cart) => connector.setPayment(cart, payment))
                        .then((cart) =>
                            Promise.all([Promise.resolve(cart), connector.createOrder(cart)])
                        )
                        // Delete the cart on error
                        .catch((e) => {
                            connector.deleteCart(cartId)
                            throw e
                        })
                        .then(([cart, order]) => {
                            expect(propTypeErrors(types.Order, order)).toBeFalsy()
                            expect(order.id).toBeDefined()
                            expect(order.creationDate).toBeDefined()
                            expect(order.status).toBeDefined()
                            expect(order.customerInfo).toMatchObject(cart.customerInfo)
                            expect(order.items.length).toEqual(1)
                            expect(order.items[0]).toMatchObject(cartItem)
                            // hybris 6.4 does not return phone field, update to 6.5 if phone field needed
                            const orderAddressReturned = JSON.parse(JSON.stringify(orderAddress))
                            orderAddressReturned.phone = undefined
                            expect(order.shippingAddress).toMatchObject(orderAddressReturned)
                            expect(order.billingAddress).toMatchObject(orderAddressReturned)
                            expect(order.selectedShippingMethodId).toEqual(
                                cart.selectedShippingMethodId
                            )
                            expect(order.items.length).toEqual(1)
                            expect(order.payments[0].details.number).toBeUndefined() // card number comes back as a masked number. see next expect.
                            expect(order.payments[0].details.maskedNumber).toContain('************')
                            const paymentReturned = JSON.parse(JSON.stringify(payment))
                            paymentReturned.details.number = undefined
                            expect(order.payments[0]).toMatchObject(paymentReturned)
                            expect(order.subtotal).toEqual(cart.subtotal)
                            // shipping, discounts, tax may be updated after order is created
                            expect(order.shipping).toBeGreaterThanOrEqual(0)
                            expect(order.discounts).toBeGreaterThanOrEqual(cart.discounts)
                            expect(order.tax).toBeGreaterThanOrEqual(cart.tax)
                            expect(order.total).toBeGreaterThanOrEqual(cart.total)
                            return Promise.resolve(order)
                        })
                        .then((order) =>
                            Promise.all([connector.getOrders([order.id]), Promise.resolve(order)])
                        )
                        .then(([orders, order]) => {
                            expect(orders.count).toEqual(1)
                            expect(orders.total).toEqual(1)

                            // BUG: does not save billing address region when sending billing address through a POST cart payment detail.
                            // Since getOrder/s does not take in a cart parameter, we cannot persist this field to the returned order.
                            orders.data[0].billingAddress.stateCode = order.billingAddress.stateCode
                            expect(orders.data[0]).toMatchObject(order)
                            expect(propTypeErrors(types.OrderList, orders)).toBeFalsy()
                        })
                )
            })
        })
    })

    describe('Coupon support', () => {
        const coupon = 'integration-test-do-not-edit-5'

        const testBody = (connector) =>
            connector
                .createCart()
                .then((cart) => connector.addCartItem(cart, cartItem))
                .then((cart) => connector.addCouponEntry(cart, coupon))
                .then((cart) => {
                    expect(propTypeErrors(types.Cart, cart)).toBeFalsy()
                    expect(cart.items.length).toEqual(1)
                    expect(cart.couponEntries[0].code).toEqual(coupon)
                    expect(cart.couponEntries[0].id).toBeDefined()
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
                const userCreateFixture = userFixture('coupons-2')
                const connector = makeConnector()
                return connector
                    .login()
                    .then(() => connector.registerCustomer(userCreateFixture))
                    .then(() => testBody(connector))
            })
        })

        const spec2 = test('Should allow a guest user to add/remove a CouponEntry to/from their cart', () => {
            return record(spec2, () => {
                const connector = makeConnector()
                return connector.login().then(() => testBody(connector))
            })
        })

        const spec3 = test('Should throw an exception if a cart object isn`t passed in when removing coupon', () => {
            return record(spec3, () => {
                const connector = makeConnector()
                return connector.login().then(() => {
                    expect(() => {
                        connector.removeCouponEntry(undefined, coupon)
                    }).toThrowError(`Parameter 'cart' is required`)
                })
            })
        })

        const spec4 = test('Should throw an exception if a cart object isn`t passed in when removing coupon', () => {
            return record(spec4, () => {
                const dummyCart = {}
                const connector = makeConnector()
                return connector.login().then(() => {
                    expect(() => {
                        connector.removeCouponEntry(dummyCart, undefined)
                    }).toThrowError(`Parameter 'couponEntryId' is required`)
                })
            })
        })
    })
})
