/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import MobifyDebugger from './mobify-debugger'

test('MobifyDebugger is available', () => {
    expect(MobifyDebugger).toBeDefined()
})

test('MobifyDebugger exposes a log function', () => {
    expect(typeof MobifyDebugger.log).toBe('function')
})
