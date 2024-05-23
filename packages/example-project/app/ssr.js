/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from 'path'
import {getRuntime} from '@salesforce/pwa-kit-runtime/ssr/server/express'
import pkg from '../package.json'
import customizeApp from './customize-app'

const options = {
    // The build directory (an absolute path)
    buildDir: path.resolve(process.cwd(), 'build'),

    // The cache time for SSR'd pages (defaults to 600 seconds)
    defaultCacheTimeSeconds: 600,

    // The port that the local dev server listens on
    port: 3000,

    // The protocol on which the development Express app listens.
    // Note that http://localhost is treated as a secure context for development,
    // except by Safari.
    protocol: 'http',

    mobify: pkg.mobify
}


// QUESTION! Aside from the "options", why do we want to have this code in user-space? Can
// it not live in the proper SDK lib?

const runtime = getRuntime()

const {handler} = runtime.createHandler(options, (app) => customizeApp({app, runtime}))

// SSR requires that we export a single handler function called 'get', that
// supports AWS use of the server that we created above.
export const get = handler
