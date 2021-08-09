import React from 'react'
import {mount, shallow} from 'enzyme'
import {UnconnectedHeader as Header, DesktopHeader, MobileHeader} from './index'

test('Header renders without errors', () => {
    const history = {push: jest.fn()}
    const wrapper = shallow(<Header history={history} />)

    expect(wrapper).toHaveLength(1)

    wrapper.setState({navigationIsOpen: true, path: '/foo'})
    wrapper.instance().closeNavigation()
    expect(wrapper.instance().state.navigationIsOpen).toBe(false)
    expect(wrapper.instance().state.path).toBe('/')

    wrapper.setState({navigationIsOpen: false, path: '/foo'})
    wrapper.instance().openNavigation()
    expect(wrapper.instance().state.navigationIsOpen).toBe(true)
    expect(wrapper.instance().state.path).toBe('/')

    wrapper.setState({navigationIsOpen: false, path: '/foo'})
    wrapper.instance().onPathChange('/some-path', true, 'click', '/some-path')
    expect(wrapper.instance().state.path).toBe('/')

    wrapper.setState({navigationIsOpen: false, path: '/foo'})
    wrapper.instance().onPathChange('/some-path', false, 'click', '/some-path')
    expect(wrapper.instance().state.path).toBe('/some-path')
})

test('DesktopHeader renders without errors', () => {
    const wrapper = shallow(<DesktopHeader />)
    expect(wrapper).toHaveLength(1)
})

test('MobileHeader renders when open', () => {
    const wrapper = shallow(<MobileHeader navigationIsOpen={true} />)
    expect(wrapper).toHaveLength(1)
})

test('If MobileHeader path is "/" then it should be hidden', () => {
    const wrapper = mount(<MobileHeader path="/" navigationIsOpen={true} />)
    expect(wrapper.find('NavHeader Button').hasClass('u-visually-hidden')).toBe(true)
})

test('MobileHeader renders when closed', () => {
    const wrapper = shallow(<MobileHeader navigationIsOpen={false} />)
    expect(wrapper).toHaveLength(1)
})
