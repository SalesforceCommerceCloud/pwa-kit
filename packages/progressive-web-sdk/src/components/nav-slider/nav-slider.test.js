/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {shallow} from 'enzyme'
import React from 'react'

import NavSlider from './index.jsx'

// Mock `requestAnimationFrame` for tests run using jsDOM
global.requestAnimationFrame =
    global.window.requestAnimationFrame ||
    function(fn) {
        return setTimeout(fn, 0)
    }

test('NavSlider renders without errors', () => {
    const wrapper = shallow(
        <NavSlider>
            <h1>content</h1>
        </NavSlider>
    )
    expect(wrapper.html()).toBe('<div class="pw-nav-slider"><h1>content</h1></div>')
})

test('renders the contents of the className prop if present', () => {
    const name = 'name'
    const wrapper = shallow(
        <NavSlider className={name}>
            <h1>content</h1>
        </NavSlider>
    )
    expect(wrapper.html()).toBe('<div class="pw-nav-slider name"><h1>content</h1></div>')
})

test('animates on enter', () => {
    return Promise.all(
        ['descending', 'ascending'].map((action) => {
            let resolvePromise
            const promise = new Promise((resolve) => {
                resolvePromise = resolve
            })

            const wrapper = shallow(<NavSlider onEnterComplete={resolvePromise} />, {
                context: {action}
            })
            expect(wrapper.state().style).toEqual({})

            wrapper.instance().componentWillEnter()
            return promise.then(() => {
                const expected = {
                    WebkitTransform: 'translate(0, 0)',
                    msTransform: 'translate(0, 0)',
                    WebkitTransition: '-webkit-transform 0.5s ease-out,transform 0.5s ease-out',
                    transform: 'translate(0, 0)',
                    transition:
                        '-ms-transform 0.5s ease-out,-webkit-transform 0.5s ease-out,transform 0.5s ease-out',
                    width: '100%',
                    position: 'absolute'
                }
                expect(wrapper.state().style).toEqual(expected)
            })
        })
    )
})

test('animates on leave', () => {
    return Promise.all(
        ['descending', 'ascending'].map((action) => {
            let resolvePromise
            const promise = new Promise((resolve) => {
                resolvePromise = resolve
            })

            const wrapper = shallow(<NavSlider onLeaveComplete={resolvePromise} />, {
                context: {action}
            })
            expect(wrapper.state().style).toEqual({})

            wrapper.instance().componentWillLeave()
            return promise.then(() => {
                const direction = `${action === 'descending' ? '-' : ''}100%`
                const expected = {
                    WebkitTransform: `translate(${direction}, 0)`,
                    msTransform: `translate(${direction}, 0)`,
                    WebkitTransition: '-webkit-transform 0.5s ease-out,transform 0.5s ease-out',
                    transform: `translate(${direction}, 0)`,
                    transition:
                        '-ms-transform 0.5s ease-out,-webkit-transform 0.5s ease-out,transform 0.5s ease-out',
                    width: '100%',
                    position: 'absolute'
                }
                expect(wrapper.state().style).toEqual(expected)
            })
        })
    )
})
