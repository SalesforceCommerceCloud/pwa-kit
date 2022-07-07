interface ShopperBasketParams {
    basketId: string | undefined
}

// The actions are manually taken from commerce-sdk-react documentation
enum ShopperBasketActions {
    createBasket = 'createBasket',
    transferBasket = 'transferBasket',
    mergeBasket = 'mergeBasket',
    deleteBasket = 'deleteBasket',
    updateBasket = 'updateBasket',
    updateBillingAddressForBasket = 'updateBillingAddressForBasket',
    addCouponToBasket = 'addCouponToBasket',
    removeCouponFromBasket = 'removeCouponFromBasket',
    updateCustomerForBasket = 'updateCustomerForBasket',
    addGiftCertificateItemToBasket = 'addGiftCertificateItemToBasket',
    removeGiftCertificateItemFromBasket = 'removeGiftCertificateItemFromBasket',
    updateGiftCertificateItemInBasket = 'updateGiftCertificateItemInBasket',
    addItemToBasket = 'addItemToBasket',
    removeItemFromBasket = 'removeItemFromBasket',
    updateItemInBasket = 'updateItemInBasket',
    addTaxesForBasketItem = 'addTaxesForBasketItem',
    addPaymentInstrumentToBasket = 'addPaymentInstrumentToBasket',
    removePaymentInstrumentFromBasket = 'removePaymentInstrumentFromBasket',
    updatePaymentInstrumentInBasket = 'updatePaymentInstrumentInBasket',
    addPriceBooksToBasket = 'addPriceBooksToBasket',
    createShipmentForBasket = 'createShipmentForBasket',
    removeShipmentFromBasket = 'removeShipmentFromBasket',
    updateShipmentForBasket = 'updateShipmentForBasket',
    updateShippingAddressForShipment = 'updateShippingAddressForShipment',
    updateShippingMethodForShipment = 'updateShippingMethodForShipment',
    addTaxesForBasket = 'addTaxesForBasket',
}

export type {ShopperBasketParams, ShopperBasketActions}
