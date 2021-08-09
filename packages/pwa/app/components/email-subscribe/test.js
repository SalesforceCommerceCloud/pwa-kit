import React from 'react'
import {shallow} from 'enzyme'
import {EmailSubscribe, validate} from './index'

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
