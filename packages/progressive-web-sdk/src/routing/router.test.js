/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {shallow} from 'enzyme'
import React from 'react'
import {Router as ReactRouter, Route, browserHistory} from 'react-router'
import {getBlacklist, setRouteList} from './is-react-route'

import Router from './router.jsx'

jest.mock('./record-routes')
import recordRoutes from './record-routes'

beforeAll(() => {
    recordRoutes.mockImplementation((_, children) => children)
})

test('Router renders a ReactRouter', () => {
    const wrapper = shallow(
        <Router>
            <Route path="/" />
        </Router>
    )

    expect(wrapper.length).toBe(1)
    expect(wrapper.is(ReactRouter)).toBe(true)
})

test('Router defaults to passing browserHistory as the history prop', () => {
    const wrapper = shallow(
        <Router>
            <Route path="/test" />
        </Router>
    )

    expect(wrapper.prop('history')).toBe(browserHistory)
})

test('Router lets you override the history prop', () => {
    const fakeHistory = {fake: 'yes'}
    const wrapper = shallow(
        <Router history={fakeHistory}>
            <Route path="/test" />
        </Router>
    )

    expect(wrapper.prop('history')).toBe(fakeHistory)
})

test("Router renders its children as the ReactRouter's children", () => {
    const child = <Route path="/" />
    const wrapper = shallow(<Router>{child}</Router>)

    expect(wrapper.children().length).toBe(1)
    expect(wrapper.children().get(0)).toEqual(child)
})

test('Router calls recordRoutes on its children', () => {
    const child = <Route path="/test" />
    shallow(<Router>{child}</Router>)

    expect(recordRoutes).toHaveBeenCalledTimes(1)
    expect(recordRoutes).toHaveBeenCalledWith(setRouteList, child)
})

test('Router sets a blacklist if defined', () => {
    const blacklist = ['something', '/(one|two)$']
    shallow(
        <Router blacklist={blacklist}>
            <Route path="/" />
        </Router>
    )
    expect(getBlacklist().length).toBe(2)
})
