/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {shallow, mount} from 'enzyme'
import React from 'react'

import MegaMenuItem from './index.jsx'

const noop = () => undefined

const hasChildrenClass = 'pw--has-children'
const contentContainerSelector = '.pw-mega-menu-item__content'
const childrenContainerSelector = '.pw-mega-menu-item__children'

jest.useFakeTimers()

/* eslint-disable newline-per-chained-call */

test('MegaMenuItem renders without errors', () => {
    const wrapper = mount(<MegaMenuItem />)

    expect(wrapper.length).toBe(1)
})

test('it renders a ListTile component', () => {
    const wrapper = mount(<MegaMenuItem content="title" />)

    expect(wrapper.find('ListTile').length).toBe(1)

    expect(wrapper.childAt(0).text()).toBe('title')
})

test('renders extra content correctly', () => {
    const overrideContent = <span>override content</span>
    const wrapper = mount(<MegaMenuItem beforeContent="before" content={overrideContent} />)
    const primaryWrapper = wrapper.find('.pw-list-tile__primary')

    // Check the before content
    expect(primaryWrapper.childAt(0).type()).toBe('div')
    expect(primaryWrapper.childAt(0).text()).toBe('before')

    // Check the main content
    expect(primaryWrapper.find('.pw-list-tile__content').children().length).toBe(1)
    expect(
        primaryWrapper
            .find('.pw-list-tile__content')
            .childAt(0)
            .type()
    ).toBe('span')
    expect(
        primaryWrapper
            .find('.pw-list-tile__content')
            .childAt(0)
            .text()
    ).toBe('override content')
})

test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<MegaMenuItem />)
    expect(wrapper.hasClass('pw-mega-menu-item')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<MegaMenuItem />)
    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    const name = 'name'
    const wrapper = mount(<MegaMenuItem className={name} />)
    expect(wrapper.hasClass(name)).toBe(true)
})

test('invokes the navigate callback on click by default', () => {
    const spy = jest.fn()
    const wrapper = shallow(<MegaMenuItem content="title" navigate={spy} />)
    wrapper.find('ListTile').simulate('click', new MouseEvent('click'))
    expect(spy.mock.calls.length).toBe(1)
})

describe('When children are passed as props...', () => {
    let wrapper

    beforeEach(() => {
        wrapper = shallow(<MegaMenuItem />)
    })

    test('renders with pw--has-children', () => {
        expect(wrapper.hasClass(hasChildrenClass)).toBe(false)
        wrapper = shallow(<MegaMenuItem>test</MegaMenuItem>)
        expect(wrapper.hasClass(hasChildrenClass)).toBe(true)
    })

    test('content container renders with pw--has-children', () => {
        expect(wrapper.find(contentContainerSelector).hasClass(hasChildrenClass)).toBe(false)
        wrapper = shallow(<MegaMenuItem>test</MegaMenuItem>)
        expect(wrapper.find(contentContainerSelector).hasClass(hasChildrenClass)).toBe(true)
    })

    test('renders this children container', () => {
        expect(wrapper.find(childrenContainerSelector).length).toBe(0)
        wrapper = shallow(<MegaMenuItem>test</MegaMenuItem>)
        expect(wrapper.find(childrenContainerSelector).length).toBe(1)
    })
})

describe('When depth is passed as a prop...', () => {
    let wrapper
    const depthClass = (depth) => `pw--depth-${depth}`
    const depths = [0, 1, 2, 3, 4]

    beforeEach(() => {
        wrapper = shallow(<MegaMenuItem />)
    })

    test('renders with pw--depth-x', () => {
        depths.forEach((depth) => {
            const currentDepthClass = depthClass(depth) // i.e. pw--depth-0

            expect(wrapper.hasClass(currentDepthClass)).toBe(false)
            wrapper = shallow(<MegaMenuItem depth={depth} />)
            expect(wrapper.hasClass(currentDepthClass)).toBe(true)
        })
    })

    test('content container renders with pw--depth-x', () => {
        depths.forEach((depth) => {
            const currentDepthClass = depthClass(depth) // i.e. pw--depth-0

            expect(wrapper.find(contentContainerSelector).hasClass(currentDepthClass)).toBe(false)

            wrapper = shallow(<MegaMenuItem depth={depth} />)
            expect(wrapper.find(contentContainerSelector).hasClass(currentDepthClass)).toBe(true)
        })
    })

    test('the children container renders with pw--depth-x', () => {
        depths.forEach((depth) => {
            const currentDepthClass = depthClass(depth) // i.e. pw--depth-0

            wrapper = shallow(<MegaMenuItem>test</MegaMenuItem>)
            expect(wrapper.find(childrenContainerSelector).hasClass(currentDepthClass)).toBe(false)

            wrapper = shallow(<MegaMenuItem depth={depth}>test</MegaMenuItem>)
            expect(wrapper.find(childrenContainerSelector).hasClass(currentDepthClass)).toBe(true)
        })
    })

    test('the tabIndex is -1 for root level Mega Menu items', () => {
        const wrapper = mount(<MegaMenuItem depth="0" />)
        expect(wrapper.find('ListTilePrimary').props().tabIndex).toBe(-1)
    })

    test('the tabIndex is 0 for Mega Menu Items of depth 1 and deeper', () => {
        const depths = [1, 2, 3, 4]

        depths.forEach((depth) => {
            const wrapper = mount(<MegaMenuItem depth={depth} />)
            expect(wrapper.find('ListTilePrimary').props().tabIndex).toBe(0)
        })
    })
})

