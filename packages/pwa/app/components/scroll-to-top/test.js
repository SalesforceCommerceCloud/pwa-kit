import React from 'react'
import {mount} from 'enzyme'
import ScrollToTop from './index'
import {MemoryRouter} from 'react-router-dom'

global.scrollTo = jest.fn()

describe('ScrollToTop', () => {
    let wrapper
    let history

    beforeEach(() => {
        wrapper = mount(
            <MemoryRouter initialEntries={['/']}>
                <ScrollToTop />
            </MemoryRouter>
        )
        history = wrapper.instance().history
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    // NOTE: Ensure the history.push() triggers its listener by calling
    // an innoxuous .go(0) after. This is possibly an issue with
    // enzyme, or it could also be the asynchornous nature of things.
    test('calls window.scrollTo when route changes', () => {
        expect(global.scrollTo).toHaveBeenCalledTimes(1)
        expect(global.scrollTo).toHaveBeenCalledWith(0, 0)

        history.push('/new-url')
        history.go(0)
        expect(global.scrollTo).toHaveBeenCalledTimes(2)

        history.push('/new-url2')
        history.go(0)
        expect(global.scrollTo).toHaveBeenCalledTimes(3)
    })
})
