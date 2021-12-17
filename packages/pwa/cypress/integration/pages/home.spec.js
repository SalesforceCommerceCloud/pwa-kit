/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

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

    it('Validate HTTP security headers', () => {
        const url = Cypress.config('baseUrl') + '/'
        cy.intercept('/', (req) => {
            if (req.url === url) {
                return req.reply((res) => {
                    expect(res.headers).to.have.property('content-security-policy')
                    // TODO: Uncomment these assertions when we remove unsafe-eval
                    //expect(res.headers['content-security-policy']).not.to.include('unsafe-inline')
                    //expect(res.headers['content-security-policy']).not.to.include('unsafe-eval')
                    expect(res.headers).to.have.property('expect-ct')
                    expect(res.headers['expect-ct']).to.equal('max-age=0')
                    expect(res.headers).to.have.property('referrer-policy')
                    expect(res.headers['referrer-policy']).to.equal('no-referrer')
                    expect(res.headers).to.have.property('strict-transport-security')
                    expect(res.headers).to.have.property('x-content-type-options')
                    expect(res.headers['x-content-type-options']).to.equal('nosniff')
                    expect(res.headers).to.have.property('x-dns-prefetch-control')
                    expect(res.headers['x-dns-prefetch-control']).to.equal('off')
                    expect(res.headers).to.have.property('x-download-options')
                    expect(res.headers['x-download-options']).to.equal('noopen')
                    expect(res.headers).to.have.property('x-frame-options')
                    expect(res.headers['x-frame-options']).to.equal('SAMEORIGIN')
                    expect(res.headers).to.have.property('x-permitted-cross-domain-policies')
                    expect(res.headers['x-permitted-cross-domain-policies']).to.equal('none')
                    expect(res.headers).to.have.property('x-xss-protection')
                    expect(res.headers['x-xss-protection']).to.equal('0')
                })
            }
        })
        cy.visit('/')
    })
})