describe('When interacted by...', () => {
    let wrapper
    let mock

    beforeEach(() => {
        mock = jest.fn()

        // Depth must be at least 1, otherwise the component will be unfocusable
        wrapper = mount(<MegaMenuItem depth="1" navigate={mock} />)
    })

    test('mouse enter – the mouseEnter handler fires the navigate callback', () => {
        expect(mock).not.toHaveBeenCalled()

        wrapper.simulate('mouseEnter')
        expect(mock).toBeCalledWith('mouseEnter')
    })

    test('mouse leave – the mouseLeave handler fires the navigate callback', () => {
        expect(mock).not.toHaveBeenCalled()

        wrapper.simulate('mouseLeave')
        expect(mock).toBeCalledWith('mouseLeave', '/')
    })

    test('touch move – the touchMove handler sets dragging to true', () => {
        // call touchMove handler manually, because... I'm not sure how to
        // simulate it.
        wrapper.instance()._handleTouchMove()
        expect(wrapper.instance().dragging).toBe(true)
    })

    test('touch end – the touchEnd handler does NOT fire the navigate callback when the event has NO target', () => {
        const relatedTarget = {target: wrapper.getDOMNode()} // pretend there is a MegaMenu target

        expect(mock).not.toHaveBeenCalled()

        // call touchEnd handler manually, because... I'm not sure how to
        // simulate it.
        wrapper.instance()._handleTouchEnd(relatedTarget)
        expect(mock).not.toHaveBeenCalled()
    })

    test('touch end – the touchEnd handler DOES fire the navigate callback when the event HAS a target', () => {
        const el = mount(<div />)
        const unrelatedTarget = {target: el.getDOMNode()} // pretend there is a non-MegaMenu target

        expect(mock).not.toHaveBeenCalled()

        // call touchEnd handler again, this time with a "blur" target
        wrapper.instance()._handleTouchEnd(unrelatedTarget)
        expect(mock).toBeCalledWith('touchEnd', '/')
    })

    test('touch end – the touchEnd handler does NOT fire if touchMove (dragging) happened first', () => {
        const unrelatedTarget = {target: null} // pretend there is a non-MegaMenu target

        expect(mock).not.toHaveBeenCalled()

        wrapper.instance()._handleTouchMove()
        wrapper.instance()._handleTouchEnd(unrelatedTarget)
        expect(mock).not.toHaveBeenCalled()
    })

    test('focus – the focus handler fires the navigate callback', () => {
        const event = {preventDefault: noop}
        expect(mock).not.toHaveBeenCalled()

        wrapper.find('.pw-list-tile__primary').simulate('focus', event)

        setTimeout(() => {
            expect(mock).toBeCalledWith('focus')
        }, 1)
        jest.runAllTimers()
    })

    test('blur – the blur handler fires the navigate callback', () => {
        const unrelatedTarget = {
            target: {
                closest: () => ({
                    // pretend we've traversed out of a MegaNavItem. This looks
                    // like we have traversed outside of the current MegaNavItem
                    // into some other element. A blur, as far as we're concerned
                    contains: () => false
                })
            }
        }
        expect(mock).not.toHaveBeenCalled()

        wrapper.simulate('blur', unrelatedTarget)

        setTimeout(() => {
            expect(mock).toBeCalledWith('blur', '/')
        }, 1)
        jest.runAllTimers()
    })

    test('blur – the blur handler does NOT fire the navigate callback if blurred within itself', () => {
        const relatedTarget = {
            target: {
                closest: () => ({
                    // pretend we've traversed inside the MegaNavItem. We
                    // haven't actually gone anywhere! Not a blur, as far as
                    // we're concerned.
                    contains: () => true
                })
            }
        }
        expect(mock).not.toHaveBeenCalled()

        wrapper.simulate('blur', relatedTarget)

        setTimeout(() => {
            expect(mock).not.toHaveBeenCalled()
        }, 1)
        jest.runAllTimers()
    })
})
