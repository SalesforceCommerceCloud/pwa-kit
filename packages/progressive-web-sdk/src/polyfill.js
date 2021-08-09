/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {polyfill as promisePolyfill} from 'es6-promise'

/* eslint-disable no-extend-native */

const stringIncludesPolyfill = () => {
    if (String.prototype.includes) {
        return
    }

    String.prototype.includes = function(search, start) {
        if (typeof start !== 'number') {
            start = 0
        }

        if (start + search.length > this.length) {
            return false
        } else {
            return this.indexOf(search, start) !== -1
        }
    }
}

const stringStartsWithPolyfill = () => {
    if (String.prototype.startsWith) {
        return
    }

    String.prototype.startsWith = function(searchString, position) {
        position = position || 0
        return this.substr(position, searchString.length) === searchString
    }
}

const polyfill = () => {
    promisePolyfill()

    stringIncludesPolyfill()
    stringStartsWithPolyfill()
}

export default polyfill
