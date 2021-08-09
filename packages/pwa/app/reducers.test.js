import * as reducers from './reducer'
import Immutable from 'immutable'

describe('"categories" works appropriately', () => {
    test('does not update state for an unknown action', () => {
        const unknownAction = {type: 'unknown', payload: {a: 'b'}}
        const state = reducers.categories(Immutable.Map(), unknownAction)
        expect(state.toJS()).toEqual({})
    })

    test('updates state when valid action is passed', () => {
        const action1 = {type: 'CATEGORIES_RECEIVED', payload: {a: 'b'}}
        const initialState = reducers.categories(undefined, action1)
        expect(initialState.toJS()).toEqual({a: 'b'})

        const action2 = {type: 'CATEGORIES_RECEIVED', payload: {a: 'c'}}
        const nextState = reducers.categories(initialState, action2)
        expect(nextState.toJS()).toEqual({a: 'c'})
    })
})

describe('"products" works appropriately', () => {
    test('does not update state for an unknown action', () => {
        const unknownAction = {type: 'unknown', payload: {a: 'b'}}
        const state = reducers.products(Immutable.Map(), unknownAction)
        expect(state.toJS()).toEqual({})
    })

    test('updates state when valid action is passed', () => {
        const action1 = {type: 'PRODUCTS_RECEIVED', payload: {a: 'b'}}
        const initialState = reducers.products(undefined, action1)
        expect(initialState.toJS()).toEqual({a: 'b'})

        const action2 = {type: 'PRODUCTS_RECEIVED', payload: {a: 'c'}}
        const nextState = reducers.products(initialState, action2)
        expect(nextState.toJS()).toEqual({a: 'c'})
    })
})

describe('"productSearches" works appropriately', () => {
    test('does not update state for an unknown action', () => {
        const unknownAction = {type: 'unknown', payload: {a: 'b'}}
        const state = reducers.productSearches(Immutable.Map(), unknownAction)
        expect(state.toJS()).toEqual({})
    })

    test('updates state when valid action is passed', () => {
        const action1 = {type: 'PRODUCT_SEARCH_RECEIVED', payload: {a: 'b'}}
        const initialState = reducers.productSearches(undefined, action1)
        expect(initialState.toJS()).toEqual({a: 'b'})

        const action2 = {type: 'PRODUCT_SEARCH_RECEIVED', payload: {a: 'c'}}
        const nextState = reducers.productSearches(initialState, action2)
        expect(nextState.toJS()).toEqual({a: 'c'})
    })
})

describe('"globals" works appropriately', () => {
    test('does not update state for an unknown action', () => {
        const unknownAction = {type: 'unknown', payload: {a: 'b'}}
        const state = reducers.globals(Immutable.Map(), unknownAction)
        expect(state.toJS()).toEqual({})
    })

    test('updates state when valid action is passed', () => {
        const action1 = {type: 'GLOBAL_UI_RECEIVED', payload: {a: 'b'}}
        const initialState = reducers.globals(undefined, action1)
        expect(initialState.toJS()).toEqual({a: 'b'})

        const action2 = {type: 'PAGE_METADATA_RECEIVED', payload: {c: 'd'}}
        const nextState = reducers.globals(initialState, action2)
        expect(nextState.toJS()).toEqual({a: 'b', c: 'd'})
    })
})

describe('"offline" works appropriately', () => {
    test('does not update state for an unknown action', () => {
        const unknownAction = {type: 'unknown', payload: {a: 'b'}}
        const state = reducers.offline(Immutable.Map(), unknownAction)
        expect(state.toJS()).toEqual({})
    })

    test('updates state when valid action is passed', () => {
        const action1 = {type: 'ONLINE_STATUS_CHANGED', payload: {a: 'b'}}
        const initialState = reducers.offline(undefined, action1)
        expect(initialState.toJS()).toEqual({a: 'b'})

        const action2 = {type: 'ONLINE_STATUS_CHANGED', payload: {a: 'c'}}
        const nextState = reducers.offline(initialState, action2)
        expect(nextState.toJS()).toEqual({a: 'c'})
    })
})
