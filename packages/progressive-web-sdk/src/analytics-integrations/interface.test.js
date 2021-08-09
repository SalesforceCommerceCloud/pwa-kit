/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {AnalyticsConnector} from './interface'

describe('Interface', () => {
    test('load() should not have implementation', () => {
        const instance = new AnalyticsConnector()

        expect.assertions(1)

        return instance.load().catch((e) => {
            expect(e).toBe('Not implemented')
        })
    })

    test('track() should not have implementation', () => {
        const instance = new AnalyticsConnector()

        expect(() => instance.track()).toThrow(new Error('Not implemented'))
    })
})
