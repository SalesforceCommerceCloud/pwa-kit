/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

const productListCommands = {
    navigateToProductDetails: function() {
        // Navigate from ProductList to ProductDetails
        return this.waitForElementVisible({
            selector: '@productTitle',
            suppressNotFoundErrors: true,
            timeout: 20000
        })
            .waitForElementVisible('@productDetailsItem')
            .click('@productDetailsItem')
            .pause(5000)
    }
}

module.exports = {
    elements: {
        productListTemplateIdentifier: '.t-product-list__container',
        productTitle: {
            selector: '.t-product-list__products-items .pw-tile',
            index: 1
        },
        productDetailsItem: {
            selector: '.t-product-list__products-items > a',
            index: 1
        }
    },
    commands: [productListCommands]
}
