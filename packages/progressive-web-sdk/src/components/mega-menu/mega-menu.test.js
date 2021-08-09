/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-disable react/prop-types */

import {shallow, mount} from 'enzyme'
import React from 'react'

import ListTilePrimary from '../list-tile/partials/list-tile-primary'
import MegaMenuItem from '../mega-menu-item'
import MegaMenu from './index.jsx'

import {keyMap} from '../../a11y-utils'

// Mock `requestAnimationFrame` for tests run using jsDOM
global.requestAnimationFrame =
    global.window.requestAnimationFrame ||
    function(fn) {
        return setTimeout(fn, 0)
    }

const noop = () => null
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const randomKey = (() => {
    let keys = {...keyMap}

    // Get rid of keys we know DO things in the MegaMenu. We're only testing
    // keys that we know do nothing.
    delete keys.left
    delete keys.right
    delete keys.tab

    // Convert key/values into just a list of the keys
    keys = Object.keys(keys)

    // Pick a random key from the keys list, and return its value
    const key = keys[getRandomInt(0, keys.length - 1)]
    return keyMap[key]
})()

const MEGAMENU_ITEM_DEPTH_1_BUTTON = '.pw-mega-menu-item__children.pw--depth-0 [role="button"]'

/**
 * Alternative renderer for a MegaMenuItem - makes tests less brittle
 */
const SimpleButton = (props) => {
    const {selected, content, children} = props
    const className = selected ? 'selected' : null
    return (
        <div>
            <button className={className}>{content}</button>
            <div>{children}</div>
        </div>
    )
}

const itemFactory = (type, props) => {
    return <SimpleButton {...props} />
}

describe('An empty MegaMenu', () => {
    const root = {title: 'root', path: '/'}
    const context = {
        selected: root,
        selectedKey: '0',
        root,
        expanded: root,
        expandedPath: root.path,
        goToPath: noop
    }

    test('renders without errors', () => {
        const wrapper = shallow(<MegaMenu />, {context})
        expect(wrapper.html()).toBe(
            '<div role="list" class="pw-mega-menu">' +
                '<div aria-level="0" role="listitem" class="pw-mega-menu-item pw--depth-0 pw--active">' +
                '<div class="pw-list-tile pw-mega-menu-item__content pw--depth-0 pw--active">' +
                '<div role="button" class="pw-list-tile__primary" tabindex="-1">' +
                '<div class="pw-list-tile__content">root</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>'
        )
    })

    test('renders the contents of the className prop if present', () => {
        const name = 'name'
        const wrapper = shallow(<MegaMenu className={name} />, {context})
        expect(wrapper.html()).toBe(
            '<div role="list" class="pw-mega-menu name">' +
                '<div aria-level="0" role="listitem" class="pw-mega-menu-item pw--depth-0 pw--active">' +
                '<div class="pw-list-tile pw-mega-menu-item__content pw--depth-0 pw--active">' +
                '<div role="button" class="pw-list-tile__primary" tabindex="-1">' +
                '<div class="pw-list-tile__content">root</div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>'
        )
    })
})

describe('A MegaMenu with MegaMenuItem children', () => {
    const c1 = {title: '1', path: '/1/', key: '1'}
    const c2 = {title: '2', path: '/2/', key: '2'}
    const root = {title: 'root', path: '/', children: [c1, c2]}
    const context = {
        selected: c2,
        selectedKey: '0',
        root,
        expanded: root,
        expandedPath: root.path,
        goToPath: noop
    }

    test('renders its factoried children', () => {
        const wrapper = shallow(<MegaMenu itemFactory={itemFactory} />, {context})
        const expected =
            '<div role="list" class="pw-mega-menu">' +
            '<div>' +
            '<button>root</button>' +
            '<div>' +
            '<div>' +
            '<button>1</button>' +
            '<div></div>' +
            '</div>' +
            '<div>' +
            '<button class="selected">2</button>' +
            '<div></div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>'
        expect(wrapper.html()).toBe(expected)
    })

    test('renders MegaMenuItems by default', () => {
        const wrapper = shallow(<MegaMenu />, {context})

        // The expected count includes all children AND the root!
        expect(wrapper.find(MegaMenuItem).length).toBe(3)
    })

    test('the children have received the `path` prop', () => {
        const wrapper = shallow(<MegaMenu />, {context})
        wrapper.find(MegaMenuItem).forEach((item) => {
            expect(item.prop('path')).toBeTruthy()
        })
    })
})

