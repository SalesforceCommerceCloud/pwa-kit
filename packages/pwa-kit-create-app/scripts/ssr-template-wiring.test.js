/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Guards the first-touch `dw_attribution` middleware wiring in the create-app SSR
 * templates (W-23493129).
 *
 * `create-mobify-app.js` copies the base retail-react-app package and then overlays
 * these template-specific `ssr.js.hbs` files, so a generated project's `app/ssr.js`
 * comes from the overlay — not from `template-retail-react-app/app/ssr.js`. If the
 * overlay does not mount the middleware, `attribution-utils.js` ships in the generated
 * project but is dead code and no cookie is ever written. This test fails if either
 * template drifts back to a bare `app.get('*', runtime.render)`.
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs')
const path = require('path')

const ASSETS = path.join(__dirname, '..', 'assets')

// Both SSR templates the generator can emit. Each imports the middleware factory from a
// different specifier: the full-source retail-react-app template uses a relative path,
// the bootstrap "extend" overlay imports from the installed package.
const TEMPLATES = [
    {
        name: 'templates/@salesforce/retail-react-app',
        file: path.join(ASSETS, 'templates/@salesforce/retail-react-app/app/ssr.js.hbs'),
        importPath: './utils/attribution-utils.js'
    },
    {
        name: 'bootstrap/js/overrides',
        file: path.join(ASSETS, 'bootstrap/js/overrides/app/ssr.js.hbs'),
        importPath: '@salesforce/retail-react-app/app/utils/attribution-utils.js'
    }
]

describe.each(TEMPLATES)('dw_attribution SSR wiring: $name', ({file, importPath}) => {
    const source = fs.readFileSync(file, 'utf8')

    test('imports the attribution middleware factory', () => {
        expect(source).toContain(`import {createAttributionCookieMiddleware} from '${importPath}'`)
    })

    test('constructs the middleware with the configured cookieDomain', () => {
        expect(source).toContain('createAttributionCookieMiddleware({')
        expect(source).toContain('cookieDomain: config?.app?.commerceAPI?.cookieDomain')
    })

    test('mounts the middleware on the catch-all render route', () => {
        expect(source).toContain("app.get('*', attributionCookieMiddleware, runtime.render)")
        // The bare route must be gone, or the overlay would replace the live app's
        // wired route with an unwired one.
        expect(source).not.toContain("app.get('*', runtime.render)")
    })
})
