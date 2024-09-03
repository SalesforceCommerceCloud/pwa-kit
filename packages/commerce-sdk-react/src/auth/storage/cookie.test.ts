/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import Cookies from 'js-cookie'
import {CookieStorage} from './cookie'

jest.mock('js-cookie', () => ({
    set: jest.fn(),
    get: jest.fn(),
    remove: jest.fn()
}))

describe('CookieStorage', () => {
    let storage: CookieStorage
    const fixedTime = new Date('2024-09-03T21:00:00Z').getTime()
    let originalDateNow: () => number

    beforeAll(() => {
        originalDateNow = Date.now
    })

    beforeEach(() => {
        jest.spyOn(Date, 'now').mockImplementation(() => fixedTime)
        storage = new CookieStorage()
        jest.clearAllMocks()
    })

    afterEach(() => {
        jest.spyOn(Date, 'now').mockImplementation(originalDateNow)
    })

    it('should convert seconds to a Date and set cookie expiration correctly', () => {
        const key = 'testKey'
        const value = 'testValue'
        const expiresInSeconds = 3600 // 1 hour in seconds
        const expectedDate = new Date(fixedTime + expiresInSeconds * 1000)

        storage.set(key, value, {expires: expiresInSeconds})

        const cookieOptions = (Cookies.set as jest.Mock).mock.calls[0][2]

        expect(cookieOptions.expires).toBeInstanceOf(Date)
        expect(cookieOptions.expires.getTime()).toBe(expectedDate.getTime())
    })

    it('should use the provided Date object as is', () => {
        const key = 'testKey'
        const value = 'testValue'
        const expirationDate = new Date(fixedTime + 3600 * 1000) // 1 hour from now

        storage.set(key, value, {expires: expirationDate})

        const cookieOptions = (Cookies.set as jest.Mock).mock.calls[0][2]

        expect(cookieOptions.expires).toBeInstanceOf(Date)
        expect(cookieOptions.expires.getTime()).toBe(expirationDate.getTime())
    })

    it('should not modify expiration for undefined expires', () => {
        const key = 'testKey'
        const value = 'testValue'

        storage.set(key, value)

        const cookieOptions = (Cookies.set as jest.Mock).mock.calls[0][2]

        expect(cookieOptions.expires).toBeUndefined()
    })
})
