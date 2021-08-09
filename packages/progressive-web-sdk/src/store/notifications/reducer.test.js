/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Immutable from 'immutable'
import reducer, {initialState} from './reducer'
import * as actions from './actions'

test('unknown action type leaves state unchanged', () => {
    const action = {
        type: 'qwertyuiop'
    }
    expect(reducer(initialState, action)).toBe(initialState)
})

test('addNotification adds a notification', () => {
    const notification = {id: 'test', content: 1, showRemoveButton: undefined}
    const action = actions.addNotification(notification.id, notification.content)
    expect(reducer(initialState, action).equals(Immutable.fromJS([notification]))).toBe(true)
})

test('addNotification will not add duplicate notifications', () => {
    const inputState = initialState.push(Immutable.fromJS({id: 5}))
    const action = actions.addNotification(5, 'duplicate')

    expect(reducer(inputState, action)).toBe(inputState)
})

test('removeNotification removes a particular notification', () => {
    const inputState = initialState.concat(Immutable.fromJS([{id: 1}, {id: 2}, {id: 3}]))
    const action = actions.removeNotification(2)
    const outputState = initialState.concat(Immutable.fromJS([{id: 1}, {id: 3}]))

    expect(reducer(inputState, action).equals(outputState)).toBe(true)
})

test('removeAllNotifications removes all notifications', () => {
    const inputState = initialState.concat(Immutable.fromJS([{id: 1}, {id: 2}, {id: 3}]))
    const action = actions.removeAllNotifications()

    expect(reducer(inputState, action).equals(initialState)).toBe(true)
})
