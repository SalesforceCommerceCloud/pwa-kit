/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import DataObject from './data-object'

export default class ShoppingList extends DataObject {
    static get TYPE() {
        return 'type'
    } // e.g. cart/wishlist
    static get COUNT() {
        return 'count'
    }
    // The total of all cart line items before shipping and taxes.
    static get SUBTOTAL() {
        return 'subtotal'
    }

    constructor(fields, additionalRequiredFields, keyMap, keepExtraFields = true) {
        super(
            [ShoppingList.COUNT, ShoppingList.TYPE],
            [ShoppingList.SUBTOTAL],
            fields,
            keepExtraFields
        )

        this.isValid(additionalRequiredFields, keyMap)

        this.sanitizeMoney(ShoppingList.SUBTOTAL)

        return this.build(keyMap)
    }
}
