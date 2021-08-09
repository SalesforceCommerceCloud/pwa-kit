// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
// /* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

// import {mount, shallow} from 'enzyme'
// /* eslint-env jest */
// import React from 'react'

// import ExpiryDate from './index.jsx'

// test('ExpiryDate renders without errors', () => {
//     const wrapper = mount(<ExpiryDate />)
//     expect(wrapper.length).toBe(1)
// })

// /* eslint-disable newline-per-chained-call */
// test('includes the component class name with no className prop', () => {
//     const wrapper = mount(<ExpiryDate />)
//     expect(wrapper.children().hasClass('pw-expiry-date')).toBe(true)
// })

// test("does not render an 'undefined' class with no className", () => {
//     const wrapper = mount(<ExpiryDate />)

//     expect(wrapper.children().hasClass('undefined')).toBe(false)
// })

// test('renders the contents of the className prop if present', () => {
//     ;['test', 'test another'].forEach((name) => {
//         const wrapper = shallow(<ExpiryDate className={name} />)
//         expect(wrapper.hasClass(name)).toBe(true)
//     })
// })

// test('ExpiryDate formats defaultValue properly', () => {
//     const displayExpiryDate = '19/29'

//     const wrapper = mount(<ExpiryDate defaultValue={displayExpiryDate} />)
//     expect(wrapper.prop('defaultValue')).toBe(displayExpiryDate)
// })

// test('Renders placeholder if present', () => {
//     const test = 'MM/YY'
//     const wrapper = mount(<ExpiryDate placeholder={test} />)

//     expect(wrapper.find('input').prop('placeholder')).toBe('MM/YY')
// })
test('TODO: Review this component', () => expect(true).toBe(true))
