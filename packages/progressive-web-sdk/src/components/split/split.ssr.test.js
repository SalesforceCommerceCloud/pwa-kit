/**
 * @jest-environment node
 */

/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import React from 'react'
import {render} from 'enzyme'
import Split from './index'

describe('Split on SSR', () => {
    test('Does not render children when showOnVariant is specified', () => {
        let wrapper = render(
            <Split className="outer" splitCookieName="cookie1" showOnVariant="A">
                <div className="child1">Child1</div>
                <div className="child2">Child2</div>
            </Split>
        )

        expect(wrapper.html()).toBeNull()
    })

    test('Renders children when showOnVariant is null', () => {
        let wrapper = render(
            <Split className="outer" splitCookieName="cookie1" showOnVariant="null">
                <div className="child1">Child1</div>
                <div className="child2">Child2</div>
            </Split>
        )

        expect(wrapper.html()).toEqual(
            `<div class="child1">Child1</div><div class="child2">Child2</div>`
        )
    })
})
