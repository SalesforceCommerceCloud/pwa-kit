/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/// <reference types="Cypress" />

describe('Home Page', () => {
    beforeEach(() => {
        // Ensure the page is in a fresh state before testing by navigating before
        // each test.
        cy.visit('/')
    })

    it('loads successfully', () => {
        // NOTE: On user `cy.intercept()`, you cannot intercept called made with `getProps()`
        // when made on the server. We'll be working on a solution for this in the future.

        // This is an innoxious example on using test-id attributes to help selecting
        // elements for testing. You may or may not have to use them in your tests.
        cy.get('[data-testid="home-page"]')
    })
})
