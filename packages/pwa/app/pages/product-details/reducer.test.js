/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2018 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jest */
import Immutable from 'immutable'
import reducer from './reducer'
import * as actions from './actions'

describe('The Product Details reducer', () => {
    test('state remains unchanged for unknown action types', () => {
        const unknownAction = {type: 'unknown', payload: {a: 'b'}}
        const initial = reducer(Immutable.Map(), unknownAction)
        expect(initial.toJS()).toEqual({})
    })
    test('if payload is an object, the state is extended', () => {
        const initial = reducer(Immutable.Map(), actions.updateProductUIState({a: 'b'}))
        expect(initial.toJS()).toEqual({a: 'b'})
        const next = reducer(initial, actions.updateProductUIState({x: 'y'}))
        expect(next.toJS()).toEqual({a: 'b', x: 'y'})
    })
    test('if payload is not an object, the state only the new value', () => {
        const initial = reducer(
            Immutable.List(),
            actions.updateProductUIState(Immutable.List(['x', 'y']))
        )
        expect(initial.toJS()).toEqual(['x', 'y'])
        const next = reducer(initial, actions.updateProductUIState(Immutable.List(['a', 'b', 'c'])))
        expect(next.toJS()).toEqual(['a', 'b', 'c'])
    })
})
