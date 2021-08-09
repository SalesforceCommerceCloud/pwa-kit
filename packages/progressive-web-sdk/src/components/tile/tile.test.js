/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'
import {Link} from 'react-router-dom'

import Tile from './index.jsx'
import Rating from '../rating'

import {mountWithRouter} from '../../utils/testing'

test('Tile renders without errors', () => {
    const wrapper = mount(<Tile />)
    expect(wrapper.length).toBe(1)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<Tile title="test" />)

    expect(wrapper.hasClass('pw-tile')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<Tile title="test" />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<Tile title="test" className={name} />)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

test('has "pw--column" class when isColumn is true', () => {
    const wrapper = shallow(<Tile title="test" isColumn />)

    expect(wrapper.hasClass('pw--column')).toBe(true)
})

test('has "pw--full" class when isFull is true', () => {
    const wrapper = shallow(<Tile title="test" isFull />)

    expect(wrapper.hasClass('pw--full')).toBe(true)
})

test('has "pw--simple" class when isSimple is true', () => {
    const wrapper = shallow(<Tile title="test" isSimple />)

    expect(wrapper.hasClass('pw--simple')).toBe(true)
})

test('renders image as primary', () => {
    const wrapper = mountWithRouter(<Tile title="test" href="test.html" />)
    const primary = wrapper.find(Link).first()
    expect(primary.length).toBe(1)
    expect(primary.prop('to')).toBe('test.html')
})

test('renders title as primary', () => {
    const wrapper = mountWithRouter(<Tile title="test" href="test.html" />)

    const primary = wrapper.find(Link).last()
    expect(primary.length).toBe(1)
    expect(primary.prop('to')).toBe('test.html')
})

test('does not render primary as a link if no href is present', () => {
    const wrapper = mount(<Tile />)

    const primary = wrapper.find('.pw-tile__primary').first()
    expect(primary.type()).toBe('div')
})

test('renders primary as a link if href is present', () => {
    const wrapper = mountWithRouter(<Tile href="test.html" />)

    const primary = wrapper
        .find('.pw-tile__primary')
        .first()
        .children()
    expect(primary.type()).toBe(Link)
})

test('If an onClick handler is passed, it is attached to the rendered component', () => {
    const mockOnClick = jest.fn()
    const wrapper = mount(<Tile onClick={mockOnClick} />)
    const primary = wrapper.find('.pw-tile__primary').first()

    expect(primary.prop('onClick')).toBe(mockOnClick)
    expect(mockOnClick).not.toBeCalled()
    primary.simulate('click')
    expect(mockOnClick).toBeCalled()
    expect(primary.prop('role')).toBe('button')
})

test('renders options if they are passed', () => {
    const options = [{label: 'one', value: '1'}, {label: 'two', value: '2'}]

    const wrapper = shallow(<Tile options={options} />)

    expect(wrapper.find('.pw-tile__options').length).toBe(1)
    expect(wrapper.find('.pw-tile__options .pw-tile__option').length).toBe(options.length)
})

test('renders no Rating if no ratingProps are passed', () => {
    const wrapper = shallow(<Tile />)

    expect(wrapper.find(Rating).length).toBe(0)
})

test('renders a Rating if ratingProps are passed', () => {
    const ratingProps = {}
    const wrapper = shallow(<Tile ratingProps={ratingProps} />)

    const rating = wrapper.find(Rating)
    expect(rating.length).toBe(1)
    expect(rating.prop('className').includes('pw-tile__rating-stars')).toBe(true)
})
