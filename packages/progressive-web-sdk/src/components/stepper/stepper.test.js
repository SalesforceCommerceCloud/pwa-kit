/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'

import Stepper from './index'
import {reduxForm, reducer as formReducer} from 'redux-form'
import {createStore, combineReducers} from 'redux'
import {Provider} from 'react-redux'

const incrementButtonClass = 'button.pw-stepper__button.pw--increment'
const decrementButtonClass = 'button.pw-stepper__button.pw--decrement'
const DecoratedStepper = reduxForm({form: 'testForm'})(Stepper)

const store = createStore(combineReducers({form: formReducer}))

const STEPPER_NAME = 'stepper-name'

test('Stepper has a default value of 0', () => {
    const wrapper = mount(<Stepper name={STEPPER_NAME} />)

    const input = wrapper.find('input')
    expect(input.prop('value')).toBe(0)
})

test('Stateful Stepper renders a stepper component initialized with passed in quantity', () => {
    const wrapper = mount(<Stepper name={STEPPER_NAME} initialValue={3} />)

    const input = wrapper.find('input')
    expect(input.length).toBe(1)
    expect(input.prop('value')).toBe(3)
})

test('Redux Form Stepper renders a stepper component', () => {
    const wrapper = mount(
        <Provider store={store}>
            <DecoratedStepper useReduxForm name={STEPPER_NAME} />
        </Provider>
    )

    const input = wrapper.find('input')
    expect(input.length).toBe(1)
})

test('Stateful Stepper puts the name prop on its input', () => {
    const wrapper = mount(<Stepper name={STEPPER_NAME} />)

    const input = wrapper.find('input')
    expect(input.length).toBe(1)
    expect(input.prop('name')).toBe(STEPPER_NAME)
})

test('Stepper renders icons', () => {
    const minusIcon = 'minus'
    const plusIcon = 'plus'
    const size = 'large'
    const wrapper = mount(
        <Stepper
            name={STEPPER_NAME}
            label="Test Artifact"
            incrementIcon={plusIcon}
            decrementIcon={minusIcon}
            iconSize={size}
        />
    )

    const buttons = wrapper.find('Button')
    const firstButtonProps = buttons.first().props()
    const secondButtonProps = buttons.last().props()

    expect(firstButtonProps.icon).toBe(minusIcon)
    expect(secondButtonProps.icon).toBe(plusIcon)

    expect(firstButtonProps.iconSize).toBe(size)
    expect(secondButtonProps.iconSize).toBe(size)
})

test('Redux Form Stepper puts the name prop on its input', () => {
    const wrapper = mount(
        <Provider store={store}>
            <DecoratedStepper useReduxForm name={STEPPER_NAME} />
        </Provider>
    )

    const input = wrapper.find('Stepper')
    expect(input.length).toBe(1)
    expect(input.prop('name')).toBe(STEPPER_NAME)
})

test('Stateful Stepper accepts alternate button text', () => {
    const incrementText = 'increase'
    const decrementText = 'decrease'
    const wrapper = mount(
        <Stepper
            name={STEPPER_NAME}
            incrementText={`${incrementText}`}
            decrementText={`${decrementText}`}
        />
    )

    const buttons = wrapper.find('Button')

    const decrementButton = buttons.first()
    const incrementButton = buttons.last()

    expect(incrementButton.prop('text')).toBe(incrementText)
    expect(decrementButton.prop('text')).toBe(decrementText)
})

test('Redux Form Stepper accepts alternate button text', () => {
    const incrementText = 'increase'
    const decrementText = 'decrease'
    const wrapper = mount(
        <Provider store={store}>
            <DecoratedStepper
                name={STEPPER_NAME}
                useReduxForm
                incrementText={`${incrementText}`}
                decrementText={`${decrementText}`}
            />
        </Provider>
    )
    const buttons = wrapper.find('Button')

    const decrementButton = buttons.first()
    const incrementButton = buttons.last()

    expect(incrementButton.prop('text')).toBe(incrementText)
    expect(decrementButton.prop('text')).toBe(decrementText)
})

test('Stateful Stepper can increment its value', () => {
    const wrapper = mount(<Stepper name={STEPPER_NAME} />)
    wrapper.find(incrementButtonClass).simulate('click')
    wrapper.update()

    const input = wrapper.find('input')
    expect(input.prop('value')).toBe(1)
})

test('Stepper can decrement its value', () => {
    const wrapper = mount(<Stepper name={STEPPER_NAME} initialValue={1} />)
    wrapper.find(decrementButtonClass).simulate('click')

    const input = wrapper.find('input')
    expect(input.prop('value')).toBe(0)
})

test('Stepper can increment above its maximumValue', () => {
    const wrapper = mount(<Stepper name={STEPPER_NAME} maximumValue={1} />)
    const incrementButton = wrapper.find(incrementButtonClass)
    incrementButton
        .simulate('click')
        .simulate('click')
        .simulate('click')

    const input = wrapper.find('input')
    expect(input.prop('value')).toBe(1)
    expect(wrapper.find(incrementButtonClass).prop('disabled')).toBe(true)
})

test('Stepper can decrement below its minimumValue', () => {
    const wrapper = mount(<Stepper name={STEPPER_NAME} minimumValue={-1} />)
    const decrementButton = wrapper.find(decrementButtonClass)
    decrementButton
        .simulate('click')
        .simulate('click')
        .simulate('click')

    const input = wrapper.find('input')
    expect(input.prop('value')).toBe(-1)
    expect(wrapper.find(decrementButtonClass).prop('disabled')).toBe(true)
})

