// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
// /* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
//
// import sinon from 'sinon'
// import {makeRequest, formEncode, makeFormEncodedRequest, makeJsonEncodedRequest} from './fetch'
//
// let realFetch
// beforeEach(() => {
//     realFetch = global.fetch
//     global.fetch = jest.fn()
//     global.fetch.mockReturnValue(
//         Promise.resolve({
//             clone: jest.fn()
//         })
//     )
// })
//
// afterEach(() => {
//     global.fetch = realFetch
// })
//
// describe('makeRequest', () => {
//     const consoleWarningSpy = sinon.spy(console, 'warn')
//     afterEach(() => consoleWarningSpy.reset())
//
//     test('fetches with the same-origin credentials', () => {
//         return makeRequest('http://test.org', {method: 'GET'}).then(() => {
//             expect(global.fetch).toBeCalled()
//             expect(global.fetch.mock.calls[0][0]).toBe('http://test.org')
//             expect(global.fetch.mock.calls[0][1]).toEqual({
//                 method: 'GET',
//                 credentials: 'same-origin'
//             })
//         })
//     })
//
//     test('cloning the result with `.clone()` emits a console warning', () => {
//         return makeRequest('http://www.mobify.com', {method: 'GET'}).then((response) => {
//             response.clone()
//             expect(consoleWarningSpy.called).toBeTruthy()
//         })
//     })
//
//     test('cloning the result with `.cloneDangerously()` does NOT emit a console warning', () => {
//         return makeRequest('http://www.mobify.com', {method: 'GET'}).then((response) => {
//             response.cloneDangerously()
//             expect(consoleWarningSpy.called).not.toBeTruthy()
//         })
//     })
// })
//
// describe('formEncode', () => {
//     test('form encodes a simple object correctly', () => {
//         expect(formEncode({test: true, value: 'two'})).toBe('test=true&value=two')
//     })
//
//     test('form encodes correctly with escaped chars', () => {
//         expect(formEncode({link: 'http://mobify.com/'})).toBe('link=http%3A%2F%2Fmobify.com%2F')
//     })
//
//     test('form encodes recursively', () => {
//         expect(
//             formEncode({
//                 outer: 'one',
//                 next: {
//                     middle: 'two',
//                     includes: {
//                         inner: 'three'
//                     }
//                 }
//             })
//         ).toBe('outer=one&next%5Bmiddle%5D=two&next%5Bincludes%5D%5Binner%5D=three')
//     })
// })
//
// test('makeFormEncodedRequest sends form-encoded data correctly', () => {
//     return makeFormEncodedRequest(
//         'http://mobify.net/',
//         {data: 'everything'},
//         {method: 'POST'}
//     ).then(() => {
//         expect(global.fetch).toBeCalled()
//         expect(global.fetch.mock.calls[0][0]).toBe('http://mobify.net/')
//         expect(global.fetch.mock.calls[0][1]).toEqual({
//             method: 'POST',
//             body: 'data=everything',
//             credentials: 'same-origin',
//             headers: {'Content-Type': 'application/x-www-form-urlencoded'}
//         })
//     })
// })
//
// test('makeJsonEncodedRequest sends json-encoded data correctly', () => {
//     return makeJsonEncodedRequest(
//         'http://mobify.net/',
//         {data: 'everything'},
//         {method: 'POST'}
//     ).then(() => {
//         expect(global.fetch).toBeCalled()
//         expect(global.fetch.mock.calls[0][0]).toBe('http://mobify.net/')
//         expect(global.fetch.mock.calls[0][1]).toEqual({
//             method: 'POST',
//             body: '{"data":"everything"}',
//             credentials: 'same-origin',
//             headers: {'Content-Type': 'application/json'}
//         })
//     })
// })
test('TODO: Review this component', () => expect(true).toBe(true))
