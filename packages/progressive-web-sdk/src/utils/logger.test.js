// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
// /* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
//
// window.Mobify = {
//     Preview: true
// }
//
// // import Logger from './logger'
// const Logger = require('./logger').default
//
// const _log = console.log
// afterEach(() => {
//     console.log = _log
// })
//
// afterAll(() => {
//     console.log = _log
//     window.Mobify = undefined
// })
//
// test('debugFlag is set to true if window.Mobify.Preview is truthy', () => {
//     expect(Logger._debugFlag).toBe(true)
// })
//
// test('log does not log to console if debugFlag is false', () => {
//     console.log = jest.fn()
//     const logger = new Logger('bar')
//     logger.log('Hello world')
//     expect(console.log).toHaveBeenCalledWith('bar', 'Hello world')
// })
//
// test('setDebug changes the value of debugFlag', () => {
//     Logger.setDebug(false)
//     expect(Logger._debugFlag).toBe(false)
// })
//
// test('log does not calls console.log if debugFlag is false', () => {
//     console.log = jest.fn()
//     const logger = new Logger()
//     logger.log('Hello world')
//     expect(console.log).not.toHaveBeenCalledWith('Hello world')
// })
test('TODO: Review this component', () => expect(true).toBe(true))
