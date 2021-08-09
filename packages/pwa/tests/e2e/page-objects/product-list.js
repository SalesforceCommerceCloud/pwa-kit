/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

const selectors = {
    productListTemplateIdentifier: '.t-product-list__container',
    productTitle(index) {
        return `.t-product-list__products-items:nth-child(${index}) .pw-tile__header`
    },
    productDetailsItem(index) {
        return `.t-product-list__products-items:nth-child(${index}) .pw-tile__details a`
    }
}

const ProductList = function(browser) {
    this.browser = browser
    this.selectors = selectors
}

ProductList.prototype.navigateToProductDetails = function(productIndex) {
    // Navigate from ProductList to ProductDetails
    this.browser
        .waitForElementVisible(selectors.productTitle(productIndex))
        .getText(selectors.productTitle(productIndex), (result) => {
            const title = result.value
            console.log(`Navigating to Product Index ${productIndex}. Going to Product: ${title}`)
        })
        .waitForElementVisible(selectors.productDetailsItem(productIndex))
        .click(selectors.productDetailsItem(productIndex))
        .waitForElementPresent('[id*="mobify"]', 10000)
    return this
}

export default ProductList
