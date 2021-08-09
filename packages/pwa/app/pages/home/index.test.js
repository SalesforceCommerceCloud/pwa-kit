import React from 'react'
import {shallow} from 'enzyme'
import Home from './index'

test('Home renders without errors', () => {
    const wrapper = shallow(<Home />)
    expect(wrapper.hasClass('t-home')).toBe(true)

    expect(typeof Home.getTemplateName()).toEqual('string')
})
