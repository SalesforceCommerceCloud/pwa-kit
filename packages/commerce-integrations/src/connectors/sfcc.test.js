/* eslint-disable max-nested-callbacks */

import Promise from 'bluebird'
import {SalesforceConnector} from './sfcc'
import {
    Cart,
    Category,
    CategoryList,
    Customer,
    Order,
    OrderAddress,
    OrderList,
    Payment,
    Product,
    ProductList,
    ProductSearch,
    Store,
    StoreSearchResult
} from '../types'
import {propTypeErrors, record, isIntegrationTest} from '../utils/test-utils'

if (isIntegrationTest) {
    jest.setTimeout(45000)
}

const userFixture = (key) => {
    const time = isIntegrationTest ? new Date().getTime() : ''
    return {
        firstName: `test-v1-${key}${time}-firstName`,
        lastName: `test-v1-${key}${time}-lastName`,
        email: `test-v1-${key}${time}@example-foo.com`,
        password: `test-v1-${key}${time}-P4$$word`
    }
}

const validCredentials = {
    username: 'testuser1@demandware.com',
    password: 'P4$$wordP4'
}

const invalidCredentials = {
    username: 'testuser0@demandware.com',
    password: 'P4$$wordP4'
}
const customerInformation = {
    email: 'engineer@mobify.com'
}
const orderAddress = {
    firstName: 'Test',
    lastName: 'User',
    phone: '5555555555',
    addressLine1: '1600 Pennsylvania Ave NW',
    countryCode: 'US',
    stateCode: 'DC',
    city: 'Washington',
    postalCode: '20500'
}
const cartItem = {
    productId: '008884303989M',
    quantity: 1
}
const payment = {
    amount: 179.98,
    methodId: 'CREDIT_CARD',
    details: {
        ccv: '123',
        type: 'Visa',
        holderName: 'Test User',
        number: '411111111111112',
        expiryMonth: 1,
        expiryYear: 2028
    }
}

