/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jest */
import Immutable from 'immutable'
import reducer from './reducer'
import * as actions from './actions'

describe('The Product List reducer', () => {
    test('state remains unchanged for unknown action types', () => {
        const unknownAction = {type: 'unknown', payload: {a: 'b'}}
        const initial = reducer(Immutable.Map(), unknownAction)
        expect(initial.toJS()).toEqual({})
    })
    test('state is extended for defined action types', () => {
        const initial = reducer(Immutable.Map(), actions.updateCategoryUIState({a: 'b'}))
        expect(initial.toJS()).toEqual({a: 'b'})
        const next = reducer(initial, actions.updateCategoryUIState({x: 'y'}))
        expect(next.toJS()).toEqual({a: 'b', x: 'y'})
    })
})
