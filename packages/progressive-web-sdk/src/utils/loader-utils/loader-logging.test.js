/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {loaderLog, setLoaderDebug} from './loader-logging'

afterAll(() => {
    // Reset Loader debug to false (the default)
    setLoaderDebug(false)
})

test('loaderlog outputs nothing if debug is set to false', () => {
    console.log = jest.fn()
    loaderLog('test')

    expect(console.log).not.toHaveBeenCalled()
})

test('loaderlog outputs message if debug is set to true', () => {
    const logMsg = 'test message'
    console.log = jest.fn()
    setLoaderDebug(true)
    loaderLog(logMsg)

    expect(console.log).toHaveBeenCalledWith('[Loader]', logMsg)
})
