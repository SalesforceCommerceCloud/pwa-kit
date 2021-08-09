import React from 'react'
import {mount, shallow} from 'enzyme'
import Footer from './index'

test('Footer renders without errors', () => {
    const wrapper = mount(<Footer />)
    expect(wrapper).toHaveLength(1)
})

test('Footer includes the component class name', () => {
    const wrapper = shallow(<Footer />)
    expect(wrapper.hasClass('c-footer')).toBe(true)
})

test('Footer read copyright content', () => {
    const wrapper = mount(<Footer />)
    const footerContent = wrapper.find('.c-footer__content')
    expect(footerContent.text()).toMatch(/Mobify Research & Development Inc/)
})