test('Stateful Stepper disables the buttons when the disabled prop is true', () => {
    const wrapper = mount(<Stepper name={STEPPER_NAME} disabled />)

    expect(wrapper.find(incrementButtonClass).prop('disabled')).toBe(true)
    expect(wrapper.find(decrementButtonClass).prop('disabled')).toBe(true)
    expect(wrapper.find('input').prop('disabled')).toBe(true)
})

test('Redux Form Stepper disables the buttons when the disabled prop is true', () => {
    const wrapper = mount(
        <Provider store={store}>
            <DecoratedStepper name={STEPPER_NAME} useReduxForm disabled />
        </Provider>
    )

    expect(wrapper.find(incrementButtonClass).prop('disabled')).toBe(true)
    expect(wrapper.find(decrementButtonClass).prop('disabled')).toBe(true)
    expect(wrapper.find('input').prop('disabled')).toBe(true)
})

test('Stepper defaults to a minimum value of 0', () => {
    const wrapper = mount(<Stepper name={STEPPER_NAME} />)
    const decrementButton = wrapper.find(decrementButtonClass)
    decrementButton.simulate('click').simulate('click')

    const input = wrapper.find('input')
    expect(input.prop('value')).toBe(0)
    expect(decrementButton.prop('disabled')).toBe(true)
})

test('no minimum is applied when the minimum value prop is nulled', () => {
    const wrapper = mount(<Stepper name={STEPPER_NAME} minimumValue={null} />)
    const decrementButton = wrapper.find(decrementButtonClass)
    const input = () => wrapper.find('input')
    for (let i = -1; i > -20; i--) {
        decrementButton.simulate('click')

        expect(input().prop('value')).toBe(i)
    }
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<Stepper name={STEPPER_NAME} />)

    expect(wrapper.hasClass('pw-stepper')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<Stepper name={STEPPER_NAME} />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<Stepper name={STEPPER_NAME} className={name} />)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

test('onChange gets called with the correct values', () => {
    const onChange = jest.fn()

    const wrapper = mount(<Stepper name={STEPPER_NAME} onChange={onChange} />)
    wrapper.find(incrementButtonClass).simulate('click')
    expect(onChange).toHaveBeenLastCalledWith(1)

    wrapper.find(incrementButtonClass).simulate('click')
    expect(onChange).toHaveBeenLastCalledWith(2)

    wrapper.find(decrementButtonClass).simulate('click')
    expect(onChange).toHaveBeenLastCalledWith(1)
})

test('uses a tel input', () => {
    const wrapper = mount(<Stepper name={STEPPER_NAME} />)
    const input = wrapper.find('input')

    expect(input.prop('type')).toBe('tel')
})

test('does not accept non-number inputs', () => {
    const wrapper = mount(<Stepper name={STEPPER_NAME} />)
    const input = () => wrapper.find('input')
    input().simulate('change', {target: {value: '2'}})
    input().simulate('change', {target: {value: 'a'}})

    expect(input().prop('value')).toBe(2)
})

test('selects text when its input is clicked', () => {
    const wrapper = mount(<Stepper name={STEPPER_NAME} />)
    const input = () => wrapper.find('input')
    input().simulate('change', {target: {value: '100'}})
    input().simulate('click')

    expect(input().instance().selectionStart).toBe(0)
    expect(input().instance().selectionEnd).toBe(3)
})

test('renders a label if label contents are passed', () => {
    const wrapper = mount(<Stepper name={STEPPER_NAME} label="Test Artifact" />)

    const label = wrapper.find('label')
    expect(label.length).toBe(1)
    expect(label.text()).toBe('Test Artifact')
    const input = wrapper.find('input')
    expect(label.prop('htmlFor')).toEqual(input.prop('id'))
})

test('Stateful Stepper bounds value when new maximumValue or minimumValue props are set', () => {
    const props = {
        initialValue: 3,
        minimumValue: 1,
        maximumValue: 5
    }
    const wrapper = mount(<Stepper name={STEPPER_NAME} {...props} />)
    expect(wrapper.find('input').prop('value')).toBe(3)
    const newProps = {
        initialValue: 1,
        minimumValue: 1,
        maximumValue: 2
    }
    wrapper.setProps(newProps)
    expect(wrapper.find('input').prop('value')).toBe(2)
})

test('Redux Form Stepper bounds value when new maximumValue or minimumValue props are set', () => {
    const props = {
        minimumValue: 1,
        maximumValue: 3
    }
    const wrapper = mount(
        <Provider store={store}>
            <DecoratedStepper useReduxForm name={STEPPER_NAME} {...props} />
        </Provider>
    )
    const input = () => wrapper.find('input')

    input().simulate('change', {target: {value: 2}})
    expect(input().prop('value')).toBe(2)
    input().simulate('change', {target: {value: 4}})
    expect(input().prop('value')).toBe(3)
})

test('stepperRef function is passed a reference to the inner StatefulStepper', () => {
    let innerStepperRef
    const stepperRef = (ref) => {
        innerStepperRef = ref
    }
    mount(<Stepper name={STEPPER_NAME} stepperRef={stepperRef} />)
    expect(innerStepperRef.constructor.name).toBe('StatefulStepper')
})

test('if using Redux Form, stepperRef function is passed a reference to the inner ReduxFormField', () => {
    let innerStepperRef
    const stepperRef = (ref) => {
        innerStepperRef = ref
    }

    // This test will show an error message
    // but that is coming from Redux Form, not our code
    mount(
        <Provider store={store}>
            <DecoratedStepper useReduxForm name={STEPPER_NAME} stepperRef={stepperRef} />
        </Provider>
    )
    expect(innerStepperRef.constructor.name).toBe('Field')
})
