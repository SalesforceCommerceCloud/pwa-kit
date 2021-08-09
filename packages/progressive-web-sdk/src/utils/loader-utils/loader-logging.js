/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

let loaderDebug = false

export const loaderLog = (...args) => {
    if (loaderDebug) {
        console.log('[Loader]', ...args)
    }
}

export const setLoaderDebug = (debug) => {
    loaderDebug = debug
}
