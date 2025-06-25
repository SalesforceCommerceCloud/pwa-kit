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
 *
 * Previously, we hard coded the public path in our webpack config to '/mobify/bundle/development/'
 * but we need something more dynamic to support namespaced /mobify paths.
 */

import {bundleBasePath} from '@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths'

/* global __webpack_public_path__: writable */
__webpack_public_path__ = `${bundleBasePath}/development/`
