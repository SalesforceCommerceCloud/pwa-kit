/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

global.document = require('jsdom').jsdom('<body></body>')
global.window = document.defaultView
global.window.matchMedia =
    global.window.matchMedia ||
    function() {
        return {
            matches: false,
            addListener: () => {},
            removeListener: () => {}
        }
    }
global.navigator = window.navigator
