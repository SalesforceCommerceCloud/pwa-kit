/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

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
