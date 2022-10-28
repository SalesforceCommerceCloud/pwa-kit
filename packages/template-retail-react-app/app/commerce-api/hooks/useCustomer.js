/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useContext, useMemo} from 'react'
import {nanoid} from 'nanoid'
import {useCommerceAPI, CustomerContext} from '../contexts'

const AuthTypes = Object.freeze({GUEST: 'guest', REGISTERED: 'registered'})

export default function useCustomer() {
    const api = useCommerceAPI()
    const {customer, setCustomer} = useContext(CustomerContext)

    const self = useMemo(() => {
        return {
            ...customer,

            /**
             * Returns boolean value whether the user data is initialized
             */
            get isInitialized() {
                return !!customer?.customerId
            },

            /**
             * Returns boolean value whether the customer is of type `registered` or not.
             */
            get isRegistered() {
                return customer?.authType === AuthTypes.REGISTERED
            },

            /**
             * Returns boolean value whether the customer is of type `guest` or not.
             */
            get isGuest() {
                return customer?.authType === AuthTypes.GUEST
            },

            /** Returns the customer's saved addresses with the 'preferred' address in the first index */
            get addresses() {
                if (!customer?.addresses) {
                    return undefined
                }
                const preferredAddressIndex = customer.addresses.find((addr) => addr.preferred)
                if (preferredAddressIndex > -1) {
                    return [
                        customer.addresses[preferredAddressIndex],
                        customer.addresses.slice(preferredAddressIndex, preferredAddressIndex + 1)
                    ]
                }
                return customer.addresses
            },

            /**
             * Log in customer account.
             *
             * @param {object} credentials
             * @param {string} credentials.email
             * @param {string} credentials.password
             */
            async login(credentials) {
                const skeletonCustomer = await api.auth.login(credentials)
                if (skeletonCustomer.authType === 'guest') {
                    setCustomer(skeletonCustomer)
                } else {
                    const customer = await api.shopperCustomers.getCustomer({
                        parameters: {customerId: skeletonCustomer.customerId}
                    })
                    setCustomer(customer)
                }
            },

            /**
             * Log out current customer.
             * and retrive a guest access token
             */
            async logout() {
                const customer = await api.auth.logout()
                setCustomer(customer)
            },

            /**
             * Fetch current customer information.
             */
            async getCustomer() {
                setCustomer(
                    await api.shopperCustomers.getCustomer({
                        parameters: {customerId: customer.customerId}
                    })
                )
            },

            /**
             * Register a new customer account.
             *
             * @param {object} data
             * @param {boolean} data.acceptsMarketing - A boolean indicates whether customer accept marketing emails.
             * @param {string} data.email
             * @param {string} data.firstName
             * @param {string} data.lastName
             * @param {string} data.password
             */
            async registerCustomer(data) {
                // TODO: investigate how to submit/include the checkbox input
                // for receiving email communication.

                const body = {
                    customer: {
                        firstName: data.firstName,
                        lastName: data.lastName,
                        email: data.email,
                        login: data.email
                    },
                    password: data.password
                }

                const response = await api.shopperCustomers.registerCustomer({body})

                // Check for error json response
                if (response.detail && response.title && response.type) {
                    throw new Error(response.detail)
                }

                // Send a new login request with the given credentials to ensure tokens are updated.
                await self.login({email: data.email, password: data.password})
            },

            /**
             * Update customer information.
             *
             * @param {object} data
             * @param {string} data.email
             * @param {string} data.firstName
             * @param {string} data.lastName
             * @param {string} data.phone
             */
            async updateCustomer(data) {
                const body = {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phoneHome: data.phone,

                    // NOTE/ISSUE
                    // The sdk is allowing you to change your email to an already-existing email.
                    // I would expect an error. We also want to keep the email and login the same
                    // for the customer, but the sdk isn't changing the login when we submit an
                    // updated email. This will lead to issues where you change your email but end
                    // up not being able to login since 'login' will no longer match the email.
                    email: data.email,
                    login: data.email
                }

                const response = await api.shopperCustomers.updateCustomer({
                    body,
                    parameters: {customerId: customer.customerId}
                })

                // Check for error json response
                if (response.detail && response.title && response.type) {
                    throw new Error(response.detail)
                }

                // This previous request does return the updated customer profile, however it does
                // not include the 'entire' customer. It is missing address and payment methods.
                // We need to refetch the customer to make sure everything is up to date.
                await self.getCustomer()
            },

            /**
             * Update customer password.
             *
             * @param {object} data
             * @param {string} data.currentPassword - The old password.
             * @param {string} data.password - The new password.
             * @param {string} email - Customer's email
             */
            async updatePassword(data, email) {
                const body = {
                    password: data.password,
                    currentPassword: data.currentPassword
                }

                // Note that we're using the raw response here. This request does not return
                // data when successful, but the sdk tries to parse the json (potential sdk bug).
                const rawResponse = await api.shopperCustomers.updateCustomerPassword(
                    {
                        body,
                        parameters: {customerId: customer.customerId}
                    },
                    true
                )

                // Success has no json response to parse, but errors do, so handle that here.
                if (rawResponse.status >= 400) {
                    const json = await rawResponse.json()
                    // Check for error json response
                    if (json.detail && json.title && json.type) {
                        throw new Error(json.detail)
                    }
                }

                // Fetch a new SLAS JWT to update the invalid one in client app state
                const credentials = {
                    email: email,
                    password: data.password
                }

                await self.login(credentials)
            },

            /**
             * @todo - Backend set up required
             * @param {string} login - customer email address
             */
            async getResetPasswordToken(login) {
                const response = await api.shopperCustomers.getResetPasswordToken({body: {login}})

                // Check for error json response
                if (response.detail && response.title && response.type) {
                    throw new Error(response.detail)
                }
            },

            /**
             * Add a new saved address.
             *
             * @external Address
             * @see https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/modules/shoppercustomers.html#customeraddress
             */
            async addSavedAddress(address) {
                // The `addressId` field is required to save the customer's address to their account.
                // Rather than make the customer provide a name/id, we can generate a unique id behind
                // the scenes instead. This is only useful if you are not displaying the addr name/id
                // in the UI, which we aren't.
                const body = {
                    addressId: nanoid(),
                    ...address
                }

                await api.shopperCustomers.createCustomerAddress({
                    body,
                    parameters: {customerId: customer.customerId}
                })

                // This endpoint does not return the updated customer object, so we manually fetch it
                await self.getCustomer()
            },

            /**
             * Update a saved address.
             *
             * @external Address
             * @see https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/modules/shoppercustomers.html#customeraddress
             */
            async updateSavedAddress(address) {
                const body = address

                await api.shopperCustomers.updateCustomerAddress({
                    body,
                    parameters: {customerId: customer.customerId, addressName: address.addressId}
                })

                // This endpoint does not return the updated customer object, so we manually fetch it
                await self.getCustomer()
            },

            /**
             * Add a new saved payment instrument.
             *
             * @external PaymentInstrument
             * @see https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/modules/shoppercustomers.html#customerpaymentinstrumentrequest
             */
            async addSavedPaymentInstrument(paymentInstrument) {
                const body = {
                    bankRoutingNumber: '',
                    giftCertificateCode: '',
                    ...paymentInstrument,
                    paymentCard: {
                        ...paymentInstrument.paymentCard,
                        securityCode: undefined
                    }
                }
                await api.shopperCustomers.createCustomerPaymentInstrument({
                    body,
                    parameters: {customerId: customer.customerId}
                })

                // This endpoint does not return the updated customer object, so we manually fetch it
                await self.getCustomer()
            },

            /**
             * Remove a saved payment instrument.
             *
             * @param {string} paymentInstrumentId - The id of the payment payment instrument.
             */
            async removeSavedPaymentInstrument(paymentInstrumentId) {
                // This SDK method must be called with `true` as second argument to avoid an error in
                // the sdk where it tries parsing json from an empty http response.
                await api.shopperCustomers.deleteCustomerPaymentInstrument(
                    {
                        parameters: {customerId: customer.customerId, paymentInstrumentId}
                    },
                    true
                )

                // This endpoint does not return the updated customer object, so we manually fetch it
                await self.getCustomer()
            },

            /**
             * Remove a saved address.
             *
             * @param {string} addressId - The id of the saved address.
             */
            async removeSavedAddress(addressId) {
                // This SDK method must be called with `true` as second argument to avoid an error in
                // the sdk where it tries parsing json from an empty http response.
                await api.shopperCustomers.removeCustomerAddress(
                    {
                        parameters: {customerId: customer.customerId, addressName: addressId}
                    },
                    true
                )

                // This endpoint does not return the updated customer object, so we manually fetch it
                await self.getCustomer()
            },

            async getCustomerOrders(params) {
                const response = await api.shopperCustomers.getCustomerOrders({
                    parameters: {customerId: customer.customerId, offset: 0, limit: 10, ...params}
                })
                return response
            },

            async getOrder(orderNo) {
                const response = await api.shopperOrders.getOrder({
                    parameters: {orderNo}
                })
                return response
            },

            async getCustomerOrderProductsDetail(ids) {
                const response = await api.shopperProducts.getProducts({
                    parameters: {ids: ids.join(',')}
                })

                const productMap = response.data.reduce((result, item) => {
                    const key = item.id
                    result[key] = item
                    return result
                }, {})

                return productMap
            }
        }
    }, [customer, setCustomer])

    return self
}
