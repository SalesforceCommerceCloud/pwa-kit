/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount} from 'enzyme'
/* eslint-env jest */
import React from 'react'

import BazaarvoiceReview from './index.jsx'

describe('BazaarvoiceReview component', () => {
    window.$BV = {
        configure: () => {},
        ui: () => {}
    }

    // NOTE: Jest will complain/fail when adding a script tag with an empty src,
    // for this reason we supply the component with a mock api src value.
    const props = {
        apiSrc: 'no-script.js',
        productId: ''
    }

    test('BazaarvoiceReview renders without errors', () => {
        const wrapper = mount(<BazaarvoiceReview {...props} />)
        // Need to set apiLoaded so that the component actually renders
        wrapper.setState({apiLoaded: true})
        expect(wrapper.length).toBe(1)
    })

    /* eslint-disable newline-per-chained-call */
    test('includes the component class name with no className prop', () => {
        // Need to use mount or we aren't able to find the element with the class
        const wrapper = mount(<BazaarvoiceReview {...props} />)
        wrapper.setState({apiLoaded: true})
        expect(wrapper.find('.pw-bazaarvoice-review').length).toBe(1)
    })

    test("does not render an 'undefined' class with no className", () => {
        const wrapper = mount(<BazaarvoiceReview {...props} />)
        wrapper.setState({apiLoaded: true})

        expect(wrapper.find('.undefined').length).toBe(0)
    })

    test('renders the contents of the className prop if present', () => {
        ;['test', 'testanother'].forEach((name) => {
            const wrapper = mount(<BazaarvoiceReview className={name} {...props} />)
            wrapper.setState({apiLoaded: true})

            expect(wrapper.find(`.pw-bazaarvoice-review`).hasClass(name)).toBeTruthy()
        })
    })

    test('calls window.$BV.ui after mounting', () => {
        window.$BV.ui = jest.fn()

        const wrapper = mount(<BazaarvoiceReview {...props} />)
        wrapper.setState({apiLoaded: true})

        expect(window.$BV.ui).toHaveBeenCalled()
    })

    test('renders api 2 properly', () => {
        window.$BV.ui = jest.fn()
        const wrapper = mount(<BazaarvoiceReview {...props} apiVersion="2" />)
        wrapper.setState({apiLoaded: true})
        expect(wrapper.find('[data-bv-show="reviews"]').length).toBe(1)
        expect(window.$BV.ui).not.toHaveBeenCalled()
    })
})
