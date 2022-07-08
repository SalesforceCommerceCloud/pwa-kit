import {QueryParams} from '../../types'

interface ShopperCustomerParams extends QueryParams {
    customerId: string | undefined
}

interface ShopperCustomerProductListParams extends ShopperCustomerParams {
    listId?: string
}

interface ShopperCustomerProductListItemParams extends ShopperCustomerParams {
    itemId?: string
}

interface ShopperCustomerPublicProductListParams extends QueryParams {
    email?: string
    firstName?: string
    lastName?: string
}

interface ShopperCustomerPublicProductListItemParams extends QueryParams {
    itemId?: string
}

interface ShopperCustomerPublicProductListParams extends QueryParams {
    listId?: string
}

interface ShopperCustomerExternalProfileParams extends ShopperCustomerParams {
    externalId: string | undefined
    authenticationProviderId: string | undefined
}

interface ShopperCustomerOrdersParams extends ShopperCustomerParams {
    crossSites: boolean | undefined
    from: string | undefined
    until: string | undefined
    status: string | undefined
    offset: number | undefined
    limit: number | undefined
}

interface ShopperCustomerAddressParams extends ShopperCustomerParams {
    addressName: string | undefined
}

interface ShopperCustomerPaymentInstrumentParams extends ShopperCustomerParams {
    paymentInstrumentId?: string
}

enum ShopperCustomerActions {
    registerCustomer = 'registerCustomer',
    invalidateCustomerAuth = 'invalidateCustomerAuth',
    authorizeCustomer = 'authorizeCustomer',
    authorizeTrustedSystem = 'authorizeTrustedSystem',
    resetPassword = 'resetPassword',
    getResetPasswordToken = 'getResetPasswordToken',
    registerExternalProfile = 'registerExternalProfile',
    updateCustomer = 'updateCustomer',
    createCustomerAddress = 'createCustomerAddress',
    removeCustomerAddress = 'removeCustomerAddress',
    updateCustomerAddress = 'updateCustomerAddress',
    updateCustomerPassword = 'updateCustomerPassword',
    createCustomerPaymentInstrument = 'createCustomerPaymentInstrument',
    deleteCustomerPaymentInstrument = 'deleteCustomerPaymentInstrument',
    createCustomerProductList = 'createCustomerProductList',
    deleteCustomerProductList = 'deleteCustomerProductList',
    updateCustomerProductList = 'updateCustomerProductList',
    createCustomerProductListItem = 'createCustomerProductListItem',
    deleteCustomerProductListItem = 'deleteCustomerProductListItem',
    updateCustomerProductListItem = 'updateCustomerProductListItem',
}

export type {
    ShopperCustomerParams,
    ShopperCustomerExternalProfileParams,
    ShopperCustomerAddressParams,
    ShopperCustomerOrdersParams,
    ShopperCustomerPaymentInstrumentParams,
    ShopperCustomerProductListParams,
    ShopperCustomerProductListItemParams,
    ShopperCustomerPublicProductListParams,
    ShopperCustomerPublicProductListItemParams,
    ShopperCustomerActions,
}
