export default {
    _v: '21.3',
    _type: 'basket',
    _resource_state: '499de7b78c2aa296eab0a33287504844c603c60e34b6413c56a3b4b7944b64fd',
    _flash: [
        {
            _type: 'flash',
            type: 'PaymentMethodRequired',
            message:
                'No payment method ID was specified. Please provide a valid payment method ID.',
            path: '$.payment_instruments[0].payment_method_id'
        },
        {
            _type: 'flash',
            type: 'BillingAddressRequired',
            message: 'No billing address was specified. Please provide a valid billing address.',
            path: '$.billing_address'
        },
        {
            _type: 'flash',
            type: 'OrderTotalNotSet',
            message: 'Order total missing, calculation failed.',
            path: '$.order_total'
        },
        {
            _type: 'flash',
            type: 'ShippingAddressRequired',
            message: 'No shipping address was specified. Please provide a valid shipping address.',
            path: '$.shipments[0].shipping_address',
            details: {shipmentId: 'me'}
        },
        {
            _type: 'flash',
            type: 'ShippingMethodRequired',
            message:
                'No shipping method ID was specified. Please provide a valid shipping method ID.',
            path: '$.shipments[0].shipping_method',
            details: {shipmentId: 'me'}
        },
        {
            _type: 'flash',
            type: 'ShippingItemAdjustedPriceNotSet',
            message: "Price missing for shipping item ''b1b391bfa953b36623ae0e3836''.",
            path: '$.shipping_items[0].adjusted_price'
        }
    ],
    adjusted_merchandize_total_tax: 15.0,
    adjusted_shipping_total_tax: null,
    agent_basket: false,
    basket_id: '0cbec76ff0bf436bb8646ded3b',
    channel_type: 'storefront',
    creation_date: '2021-06-04T12:06:54.221Z',
    currency: 'USD',
    customer_info: {
        _type: 'customer_info',
        customer_id: 'customerid',
        email: ''
    },
    last_modified: '2021-06-04T12:07:27.721Z',
    merchandize_total_tax: 15.0,
    notes: {
        _type: 'simple_link',
        link:
            'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/s/RefArch/dw/shop/v21_3/baskets/0cbec76ff0bf436bb8646ded3b/notes'
    },
    order_total: null,
    product_items: [
        {
            _type: 'product_item',
            adjusted_tax: 15.0,
            base_price: 299.99,
            bonus_product_line_item: false,
            gift: false,
            item_id: '68182df78551d6e8629bd5ece4',
            item_text: 'Black Single Pleat Athletic Fit Wool Suit',
            price: 299.99,
            price_after_item_discount: 299.99,
            price_after_order_discount: 299.99,
            product_id: '750518699578M',
            product_name: 'Black Single Pleat Athletic Fit Wool Suit',
            quantity: 1,
            shipment_id: 'me',
            tax: 15.0,
            tax_basis: 299.99,
            tax_class_id: 'standard',
            tax_rate: 0.05
        }
    ],
    product_sub_total: 299.99,
    product_total: 299.99,
    shipments: [
        {
            _type: 'shipment',
            adjusted_merchandize_total_tax: 15.0,
            adjusted_shipping_total_tax: null,
            gift: false,
            merchandize_total_tax: 15.0,
            product_sub_total: 299.99,
            product_total: 299.99,
            shipment_id: 'me',
            shipment_total: null,
            shipping_status: 'not_shipped',
            shipping_total: null,
            shipping_total_tax: null,
            tax_total: null
        }
    ],
    shipping_items: [
        {
            _type: 'shipping_item',
            adjusted_tax: null,
            base_price: null,
            item_id: 'b1b391bfa953b36623ae0e3836',
            item_text: 'Shipping',
            price: null,
            price_after_item_discount: null,
            shipment_id: 'me',
            tax: null,
            tax_basis: null,
            tax_class_id: null,
            tax_rate: 0.05
        }
    ],
    shipping_total: null,
    shipping_total_tax: null,
    taxation: 'net',
    tax_total: null
}
