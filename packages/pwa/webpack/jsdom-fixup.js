/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
'use strict'
/* eslint-env node */

/*
 * A custom loader to fixup an issue in jsdom
 */

// eslint-disable-next-line import/no-commonjs
module.exports = function(source) {
    return source.replace(
        // match require.resolve used in a query expression...
        /require\.resolve\s*\?/,
        // ...replace with a falsy constant so that the expression
        // always returns the false result.
        '0 ?'
    )
}