describe(`The SFCC Connector`, () => {
    const makeConnector = () =>
        SalesforceConnector.fromConfig({
            basePath: `https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/s/RefArch/dw/shop/v20_4`,
            defaultHeaders: {
                'x-dw-client-id': 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
            }
        })

    describe('Checkout flow', () => {
        const spec0 = test('Registered User', () => {
            return record(spec0, () => {
                const {username, password} = validCredentials
                const connector = makeConnector()
                let cart

                return (
                    connector
                        .login(username, password)
                        // 1. Create a new cart
                        .then(() => connector.createCart())
                        .then((data) => {
                            expect(propTypeErrors(Cart, data)).toBeFalsy()

                            cart = data
                        })
                        // 2. Set customer information
                        .then(() => connector.setCustomerInformation(cart, customerInformation))
                        .then((data) => {
                            expect(data.customerInfo.email).toEqual(customerInformation.email)

                            cart = data // Update local cart variable
                        })
                        // 3. Add Cart Item
                        .then(() => connector.addCartItem(cart, cartItem))
                        .then((data) => {
                            expect(data.items).toHaveLength(1)
                            expect(data.items[0].productId).toEqual(cartItem.productId)
                            expect(data.items[0].quantity).toEqual(cartItem.quantity)

                            cart = data // Update local cart variable
                        })
                        // 4. Update Cart Item
                        .then(() => connector.updateCartItem(cart, {...cart.items[0], quantity: 2}))
                        .then((data) => {
                            expect(data.items).toHaveLength(1)
                            expect(data.items[0].productId).toEqual(cartItem.productId)
                            expect(data.items[0].quantity).toEqual(2)

                            cart = data
                        })
                        // 5. Remove Cart item
                        .then(() => connector.removeCartItem(cart, cart.items[0].id))
                        .then((data) => {
                            expect(data.items).toHaveLength(0)

                            cart = data // Update local cart variable
                        })
                        // 5b. Re Add Cart Item so order creation doesn't fail
                        .then(() => connector.addCartItem(cart, cartItem))
                        .then((data) => {
                            cart = data // Update local cart variable
                        })
                        // 6. Set Billing Address
                        .then(() => connector.setBillingAddress(cart, orderAddress))
                        .then((data) => {
                            expect(data.billingAddress).toMatchObject(orderAddress)
                            expect(propTypeErrors(OrderAddress, data.billingAddress)).toBeFalsy()

                            cart = data // Update local cart variable
                        })
                        // 7. Set Shipping Address
                        .then(() => connector.setShippingAddress(cart, orderAddress))
                        .then((data) => {
                            expect(data.shippingAddress).toMatchObject(orderAddress)
                            expect(propTypeErrors(OrderAddress, data.shippingAddress)).toBeFalsy()

                            cart = data // Update local cart variable
                        })
                        // 8. Get Shipping Methods
                        .then(() => connector.getShippingMethods(cart))
                        .then((data) => {
                            cart.shippingMethods = data

                            expect(data.length).not.toBeLessThan(0)
                            expect(propTypeErrors(Cart, cart)).toBeFalsy()
                        })
                        // 9. Set Shipping Method
                        .then(() => connector.setShippingMethod(cart, cart.shippingMethods[0]))
                        .then((data) => {
                            expect(data.selectedShippingMethodId).toEqual(
                                cart.shippingMethods[0].id
                            )
                            expect(propTypeErrors(Cart, data)).toBeFalsy()

                            cart = data // Update local cart variable
                        })
                        // 9b. Set Shipping Method
                        .then(() => {
                            return expect(
                                connector.setShippingMethod(cart, 'INVALID_SHIPPING_METHOD_ID')
                            ).rejects.toThrow()
                        })
                        // 10. Get Payment Methods
                        .then(() => connector.getPaymentMethods(cart))
                        .then((data) => {
                            expect(data.length).not.toBeLessThan(0)

                            cart.paymentMethods = data
                            expect(propTypeErrors(Cart, cart)).toBeFalsy()
                        })
                        // 11. Set Payment
                        .then(() => connector.setPayment(cart, payment))
                        .then((data) => {
                            expect(data.payments).toHaveLength(1)
                            expect(propTypeErrors(Payment, data.payments[0])).toBeFalsy()
                            expect(data.payments[0].methodId).toEqual(payment.methodId)

                            cart = data // Update local cart variable
                        })
                        // 12. Set Payment (Updated Values)
                        .then(() => connector.setPayment(cart, {...cart.payments[0], amount: 200}))
                        .then((data) => {
                            expect(data.payments).toHaveLength(1)
                            expect(propTypeErrors(Payment, data.payments[0])).toBeFalsy()
                            expect(data.payments[0].amount).toEqual(200)

                            cart = data // Update local cart variable
                        })
                        // 13. Create Order
                        .then(() => connector.createOrder(cart))
                        .then((data) => {
                            expect(propTypeErrors(Order, data)).toBeFalsy()
                            return data
                        })
                        // 14. Verify order by getting it.
                        .then((order) =>
                            Promise.all([Promise.resolve(order), connector.getOrders([order.id])])
                        )
                        .then(([order, orders]) => {
                            expect(orders.count).toEqual(1)
                            expect(orders.total).toEqual(1)
                            expect(orders.data[0].id).toEqual(order.id)

                            // Delete the cart as placing the order successfully has deleted it.
                            cart = undefined

                            return null
                        })
                        .catch((e) => {
                            // Ensure we delete the cart so our tests don't fail on cart creation next time.
                            if (cart) {
                                connector.deleteCart(cart.id)
                            }

                            // Rethrow the error so that the tests fail.
                            throw e
                        })
                )
            })
        })
    })

    describe('Searching for products', () => {
        const sorts = [
            undefined,
            {query: 'name-ascending', key: 'name', compare: (a, b) => a.localeCompare(b)},
            {query: 'price-low-to-high', key: 'price', compare: (a, b) => a - b}
        ]
        sorts.forEach((sortOpts) => {
            const spec1 = test(`with a sort order [sort: ${sortOpts && sortOpts.query}]`, () => {
                return record(spec1, () => {
                    const connector = makeConnector()
                    const query = {
                        filters: {
                            categoryId: 'root'
                        },
                        ...(sortOpts && {sort: sortOpts.query})
                    }
                    return connector.searchProducts(query).then((data) => {
                        expect(propTypeErrors(ProductSearch, data)).toBeFalsy()
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
            const spec2 = test(`with a max count (count: ${count})`, () => {
                return record(spec2, () => {
                    const connector = makeConnector()
                    const query = {
                        filters: {categoryId: 'root'},
                        count
                    }
                    return connector.searchProducts(query).then((data) => {
                        expect(propTypeErrors(ProductSearch, data)).toBeFalsy()
                        expect(data.results.length).toEqual(count)
                    })
                })
            })
        })
    })

    describe('Getting an order', () => {
        const spec3 = test('with an invalid id should reject', () => {
            return record(spec3, () => {
                const connector = makeConnector()
                return expect(connector.getOrder('1')).rejects.toThrow()
            })
        })
    })

    describe('Getting orders', () => {
        const spec4 = test('with invalid ids should resolve with a OrderList instance with empty data', () => {
            return record(spec4, () => {
                const connector = makeConnector()
                const invalidIds = ['1', '2']
                return connector.getOrders(invalidIds).then((result) => {
                    expect(propTypeErrors(OrderList, result)).toBeFalsy()
                    expect(result.data.length).toEqual(0)
                })
            })
        })
    })

    describe('Getting a product', () => {
        const spec5 = test('with a valid id should resolve with a Product instance', () => {
            return record(spec5, () => {
                const connector = makeConnector()
                return connector.getProduct('008884303989M').then((data) => {
                    expect(propTypeErrors(Product, data)).toBeFalsy()
                })
            })
        })

        const spec6 = test('with an invalid id should reject', () => {
            return record(spec6, () => {
                const connector = makeConnector()
                return expect(connector.getProduct('1')).rejects.toThrow()
            })
        })
    })

    describe('Getting products', () => {
        const spec7 = test('with valid ids should resolve with a ProductList instance with populated data', () => {
            return record(spec7, () => {
                const connector = makeConnector()
                const validIds = ['008884303989M', '008884303996M']
                return connector.getProducts(validIds).then((result) => {
                    expect(propTypeErrors(ProductList, result)).toBeFalsy()
                    expect(result.data.length).toEqual(validIds.length)
                })
            })
        })

        const spec8 = test('with invalid ids should resolve with a ProductList instance with empty data', () => {
            return record(spec8, () => {
                const connector = makeConnector()
                const invalidIds = ['1', '2']
                return connector.getProducts(invalidIds).then((result) => {
                    expect(propTypeErrors(ProductList, result)).toBeFalsy()
                    expect(result.data.length).toEqual(0)
                })
            })
        })

        const spec9 = test('with a mix of valid and invalid ids should resolve with a ProductList instance with partial data', () => {
            return record(spec9, () => {
                const connector = makeConnector()
                const validIds = ['008884303989M', '008884303996M']
                const invalidIds = ['1', '2']

                return connector.getProducts([...validIds, ...invalidIds]).then((result) => {
                    expect(propTypeErrors(ProductList, result)).toBeFalsy()
                    expect(result.data.length).toEqual(validIds.length)
                    expect(result.total).toEqual(validIds.length)
                    expect(result.count).toEqual(validIds.length)
                })
            })
        })
    })

    const spec10 = test('Getting a Store', () => {
        return record(spec10, () => {
            const connector = makeConnector()
            return connector.getStore('store1').then((data) => {
                expect(propTypeErrors(Store, data)).toBeFalsy()
            })
        })
    })

    describe('Searching for Stores', () => {
        // searchStoreRequest is using default values for start, count if not provided
        const spec11 = test('Only longitude provided, missing latitude', () => {
            return record(spec11, () => {
                const connector = makeConnector()
                const searchStoreRequest = {
                    latlon: {
                        longitude: -118.225606
                    }
                }
                expect(() => {
                    connector.searchStores(searchStoreRequest)
                }).toThrowError('Provide Latitude and Longitude coordinates')
            })
        })

        const spec12 = test('Only latitude provided, missing longitude', () => {
            return record(spec12, () => {
                const connector = makeConnector()
                const searchStoreRequest = {
                    latlon: {
                        latitude: 34.014613
                    }
                }
                expect(() => {
                    connector.searchStores(searchStoreRequest)
                }).toThrowError('Provide Latitude and Longitude coordinates')
            })
        })

        const spec13 = test('Valid latitude and longitude provided', () => {
            return record(spec13, () => {
                const connector = makeConnector()
                const searchStoreRequest = {
                    latlon: {
                        latitude: 34.014613,
                        longitude: -118.225606
                    }
                }
                return connector.searchStores(searchStoreRequest).then((data) => {
                    expect(data.stores).not.toHaveLength(0)
                    expect(data.stores).toHaveLength(data.count)
                    expect(propTypeErrors(StoreSearchResult, data)).toBeFalsy()
                })
            })
        })

        const spec14 = test('0.0, 1.0 geo-coordinates allowed', () => {
            return record(spec14, () => {
                const connector = makeConnector()
                const searchStoreRequest = {
                    latlon: {
                        latitude: 0.0,
                        longitude: 0.0
                    }
                }
                return connector.searchStores(searchStoreRequest).then((data) => {
                    expect(data.stores).not.toHaveLength(0)
                    expect(data.stores).toHaveLength(data.count)
                    expect(propTypeErrors(StoreSearchResult, data)).toBeFalsy()
                })
            })
        })
    })

    describe('Get Product Categories', () => {
        const spec15 = test(`getCategory should resolve to a Category instance`, () => {
            return record(spec15, () => {
                const connector = makeConnector()
                const category = 'root'
                return connector.getCategory(category, {levels: 2}).then((data) => {
                    expect(propTypeErrors(Category, data)).toBeFalsy()
                    expect(data.id).toEqual(category)
                })
            })
        })

        const spec16 = test(`getCategories should resolve to a CategoryList instance`, () => {
            return record(spec16, () => {
                const connector = makeConnector()
                const categories = ['mens', 'womens']
                return connector.getCategories(categories, {levels: 2}).then((result) => {
                    expect(propTypeErrors(CategoryList, result)).toBeFalsy()
                    expect(result.count).toEqual(2)
                    expect(result.data[0].id).toEqual(categories[0])
                    expect(result.data[1].id).toEqual(categories[1])
                })
            })
        })
    })

    describe('Customer Authorization', () => {
        const spec17 = test(`authorizing a valid customer should return said customer`, () => {
            return record(spec17, () => {
                const connector = makeConnector()
                const {username, password} = validCredentials
                return connector.login(username, password).then((customer) => {
                    expect(propTypeErrors(Customer, customer)).toBeFalsy()
                    expect(customer.email).toEqual(username)
                })
            })
        })

        const spec18 = test(`authorizing an invalid customer should throw`, () => {
            return record(spec18, () => {
                const connector = makeConnector()
                const {username, password} = invalidCredentials
                return expect(connector.login(username, password)).rejects.toThrow()
            })
        })

        const spec19 = test(`authorizing as a guest should return a customer`, () => {
            return record(spec19, () => {
                const connector = makeConnector()
                return connector.login().then((customer) => {
                    expect(propTypeErrors(Customer, customer)).toBeFalsy()
                })
            })
        })
    })

    describe('Account management', () => {
        const spec20 = test('Should support creating a new user account', () => {
            return record(spec20, () => {
                const data = userFixture('creating-accounts')
                const connector = makeConnector()
                return Promise.resolve()
                    .then(() => connector.login())
                    .then(() => connector.registerCustomer(data))
                    .then((customer) => {
                        expect(propTypeErrors(Customer, customer)).toBeFalsy()
                        return connector.getCustomer(customer.id) // Protected endpoint
                    })
                    .then((customer) => {
                        expect(propTypeErrors(Customer, customer)).toBeFalsy()
                        Object.keys(data)
                            .filter((k) => k !== 'password')
                            .forEach((k) => expect(data[k]).toEqual(customer[k]))
                        expect(customer).not.toHaveProperty('password')
                    })
            })
        })
    })

    describe('Getting a customer', () => {
        const spec21 = test(`getting any customer without logging in first should throw`, () => {
            return record(spec21, () => {
                const connector = makeConnector()
                const customerId = 'bcyyeR5KK0gGKjf2uZHarcK93Z'
                const error = {
                    arguments: undefined,
                    message: "Unauthorized request: The 'Authorization' header is missing.",
                    type: 'AuthorizationHeaderMissingException'
                }
                return expect(connector.getCustomer(customerId)).rejects.toEqual(error)
            })
        })

        const spec22 = test(`getting the logged in customer after logging in should return the customer`, () => {
            return record(spec22, () => {
                const connector = makeConnector()
                const {username, password} = validCredentials
                return connector
                    .login(username, password)
                    .then((customer) => {
                        return connector.getCustomer(customer.id)
                    })
                    .then((customer) => {
                        expect(propTypeErrors(Category, customer)).toBeFalsy()
                        expect(customer.email).toEqual(username)
                    })
            })
        })

        const spec23 = test(`can set default headers to maintain authentication tokens between connectors`, () => {
            return record(spec23, () => {
                const connector1 = makeConnector()
                const connector2 = makeConnector()
                const {username, password} = validCredentials

                return connector1
                    .login(username, password)
                    .then((customer) => {
                        connector2.setDefaultHeaders(connector1.getDefaultHeaders())

                        return connector2.getCustomer(customer.id)
                    })
                    .then((customer) => {
                        expect(propTypeErrors(Category, customer)).toBeFalsy()
                        expect(customer.email).toEqual(username)
                    })
            })
        })
    })

    describe('Coupon support', () => {
        const testBody = (connector) =>
            connector
                .createCart()
                .then((cart) => connector.addCartItem(cart, cartItem))
                .then((cart) => connector.addCouponEntry(cart, 'orderLevel'))
                .then((cart) => {
                    expect(propTypeErrors(Cart, cart)).toBeFalsy()
                    expect(cart.items.length).toEqual(1)
                    expect(cart.couponEntries[0].code).toEqual('orderLevel')
                    expect(cart.couponEntries[0].id).toBeDefined()
                    expect(cart.discounts).toBeLessThan(0)
                    return cart
                })
                .then((cart) => connector.removeCouponEntry(cart, cart.couponEntries[0].id))
                .then((cart) => {
                    expect(propTypeErrors(Cart, cart)).toBeFalsy()
                    expect(cart.items.length).toEqual(1)
                    expect(cart.couponEntries).toEqual([])
                    expect(cart.discounts).toBe(0)
                    return cart
                })
                .then((cart) => {
                    return expect(connector.addCouponEntry(cart, 'INVALID_COUPON'))
                        .rejects.toThrow()
                        .then(() => cart)
                })
                .then((cart) => {
                    return expect(connector.removeCouponEntry(cart, 'INVALID_COUPONENTRY_ID'))
                        .rejects.toThrow()
                        .then(() => cart)
                })

        const spec1 = test('Should allow a registered user to add/remove a CouponEntry to/from their cart', () => {
            return record(spec1, () => {
                const userCreateFixture = userFixture('coupons-1')
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
    })
})
