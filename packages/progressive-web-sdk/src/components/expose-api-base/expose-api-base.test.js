/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount} from 'enzyme'
import React from 'react'

import ExposeApiBase from './index'

class ExposeApi extends ExposeApiBase {
    buildProgressiveApi() {
        return {
            ...super.buildProgressiveApi(),
            test: () => {
                console.log('test')
            }
        }
    }
}

describe('ExposeApiBase', () => {
    afterEach(() => {
        window.Progressive = null
    })

    test('navigate is exposed to the window scope', () => {
        mount(<ExposeApiBase />)

        expect(window.Progressive.api).toBeDefined()
        expect(window.Progressive.api.navigate).toBeDefined()
    })

    test('ExposeApiBase is extendable', () => {
        mount(<ExposeApi />)

        expect(window.Progressive.api).toBeDefined()
        expect(window.Progressive.api.navigate).toBeDefined()
        expect(window.Progressive.api.test).toBeDefined()
    })

    test("doesn't error if mounted twice", () => {
        expect(() => {
            mount(
                <div>
                    <ExposeApi />
                    <ExposeApi />
                </div>
            )
        }).not.toThrow()
    })
})
