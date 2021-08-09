// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
// /* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
const productDetailsCommands = {
    verifyModalButton: function() {
        return this.waitForElementVisible({
            selector: '@productDetailsTitle',
            suppressNotFoundErrors: true,
            timeout: 20000
        })
            .moveToElement('@modalButton', 10, 10)
            .waitForElementVisible({selector: '@modalButton', timeout: 20000})
            .click('@modalButton')
            .waitForElementVisible('@sheetCloseButton')
    }
}

module.exports = {
    elements: {
        productDetailsTemplateIdentifier: '.t-product-details',
        productDetailsTitle: '.t-product-details__info h1',
        modalButton: '.qa-modal-button',
        sheetCloseButton: '.pw-sheet button',
        emailForm: 'input[type="email"]'
    },
    commands: [productDetailsCommands]
}
