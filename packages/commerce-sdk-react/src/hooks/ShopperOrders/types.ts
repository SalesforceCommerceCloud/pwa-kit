import {QueryParams} from '../../types'

interface ShopperOrderParams extends QueryParams {
    orderNo?: string
}

enum ShopperOrderActions {
    createOrder = 'createOrder',
    createPaymentInstrumentForOrder = 'createPaymentInstrumentForOrder',
    removePaymentInstrumentFromOrder = 'removePaymentInstrumentFromOrder',
    updatePaymentInstrumentForOrder = 'updatePaymentInstrumentForOrder',
}

export type {ShopperOrderParams, ShopperOrderActions}
