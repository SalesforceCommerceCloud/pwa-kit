/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * This file is used to dynamically set the webpack public path used by HMR via the global webpack variable
 * __webpack_public_path__
 * See https://webpack.js.org/guides/public-path/
 */

/* global __webpack_public_path__: writable */

/**
 * TODO - __webpack_public_path__ must be the first thing set on client side local environments
 * for HMR to work!
 * However, when this value needs to be set, window.__config__ is not yet hydrated so we
 * do not have access to the base path
 *
 * Resolve this to allow the local development server to use namespaces.
 *
 * import {getBundlePath} from '@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths'
 * const getPublicPath = () => `${getBundlePath()}/development/`
 * console.log(getPublicPath())
 *
 * __webpack_public_path__ = getPublicPath()
 */

// Setting this so that *.hot-update.json requests are resolving
__webpack_public_path__ = '/mobify/bundle/development'
