/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-disable react/prop-types */

import {shallow, mount} from 'enzyme'
import React from 'react'

import NavItem from '../nav-item'
import NavMenu from './index.jsx'
import NonExpandedItems from './non-expanded-items'

// Mock `requestAnimationFrame` for tests run using jsDOM
global.requestAnimationFrame =
    global.window.requestAnimationFrame ||
    function(fn) {
        return setTimeout(fn, 0)
    }

const noop = () => null

/**
 * Alternative renderer for a NavItem - makes tests less brittle
 */
const SimpleButton = (props) => {
    const {title, selected} = props
    const className = selected ? 'selected' : null
    return <button className={className}>{title}</button>
}

const itemFactory = (type, props) => {
    return <SimpleButton {...props} />
}

describe('An empty NavMenu', () => {
    const root = {title: 'root', path: '/'}
    const context = {selected: root, root, expanded: root, expandedPath: root.path, goToPath: noop}

    test('renders without errors', () => {
        const wrapper = shallow(<NavMenu />, {context})
        expect(wrapper.html()).toBe(
            '<div class="pw-nav-menu">' +
                '<div class="pw-nav-slider pw-nav-menu__slider">' +
                '<div class="pw-nav-menu__panel"></div>' +
                '</div>' +
                '<div class="pw-nav-menu__non-expanded-items u-visually-hidden" aria-hidden="true"></div>' +
                '</div>'
        )
    })

    test('renders the contents of the className prop if present', () => {
        const name = 'name'
        const wrapper = shallow(<NavMenu className={name} />, {context})
        expect(wrapper.html()).toBe(
            '<div class="pw-nav-menu name">' +
                '<div class="pw-nav-slider pw-nav-menu__slider">' +
                '<div class="pw-nav-menu__panel"></div>' +
                '</div>' +
                '<div class="pw-nav-menu__non-expanded-items u-visually-hidden" aria-hidden="true"></div>' +
                '</div>'
        )
    })
})

describe('A NavMenu with an expanded NavItem', () => {
    const c1 = {title: '1', path: '/1/', key: '1'}
    const c2 = {title: '2', path: '/2/', key: '2'}
    const root = {title: 'root', path: '/', children: [c1, c2]}
    const context = {selected: c2, root, expanded: root, expandedPath: root.path, goToPath: noop}

    test('renders the children of the expanded NavItem', () => {
        const wrapper = shallow(<NavMenu itemFactory={itemFactory} />, {context})
        const expected =
            '<div class="pw-nav-menu">' +
            '<div class="pw-nav-slider pw-nav-menu__slider">' +
            '<div class="pw-nav-menu__panel">' +
            '<button>1</button>' +
            '<button class="selected">2</button>' +
            '</div>' +
            '</div>' +
            '<div class="pw-nav-menu__non-expanded-items u-visually-hidden" aria-hidden="true"></div>' +
            '</div>'
        expect(wrapper.html()).toBe(expected)
    })

    test('renders NavItems by default', () => {
        const wrapper = shallow(<NavMenu />, {context})

        expect(wrapper.find(NavItem).length).toBe(2)
    })
})

describe('A NavMenu with NonExpandedItems', () => {
    const c1 = {
        title: '1',
        path: '/1/',
        key: '1',
        children: [{title: '3', path: '/1/3', key: '3'}, {title: '4', path: '/1/4', key: '4'}]
    }
    const c2 = {
        title: '2',
        path: '/2/',
        key: '2',
        children: [
            {title: '5', path: '/2/5', key: '5'},
            {title: '6', path: '/2/6', key: '6', children: [{title: '7', path: '/2/6/7', key: '7'}]}
        ]
    }
    const root = {title: 'root', path: '/', children: [c1, c2]}
    const context = {selected: c2, root, expanded: root, expandedPath: root.path, goToPath: noop}

    const nonExpandedItemsProps = {
        root,
        expanded: root,
        selected: c2,
        getRealPath: (path) => path
    }

    test('renders a simplified, hidden version of non-expanded nav items', () => {
        const wrapper = mount(<NavMenu />, {context})

        const nonExpandedItemsWrapper = wrapper.find(NonExpandedItems)
        expect(nonExpandedItemsWrapper.length).toBe(1)

        // The currently expanded menu shows root, 1 and 2
        // So the non-expanded items are the children of 1
        const links = nonExpandedItemsWrapper.find('a')
        expect(links.length).toBe(5)
    })

    test('if prerender is false, non-expanded nav items are not rendered', () => {
        const wrapper = shallow(<NavMenu prerender={false} />, {context})

        expect(wrapper.find(NonExpandedItems).length).toBe(0)
    })

    test('NavMenu enables rerendering of non expanded items when animation is complete', () => {
        const wrapper = mount(<NavMenu />, {context})
        const sliderWrapper = wrapper.find('NavSlider')

        const instance = wrapper.instance()
        const setState = jest.fn()
        instance.setState = setState

        // In this case, we don't want to have this happen async
        window.requestAnimationFrame = (fn) => fn()

        sliderWrapper.prop('onEnterComplete')()

        expect(setState).toBeCalled()
        expect(setState.mock.calls[0][0]).toEqual({rerenderNonExpandedItems: true})

        window.requestAnimationFrame = global.window.requestAnimationFrame
    })

    test('NavMenu disables rerendering of non expanded items after they have rendered', () => {
        const wrapper = mount(<NavMenu animationProperties={{duration: 0}} />, {context})
        const nonExpandedItemsWrapper = wrapper.find(NonExpandedItems)

        const instance = wrapper.instance()
        const setState = jest.fn()
        instance.setState = setState

        // In this case, we don't want to have this happen async
        window.requestAnimationFrame = (fn) => fn()

        nonExpandedItemsWrapper.prop('onRenderComplete')()

        expect(setState).toBeCalled()
        expect(setState.mock.calls[0][0]).toEqual({rerenderNonExpandedItems: false})

        window.requestAnimationFrame = global.window.requestAnimationFrame
    })

    test('NonExpandedItems calls onRenderComplete after updating', () => {
        const onRenderComplete = jest.fn()
        const wrapper = mount(
            <NonExpandedItems
                {...nonExpandedItemsProps}
                allowRerender
                onRenderComplete={onRenderComplete}
            />
        )

        wrapper.instance().componentDidUpdate()
        expect(onRenderComplete).toBeCalled()
    })

    test('Empty NonExpandedItems renders without errors', () => {
        const wrapper = shallow(<NonExpandedItems />)

        expect(wrapper.length).toBe(1)
    })

    test('NonExpandedItems should not update if allowRerender is false', () => {
        const wrapper = shallow(<NonExpandedItems />)
        const shouldUpdate = !!wrapper.instance().shouldComponentUpdate({})

        expect(shouldUpdate).toBe(false)
    })

    test('NonExpandedItems should update if allowRerender is true', () => {
        const wrapper = shallow(<NonExpandedItems />)
        const shouldUpdate = !!wrapper.instance().shouldComponentUpdate({
            allowRerender: true
        })

        expect(shouldUpdate).toBe(true)
    })
})
