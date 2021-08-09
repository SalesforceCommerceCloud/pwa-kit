import React from 'react'
import {shallow} from 'enzyme'
import EmailSubscribe, {validate} from './index'
import {getAnalyticsManager} from '../../analytics'

const analyticsManager = getAnalyticsManager()

beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(jest.fn())
    jest.spyOn(console, 'groupCollapsed').mockImplementation(jest.fn())
})

afterAll(() => {
    console.log.mockRestore()
    console.groupCollapsed.mockRestore()
})

afterEach(() => {
    console.log.mockClear()
    console.groupCollapsed.mockClear()
})

test('EmailSubscribe renders without errors', () => {
    const wrapper = shallow(
        <EmailSubscribe handleSubmit={() => undefined} onSubmit={() => undefined} />
    )
    expect(wrapper).toHaveLength(1)
    expect(wrapper.hasClass('c-email-subscribe')).toBe(true)
})

test('Email address validation works', () => {
    expect(Object.keys(validate({}))).toHaveLength(1)
    expect(Object.keys(validate({email: 'not-an-email'}))).toHaveLength(1)
    expect(Object.keys(validate({email: 'person@mobify.com'}))).toHaveLength(0)
})

test('Analytics manager tracks email submit errors', () => {
    const analyticsManagerTrack = jest.spyOn(analyticsManager, 'track')
    const submitEvent = {
        preventDefault: jest.fn()
    }
    const wrapper = shallow(<EmailSubscribe />)
    wrapper.instance().setState({value: 'bademail@blah.x'})
    wrapper.instance().handleSubmit(submitEvent)
    expect(analyticsManagerTrack).toHaveBeenCalled()
    analyticsManagerTrack.mockClear()

    wrapper.instance().setState({value: 'goodemail@mobify.com'})
    wrapper.instance().handleSubmit(submitEvent)
    expect(analyticsManagerTrack).not.toHaveBeenCalled()
})

test('If an onSubmit prop is given, call it on submission of a valid email', () => {
    const analyticsManagerTrack = jest.spyOn(analyticsManager, 'track')

    const onSubmit = jest.fn()
    const wrapper = shallow(<EmailSubscribe onSubmit={onSubmit} />)
    wrapper.instance().setState({value: 'goodemail@mobify.com'})
    wrapper.instance().handleSubmit({
        preventDefault: jest.fn()
    })
    expect(analyticsManagerTrack).not.toHaveBeenCalled()
    expect(onSubmit).toHaveBeenCalled()
    onSubmit.mockClear()
})

test('HandleChange sets the state with the target value', () => {
    const wrapper = shallow(<EmailSubscribe />)
    wrapper.instance().handleChange({
        target: {value: 'goodemail@mobify.com'}
    })
    expect(wrapper.instance().state.value).toBe('goodemail@mobify.com')
})
