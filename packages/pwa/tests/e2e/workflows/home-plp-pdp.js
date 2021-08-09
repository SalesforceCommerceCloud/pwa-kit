/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
let home
let productList
let productDetails

module.exports = {
    // eslint-disable-line import/no-commonjs
    '@tags': ['e2e'],

    before: (browser) => {
        home = browser.page.home()
        productList = browser.page.productList()
        productDetails = browser.page.productDetails()
    },

    after: () => {
        home.closeBrowser()
    },

    'Step 1 - Open to Home Page': (browser) => {
        home.navigate().waitForElementVisible('@copyright')
    },

    'Step 2 - Navigate from Home to ProductList': (browser) => {
        home.navigateToProductList()
        productList.waitForElementVisible('@productListTemplateIdentifier')
    },

    'Step 3 - Navigate from ProductList to ProductDetails': (browser) => {
        productList.navigateToProductDetails()
        productDetails.waitForElementVisible('@productDetailsTemplateIdentifier')
        productDetails.verifyModalButton()
        browser.end()
    }
}
