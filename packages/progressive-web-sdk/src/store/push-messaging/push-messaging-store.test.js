/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Store from './push-messaging-store'

afterEach(() => {
    localStorage.clear()
})

test('creating a Store with a namespace prefixes key names when set in local storage', () => {
    const namespace = 'test-namespace'
    const key = 'foo'

    const store = new Store(namespace)
    store.set(key, 'bar')

    expect(localStorage.__STORE__[`${namespace}-${key}`]).toEqual(JSON.stringify('bar'))
})

test('creating a store without namespace does not prefix key names when set in local storage', () => {
    const key = 'foo'
    const value = 'bar'

    const store = new Store()
    store.set('foo', 'bar')

    expect(localStorage.__STORE__[key]).toEqual(JSON.stringify(value))
})

test('creating multiple PushMessagingStore instances re-use the same local storage instance', () => {
    const store1 = new Store()
    const store2 = new Store()

    expect(store1.store).toBe(store2.store)
})

test('get method returns the value of the requested key from local storage', () => {
    const key = 'foo'
    const value = 'bar'
    const store = new Store()

    store.set(key, value)

    expect(store.get(key)).toEqual(value)
})

test('when an expiry is set, getting from local storage will return null', (done) => {
    const store = new Store()

    store.set('foo', 'bar', 0.01) // 10ms expiry, to give us time to access storage
    expect(store.get('foo')).toEqual('bar')

    // Wait for 30ms to allow expiry to occur
    setTimeout(() => {
        expect(store.get('foo')).toBeNull()
        done()
    }, 30)
})
