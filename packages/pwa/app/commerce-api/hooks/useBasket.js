import {useContext, useMemo} from 'react'
import {useCommerceAPI, BasketContext} from '../utils'
import useCustomer from './useCustomer'

export default function useBasket() {
    const api = useCommerceAPI()
    const customer = useCustomer()
    const {basket, setBasket: _setBasket} = useContext(BasketContext)

    const setBasket = (basketData) => {
        const _productItemsDetail = basket?._productItemsDetail
        _setBasket({_productItemsDetail, ...basketData})
    }

    const self = useMemo(() => {
        return {
            ...basket,

            get itemCount() {
                return basket?.productItems?.length || 0
            },

            // Items taking into account quantity of each
            get itemAccumulatedCount() {
                return basket?.productItems?.reduce((prev, next) => prev + next.quantity, 0) || 0
            },

            async getOrCreateBasket() {
                // NOTE: This request is the only time we are using the ShopperCustomers API
                // to interact with a customer basket. All other calls are done through the
                // ShopperBaskets API, which in our case, uses OCAPI rather than commerce sdk.
                const customerBaskets = await api.shopperCustomers.getCustomerBaskets({
                    parameters: {customerId: customer?.customerId}
                })

                if (Array.isArray(customerBaskets?.baskets)) {
                    return setBasket(customerBaskets.baskets[0])
                }

                // Back to using ShopperBaskets for all basket interaction.
                const newBasket = await api.shopperBaskets.createBasket({})
                setBasket(newBasket)
            },

            async addItemToBasket(item) {
                const response = await api.shopperBaskets.addItemToBasket({
                    body: item,
                    parameters: {basketId: basket.basketId}
                })
                if (response.fault) {
                    throw new Error(response)
                } else {
                    setBasket(response)
                }
            },

            async removeItemFromBasket(itemId) {
                const response = await api.shopperBaskets.removeItemFromBasket({
                    parameters: {basketId: basket.basketId, itemId: itemId}
                })

                if (response.fault) {
                    throw new Error(response)
                } else {
                    setBasket(response)
                }
            },

            async updateItemInBasket(item, basketItemId) {
                const response = await api.shopperBaskets.updateItemInBasket({
                    body: item,
                    parameters: {basketId: basket.basketId, itemId: basketItemId}
                })
                if (response.fault) {
                    throw new Error(response)
                } else {
                    setBasket(response)
                }
            },

            async getProductsInBasket(ids) {
                if (!ids) {
                    return
                }

                const response = await api.shopperProducts.getProducts({
                    parameters: {ids: ids}
                })

                const itemDetail = response.data.reduce((result, item) => {
                    var key = item.id
                    result[key] = item
                    return result
                }, {})

                const updatedBasket = {
                    ...basket,
                    _productItemsDetail: {...basket._productItemsDetail, ...itemDetail}
                }

                setBasket(updatedBasket)
            },

            async setShippingAddress(address) {
                const response = await api.shopperBaskets.updateShippingAddressForShipment({
                    body: address,
                    parameters: {
                        basketId: basket.basketId,
                        shipmentId: 'me',
                        useAsBilling: !basket.billingAddress
                    }
                })

                setBasket(response)
            },

            async setShippingMethod(id) {
                const response = await api.shopperBaskets.updateShippingMethodForShipment({
                    body: {id},
                    parameters: {basketId: basket.basketId, shipmentId: 'me'}
                })
                setBasket(response)
            },

            async setBillingAddress(address) {
                const response = await api.shopperBaskets.updateBillingAddressForBasket({
                    body: address,
                    parameters: {basketId: basket.basketId, shipmentId: 'me'}
                })

                setBasket(response)
            },

            async setPaymentInstrument(paymentInstrument) {
                // NOTE: API does allow adding multiple payment instruments to split payment. However,
                // we are currently only handling a single payment instrument.
                // Commerce API does not have an endpoint to edit a payment instrument, but OCAPI does.
                // We want to emulate Commerce API behavior (when using OCAPI) so we'll just remove the
                // existing payment and add the new one to simulate editing. We're making an assumption
                // that our basket will never have more than one payment instrument applied at any time.

                // Keep reference to existing payment instrument id
                let existingPaymentInstrumentId =
                    basket.paymentInstruments && basket.paymentInstruments[0]?.paymentInstrumentId

                // Add the new payment instrument to basket
                let response = await api.shopperBaskets.addPaymentInstrumentToBasket({
                    body: paymentInstrument,
                    parameters: {basketId: basket.basketId}
                })

                // TOOO: Handle possible error when adding payment instrument.
                // We won't attempt to remove the previous payment instrument in this case.

                // Remove the previous payment instrument if it existed
                if (existingPaymentInstrumentId) {
                    response = await api.shopperBaskets.removePaymentInstrumentFromBasket({
                        parameters: {
                            basketId: basket.basketId,
                            paymentInstrumentId: existingPaymentInstrumentId
                        }
                    })
                }

                setBasket(response)
            },

            async removePaymentInstrument() {
                let paymentInstrumentId =
                    basket.paymentInstruments && basket.paymentInstruments[0]?.paymentInstrumentId

                if (!paymentInstrumentId) {
                    return
                }

                const response = await api.shopperBaskets.removePaymentInstrumentFromBasket({
                    parameters: {
                        basketId: basket.basketId,
                        paymentInstrumentId: paymentInstrumentId
                    }
                })

                setBasket(response)
            },

            async updateCustomerInfo(info) {
                const response = await api.shopperBaskets.updateCustomerForBasket({
                    body: info,
                    parameters: {basketId: basket.basketId}
                })

                setBasket(response)
            },

            async createOrder() {
                const response = await api.shopperOrders.createOrder({
                    body: {basketId: basket.basketId}
                })

                if (response.fault || (response.title && response.type && response.detail)) {
                    throw new Error(response.title)
                }

                // We replace the basket with the order result data so we can display
                // it on the confirmation page. The basket is automatically deleted
                // in SF so we need to make sure a new one is created when leaving the confirmation.
                setBasket(response)
            }
        }
    }, [customer, basket, setBasket])

    return self
}
