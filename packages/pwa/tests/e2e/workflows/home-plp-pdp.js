/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Home from '../page-objects/home'
import ProductList from '../page-objects/product-list'
import ProductDetails from '../page-objects/product-details'

let home
let productList
let productDetails
const PRODUCT_DETAILS_INDEX = process.env.PRODUCT_DETAILS_INDEX || 1

module.exports = {
    // eslint-disable-line import/no-commonjs
    '@tags': ['e2e'],

    before: (browser) => {
        home = new Home(browser)
        productList = new ProductList(browser)
        productDetails = new ProductDetails(browser)
    },

    after: () => {
        home.closeBrowser()
    },

    'Step 1 - Open to Home Page': (browser) => {
        browser.url(`http://localhost:3000/`).waitForElementVisible(home.selectors.copyright)
    },

    'Step 2 - Navigate from Home to ProductList': (browser) => {
        home.navigateToProductList()
        browser.waitForElementVisible(productList.selectors.productListTemplateIdentifier)
    },

    'Step 3 - Navigate from ProductList to ProductDetails': (browser) => {
        productList.navigateToProductDetails(PRODUCT_DETAILS_INDEX)
        browser.waitForElementVisible(productDetails.selectors.productDetailsTemplateIdentifier)
        productDetails.verifyModalButton()
        browser.end()
    }
}
