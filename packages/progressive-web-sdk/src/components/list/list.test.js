/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {shallow, mount} from 'enzyme'
import React from 'react'

import List from './index.jsx'
import ListTile from '../list-tile/index.jsx'
import Button from '../button'

test('List renders without errors', () => {
    const wrapper = mount(<List items={[]} />)
    expect(wrapper.length).toBe(1)
})

test('List renders its children', () => {
    const children = [<p key="1">Item 1</p>, <p key="2">Item 2</p>]
    const wrapper = shallow(<List>{children}</List>)
    const listChildren = wrapper.find('p')

    expect(listChildren.length).toBe(children.length)
})

test('List renders its children if provided, and then not any items', () => {
    const children = [<p key="1">Item 1</p>, <p key="2">Item 2</p>]
    const items = [
        {
            title: 'test'
        },
        {
            title: 'test2'
        }
    ]
    const wrapper = shallow(<List items={items}>{children}</List>)
    const paragraphElements = wrapper.find('p')
    const listElements = wrapper.find(ListTile)

    expect(paragraphElements.length).toBe(children.length)
    expect(listElements.length).toBe(0)
})

test('List renders a child for each item in the items prop array', () => {
    const items = [
        {
            title: 'test'
        },
        {
            title: 'test2'
        }
    ]
    const wrapper = shallow(<List items={items} />)
    const listElements = wrapper.find(ListTile)

    expect(listElements.length).toBe(items.length)
})

test('List renders its items list as designated by the component prop', () => {
    const items = [
        {
            title: 'test'
        },
        {
            title: 'test2'
        }
    ]
    const wrapper = shallow(<List items={items} component={Button} />)
    const buttonElements = wrapper.find(Button)

    expect(buttonElements.length).toBe(items.length)
})

test("List renders its items as designated by that item's own component prop", () => {
    const items = [
        {
            title: 'test',
            component: Button
        },
        {
            title: 'test2',
            component: ListTile
        }
    ]
    const wrapper = shallow(<List items={items} component={Button} />)
    const buttonElements = wrapper.find(Button)
    const listElements = wrapper.find(ListTile)

    expect(buttonElements.length).toBe(1)
    expect(listElements.length).toBe(1)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<List items={[]} />)

    expect(wrapper.hasClass('pw-list')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<List items={[]} />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<List items={[]} className={name} />)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

test('the clickHandler is called when an item is clicked, with its index', () => {
    const onClick = jest.fn()
    const wrapper = mount(<List items={[{title: 'test'}]} clickHandler={onClick} />)

    wrapper.find('div.pw-list-tile__primary').prop('onClick')()
    expect(onClick).toBeCalledWith(0)
})
