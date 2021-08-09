/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {pages, PAGEEVENTS} from './events'

describe('Page Events', () => {
    beforeEach(() => {})
    test('emit and receive a PAGELOAD Page Event', () => {
        expect.assertions(1)

        return new Promise((resolve) => {
            pages.on(PAGEEVENTS.PAGELOAD, (evt) => {
                expect(JSON.stringify(evt)).toEqual(
                    JSON.stringify({
                        templateName: 'blah',
                        start: 123,
                        end: 456
                    })
                )
                return resolve()
            })

            pages.pageLoad('blah', 123, 456)
        })
    })
    test('emit and receive a ERROR Page Event', () => {
        expect.assertions(1)

        return new Promise((resolve) => {
            pages.on(PAGEEVENTS.ERROR, (evt) => {
                expect(JSON.stringify(evt)).toEqual(
                    JSON.stringify({
                        name: 'blah',
                        content: 'more blah'
                    })
                )
                return resolve()
            })

            pages.error('blah', 'more blah')
        })
    })
})
