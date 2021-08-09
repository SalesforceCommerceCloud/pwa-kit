import React from 'react'
import Router from './router'
import {shallow} from 'enzyme'

test('Router component is rendered appropriately', () => {
    const wrapper = shallow(<Router />)
    expect(wrapper.length).toBe(1)
})
