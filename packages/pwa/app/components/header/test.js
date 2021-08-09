import React from 'react'
import {mount, shallow} from 'enzyme'
import {Provider} from 'react-redux'
import Header, {DesktopHeader, MobileHeader} from './index'
import configureStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import Immutable from 'immutable'

const storeFactory = configureStore([thunk])

let store

beforeEach(() => {
    store = storeFactory({
        mediaQueryProps: Immutable.fromJS({}),
        app: Immutable.fromJS({})
    })
})

afterEach(() => {
    store = undefined
})

test('Header renders without errors', () => {
    const router = {push: () => undefined}
    const wrapper = shallow(
        <Provider store={store}>
            <Header router={router} />
        </Provider>
    )
        .dive()
        .dive()
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
    const wrapper = mount(
        <Provider store={store}>
            <DesktopHeader />
        </Provider>
    )
    expect(wrapper).toHaveLength(1)
})

test('MobileHeader renders when open', () => {
    const wrapper = mount(
        <Provider store={store}>
            <MobileHeader navigationIsOpen={true} />
        </Provider>
    )
    expect(wrapper).toHaveLength(1)
})

test('If MobileHeader path is "/" then it should be hidden', () => {
    const wrapper = mount(
        <Provider store={store}>
            <MobileHeader path="/" navigationIsOpen={true} />
        </Provider>
    )

    expect(wrapper.find('NavHeader Button').hasClass('u-visually-hidden')).toBe(true)
})

test('MobileHeader renders when closed', () => {
    const wrapper = mount(
        <Provider store={store}>
            <MobileHeader navigationIsOpen={false} />
        </Provider>
    )
    expect(wrapper).toHaveLength(1)
})
