/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

const selectors = {
    productDetailsTemplateIdentifier: '.t-product-details',
    modalButton: '.qa-modal-button',
    sheetCloseButton: '.pw-sheet button',
    emailForm: 'input[type="email"]'
}

const ProductDetails = function(browser) {
    this.browser = browser
    this.selectors = selectors
}

ProductDetails.prototype.verifyModalButton = function() {
    console.log('Verify modal button is working')
    this.browser
        .execute('scrollTo(0,500)')
        .waitForElementVisible(selectors.modalButton)
        .click(selectors.modalButton)
        .waitForElementVisible(selectors.sheetCloseButton)
    return this
}

export default ProductDetails
