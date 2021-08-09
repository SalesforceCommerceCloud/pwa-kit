/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
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
