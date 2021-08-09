/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {shallow, mount} from 'enzyme'
import React from 'react'

import Button from '../button'
import NavHeader from './index.jsx'

test('NavHeader renders without errors', () => {
    const wrapper = shallow(<NavHeader />)
    expect(wrapper.length).toBe(1)
})

test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<NavHeader />)
    expect(wrapper.prop('className').startsWith('pw-nav-header')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<NavHeader />)
    expect(wrapper.prop('className').includes('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    const name = 'name'
    const wrapper = shallow(<NavHeader className={name} />)
    expect(wrapper.prop('className').includes(name)).toBe(true)
})

test('renders the title of the expanded navigation item', () => {
    const wrapper = shallow(<NavHeader />, {context: {expanded: {title: 'title', path: '/path'}}})
    const text = wrapper.find('.pw-nav-header__title').text()
    expect(text).toBe('title')
})

test('provides default start and end actions', () => {
    const expanded = {title: 'Child', path: '/child/'}
    const wrapper = shallow(<NavHeader />, {context: {expanded, expandedPath: expanded.path}})

    expect(wrapper.find('.pw-nav-header__actions-start').html()).toBe(
        '<div class="pw-nav-header__actions-start">' +
            '<button class="pw-button pw-nav-header__button pw-nav-header__back" type="button">' +
            '<div class="pw-button__inner">Back</div>' +
            '</button>' +
            '</div>'
    )

    expect(wrapper.find('.pw-nav-header__actions-end').html()).toBe(
        '<div class="pw-nav-header__actions-end">' +
            '<button class="pw-button pw-nav-header__button pw-nav-header__close" type="button">' +
            '<div class="pw-button__inner">Close</div>' +
            '</button>' +
            '</div>'
    )
})

test('supports overriding default content for start and end actions', () => {
    const [startContent, endContent] = ['start', 'end']
    const wrapper = shallow(<NavHeader startContent={startContent} endContent={endContent} />)
    const startText = wrapper.find('.pw-nav-header__actions-start').text()
    const endText = wrapper.find('.pw-nav-header__actions-end').text()
    expect(startText).toBe(startContent)
    expect(endText).toBe(endContent)
})

test('renders a Back button if the path is not at root', () => {
    const wrapper = mount(<NavHeader />, {context: {expandedPath: '/path'}})
    expect(wrapper.find('Button.pw-nav-header__back').length).toBe(1)
})

test('renders no Back button if the path is at root', () => {
    const wrapper = mount(<NavHeader />, {context: {expandedPath: '/'}})
    expect(wrapper.find('.pw-nav-header__back').length).toBe(0)
})

test('invokes onBack callback', () => {
    const spy = jest.fn()
    const wrapper = mount(<NavHeader />, {context: {goBack: spy}})
    wrapper
        .find('Button.pw-nav-header__back')
        .simulate('click', new MouseEvent('click', {bubbles: true, cancelable: true}))
    expect(spy).toBeCalled()
})

test('invokes onClose callback', () => {
    const spy = jest.fn()
    const wrapper = mount(<NavHeader onClose={spy} />)
    wrapper
        .find('Button.pw-nav-header__close')
        .simulate('click', new MouseEvent('click', {bubbles: true, cancelable: true}))
    expect(spy).toBeCalled()
})

test('renders startContent, endContent if provided', () => {
    const startContent = <Button className="t-start-content" />
    const endContent = <Button className="t-end-content" />
    const wrapper = mount(<NavHeader startContent={startContent} endContent={endContent} />)
    expect(wrapper.find('Button.t-start-content').length).toBe(1)
    expect(wrapper.find('Button.t-end-content').length).toBe(1)
})

test('passes atRoot and onClick to startContent', () => {
    const startContent = <Button />
    const wrapper = shallow(<NavHeader startContent={startContent} />)

    const props = wrapper.find(Button).props()
    expect(props.atRoot).toBeDefined()
    expect(props.onClick).toBeDefined()
    expect(typeof props.onClick).toBe('function')
})

test('passes onClick to endContent', () => {
    const endContent = <button className="t-end-content" />
    const wrapper = mount(<NavHeader endContent={endContent} />)
    const props = wrapper.find('.t-end-content').props()
    expect(props.onClick).toBeDefined()
    expect(typeof props.onClick).toBe('function')
})

test('renders startContent and endContent as is if they are not valid React Elements', () => {
    const startContent = 'startContent'
    const endContent = 'endContent'
    const wrapper = mount(<NavHeader startContent={startContent} endContent={endContent} />)
    expect(wrapper.find('.pw-nav-header__actions-start').text()).toBe(startContent)
    expect(wrapper.find('.pw-nav-header__actions-end').text()).toBe(endContent)
})

test('invokes onTitleClick callback', () => {
    let result
    const spy = jest.fn((title, path) => (result = {title, path}))
    const expanded = {title: 'Child', path: '/child/'}
    const wrapper = mount(<NavHeader onTitleClick={spy} />, {context: {expanded}})
    wrapper
        .find('.pw-nav-header__title')
        .simulate('click', new MouseEvent('click', {bubbles: true, cancelable: true}))
    expect(spy).toBeCalled()
    expect(result).toEqual({title: expanded.title, path: expanded.path})
})
