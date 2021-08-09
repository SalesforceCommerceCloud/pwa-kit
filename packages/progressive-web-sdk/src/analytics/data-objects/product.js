/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import DataObject from './data-object'

export default class Product extends DataObject {
    static get ID() {
        return 'id'
    }
    static get NAME() {
        return 'name'
    }
    static get CATEGORY() {
        return 'category'
    }
    static get BRAND() {
        return 'brand'
    }
    static get VARIANT() {
        return 'variant'
    }
    static get LIST() {
        return 'list'
    }
    static get POSITION() {
        return 'position'
    }
    static get PRICE() {
        return 'price'
    }
    static get QUANTITY() {
        return 'quantity'
    }
    static get COUPON() {
        return 'coupon'
    }
    static get STOCK() {
        return 'stock'
    }
    static get SIZE() {
        return 'size'
    }
    static get COLOR() {
        return 'color'
    }

    constructor(fields, additionalRequiredFields, keyMap, keepExtraFields = true) {
        super(
            [Product.ID, Product.NAME],
            [
                Product.CATEGORY,
                Product.BRAND,
                Product.VARIANT,
                Product.LIST,
                Product.POSITION,
                Product.PRICE,
                Product.QUANTITY,
                Product.COUPON,
                Product.STOCK,
                Product.SIZE,
                Product.COLOR
            ],
            fields,
            keepExtraFields
        )

        this.sanitizeMoney(Product.PRICE)

        this.isValid(additionalRequiredFields, keyMap)

        return this.build(keyMap)
    }
}
