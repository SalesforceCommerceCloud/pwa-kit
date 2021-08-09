import React from 'react'
import {shallow} from 'enzyme'
import {UnconnectedHome as Home} from './index'

test('Home renders without errors', () => {
    const props = {
        initializeHome: jest.fn(),
        trackPageLoad: jest.fn()
    }
    const wrapper = shallow(<Home {...props} />)
    expect(wrapper.hasClass('t-home')).toBe(true)
    expect(props.initializeHome.mock.calls.length).toBe(1)
    expect(props.trackPageLoad.mock.calls.length).toBe(1)
    const getResponseOptions = props.trackPageLoad.mock.calls[0][2]

    expect(getResponseOptions({statusCode: 200})).toEqual({
        statusCode: 200,
        headers: {
            'Cache-Control': 'max-age=0, s-maxage=3600'
        }
    })

    expect(getResponseOptions({statusCode: 404})).toEqual({
        statusCode: 404
    })
})
