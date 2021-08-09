/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

const DEBUG = false || process.env.DEBUG

const homeCommands = {
    closeBrowser: function() {
        if (DEBUG) {
            console.log('Debugging, not closing browser')
        } else {
            this.api.end()
        }
        return this
    },
    navigateToProductList: function() {
        return this.waitForElementVisible('@menuBtn')
            .click('@menuBtn')
            .isVisible({selector: '@menuItemLevel2', suppressNotFoundErrors: true})
            .click({selector: '@menuItemLevel1', suppressNotFoundErrors: true})
            .pause(3000)
            .waitForElementVisible({selector: '@menuItemLevel2', timeout: 20000})
            .click('@menuItemLevel2')
            .pause(5000)
    }
}

module.exports = {
    url: 'http://localhost:3000',
    elements: {
        pwa: '.react-target',
        wrapper: '.t-home',
        menuBtn: '.pw-header-bar__actions .pw-button',
        menuItemLevel1: '.pw-nav-item.pw--has-child div[role=button]',
        menuItemLevel2: '.pw-nav-item:not(.pw--has-child)',
        copyright: '.qa-footer__copyright'
    },
    commands: [homeCommands]
}
