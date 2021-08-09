/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/**
 * Thin wrapper around store.js module that wraps local storage access
 *
 * @url https://github.com/marcuswestin/store.js/
 */
import engine from 'store/src/store-engine'
import localStorage from 'store/storages/localStorage'
import memoryStorage from 'store/storages/memoryStorage' // Fallback for crazy environments like Safari Incognito
import expirePlugin from 'store/plugins/expire'

import Logger from '../../utils/logger'
const logger = new Logger('[Messaging UI]')

let _storageInstance
/**
 * Create StoreJS instance with the provided optional namespace
 *
 * @param {string} [namespace] - prefix key name with provided string value
 */
const PushMessagingStore = function(namespace) {
    this.namespace = namespace ? `${namespace}-` : ''

    this.store =
        _storageInstance ||
        (_storageInstance = engine.createStore([localStorage, memoryStorage], [expirePlugin]))

    logger.log('Storage wrapper created', this.namespace ? `with namespace: ${namespace}` : '')
    return this
}

/**
 * Sets a key in local storage
 *
 * @param {string} key
 * @param {*} value
 * @param {number} [expiry] - expiration of key *in seconds* after current time
 * @returns {*} value
 */
PushMessagingStore.prototype.set = function(key, value, expiry) {
    key = `${this.namespace}${key}`
    let expires

    if (expiry) {
        expires = new Date().getTime() + expiry * 1000
    }

    logger.log(`Set ${key} to:`, value)
    return this.store.set(key, value, expires)
}

/**
 * Gets a get from local storage
 *
 * @param {string} key
 * @returns {*} the value of whatever is stored under `key`
 */
PushMessagingStore.prototype.get = function(key) {
    key = `${this.namespace}${key}`
    const value = this.store.get(key)

    if (value) {
        logger.log(`Got ${key} with value:`, value)
        return value
    } else {
        return null
    }
}

export default PushMessagingStore