describe('The MegaMenu keyUp handlers', () => {
    const c1 = {title: '1', path: '/1/', key: '1'}
    const c2 = {title: '2', path: '/2/', key: '2'}
    const c3 = {title: '3', path: '/3/', key: '3'}
    const root = {title: 'root', path: '/', children: [c1, c2, c3]}
    let context

    beforeEach(() => {
        context = {
            selected: root,
            selectedKey: '0',
            root,
            expanded: root,
            expandedPath: root.path,
            goToPath: noop
        }
    })

    test('From Item 2 (a middle item), pressing "→" focuses Item 3 (the next item)', () => {
        context.selected = c2
        context.selectedKey = '0.1'

        const wrapper = mount(<MegaMenu />, {context})
        const event = {keyCode: keyMap.right}
        const mockFocusOnNode1 = jest.fn()
        const mockBlurFromNode0 = jest.fn()
        const target = wrapper.getDOMNode().querySelectorAll(MEGAMENU_ITEM_DEPTH_1_BUTTON)

        // Assign a focus event listener to the THIRD node, which is the node
        // we expect to get highlighted when using the "→" key
        target[2].addEventListener('focus', mockFocusOnNode1)

        // Assign a blur event listener to the SECOND node, which is the node
        // that started focused, which we expect to blur after using the "→" key
        target[1].addEventListener('blur', mockBlurFromNode0)

        // Setup the SECOND node as being focused, in preperation for the test
        target[1].focus()

        expect(mockFocusOnNode1).not.toHaveBeenCalled()
        expect(mockBlurFromNode0).not.toHaveBeenCalled()
        wrapper.simulate('keyUp', event)
        expect(mockFocusOnNode1).toHaveBeenCalled()
        expect(mockBlurFromNode0).toHaveBeenCalled()
    })

    test('From Item 3 (the last item), pressing "→" leaves focus on Item 3', () => {
        context.selected = c3
        context.selectedKey = '0.2'

        const wrapper = mount(<MegaMenu />, {context})
        const event = {keyCode: keyMap.right}
        const mockBlurFromNode2 = jest.fn()
        const target = wrapper.getDOMNode().querySelectorAll(MEGAMENU_ITEM_DEPTH_1_BUTTON)

        // Assign a blur event listener to the THIRD node, which is the node
        // that started focused, which we expect to stay focused (no blur)
        target[2].addEventListener('blur', mockBlurFromNode2)

        // Setup the THIRD node as being focused, in preperation for the test
        target[2].focus()

        expect(mockBlurFromNode2).not.toHaveBeenCalled()
        wrapper.simulate('keyUp', event)
        expect(mockBlurFromNode2).not.toHaveBeenCalled()
    })

    test('From Item 2 (a middle item), pressing "←" focuses on Item 1 (the previous item)', () => {
        context.selected = c2
        context.selectedKey = '0.1'

        const wrapper = mount(<MegaMenu />, {context})
        const event = {keyCode: keyMap.left}
        const mockFocusOnNode0 = jest.fn()
        const mockBlurFromNode1 = jest.fn()
        const target = wrapper.getDOMNode().querySelectorAll(MEGAMENU_ITEM_DEPTH_1_BUTTON)

        // Assign a focus event listener to the FIRST node, which is the node
        // we expect to get highlighted when using the "←" key
        target[0].addEventListener('focus', mockFocusOnNode0)

        // Assign a blur event listener to the SECOND node, which is the node
        // that started focused, which we expect to blur after using the "←" key
        target[1].addEventListener('blur', mockBlurFromNode1)

        // Setup the SECOND node as being focused, in preperation for the test
        target[1].focus()

        expect(mockFocusOnNode0).not.toHaveBeenCalled()
        expect(mockBlurFromNode1).not.toHaveBeenCalled()
        wrapper.simulate('keyUp', event)
        expect(mockFocusOnNode0).toHaveBeenCalled()
        expect(mockBlurFromNode1).toHaveBeenCalled()
    })

    test('From Item 1 (the first item), pressing "←" leaves focus on Item 1', () => {
        context.selected = c1
        context.selectedKey = '0.0'

        const wrapper = mount(<MegaMenu />, {context})
        const event = {keyCode: keyMap.left}
        const mockBlurFromNode0 = jest.fn()
        const target = wrapper.getDOMNode().querySelectorAll(MEGAMENU_ITEM_DEPTH_1_BUTTON)

        // Assign a blur event listener to the FIRST node, which is the node
        // that started focused, which we expect to stay focused (no blur)
        target[0].addEventListener('blur', mockBlurFromNode0)

        // Setup the FIRST node as being focused, in preperation for the test
        target[0].focus()

        expect(mockBlurFromNode0).not.toHaveBeenCalled()
        wrapper.simulate('keyUp', event)
        expect(mockBlurFromNode0).not.toHaveBeenCalled()
    })

    test('Pressing any other key does nothing', () => {
        context.selected = c2
        context.selectedKey = '0.1'

        const wrapper = mount(<MegaMenu />, {context})
        const event = {keyCode: randomKey} // @TODO randomize
        const mock = jest.fn()
        const target = wrapper.getDOMNode().querySelectorAll(MEGAMENU_ITEM_DEPTH_1_BUTTON)

        // Assign a blur event listener to the SECOND node, which is the node
        // that started focused, which we expect to stay focused (no blur)
        target[1].addEventListener('blur', mock)

        // Setup the SECOND node as being focused, in preperation for the test
        target[1].focus()

        expect(mock).not.toHaveBeenCalled()
        wrapper.simulate('keyUp', event)
        expect(mock).not.toHaveBeenCalled()
    })
})

describe('Interacting with an item inside a MegaMenu', () => {
    const mock = jest.fn()
    const c1 = {title: '1', path: '/1/', key: '1'}
    const c2 = {title: '2', path: '/2/', key: '2'}
    const root = {title: 'root', path: '/', children: [c1, c2]}
    const context = {
        selected: c2,
        selectedKey: '0',
        root,
        expanded: root,
        expandedPath: root.path,
        goToPath: mock
    }

    test('by `click` will invoke `goToPath()`', () => {
        const action = 'click'
        const wrapper = mount(<MegaMenu />, {context})

        // Grab `c2` from the instance so we can trigger a click on it
        let target = wrapper.find(MegaMenuItem)
        target = target.at(target.length - 1).find(ListTilePrimary)

        // Simulate a click on `c2`
        target.simulate(action)

        expect(mock).toBeCalledWith(c2.path, action)
    })
})
