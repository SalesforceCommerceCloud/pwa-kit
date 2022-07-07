import {QueryParams} from '../../types'

interface ShopperOrderParams extends QueryParams {
    orderNo: string | undefined
}

enum ShopperOrderActions {
    createOrder = 'createOrder',
    createPaymentInstrumentForOrder = 'createPaymentInstrumentForOrder',
    removePaymentInstrumentFromOrder = 'removePaymentInstrumentFromOrder',
    updatePaymentInstrumentForOrder = 'updatePaymentInstrumentForOrder',
}

export type {ShopperOrderParams, ShopperOrderActions}
