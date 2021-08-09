/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {keyMap, onKeyUpHelper, onKeyUpWrapper} from './a11y-utils'

test('onKeyUpHelper calls the given function if the event key matches the given key or space', () => {
    const mockOnClick = jest.fn()

    onKeyUpHelper({keyCode: keyMap.enter}, mockOnClick, keyMap.enter)
    expect(mockOnClick).toHaveBeenCalledTimes(1)
    onKeyUpHelper({keyCode: keyMap.space}, mockOnClick, keyMap.enter)
    expect(mockOnClick).toHaveBeenCalledTimes(2)
})

test('onKeyUpHelper defaults to space', () => {
    const mockOnClick = jest.fn()

    onKeyUpHelper({keyCode: keyMap.space}, mockOnClick)
    expect(mockOnClick).toHaveBeenCalledTimes(1)
})

test('onKeyUpHelper does not call the function if the key does not match', () => {
    const mockOnClick = jest.fn()

    onKeyUpHelper({keyCode: keyMap.tab}, mockOnClick, keyMap.enter)
    expect(mockOnClick).not.toBeCalled()
})

test('onKeyUpHelper does not break if the onClick is not a function', () => {
    onKeyUpHelper({keyCode: keyMap.space}, null)
})

test('onKeyUpWrapper splits up the arguments to onKeyUpHelper usefully', () => {
    const mockOnClick = jest.fn()
    const wrapper = onKeyUpWrapper(mockOnClick, keyMap.enter)

    expect(mockOnClick).not.toBeCalled()
    wrapper({keyCode: keyMap.enter})
    expect(mockOnClick).toHaveBeenCalledTimes(1)
    wrapper({keyCode: keyMap.space})
    expect(mockOnClick).toHaveBeenCalledTimes(2)
    wrapper({keyCode: keyMap.tab})
    expect(mockOnClick).toHaveBeenCalledTimes(2)
})

test('onKeyUpHelper passes the event to the function it calls', () => {
    const mockOnClick = jest.fn()
    const event = {keyCode: keyMap.space}

    onKeyUpHelper(event, mockOnClick)
    expect(mockOnClick).toHaveBeenCalledWith(event)
})
