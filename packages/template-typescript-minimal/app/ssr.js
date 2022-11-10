/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const path = require('path')
const {getRuntime} = require('pwa-kit-runtime/ssr/server/express')
const pkg = require('../package.json')
const jwt = require('jsonwebtoken')

const key = `-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEAv0CzPgQpIoqOjZaysOBZQHF0r8YId7KeEZFM/fkeY2ATrAzZ0xyEXlBPce77Dnzfsi2kzzSrw6ejVN4yCPS/g1cIXsHvkm6EoFdnAxtirdnHfyY1HwvSzxmZZCu2vWpamL+XdxxwceguM1kVi2/2mc3WdhQ4LqZQbznmP4lFE+pFPpebjIujsgatXYF962WdlI+tM4dBr492oy+dxtsulr2VIOiXT/6KSHrNJieOy+xxrWjTqHi/0eYQzo/RXdB+CpdMLBf1Yrcm9iGLNizknYAEYNy1BncYjkM+Zj354ZYvkzX427UyXbA5fhO3Gab5Rc0hB9dVZHNeij+W+eS+9wIDAQABAoIBAFQlwHeB1yN2eSA89OQz4bEj+iY4aJNZyIiMOKbqC//HTwB9Kv3i5y6kAUBs2JNYSAgaYxAz6XsNcCSwGq2sGfNMwMcIZ0MzUzFFI3LPgsxhLJB6HBdL2XX7mmzjeuS+PZxFd/wVTDgh4un+wSb3nTWwxjJv1QRZcrxtaiv8VqNaxhMOWEHrMzxdn02bQLOU70zIKH11cokOxieHD3n9dlq9XDQdXSKOC4Q3DTEygKKj0IBbYx9bmme0eR3G4JXupj0ymXo2CALjhCJ5c4Nywc/Wq8Jgs8tb86uYOgFCqX9mdY4T2e6Qb+USNLj//VvaNflbDKnkTVre2gnhMDVvd8ECgYEA6kUOeJUMTvQvAvyoKLitnkDGFZdrTb7Ir3gDi+D46sEtJeRtzhA/BvfQlYyv8KaZHUVV60NU4K0diTlEAeigYJwUGQY5qcdkHQqcNQOQu3aQWucGiZUpu03hDghptKT1a041WL5sSINLZ3h/sxb3TVYgVRkF1TpsAGebV2E6b+ECgYEA0P4qlQDuRTe2n8soxXRLrT4u2DONZ/tP4W+uupceLiJl1oCIuz12/vnQdd5GdhGctLk4flAcP1pYkcpwxEXmrsR9THqUInUbvKLgAkPZT4/1timMP8XcBrPzYES3S2OIPupsqbeAxTn3NpUKvUMnZzk9HCWkE/3rqPQVNCWd6dcCgYA94GuIEeYkXH6mTVGlH9JLwFQRk+L1r/SV1B8rrQpSByADqCgQi136Wy4usfAuofJDNvMQpsIebdslSYja8DScD92HFovYeh/JQ+oqXny15wUN3YNuh4V0QYe2CybQXdmstAWHIRS8umEKPVuNU/2R4bO8hlVyEnJAUR1IoResQQKBgHLA7H6uaSZmhgdNlRB+X8M7XptmCyHqMx1Upntb2L16M7LJFsrA4CL25oihyMyxtPrirOtmb2w13mYG405SF20lBKvGrqoQ5W75e8iimqL+J+ui+phVuw+PJXZZpM9nUntBWvMBiFpDDsPQqHntcqhSHITlAifcB9bYVwAwG3o3AoGAdZit8Bp1TfCibqyt9cNIkWhDj6j5z+Mz3QWaal7rl3MF1YrWwJbsCYqWhxPQOOpvxJ7fEAWnK0akXFUh59xbWfaAY5BuxZRSWWCfI5zaUYB16+QAvZZK1gEq11aerAHCMc656Khiu5tcsda3TYvwFcfGCh52J+Z2eURuq5V0jnE=
-----END RSA PRIVATE KEY-----`
const options = {
    // The build directory (an absolute path)
    buildDir: path.resolve(process.cwd(), 'build'),

    // The cache time for SSR'd pages (defaults to 600 seconds)
    defaultCacheTimeSeconds: 600,

    // The port that the local dev server listens on
    port: 3000,

    // The protocol on which the development Express app listens.
    // Note that http://localhost is treated as a secure context for development.
    protocol: 'http',

    mobify: pkg.mobify
}

const runtime = getRuntime()

const {handler} = runtime.createHandler(options, (app) => {
    // Handle the redirect from SLAS as to avoid error
    app.get('/callback?*', (req, res) => {
        res.send()
    })

    app.get('/jwt', (req, res) => {
        const token = jwt.sign(
            {
                iss:
                    '3MVG9sA57VMGPDfccCqclI6RJtAtX8wWWhlw31HVV7dAXKQrDd03vlapy1jQNtNJxdr_7VimdE1yefXDvrv2o',
                sub: 'tofu.f55bbc525d@salesforce.com',
                aud: 'https://dro000000bdrl2ao.test1.my.pc-rnd.salesforce.com',
                exp: Math.floor(Date.now() / 1000) + 60 * 60
            },
            key,
            {header: {typ: undefined}, algorithm: 'RS256'}
        )

        console.log('token=======================', token)
        res.send(token)
    })

    app.get('/favicon.ico', runtime.serveStaticFile('static/favicon.ico'))

    app.get('*', runtime.render)
})

// SSR requires that we export a single handler function called 'get', that
// supports AWS use of the server that we created above.
exports.get = handler
