/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jest */
import {createAction, createActionWithAnalytics, createTypedAction} from './action-creation'

jest.mock('./typechecking')
import {typecheck} from './typechecking'

test('createAction creates a multi-argument action creator if names are passed', () => {
    const actionCreator = createAction('Test Action', ['a', 'b', 'c'])
    expect(typeof actionCreator).toBe('function')

    const action = actionCreator(1, 2, 3)
    expect(action).toEqual({
        type: 'Test Action',
        payload: {
            a: 1,
            b: 2,
            c: 3
        }
    })
})

test('createAction creates a single-argument action creator if no names are passed', () => {
    const actionCreator = createAction('Complete Test')
    expect(typeof actionCreator).toBe('function')

    const action = actionCreator('payload', 'ignored')
    expect(action).toEqual({
        type: 'Complete Test',
        payload: 'payload'
    })
})

test('createAction passes in its meta creator', () => {
    const actionCreator = createAction('Test With Meta', ['a'], (a, b) => ({a, b}))
    expect(typeof actionCreator).toBe('function')

    const action = actionCreator(1, 2)
    expect(action).toEqual({
        type: 'Test With Meta',
        payload: {
            a: 1
        },
        meta: {
            a: 1,
            b: 2
        }
    })
})

test('createActionWithAnalytics creates an action creator that adds analytics information', () => {
    const actionCreator = createActionWithAnalytics(
        'Test With Analytics',
        ['a'],
        'test',
        (a, b) => ({b})
    )
    expect(typeof actionCreator).toBe('function')

    const action = actionCreator(1, 2)
    expect(action).toEqual({
        type: 'Test With Analytics',
        payload: {
            a: 1
        },
        meta: {
            analytics: {
                type: 'test',
                payload: {
                    b: 2
                }
            }
        }
    })

    const actionCreatorUndefined = createActionWithAnalytics('Test With Analytics', ['a'], 'test')
    const actionTwo = actionCreatorUndefined()
    expect(actionTwo).toEqual({
        type: 'Test With Analytics',
        payload: {
            a: undefined
        },
        meta: {
            analytics: {
                payload: undefined,
                type: 'test'
            }
        }
    })
})

test('createActionWithAnalytics supports single-argument action creators', () => {
    const actionCreator = createActionWithAnalytics('Test With Analytics', null, 'test', (a) => ({
        a
    }))
    expect(typeof actionCreator).toBe('function')

    const action = actionCreator(1)
    expect(action).toEqual({
        type: 'Test With Analytics',
        payload: 1,
        meta: {
            analytics: {
                type: 'test',
                payload: {
                    a: 1
                }
            }
        }
    })
})

test('createTypedAction creates a simple action creator which typechecks with no key', () => {
    typecheck.mockImplementation((x, y) => y)

    const mockType = {type: true}
    const actionCreator = createTypedAction('Test', mockType)
    expect(typeof actionCreator).toBe('function')

    const payload = {test: 'no key'}
    const action = actionCreator(payload)
    expect(action.type).toBe('Test')
    expect(action.payload).toBe(payload)
    expect(typecheck).toHaveBeenCalledWith(mockType, payload)
})

test('createTypedAction creates an action creator to set the given key, with typechecking', () => {
    typecheck.mockImplementation((x, y) => y)

    const mockType = {type: true}
    const actionCreator = createTypedAction('Test', mockType, 'data')
    expect(typeof actionCreator).toBe('function')

    const payload = {test: 'key'}
    const action = actionCreator(payload)
    expect(action.type).toBe('Test')
    expect(action.payload).toHaveProperty('data', payload)
    expect(typecheck).toHaveBeenCalledWith(mockType, payload)
})
