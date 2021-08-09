import React from 'react'
import {shallow} from 'enzyme'
import Error, {ERROR_DEFAULT_TITLE, ERROR_NOT_FOUND_TITLE} from './index'

test('Error renders without errors', () => {
    expect(shallow(<Error />).hasClass('t-error')).toBe(true)
})

test('Error status 500', () => {
    expect(
        shallow(<Error status={500} />)
            .find('h1')
            .text()
    ).toBe(ERROR_DEFAULT_TITLE)
})

test('Error status 404', () => {
    expect(
        shallow(<Error status={404} />)
            .find('h1')
            .text()
    ).toBe(ERROR_NOT_FOUND_TITLE)
})
