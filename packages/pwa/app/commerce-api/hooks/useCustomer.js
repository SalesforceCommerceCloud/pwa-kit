import {useContext, useMemo} from 'react'

import {getAppOrigin} from 'pwa-kit-react-sdk/dist/utils/url'
import {nanoid} from 'nanoid'
import {useCommerceAPI, CustomerContext, createGetTokenBody} from '../utils'

export default function useCustomer() {
    const api = useCommerceAPI()
    const {customer, setCustomer} = useContext(CustomerContext)

    const self = useMemo(() => {
        return {
            ...customer,

            async login(credentials) {
                const res = await api.auth.login(credentials)

                if (credentials) {
                    const tokenBody = createGetTokenBody(
                        res,
                        `${getAppOrigin()}/callback`,
                        window.sessionStorage.getItem('codeVerifier')
                    )
                    const {customer_id} = await api.auth.getLoggedInToken(tokenBody)

                    const customer = await api.shopperCustomers.getCustomer({
                        parameters: {customerId: customer_id}
                    })

                    setCustomer(customer)
                } else {
                    let customer = res.customer

                    if (res.access_token) {
                        customer = await api.shopperCustomers.getCustomer({
                            parameters: {customerId: res.customer_id}
                        })
                    }
                    setCustomer(customer)
                }
            },

            async logout() {
                const {customer} = await api.auth.logout()
                setCustomer(customer)
            },

            async getCustomer() {
                setCustomer(
                    await api.shopperCustomers.getCustomer({
                        parameters: {customerId: customer.customerId}
                    })
                )
            },

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
             * @todo - Backend set up required
             * @param {string} - customer email address
             */
            async getResetPasswordToken(login) {
                const response = await api.shopperCustomers.getResetPasswordToken({body: {login}})

                // Check for error json response
                if (response.detail && response.title && response.type) {
                    throw new Error(response.detail)
                }
            },

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
                await self.getCustomer()
            },

            async removeSavedAddress(addressId) {
                await api.shopperCustomers.removeCustomerAddress(
                    {
                        parameters: {customerId: customer.customerId, addressName: addressId}
                    },
                    true
                )
                await self.getCustomer()
            }
        }
    }, [customer, setCustomer])

    return self
}
