/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'
import {Link as RawLink} from 'react-router'

import Link from './index.jsx'
import {setRouteList} from '../../routing/is-react-route'

/* eslint-disable newline-per-chained-call */
/* eslint-disable jsx-a11y/anchor-has-content */

const testReactRegex = /\/react/
const testAnotherRegex = /\/path1?/

beforeEach(() => {
    setRouteList([testReactRegex, testAnotherRegex])
})

test('Link renders without errors', () => {
    const wrapper = mount(<Link href="test" />)
    expect(wrapper.length).toBe(1)
})

test('Link renders a Link if the href matches the route list', () => {
    const testHrefs = [
        'https://www.mobify.com/react/test',
        'https://www.mobify.com/path',
        '/path/test.html'
    ]
    testHrefs.forEach((href) => {
        const wrapper = shallow(<Link href={href}>Test</Link>)

        expect(wrapper.is(RawLink)).toBe(true)
        expect(wrapper.prop('to')).toBe(href.replace('https://www.mobify.com', ''))
        expect(wrapper.children().text()).toBe('Test')
    })
})

test('Link renders an anchor if the href does not match the route list', () => {
    const testHrefs = ['http://test-site.com/non-react/', 'http://www.mobify.com/']

    testHrefs.forEach((href) => {
        const wrapper = shallow(<Link href={href}>Test</Link>)

        expect(wrapper.is('a')).toBe(true)
        expect(wrapper.prop('href')).toBe(href)
        expect(wrapper.children().text()).toBe('Test')
    })
})

test('If no children are passed, it renders the link with the text prop', () => {
    const wrapper = shallow(<Link href="http://google.com/" text="Test" />)

    expect(wrapper.is('a')).toBe(true)
    expect(wrapper.prop('href')).toBe('http://google.com/')
    expect(wrapper.children().text()).toBe('Test')
})

test('If no href is passed, it renders a link with javascript:', () => {
    const wrapper = shallow(<Link text="test" />)

    expect(wrapper.is('a')).toBe(true)
    expect(wrapper.prop('href')).toBe('javascript:')
})

test('If an onClick handler is passed, it is attached to the rendered component', () => {
    const onClick = jest.fn()
    const wrapper = shallow(<Link onClick={onClick} />)

    expect(wrapper.is('a')).toBe(true)
    expect(wrapper.prop('onClick')).toBe(onClick)
    expect(onClick).not.toBeCalled()
    wrapper.simulate('click')
    expect(onClick).toBeCalled()
})

test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<Link />)

    expect(wrapper.hasClass('pw-link')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<Link />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<Link className={name} />)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

test('renders data props correctly', () => {
    const dataProps = {
        'data-a': 'hello',
        'data-b': 'world'
    }
    const wrapper = shallow(<Link data={dataProps} />)
    expect(wrapper.find('a').prop('data-a')).toBe('hello')
    expect(wrapper.find('a').prop('data-b')).toBe('world')
})

test('errors out on invalid data props', () => {
    const dataProps = {
        'invalid-a': 'hello'
    }

    expect(Link.propTypes.data({data: dataProps}, 'data', 'Link')).toEqual(
        new Error(
            "Invalid prop data supplied to Link. Make sure it's an object with keys that start with 'data-'. Validation failed."
        )
    )
})

test('the openInNewTab prop adds the right attributes', () => {
    const wrapper = shallow(<Link href="http://google.com" openInNewTab />)

    expect(wrapper.prop('target')).toBe('_blank')
    expect(wrapper.prop('rel')).toBe('noopener')
})

test('passes arbitrary props to the `a` element', () => {
    const onFocus = () => {}
    const wrapper = shallow(
        <Link data-foo="bar" data-spam="cheese" data-pigeon onFocus={onFocus} />
    )

    expect(wrapper.type()).toBe('a')
    expect(wrapper.prop('data-foo')).toBe('bar')
    expect(wrapper.prop('data-spam')).toBe('cheese')
    expect(wrapper.prop('data-pigeon')).toBe(true)
    expect(wrapper.prop('onFocus')).toBe(onFocus)
})

test('onMouseEnter fires on hover', () => {
    const mockOnMouseEnter = jest.fn()

    const wrapper = shallow(<Link onMouseEnter={mockOnMouseEnter} />)

    wrapper.simulate('mouseEnter')

    expect(mockOnMouseEnter.mock.calls.length).toBe(1)
})
