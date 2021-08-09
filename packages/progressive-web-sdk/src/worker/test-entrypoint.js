/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/*
 This is the entrypoint for the service worker when running under tests.
 */

// When run in a test environment, self.location.toString isn't implemented
// (defaults to Object.toString) - we fix that up here so that sw-toolbox can
// initialize.
const sl = self.location
if (!sl.hasOwnProperty('toString')) {
    sl.toString = function() {
        return this.href
    }
}

// We require main rather than import it because imports are hoisted,
// and we need to perform the fixups above before module code
// executes.
const worker = require('./main').default

// If you're fixing up tests, you may want to pass isDebug: true
// to get more console logging.
worker({slug: 'test', isDebug: false})
