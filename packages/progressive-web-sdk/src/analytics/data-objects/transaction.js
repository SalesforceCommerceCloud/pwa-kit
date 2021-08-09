/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import DataObject from './data-object'
import Product from './product'

export default class Transaction extends DataObject {
    static get ID() {
        return 'id'
    } // Transaction id
    static get AFFILIATION() {
        return 'affiliation'
    } // Checkout Method (Web, Paypal, Apple Pay, Google store ... etc)
    static get REVENUE() {
        return 'revenue'
    } // Grand total (including shipping and taxes)
    static get TAX() {
        return 'tax'
    }
    static get SHIPPING() {
        return 'shipping'
    }
    static get LIST() {
        return 'list'
    } // Purchase attribution - What affected this purchase? (ie. Web push)
    static get STEP() {
        return 'step'
    } // A number representing a step in the checkout process
    static get OPTION() {
        return 'option'
    } // Additional options

    constructor(
        transactionInfo,
        productsInfo,
        additionalTransactionRequiredFields,
        additionalProductRequiredFields,
        transactionKeyMap,
        productKeyMap,
        keepExtraFields = true
    ) {
        super(
            [Transaction.ID],
            [
                Transaction.AFFILIATION,
                Transaction.REVENUE,
                Transaction.TAX,
                Transaction.SHIPPING,
                Transaction.LIST,
                Transaction.STEP,
                Transaction.OPTION
            ],
            transactionInfo,
            keepExtraFields
        )

        this.isValid(additionalTransactionRequiredFields, transactionKeyMap)

        this.sanitizeMoney(Transaction.REVENUE)
        this.sanitizeMoney(Transaction.TAX)
        this.sanitizeMoney(Transaction.SHIPPING)

        this.products = []
        productsInfo.forEach((product) => {
            this.products.push(
                new Product(
                    product,
                    additionalProductRequiredFields,
                    productKeyMap,
                    keepExtraFields
                )
            )
        })

        return this.build(transactionKeyMap)
    }

    build(keyMap) {
        return {
            transaction: super.build(keyMap),
            products: this.products
        }
    }
}
