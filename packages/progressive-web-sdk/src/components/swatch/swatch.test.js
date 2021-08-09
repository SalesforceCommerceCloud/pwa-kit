/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'

import {Swatch, SwatchItem} from './index.js'

describe('Swatch', () => {
    test('Swatch renders without errors', () => {
        const wrapper = mount(<Swatch />)
        expect(wrapper.length).toBe(1)
    })

    /* eslint-disable newline-per-chained-call */
    test('includes the component class name with no className prop', () => {
        const wrapper = shallow(<Swatch />)

        expect(wrapper.hasClass('pw-swatch')).toBe(true)
    })

    test("does not render an 'undefined' class with no className", () => {
        const wrapper = shallow(<Swatch />)

        expect(wrapper.hasClass('undefined')).toBe(false)
    })

    test('renders the contents of the className prop if present', () => {
        ;['test', 'test another'].forEach((name) => {
            const wrapper = shallow(<Swatch className={name} />)

            expect(wrapper.hasClass(name)).toBe(true)
        })
    })

    test('passes the selected prop to the correct child', () => {
        const wrapper = mount(
            <Swatch value="a">
                <SwatchItem value="a" />
                <SwatchItem value="b" />
                <SwatchItem value="c" />
            </Swatch>
        )

        const isItemSelected = (child) =>
            wrapper
                .find('.pw-swatch__items')
                .childAt(child)
                .props().selected

        expect(isItemSelected(0)).toBe(true)
        expect(isItemSelected(1)).toBe(false)
        expect(isItemSelected(2)).toBe(false)

        wrapper.setProps({value: 'b'})

        expect(isItemSelected(0)).toBe(false)
        expect(isItemSelected(1)).toBe(true)
        expect(isItemSelected(2)).toBe(false)
    })

    test('removes spaces from string labels', () => {
        const wrapper = mount(
            <Swatch label="hello world">
                <SwatchItem />
            </Swatch>
        )

        expect(wrapper.find('.pw-swatch__label').prop('id')).toBe('swatch-label-hello-world')
    })

    test('works correctly with non string labels', () => {
        const wrapper = mount(
            <Swatch label={5000}>
                <SwatchItem />
            </Swatch>
        )

        expect(wrapper.find('.pw-swatch__label').prop('id')).toBe('swatch-label-5000')
    })

    test('passes the selected and onClick props only to SwatchItem children', () => {
        const wrapper = mount(
            <Swatch>
                <SwatchItem />
                <p />
                <SwatchItem />
            </Swatch>
        )

        wrapper.find(SwatchItem).forEach((item) => {
            expect(item.prop('selected')).not.toBeUndefined()
            expect(item.prop('onClick')).not.toBeUndefined()
        })

        const paragraph = wrapper.find('p')
        expect(paragraph.prop('selected')).toBeUndefined()
        expect(paragraph.prop('onClick')).toBeUndefined()
    })

    test('works correctly with falsy children', () => {
        const wrapper = shallow(
            <Swatch>
                {false}
                <p />
                {undefined}
            </Swatch>
        )

        expect(wrapper.length).toBe(1)
    })

    test('selecting an option fires the onChange prop', () => {
        const onChange = jest.fn()

        const wrapper = mount(
            <Swatch onChange={onChange}>
                <SwatchItem value="25" />
            </Swatch>
        )
        expect(onChange).not.toHaveBeenCalled()

        wrapper.find('button.pw-swatch__button').simulate('click')
        expect(onChange).toHaveBeenCalled()
    })
})

describe('SwatchItem', () => {
    test('renders without errors', () => {
        const wrapper = mount(<SwatchItem />)
        expect(wrapper.length).toBe(1)
    })

    test('includes the component class name with no className prop', () => {
        const wrapper = shallow(<SwatchItem />)

        expect(wrapper.hasClass('pw-swatch__item')).toBe(true)
    })

    test("does not render an 'undefined' class with no className", () => {
        const wrapper = shallow(<SwatchItem />)

        expect(wrapper.hasClass('undefined')).toBe(false)
    })

    test('renders the contents of the className prop if present', () => {
        ;['test', 'test another'].forEach((name) => {
            const wrapper = shallow(<SwatchItem className={name} />)

            expect(wrapper.hasClass(name)).toBe(true)
        })
    })

    test('if the color prop is passed, it is set as the background color', () => {
        const props = {
            color: '#ff0000'
        }

        const wrapper = mount(<SwatchItem />)
        const chip = () => wrapper.find('.pw-swatch__chip-inner')

        expect(chip().props().style.backgroundColor).not.toBe(props.color)

        wrapper.setProps(props)

        expect(chip().props().style.backgroundColor).toBe(props.color)
    })

    test('the label is rendered, if provided', () => {
        const props = {
            label: 'test'
        }

        const wrapper = mount(<SwatchItem />)
        expect(wrapper.find('.pw-swatch__outer-label').length).toBe(0)
        wrapper.setProps(props)
        expect(wrapper.find('.pw-swatch__outer-label').length).toBe(1)
    })

    test('clicking the button fires the onClick props', () => {
        const props = {
            onClick: jest.fn(),
            value: 'test'
        }

        const wrapper = mount(<SwatchItem {...props} />)
        expect(props.onClick).not.toHaveBeenCalled()
        wrapper.find('button').simulate('click')
        expect(props.onClick).toHaveBeenCalledWith(props.value)
    })

    test('children are rendered inside the chip', () => {
        const props = {
            children: 'test'
        }

        const wrapper = mount(<SwatchItem {...props} />)
        expect(wrapper.find('.pw-swatch__chip').text()).toBe(props.children)
    })
})
